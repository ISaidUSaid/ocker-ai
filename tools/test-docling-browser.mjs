// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
// Run the JS demo first. This opt-in smoke test downloads the real OCR models.
import assert from 'node:assert/strict';
import {jsPDF} from 'jspdf';
import {chromium} from '@playwright/test';

const url=process.env.OCKER_DEMO_URL??'http://127.0.0.1:5173/';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'})});
try {
  const page=await browser.newPage();
  const uploads=[];
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(url).origin&&!['GET','HEAD'].includes(request.method()))uploads.push(request.url());});
  await page.goto(url);
  const scan=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;
    const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,1200,900);
    context.fillStyle='black';context.font='36px Arial';
    context.fillText('SCANNED WITNESS STATEMENT',60,120);
    context.fillText('I did not identify a witness.',60,200);
    context.fillText('Recorded on 01 March 2024.',60,280);
    return canvas.toDataURL('image/png');
  });
  const pdf=new jsPDF();pdf.text('Typed cover page',20,30);pdf.addPage();
  pdf.addImage(scan,'PNG',10,20,190,142.5);
  pdf.addPage();pdf.text('Typed final page',20,30);
  const paragraphs=await page.evaluate(async bytes=>{
    const {parsePdf}=await import('/src/pdf.js');
    const result=await parsePdf(new Uint8Array(bytes),{title:'mixed-test.pdf',docling:{assetBaseUrl:'/docling/'}});
    return result.document.paragraphs;
  },Array.from(new Uint8Array(pdf.output('arraybuffer'))));
  assert.deepEqual([...new Set(paragraphs.map(item=>item.page))],[1,2,3]);
  assert.match(paragraphs.filter(item=>item.page===2).map(item=>item.text).join(' '),/did not identify a witness/i);
  assert.deepEqual(uploads,[],'PDF processing must not upload documents');
  console.log('Browser Docling passed: typed pages, scanned middle page, source page order, negation and no document uploads.');
} finally {await browser.close();}
