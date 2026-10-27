// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {id,makeAsset,assertIntermediate} from './model.js';

function endpointUrl(endpoint='http://localhost:5001') {
  const url=new URL(endpoint);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use an HTTP or HTTPS Docling Serve address without credentials, a query or a fragment.');
  return url.href.replace(/\/$/,'');
}
function requestSignal(options,defaultTimeout) {
  const timeout=options.timeoutMs??defaultTimeout;
  if(!Number.isFinite(timeout)||timeout<=0)throw new Error('Docling timeout must be a positive number of milliseconds.');
  return options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(timeout)]):AbortSignal.timeout(timeout);
}
export async function testDoclingConnection(options={}) {
  const endpoint=endpointUrl(options.endpoint);const signal=requestSignal(options,10000);
  try {
    const response=await (options.fetch??fetch)(endpoint+'/health',{signal});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const health=await response.json();
    if(health.status!=='ok')throw new Error('Unexpected health response');
    return {ok:true,endpoint};
  }catch(error){if(options.signal?.aborted)throw options.signal.reason;throw new Error(`Cannot connect to Docling Serve at ${endpoint}. Start Docling Serve and test the connection again. ${error.message}`,{cause:error});}
}
export async function convertWithDoclingServe(bytes,options={}) {
  const settings=options.docling??{};const endpoint=endpointUrl(settings.endpoint);const signal=requestSignal({...settings,signal:options.signal},300000);
  const form=new FormData();form.append('files',new Blob([bytes],{type:'application/pdf'}),options.title??'document.pdf');
  form.append('to_formats','json');form.append('do_ocr','true');form.append('do_table_structure','true');
  form.append('image_export_mode','placeholder');
  options.onProgress?.({stage:'reading',detail:'Reading the PDF with Docling Serve…'});
  let response;
  try{response=await (settings.fetch??fetch)(endpoint+'/v1/convert/file',{method:'POST',body:form,signal});}
  catch(error){if(options.signal?.aborted)throw options.signal.reason;throw new Error(`Docling Serve could not process the PDF at ${endpoint}. Check that the server is running and its timeout allows this document. ${error.message}`,{cause:error});}
  if(!response.ok)throw new Error(`Docling Serve rejected the PDF (HTTP ${response.status}). Check the file and the server's upload limits.`);
  const result=await response.json();
  if(result.status!=='success')throw new Error(`Docling conversion ${result.status??'failed'}. The incomplete document was not imported.`);
  const doc=result.document?.json_content;
  if(!doc)throw new Error('Docling Serve did not return a JSON document. Check the server version and JSON output support.');
  return typeof doc==='string'?JSON.parse(doc):doc;
}

// Use the document tree, including picture children. Markdown deliberately omits some OCR text.
export function doclingParagraphs(doc,options={}) {
  if(!doc||typeof doc!=='object'||!Array.isArray(doc.texts))throw new Error('Docling returned an invalid document.');
  const pages=Object.keys(doc.pages??{}).map(Number);
  if(pages.some(p=>!Number.isInteger(p)||p<1)||Math.max(0,...pages)>(options.maxPages??250))throw new Error('PDF exceeds the configured page limit or has invalid page references.');
  const paragraphs=[],visited=new Set();let length=0;
  function add(item,text) {
    if(typeof text!=='string'||!text.trim())return;
    const provenance=item.prov??[];
    if(!provenance.length)throw new Error('Docling returned text without a page reference.');
    for(const prov of provenance){
      const page=prov.page_no;
      if(!Number.isInteger(page)||page<1||page>(options.maxPages??250))throw new Error('Docling returned an invalid page reference.');
      const span=prov.charspan;
      const value=(provenance.length>1&&Array.isArray(span)?text.slice(span[0],span[1]):text).trim();
      if(!value)continue;
      length+=value.length;if(length>(options.maxTextCharacters??2000000))throw new Error('Extracted text exceeds the configured limit.');
      paragraphs.push({id:id(),page,label:String(paragraphs.length+1),text:value});
    }
  }
  function walk(ref) {
    const key=typeof ref==='string'?ref:ref?.$ref;if(!key||visited.has(key))return;
    const match=/^#\/(texts|tables|pictures|groups)\/(\d+)$/.exec(key);if(!match)throw new Error('Docling returned an invalid content reference.');
    const item=doc[match[1]]?.[Number(match[2])];if(!item)throw new Error('Docling returned an unresolved content reference.');visited.add(key);
    if(item.content_layer==='furniture')return;
    if(match[1]==='tables'){
      const cells=item.data?.table_cells??[];const rows=new Map();
      for(const cell of cells){const row=cell.start_row_offset_idx??0;const line=rows.get(row)??[];line.push(cell);rows.set(row,line);}
      const text=[...rows].sort(([a],[b])=>a-b).map(([,cells])=>cells.sort((a,b)=>(a.start_col_offset_idx??0)-(b.start_col_offset_idx??0)).map(c=>c.text??'').join(' | ')).join('\n');
      add(item,text);
    }else {if(match[1]==='texts')add(item,item.text);for(const child of item.children??[])walk(child);}
  }
  for(const child of doc.body?.children??[])walk(child);
  // Keep orphan OCR text exposed by converters even when no body tree is supplied.
  for(const collection of ['texts','tables','pictures'])for(let i=0;i<(doc[collection]?.length??0);i++)walk(`#/${collection}/${i}`);
  if(!paragraphs.length)throw new Error('Docling found no readable text in this PDF. Try a clearer scan or an unlocked copy.');
  paragraphs.sort((a,b)=>a.page-b.page);
  paragraphs.forEach((paragraph,index)=>{paragraph.label=String(index+1);});
  return paragraphs;
}
export async function doclingIntermediate(doc,bytes,options={}) {
  options.signal?.throwIfAborted();
  const paragraphs=doclingParagraphs(doc,options);const title=options.title??'Imported PDF';
  const asset=await makeAsset(bytes,title,'application/pdf');
  return assertIntermediate({format:'ocker-document',version:'0.1.0',document:{id:id(),title,kind:options.kind??'affidavit',...(options.author?{author:options.author}:{}),assetId:asset.id,paragraphs},asset});
}
