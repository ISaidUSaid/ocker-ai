// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {pagesWithoutText,mergeScannedPages} from './docling-pages.js';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';

// PDF.js renders pixels only. Extraction, layout and OCR run in Docling's worker.
export async function convertPdfInBrowser(bytes,options={}) {
  const config=options.docling??{};
  const workerSrc=options.workerSrc??new URL('pdf.worker.min.mjs',document.baseURI).href;
  pdfjs.GlobalWorkerOptions.workerSrc=workerSrc;
  const assetBase=new URL(config.assetBaseUrl??new URL('docling/',new URL(workerSrc,document.baseURI)),document.baseURI).href;
  const worker=new Worker(new URL('worker.js',assetBase),{type:'module',name:'ocker-docling'});
  const pending=new Map();let sequence=0,disposed=false,renderTask;
  const timeoutMs=config.timeoutMs??600000;
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0){worker.terminate();throw new Error('Docling timeout must be positive.');}
  if(!['en','ch','cyrillic'].includes(config.ocrLanguage??'en')){worker.terminate();throw new Error('Unsupported browser OCR language. Use en, ch or cyrillic.');}
  const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs);
  const progress=detail=>options.onProgress?.({stage:'reading',detail});
  const fail=error=>{for(const {reject} of pending.values())reject(error);pending.clear();};
  worker.onmessage=({data})=>{
    if(data.type==='status'){progress(data.msg);return;}
    const request=pending.get(data.id);if(!request)return;pending.delete(data.id);
    data.type==='error'?request.reject(new Error(data.msg)):request.resolve(data);
  };
  worker.onerror=event=>fail(new Error(`Cannot load Docling document support. Check that the host prepared its Docling assets. ${event.message??''}`));
  const request=(type,data={},transfer=[])=>new Promise((resolve,reject)=>{
    if(disposed||signal.aborted){reject(signal.reason??new Error('Docling worker stopped.'));return;}
    const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,type,...data},transfer);
  });
  const task=pdfjs.getDocument({data:bytes.slice(),isEvalSupported:false,useSystemFonts:true});
  const stop=()=>{disposed=true;worker.terminate();renderTask?.cancel();fail(signal.reason);void task.destroy();};
  signal.addEventListener('abort',stop,{once:true});
  try {
    signal.throwIfAborted();const pdf=await task.promise;
    if(pdf.numPages>(options.maxPages??250))throw new Error('PDF exceeds the configured page limit.');
    progress('Preparing local document support. Models download on first use; your PDF stays on this device.');
    await request('boot',{layoutOnly:true,modelBaseUrl:config.modelBaseUrl});
    // A digital converter can contain scanned pages too; choose the scanned path only
    // when Docling explicitly reports that the document has no native text layer.
    let digital=true;
    try {await request('doc-start-digital',{bytes:bytes.slice(),useTf:config.tableStructure!==false,lang:config.ocrLanguage??'en'});}
    catch(error){if(!/no (embedded )?text|no native text|image.only|scanned/i.test(error.message))throw error;digital=false;await request('doc-start',{lang:config.ocrLanguage??'en',useTf:config.tableStructure!==false});}
    async function readPage(index){
      signal.throwIfAborted();options.onProgress?.({stage:'reading',detail:`Reading page ${index+1} of ${pdf.numPages} on this device`,current:index+1,total:pdf.numPages});
      const page=await pdf.getPage(index+1);const scale=2;const viewport=page.getViewport({scale});
      if(viewport.width*viewport.height>40000000)throw new Error('This PDF page is too large for browser processing.');
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      const context=canvas.getContext('2d',{willReadFrequently:true});
      try{
        renderTask=page.render({canvas,canvasContext:context,viewport});await renderTask.promise;
        const rgba=context.getImageData(0,0,canvas.width,canvas.height).data.buffer;
        await request('doc-page',{rgba,w:canvas.width,h:canvas.height,scale,index},[rgba]);
      }finally{canvas.width=canvas.height=0;page.cleanup();}
    }
    for(let index=0;index<pdf.numPages;index++)await readPage(index);
    const finish=async()=>JSON.parse((await request('doc-finish',{name:options.title??'document.pdf',to:'json',images:'placeholder'})).md);
    let result=await finish();
    const missing=digital?pagesWithoutText(result,pdf.numPages):[];
    if(missing.length){
      progress('Reading scanned pages inside this PDF…');
      await request('doc-start',{lang:config.ocrLanguage??'en',useTf:config.tableStructure!==false});
      for(const page of missing)await readPage(page-1);
      result=mergeScannedPages(result,await finish(),missing);
    }
    return result;
  }finally {signal.removeEventListener('abort',stop);disposed=true;worker.terminate();await task.destroy();}
}
