// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {id,makeAsset} from './model.js';
export async function parsePdf(input,options={}) {
  options.signal?.throwIfAborted();
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input instanceof ArrayBuffer?input:await input.arrayBuffer());
  if(bytes.byteLength>(options.maxBytes??25*1024*1024))throw new Error('PDF exceeds the configured size limit.');
  if(new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw new Error('Choose a standard text PDF.');
  const pdfjs=typeof window==='undefined'?await import('pdfjs-dist/legacy/build/pdf.mjs'):await import('./pdf-browser.js').then(m=>m.configurePdfJs(options.workerSrc));
  const task=pdfjs.getDocument({data:bytes.slice(),isEvalSupported:false,useSystemFonts:true});
  const abort=()=>{void task.destroy();};options.signal?.addEventListener('abort',abort,{once:true});
  let pdf;
  try {
    pdf=await task.promise;if(pdf.numPages>(options.maxPages??250))throw new Error('PDF exceeds the configured page limit.');
    const paragraphs=[];
    for(let page=1;page<=pdf.numPages;page++) {
      options.signal?.throwIfAborted();options.onProgress?.({stage:'reading',detail:`Reading page ${page}`,current:page,total:pdf.numPages});
      const content=await (await pdf.getPage(page)).getTextContent();let line='';const lines=[];
      for(const item of content.items)if('str' in item){line+=item.str+' ';if(item.hasEOL){lines.push(line.trim());line='';}}
      if(line.trim())lines.push(line.trim());
      // This is ordinary text extraction. Empty image pages stay empty; there is no OCR.
      for(const text of lines.filter(Boolean))paragraphs.push({id:id(),page,label:String(paragraphs.length+1),text});
    }
    if(!paragraphs.length)throw new Error('This PDF has no extractable text. Scanned and image-only PDFs are not supported.');
    const asset=await makeAsset(bytes,options.title??input.name??'document.pdf');
    return {format:'ocker-document',version:'0.1.0',document:{id:id(),title:options.title??input.name??'Imported PDF',kind:options.kind??'affidavit',...(options.author?{author:options.author}:{}),assetId:asset.id,paragraphs},asset};
  } finally {options.signal?.removeEventListener('abort',abort);await task.destroy();}
}
