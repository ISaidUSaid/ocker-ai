// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {createRecord,exportRecord,verifyAssets} from '../../ri/js/src/model.js';
import {parsePdf} from '../../ri/js/src/pdf.js';
const root=new URL('../examples/',import.meta.url),web=new URL('../../ri/js/demo/public/examples/',import.meta.url);
await mkdir(web,{recursive:true});
const stamp='2026-10-24T00:00:00Z',record=createRecord('Joe & Jill · Two accounts, one chronology');
record.id='joe-jill-example';record.createdAt=record.updatedAt=stamp;
record.actors=[{id:'joe',name:'Joe Blogs',role:'deponent'},{id:'jill',name:'Jill Blogs',role:'deponent'},{id:'practitioner',name:'Example practitioner',role:'practitioner'}];
const fixture=JSON.parse(await readFile(new URL('source/accounts.json',root),'utf8')),accounts=fixture.accounts;
for(const [key,events] of Object.entries(accounts)) {
 const name=key.startsWith('joe')?'Joe':'Jill',file=name+'BlogsAffidavit.pdf';
 const parsed=await parsePdf(new Uint8Array(await readFile(new URL('source/'+file,root))),{title:file,author:name+' Blogs',kind:'affidavit'});
 const {document,asset}=parsed;document.id=key;asset.id=key+'-pdf';document.assetId=asset.id;
 document.paragraphs.forEach((p,i)=>{p.id=key+'-p'+(i+1);});
 record.documents.push(document);record.assets.push(asset);
 for(const [i,account] of events.entries()) {
  const normal=value=>value.normalize('NFKC').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
  const match=normal(account.sourceText);const pageMatch=/[Pp]age\s*(\d+)|^p(\d+)/.exec(account.paragraphRef??'');const page=account.page??Number(pageMatch?.[1]??pageMatch?.[2]??1);
  const originalText=document.paragraphs.filter(p=>p.page===page).map(p=>p.text).join(' ');
  if(!normal(originalText).includes(match))throw new Error('Fixture paragraph does not occur in original PDF: '+account.id);
  let paragraph=document.paragraphs.find(p=>p.page===page&&p.text===account.sourceText);
  if(!paragraph){paragraph={id:key+'-account-'+(i+1),page,label:account.paragraphRef,text:account.sourceText};document.paragraphs.push(paragraph);}
  record.events.push({id:account.id,title:account.title,summary:account.summary,date:account.date,assertedBy:account.assertedBy??name+' Blogs',actorIds:[name.toLowerCase()],status:account.status,sources:[{documentId:key,paragraphId:paragraph.id,page,quote:paragraph.text}],narrative:account.narrative});
 }
 await writeFile(new URL(key+'.document.json',root),JSON.stringify(parsed,null,2)+'\n');await copyFile(new URL('source/'+file,root),new URL(file,web));
}
record.relationships=fixture.relationships.map((r,i)=>({id:'relation-'+(i+1),...r,provenance:{method:'imported',createdAt:stamp,authorId:'practitioner'}}));
const contested=record.events.find(e=>e.status==='disputed'&&e.title.toLowerCase().includes('blackmail'))??record.events.find(e=>e.status==='disputed');
const agreed=record.events.find(e=>e.status==='agreed');
record.notes=[
 {id:'example-review-note',eventId:contested.id,body:'Compare the alleged demand with the denial. An admission of child-support threats does not, by itself, settle whether blackmail occurred.',position:{x:300,y:30},createdAt:stamp,updatedAt:stamp,authorId:'practitioner'},
 {id:'example-common-ground-note',eventId:agreed.id,body:'Common ground on the words used. Keep the differing explanations and surrounding context separate.',position:{x:300,y:30},createdAt:stamp,updatedAt:stamp,authorId:'practitioner'}
];
record.authorities=[{id:'example-precedent',eventId:contested.id,title:'Briginshaw v Briginshaw',citation:'(1938) 60 CLR 336; [1938] HCA 34',type:'binding',color:'blue',court:'High Court of Australia',jurisdiction:'Australia',sourceUrl:'https://www.hcourt.gov.au/cases-and-judgments/judgments/1-clr-100-clr/briginshaw-v-briginshaw',body:'Example research flag for contested allegations. Review the judgment and verify its application to the issue and applicable statutory framework before relying on it.',createdAt:stamp,updatedAt:stamp,authorId:'practitioner'}];
await verifyAssets(record);const json=exportRecord(record);await writeFile(new URL('joe-jill.ocker.json',root),json);await writeFile(new URL('joe-jill.ocker.json',web),json);
const minimal=createRecord('Empty valid chronology');minimal.id='minimal-example';minimal.createdAt=minimal.updatedAt=stamp;await writeFile(new URL('minimal.ocker.json',root),exportRecord(minimal));
console.log('Built source-backed test fixture: '+record.events.length+' events; '+record.documents.map(d=>d.paragraphs.length).join('/')+' extracted text lines.');
