// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePdf} from '../src/pdf.js';
import {doclingParagraphs,testDoclingConnection} from '../src/docling.js';
import {pagesWithoutText,mergeScannedPages} from '../src/docling-pages.js';
const doc=()=>({pages:{'1':{},'2':{}},body:{children:[{$ref:'#/texts/0'},{$ref:'#/pictures/0'},{$ref:'#/tables/0'}]},texts:[
 {text:'I did not identify a witness.',prov:[{page_no:1}],children:[]},
 {text:'Picture OCR 01 March 2024',parent:{$ref:'#/pictures/0'},prov:[{page_no:2}],children:[]},
 {text:'Page 1',content_layer:'furniture',prov:[{page_no:1}],children:[]}],
 pictures:[{children:[{$ref:'#/texts/1'}]}],tables:[{prov:[{page_no:2}],data:{table_cells:[{start_row_offset_idx:0,start_col_offset_idx:1,text:'$125.00'},{start_row_offset_idx:0,start_col_offset_idx:0,text:'Invoice'}]}}]});
test('full Docling JSON preserves negation, picture children, table cells, pages and source order',()=>{
 const p=doclingParagraphs(doc());assert.deepEqual(p.map(x=>[x.page,x.text]),[[1,'I did not identify a witness.'],[2,'Picture OCR 01 March 2024'],[2,'Invoice | $125.00']]);
 assert.throws(()=>doclingParagraphs(doc(),{maxPages:1}),/page limit/);
 assert.throws(()=>doclingParagraphs(doc(),{maxTextCharacters:5}),/text exceeds/);
 const invalid=doc();delete invalid.texts[0].prov;assert.throws(()=>doclingParagraphs(invalid),/page reference/);
});
test('PDF imports use Docling Serve and retain original bytes/hash',async()=>{
 let called=false;const bytes=new TextEncoder().encode('%PDF-fixture');
 const parsed=await parsePdf(bytes,{title:'scan.pdf',docling:{endpoint:'http://localhost:5001',fetch:async(url,init)=>{
  called=true;assert.equal(url,'http://localhost:5001/v1/convert/file');assert.equal(init.method,'POST');assert.equal(init.body.get('to_formats'),'json');assert.equal(init.body.get('do_ocr'),'true');
  assert.deepEqual(new Uint8Array(await init.body.get('files').arrayBuffer()),bytes);return Response.json({status:'success',document:{json_content:doc()}});
 }}});assert(called);assert.equal(parsed.asset.byteLength,bytes.length);assert.equal(parsed.document.assetId,parsed.asset.id);assert.equal(parsed.document.paragraphs.length,3);
 await assert.rejects(parsePdf(Uint8Array.of(1,2)),/Choose a PDF/);
});
test('service failures never fall back to old extraction; partial results are rejected',async()=>{
 const bytes=new TextEncoder().encode('%PDF-fixture');
 await assert.rejects(parsePdf(bytes,{docling:{fetch:async()=>{throw new Error('offline');}}}),/Docling Serve/);
 await assert.rejects(parsePdf(bytes,{docling:{fetch:async()=>Response.json({status:'partial_success',document:{json_content:doc()}})}}),/incomplete/);
 await assert.rejects(parsePdf(bytes,{signal:AbortSignal.abort()}),{name:'AbortError'});
});
test('connection check validates service and never accepts credentials in URL',async()=>{
 assert.deepEqual(await testDoclingConnection({fetch:async()=>Response.json({status:'ok'})}),{ok:true,endpoint:'http://localhost:5001'});
 await assert.rejects(testDoclingConnection({fetch:async()=>Response.json({ok:true})}),/Cannot connect/);
 await assert.rejects(testDoclingConnection({endpoint:'http://user:pass@localhost:5001'}),/without credentials/);
});
test('mixed PDFs OCR missing pages and keep original page numbers and reading order',()=>{
 const digital={pages:{1:{},2:{},3:{}},texts:[{text:'Typed page one',prov:[{page_no:1}]},{text:'Typed page three',prov:[{page_no:3}]}],body:{children:[{$ref:'#/texts/0'},{$ref:'#/texts/1'}]}};
 assert.deepEqual(pagesWithoutText(digital,3),[2]);
 const scanned={texts:[{text:'Scanned witness statement',prov:[{page_no:1}]}],pictures:[{children:[{$ref:'#/texts/0'}]}],body:{children:[{$ref:'#/pictures/0'}]}};
 const merged=mergeScannedPages(digital,scanned,[2]);
 assert.deepEqual(doclingParagraphs(merged).map(p=>[p.page,p.text]),[[1,'Typed page one'],[2,'Scanned witness statement'],[3,'Typed page three']]);
 assert.deepEqual(pagesWithoutText(merged,3),[]);
 assert.equal(scanned.texts[0].prov[0].page_no,1);
 assert.throws(()=>mergeScannedPages(digital,scanned,[]),/invalid scanned-page/);
});
