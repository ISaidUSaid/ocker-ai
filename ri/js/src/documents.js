// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {id,makeAsset,assertIntermediate} from './model.js';
import {parsePdf} from './pdf.js';
import {Parser} from 'htmlparser2';

export async function parseText(text,options={}) {
  options.signal?.throwIfAborted();
  const bytes=new TextEncoder().encode(text);
  if(bytes.length>(options.maxBytes??25*1024*1024))throw new Error('Document exceeds the configured size limit.');
  return textIntermediate(text,bytes,options.title??'Pasted text.txt','text/plain',options);
}
async function textIntermediate(text,bytes,title,mediaType,options) {
  options.signal?.throwIfAborted();
  if(text.length>(options.maxTextCharacters??2000000))throw new Error('Extracted text exceeds the configured limit.');
  const parts=text.replace(/\r\n?/g,'\n').split(/\n+/).map(p=>p.trim()).filter(Boolean);
  if(!parts.length)throw new Error('This document has no readable text.');
  const paragraphs=parts.map((text,index)=>({id:id(),page:1,label:String(index+1),text}));
  const asset=await makeAsset(bytes,title,mediaType);
  const document={id:id(),title,kind:options.kind??'affidavit',...(options.author?{author:options.author}:{}),assetId:asset.id,paragraphs};
  options.onProgress?.({stage:'reading',detail:'Document text ready',current:paragraphs.length,total:paragraphs.length});
  return assertIntermediate({format:'ocker-document',version:'0.1.0',document,asset});
}

export async function parseRichText(html,options={}) {
  const bytes=new TextEncoder().encode(html);
  if(bytes.length>(options.maxBytes??25*1024*1024))throw new Error('Document exceeds the configured size limit.');
  let text='',skip=0;const hidden=new Set(['script','style','noscript','template','iframe','object']);
  const parser=new Parser({
    onopentag(name){if(hidden.has(name))skip++;if(!skip&&['br','p','div','li','tr','h1','h2','h3','blockquote'].includes(name))text+='\n';},
    ontext(value){if(!skip)text+=value;},
    onclosetag(name){if(hidden.has(name))skip--;if(!skip&&['p','div','li','tr','h1','h2','h3','blockquote'].includes(name))text+='\n';}
  },{decodeEntities:true});parser.write(html);parser.end();
  return textIntermediate(text,bytes,options.title??'Pasted rich text.html','text/html',options);
}

// Basic RTF text reader: formatting and embedded destinations never become evidence text.
export function rtfText(rtf) {
  if(!/^\{\\rtf\d/.test(rtf))throw new Error('This is not a supported RTF document.');
  let state={skip:false,uc:1},stack=[],output='',fallback=0;
  const skipped=new Set(['fonttbl','colortbl','stylesheet','info','pict','object','header','footer','filetbl','datastore','themedata','xmlnstbl','listtable','listoverridetable','fldinst']);
  for(let i=0;i<rtf.length;) {
    const char=rtf[i++];
    if(char==='{'){stack.push({...state});continue;}
    if(char==='}'){if(!stack.length)throw new Error('Malformed RTF groups.');state=stack.pop();continue;}
    if(char!=='\\'){if(char!=='\r'&&char!=='\n'){if(fallback)fallback--;else if(!state.skip)output+=char;}continue;}
    const rest=rtf.slice(i);
    if(rest[0]==="'") {const hex=rest.slice(1,3);if(!/^[\da-f]{2}$/i.test(hex))throw new Error('Malformed RTF escape.');i+=3;if(fallback)fallback--;else if(!state.skip)output+=new TextDecoder('windows-1252').decode(Uint8Array.of(parseInt(hex,16)));continue;}
    const match=/^([a-z]+)(-?\d+)? ?/i.exec(rest);
    if(!match){const symbol=rtf[i++];if(symbol==='*')state.skip=true;else if(fallback)fallback--;else if(!state.skip)output+=({'\\':'\\','{':'{','}':'}','~':'\u00a0','_':'\u2011'}[symbol]??'');continue;}
    i+=match[0].length;const word=match[1],n=Number(match[2]);
    if(skipped.has(word))state.skip=true;
    if(word==='bin'){if(!Number.isInteger(n)||n<0||i+n>rtf.length)throw new Error('Malformed RTF binary data.');i+=n;continue;}
    if(word==='uc'){state.uc=Math.max(0,Math.min(16,n));continue;}
    if(state.skip)continue;
    if(word==='u'){output+=String.fromCharCode(n<0?n+65536:n);fallback=state.uc;}
    else output+=({par:'\n',line:'\n',tab:'\t',emdash:'—',endash:'–',lquote:'‘',rquote:'’',ldblquote:'“',rdblquote:'”',bullet:'•'}[word]??'');
  }
  if(stack.length)throw new Error('Malformed RTF groups.');
  return output;
}
function checkDocxSize(bytes,limit) {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(view.getUint32(p,true)===0x06054b50){end=p;break;}
  if(end<0)throw new Error('This is not a supported DOCX archive.');
  let offset=view.getUint32(end+16,true),total=0;const count=view.getUint16(end+10,true);
  if(count===65535)throw new Error('ZIP64 DOCX archives are not supported.');
  for(let i=0;i<count;i++) {
    if(offset+46>bytes.length||view.getUint32(offset,true)!==0x02014b50)throw new Error('Malformed DOCX archive.');
    total+=view.getUint32(offset+24,true);if(total>limit)throw new Error('Expanded DOCX exceeds the configured limit.');
    offset+=46+view.getUint16(offset+28,true)+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
  }
}
export async function parseDocument(input,options={}) {
  options.signal?.throwIfAborted();
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input instanceof ArrayBuffer?input:await input.arrayBuffer());
  if(bytes.length>(options.maxBytes??25*1024*1024))throw new Error('Document exceeds the configured size limit.');
  const title=options.title??input.name??'Imported document';
  const ext=(options.format??title.split('.').pop()).toLowerCase();
  if(ext==='pdf'||new TextDecoder().decode(bytes.subarray(0,5))==='%PDF-')return parsePdf(bytes,{...options,title});
  let text,mediaType;
  if(ext==='docx') {
    checkDocxSize(bytes,options.maxExpandedBytes??50*1024*1024);
    const imported=typeof window==='undefined'?await import('mammoth'):await import('mammoth/mammoth.browser.js');
    const mammoth=imported.default??imported;
    const result=await mammoth.extractRawText(typeof window==='undefined'?{buffer:Buffer.from(bytes)}:{arrayBuffer:bytes.slice().buffer});
    text=result.value;mediaType='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if(ext==='rtf') {text=rtfText(new TextDecoder('windows-1252').decode(bytes));mediaType='application/rtf';}
  else if(['html','htm'].includes(ext))return parseRichText(new TextDecoder('utf-8',{fatal:true}).decode(bytes),{...options,title});
  else if(['txt','text'].includes(ext)){text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);mediaType='text/plain';if(text.includes('\0'))throw new Error('Choose a UTF-8 text document.');}
  else throw new Error('Choose a PDF, DOCX, RTF or TXT document.');
  return textIntermediate(text,bytes,title,mediaType,options);
}
