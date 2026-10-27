// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {convertWithDoclingServe,doclingIntermediate} from './docling.js';
export async function parsePdf(input,options={}) {
  options.signal?.throwIfAborted();
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input instanceof ArrayBuffer?input:await input.arrayBuffer());
  if(bytes.byteLength>(options.maxBytes??25*1024*1024))throw new Error('PDF exceeds the configured size limit.');
  if(new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw new Error('Choose a PDF document.');
  const settings={...options,title:options.title??input.name??'Imported PDF'};
  const doc=typeof window==='undefined'
    ?await convertWithDoclingServe(bytes,settings)
    :await import('./pdf-browser.js').then(m=>m.convertPdfInBrowser(bytes,settings));
  options.signal?.throwIfAborted();
  return doclingIntermediate(doc,bytes,settings);
}
