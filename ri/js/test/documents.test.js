// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import test from 'node:test';import assert from 'node:assert/strict';import {readFile}from'node:fs/promises';
import {parseDocument,parseText,parseRichText,rtfText}from'../src/documents.js';
import {sha256,assertIntermediate}from'../src/model.js';
import {EXTRACTION_PROMPT,RELATIONSHIP_PROMPT}from'../src/pipeline.js';
test('public prompts match the canonical library, not inline copies',async()=>{
 for(const [name,actual]of [['extract',EXTRACTION_PROMPT],['relate',RELATIONSHIP_PROMPT]])assert.equal(actual,(await readFile(new URL('../../../prompt-library/'+name+'.txt',import.meta.url),'utf8')).trim());
});
test('plain text and rich HTML retain original bytes and safe paragraph text',async()=>{
 const plain=await parseText('First account\n\nSecond account',{title:'Account.txt',kind:'report'});assert.equal(plain.document.paragraphs.length,2);assert.equal(plain.document.kind,'report');assertIntermediate(plain);
 const html='<p>Agreed &amp; acknowledged.</p><script>Do not extract me</script><style>hide me</style><p>Another account.</p>';
 const rich=await parseRichText(html,{title:'Account.html'});assert.deepEqual(rich.document.paragraphs.map(p=>p.text),['Agreed & acknowledged.','Another account.']);assert.equal(rich.asset.mediaType,'text/html');assert.equal(rich.asset.sha256,await sha256(new TextEncoder().encode(html)));
 const viaFile=await parseDocument(new TextEncoder().encode(html),{title:'Account.html'});assert.deepEqual(viaFile.document.paragraphs.map(p=>p.text),rich.document.paragraphs.map(p=>p.text));
});
test('RTF handles unicode, formatting groups and hidden embedded destinations',async()=>{
 const rtf=String.raw`{\rtf1\ansi\uc1 First \b account\b0 .\par {\fonttbl {\f0 Secret font;}}Second \u8217?account. {\*\unknown hidden}{\pict ignored}}`;
 const parsed=await parseDocument(new TextEncoder().encode(rtf),{title:'Account.rtf'});assert.equal(parsed.document.paragraphs.length,2);assert.equal(parsed.document.paragraphs[1].text,'Second ’account.');assert.equal(parsed.asset.mediaType,'application/rtf');assert(!rtfText(rtf).includes('hidden'));assert.throws(()=>rtfText('{\\rtf1 missing end'),/Malformed/);
});
test('DOCX uses standard text extraction and preserves original file integrity',async()=>{
 const bytes=new Uint8Array(await readFile(new URL('../../../spec/examples/source/JoeBlogsAffidavit.docx',import.meta.url)));const result=await parseDocument(bytes,{title:'JoeBlogsAffidavit.docx'});assert(result.document.paragraphs.some(p=>p.text.includes('Respondent')));assert.equal(result.asset.sha256,await sha256(bytes));assert.equal(result.asset.byteLength,bytes.length);assertIntermediate(result);
 await assert.rejects(parseDocument(bytes,{title:'Joe.docx',maxExpandedBytes:10}),/Expanded DOCX/);await assert.rejects(parseDocument(new Uint8Array([1,2,3]),{title:'Bad.docx'}),/DOCX/);
});
test('empty, unsupported, oversized and cancelled imports fail before producing an intermediate',async()=>{
 await assert.rejects(parseText(' \n '),/no readable text/);await assert.rejects(parseText('abc',{maxBytes:1}),/size limit/);await assert.rejects(parseDocument(new Uint8Array([1]),{title:'Bad.doc'}),/Choose/);await assert.rejects(parseText('text',{signal:AbortSignal.abort()}),{name:'AbortError'});
});

test('provider protocols retain explicit model selection and allow keyless loopback only',async()=>{
 const {createProviderAdapter,isLoopbackEndpoint}=await import('../src/pipeline.js');let request;
 const local=createProviderAdapter({endpoint:'http://localhost:11434/v1/chat/completions',model:'user-chosen',fetch:async(url,init)=>{request=init;return new Response(JSON.stringify({choices:[{message:{content:'{"events":[]}'}}]}));}});await local({prompt:'public',input:{},task:'extract'});assert(!('Authorization'in request.headers));assert.equal(JSON.parse(request.body).model,'user-chosen');assert(isLoopbackEndpoint('http://[::1]:11434/v1'));
 assert.throws(()=>createProviderAdapter({endpoint:'https://remote.example/chat',model:'user-chosen'}),/API key/);assert.throws(()=>createProviderAdapter({protocol:'other'}),/Unsupported/);
 const anthropic=createProviderAdapter({protocol:'anthropic',endpoint:'https://api.anthropic.com/v1/messages',model:'user-chosen',apiKey:'MOCK-KEY',fetch:async(url,init)=>{request=init;return new Response(JSON.stringify({content:[{type:'text',text:'{"events":[]}'}]}));}});assert.deepEqual(await anthropic({prompt:'public',input:{paragraphs:[]},task:'extract'}),{events:[]});assert.equal(request.headers['x-api-key'],'MOCK-KEY');assert.equal(JSON.parse(request.body).system,'public');assert.equal(JSON.parse(request.body).model,'user-chosen');assert(!request.headers.Authorization);
});
