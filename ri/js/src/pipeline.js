// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import prompts from './prompts.generated.json' with {type:'json'};
import {assertRecord,assertIntermediate,verifyAssetsSync,clone,createRecord,id,now} from './model.js';
export const SUPPORTED_PROMPT_LOCALES=prompts.supportedLocales;
export const DEFAULT_PROMPT_LOCALE=prompts.defaultLocale;
export function normalisePromptLocale(value,fallback=DEFAULT_PROMPT_LOCALE) {
  const candidate=String(value??'').trim().toLowerCase().replace('_','-').split('-')[0];
  return SUPPORTED_PROMPT_LOCALES.includes(candidate)?candidate:(SUPPORTED_PROMPT_LOCALES.includes(fallback)?fallback:DEFAULT_PROMPT_LOCALE);
}
export function getPrompts(locale=DEFAULT_PROMPT_LOCALE) { return prompts.locales[normalisePromptLocale(locale)]; }
// Existing integrations imported these English constants before locale support.
export const EXTRACTION_PROMPT=getPrompts('en').extract;
export const RELATIONSHIP_PROMPT=getPrompts('en').relate;
function progress(options,stage,detail,current,total){options.onProgress?.({stage,detail,current,total});}
function objectResponse(value) {
  if(typeof value!=='string')return value;
  const clean=value.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try{return JSON.parse(clean);}catch{throw new Error('The provider returned invalid JSON. No chronology changes were saved.');}
}
function adapter(options){if(typeof options.llm!=='function')throw new Error('Choose an LLM and supply its API key, or configure an llm callback.');return options.llm;}
export async function buildChronology(intermediates,options={}) {
  const llm=adapter(options); const record=createRecord(options.title??'Chronology');
  const prompt=getPrompts(options.locale);
  if(!Array.isArray(intermediates)||!intermediates.length)throw new Error('Import at least one document first.');
  for(const [index,item] of intermediates.entries()) {
    options.signal?.throwIfAborted();
    assertIntermediate(item);
    if(!item.document.paragraphs.length)throw new Error('The intermediate document has no text paragraphs.');
    if(JSON.stringify(item.document).length>(options.maxDocumentCharacters??160000))throw new Error('Document exceeds the configured LLM input limit. Split the document or raise maxDocumentCharacters.');
    const document=clone(item.document); if(record.documents.some(d=>d.id===document.id))throw new Error('Duplicate document ID.');
    record.documents.push(document);if(item.asset&&!record.assets.some(a=>a.id===item.asset.id))record.assets.push(clone(item.asset));
    progress(options,'extracting',document.title,index+1,intermediates.length);
    const response=objectResponse(await llm({task:'extract',locale:normalisePromptLocale(options.locale),prompt:prompt.extract,input:document,signal:options.signal}));
    options.signal?.throwIfAborted();
    if(!Array.isArray(response?.events)||response.events.length>(options.maxEventsPerDocument??300))throw new Error('Invalid or oversized event response.');
    const paragraphMap=new Map(document.paragraphs.map(p=>[p.id,p]));
    for(const raw of response.events) {
      if(!Array.isArray(raw.paragraphIds)||!raw.paragraphIds.length||raw.paragraphIds.some(p=>!paragraphMap.has(p)))throw new Error('The LLM cited an unknown or missing source paragraph.');
      const event={id:id(),title:raw.title,summary:raw.summary,date:raw.date,sources:raw.paragraphIds.map(paragraphId=>{const p=paragraphMap.get(paragraphId);return {documentId:document.id,paragraphId,page:p.page,quote:p.text};})};
      for(const key of ['assertedBy','status','narrative'])if(raw[key])event[key]=raw[key];
      record.events.push(event);
    }
  }
  record.events.sort((a,b)=>(a.date.value??'9999').localeCompare(b.date.value??'9999'));
  assertRecord(record); progress(options,'completed','Chronology ready',record.events.length,record.events.length); return record;
}
export async function findRelationships(record,options={}) {
  verifyAssetsSync(assertRecord(record));const llm=adapter(options);options.signal?.throwIfAborted();
  const prompt=getPrompts(options.locale);
  if(record.events.length<2)return clone(record);
  const events=record.events.map(({id,title,summary,date,assertedBy,sources})=>({id,title,summary,date,assertedBy,sources}));
  if(JSON.stringify(events).length>(options.maxRelationshipCharacters??200000))throw new Error('Chronology exceeds the basic relationship input limit. Supply a custom adapter or smaller record.');
  progress(options,'relating','Comparing chronology accounts',0,1);
  const response=objectResponse(await llm({task:'relate',locale:normalisePromptLocale(options.locale),prompt:prompt.relate,input:{events},signal:options.signal}));
  options.signal?.throwIfAborted();if(!Array.isArray(response?.relationships)||response.relationships.length>events.length*5)throw new Error('Invalid relationship response.');
  const result=clone(record);const ids=new Set(events.map(e=>e.id));
  const pairs=new Set(result.relationships.map(r=>[r.from,r.to].sort().join('|')+'|'+r.type));
  for(const raw of response.relationships) {
    if(!ids.has(raw.from)||!ids.has(raw.to)||raw.from===raw.to||!['supports','contradicts'].includes(raw.type)||typeof raw.rationale!=='string'||!raw.rationale.trim())throw new Error('The provider returned an unsupported relationship or unknown event.');
    const pair=[raw.from,raw.to].sort().join('|')+'|'+raw.type;if(pairs.has(pair))continue;pairs.add(pair);
    const provenance={method:'llm',createdAt:now()};if(options.authorId)provenance.authorId=options.authorId;
    result.relationships.push({id:id(),from:raw.from,to:raw.to,type:raw.type,rationale:raw.rationale,provenance});
  }
  result.updatedAt=now();assertRecord(result);progress(options,'completed','Relationships ready',1,1);return result;
}
export function createOpenAICompatibleAdapter({endpoint,model,apiKey,fetch:fetcher=globalThis.fetch,headers={},temperature,responseFormat=true,maxResponseBytes=4*1024*1024}={}) {
  if(!endpoint||!model)throw new Error('Endpoint and model are required.');
  if(!apiKey&&!isLoopbackEndpoint(endpoint))throw new Error('An API key is required for remote providers.');
  const url=new URL(endpoint);if(!['https:','http:'].includes(url.protocol))throw new Error('Provider endpoint must be an HTTP(S) URL.');
  return async ({prompt,input,signal})=>{
    signal?.throwIfAborted();
    const body={model,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(input)}]};
    if(temperature!==undefined)body.temperature=temperature;
    if(responseFormat)body.response_format={type:'json_object'};
    const response=await fetcher(url,{method:'POST',headers:{...headers,'Content-Type':'application/json',...(apiKey?{Authorization:'Bearer '+apiKey}:{})},body:JSON.stringify(body),signal});
    if(!response.ok)throw new Error(`Provider request failed (${response.status}). Check endpoint, model, access and browser CORS support.`);
    const raw=await response.text();if(new TextEncoder().encode(raw).length>maxResponseBytes)throw new Error('Provider response exceeds configured limit.');
    const json=JSON.parse(raw);const content=json.choices?.[0]?.message?.content;if(typeof content!=='string')throw new Error('Provider did not return a text JSON completion.');return objectResponse(content);
  };
}

export function isLoopbackEndpoint(endpoint) {try{return ['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname);}catch{return false;}}
export function createProviderAdapter(options={}) {
  if(!options.protocol||options.protocol==='openai')return createOpenAICompatibleAdapter(options);
  if(options.protocol!=='anthropic')throw new Error('Unsupported provider protocol.');
  const {endpoint,model,apiKey,fetch:fetcher=globalThis.fetch,maxTokens=8192,maxResponseBytes=4*1024*1024}=options;
  if(!endpoint||!model||!apiKey)throw new Error('Endpoint, model and API key are required.');
  const url=new URL(endpoint);if(!['https:','http:'].includes(url.protocol))throw new Error('Provider endpoint must use HTTP(S).');
  return async({prompt,input,signal})=>{
    signal?.throwIfAborted();
    const response=await fetcher(url,{method:'POST',signal,headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01',...(typeof window!=='undefined'?{'anthropic-dangerous-direct-browser-access':'true'}:{})},body:JSON.stringify({model,max_tokens:maxTokens,system:prompt,messages:[{role:'user',content:JSON.stringify(input)}]})});
    if(!response.ok)throw new Error(`Provider request failed (${response.status}). Check endpoint, model, key and browser access.`);
    const text=await response.text();if(new TextEncoder().encode(text).length>maxResponseBytes)throw new Error('Provider response exceeds configured limit.');
    const result=JSON.parse(text);const content=result.content?.filter(c=>c.type==='text').map(c=>c.text).join('');if(!content)throw new Error('Provider did not return a text completion.');return objectResponse(content);
  };
}
