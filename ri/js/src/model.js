// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {sha256 as digestSha256} from '@noble/hashes/sha2.js';
import schema from './schema.json' with {type:'json'};
import documentSchema from './document.schema.json' with {type:'json'};
const ajv = new Ajv2020({allErrors:true,strict:false}); addFormats(ajv);
const checkSchema=ajv.compile(schema);
const checkDocument=ajv.compile(documentSchema);
export const VERSION='0.1.0';
export const id=()=>globalThis.crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const clone=value=>structuredClone(value);
export function createRecord(title='Untitled chronology') {
  const stamp=now(); return {format:'ocker',version:VERSION,id:id(),title,createdAt:stamp,updatedAt:stamp,actors:[],documents:[],events:[],relationships:[],notes:[],authorities:[],assets:[]};
}
function validCalendar(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d=new Date(value+'T00:00:00Z'); return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===value;
}
export function validateRecord(record) {
  const errors=[];
  if(!checkSchema(record)) errors.push(...checkSchema.errors.map(e=>`${e.instancePath||'/'} ${e.message}`));
  if(errors.length) return {valid:false,errors};
  const used=new Set([record.id]); const maps={};
  for(const list of ['actors','documents','events','relationships','notes','authorities','assets']) {
    maps[list]=new Map();
    for(const item of record[list]) { if(used.has(item.id)) errors.push(`Duplicate id: ${item.id}`); used.add(item.id); maps[list].set(item.id,item); }
  }
  const requireRef=(group,key,label)=>{if(key!==undefined&&!maps[group].has(key)) errors.push(`${label}: unresolved ${key}`);};
  for(const doc of record.documents) {
    requireRef('assets',doc.assetId,'Document asset'); const paraIds=new Set();
    for(const p of doc.paragraphs) {if(paraIds.has(p.id)) errors.push('Duplicate paragraph id: '+p.id); paraIds.add(p.id);}
  }
  function source(s) {
    requireRef('documents',s.documentId,'Source document'); requireRef('assets',s.assetId,'Source asset');
    const doc=maps.documents.get(s.documentId);
    const paragraph=doc?.paragraphs.find(p=>p.id===s.paragraphId);
    if(s.paragraphId&&!paragraph) errors.push('Unresolved source paragraph: '+s.paragraphId);
    if(s.page&&doc&&!doc.paragraphs.some(p=>p.page===s.page)) errors.push('Unresolved source page: '+s.page);
    if(s.quote&&paragraph&&!paragraph.text.includes(s.quote)) errors.push('Source quote does not occur in its paragraph');
    if(s.selector?.end!==undefined&&s.selector.end<(s.selector.start??0)) errors.push('Source selector end precedes start');
  }
  for(const e of record.events) {
    const d=e.date;
    if((d.precision==='day'||d.precision==='range')&&!validCalendar(d.value)) errors.push('Invalid calendar date: '+d.value);
    if(d.precision==='month'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.value)) errors.push('Invalid month: '+d.value);
    if(d.precision==='range'&&(!validCalendar(d.end)||d.end<d.value)) errors.push('Invalid date range');
    for(const a of e.actorIds??[]) requireRef('actors',a,'Event actor');
    e.sources.forEach(source);
  }
  const pairs=new Set();
  for(const r of record.relationships) {
    requireRef('events',r.from,'Relationship from');requireRef('events',r.to,'Relationship to');
    requireRef('actors',r.provenance.authorId,'Relationship author');
    if(r.from===r.to) errors.push('Relationship cannot link an event to itself');
    const pair=[r.from,r.to].sort().join('|')+'|'+r.type;
    if(pairs.has(pair)) errors.push('Duplicate relationship');pairs.add(pair);(r.sources??[]).forEach(source);
  }
  for(const item of [...record.notes,...record.authorities]) {
    requireRef('events',item.eventId,'Annotation event');requireRef('actors',item.authorId,'Annotation author');
    if(Date.parse(item.updatedAt)<Date.parse(item.createdAt)) errors.push('Annotation update precedes creation');
  }
  for(const a of record.authorities) if(a.sourceUrl&&!/^https?:\/\//i.test(a.sourceUrl)) errors.push('Authority source URL must use HTTPS or HTTP');
  for(const a of record.assets) {
    requireRef('assets',a.derivedFrom,'Derived asset source');
    const seen=new Set([a.id]);let parent=a.derivedFrom;
    while(parent&&maps.assets.has(parent)) {if(seen.has(parent)){errors.push('Asset derivation cycle');break;}seen.add(parent);parent=maps.assets.get(parent).derivedFrom;}
    if(a.selector?.end!==undefined&&a.selector.end<(a.selector.start??0)) errors.push('Asset selector end precedes start');
  }
  return {valid:errors.length===0,errors};
}
export function assertRecord(record) {const result=validateRecord(record);if(!result.valid) throw new Error('Invalid OCKER record: '+result.errors.join('; '));return record;}
export function parseRecord(input,options={}) {
  const text=typeof input==='string'?input:new TextDecoder().decode(input);
  if(new TextEncoder().encode(text).length>(options.maxBytes??100*1024*1024)) throw new Error('OCKER file exceeds the configured size limit');
  const record=JSON.parse(text); return verifyAssetsSync(assertRecord(record));
}
export function exportRecord(record) {return JSON.stringify(verifyAssetsSync(assertRecord(record)),null,2)+'\n';}
export function bytesToBase64(bytes) {
  if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
}
export function base64ToBytes(data) {
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw new Error('Invalid base64');
  if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(data,'base64'));
  return Uint8Array.from(atob(data),x=>x.charCodeAt(0));
}
export async function sha256(bytes) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export function verifyAssetsSync(record) {
  for(const asset of record.assets) {
    if(asset.data===undefined)continue;
    const bytes=base64ToBytes(asset.data);
    const digest=Array.from(digestSha256(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    if(bytes.byteLength!==asset.byteLength||digest!==asset.sha256)throw new Error('Evidence integrity check failed: '+asset.id);
  }
  return record;
}
export async function verifyAssets(record,{signal}={}) {
  assertRecord(record);
  for(const asset of record.assets) {
    signal?.throwIfAborted();
    if(asset.data===undefined)continue;
    const bytes=base64ToBytes(asset.data);
    if(bytes.byteLength!==asset.byteLength||await sha256(bytes)!==asset.sha256)throw new Error('Evidence integrity check failed: '+asset.id);
  }
  return record;
}
export async function makeAsset(bytes,name,mediaType='application/pdf') {
  return {id:id(),name,mediaType,sha256:await sha256(bytes),byteLength:bytes.byteLength,data:bytesToBase64(bytes)};
}
export function updateRecord(record,mutator) {
  const next=clone(record);mutator(next);next.updatedAt=now();return assertRecord(next);
}
export function saveNote(record,input) {
  return updateRecord(record,next=>{const old=next.notes.find(n=>n.id===input.id); const value={...old,...input,id:old?.id??id(),createdAt:old?.createdAt??now(),updatedAt:now()};if(old)next.notes[next.notes.indexOf(old)]=value;else next.notes.push(value);});
}
export function saveAuthority(record,input) {
  return updateRecord(record,next=>{const old=next.authorities.find(n=>n.id===input.id);const value={...old,...input,id:old?.id??id(),createdAt:old?.createdAt??now(),updatedAt:now()};if(old)next.authorities[next.authorities.indexOf(old)]=value;else next.authorities.push(value);});
}
export function deleteAnnotation(record,annotationId) {return updateRecord(record,next=>{next.notes=next.notes.filter(n=>n.id!==annotationId);next.authorities=next.authorities.filter(n=>n.id!==annotationId);});}
export function formatDate(date,locale='en') {
  if(date.precision==='unknown')return 'Undated';
  if(date.precision==='year')return (date.approximate?'≈ ':'')+date.value;
  if(date.precision==='month')return (date.approximate?'≈ ':'')+new Intl.DateTimeFormat(locale,{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date.value+'-01T00:00:00Z'));
  const fmt=v=>new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(v+'T00:00:00Z'));
  return (date.approximate?'≈ ':'')+fmt(date.value)+(date.precision==='range'?' – '+fmt(date.end):'');
}

export function assertIntermediate(item) {
  if(!checkDocument(item))throw new Error('Invalid intermediate document: '+checkDocument.errors.map(e=>`${e.instancePath||'/'} ${e.message}`).join('; '));
  const record=createRecord('Intermediate validation');record.documents=[item.document];record.assets=item.asset?[item.asset]:[];
  verifyAssetsSync(assertRecord(record));return item;
}
export function parseIntermediate(input) {return assertIntermediate(JSON.parse(typeof input==='string'?input:new TextDecoder().decode(input)));}
export function exportIntermediate(item) {return JSON.stringify(assertIntermediate(item),null,2)+'\n';}
