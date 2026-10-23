// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {jsPDF} from 'jspdf';
import {createRecord,makeAsset,exportRecord,verifyAssets} from '../../ri/js/src/model.js';
const root=new URL('../examples/',import.meta.url),web=new URL('../../ri/js/demo/public/examples/',import.meta.url);
await mkdir(root,{recursive:true});await mkdir(web,{recursive:true});
const stamp='2026-10-23T00:00:00Z';
const record=createRecord('Joe & Jill · Two accounts, one chronology');record.id='joe-jill-example';record.createdAt=record.updatedAt=stamp;
record.actors=[{id:'joe',name:'Joe Blogs',role:'deponent'},{id:'jill',name:'Jill Blogs',role:'deponent'},{id:'practitioner',name:'Example practitioner',role:'practitioner'}];
const data=[{id:'joe-affidavit',name:'Joe Blogs',file:'JoeBlogsAffidavit.pdf',paragraphs:[
 ['2017','year','We married in 2017.','Marriage'],
 ['2024-05-25','day','On 25 May 2024, Johnny did not attend my agreed weekend visit.','Weekend visit did not occur'],
 ['2024-05-29','day','On 29 May 2024, Jill threatened to withdraw child support unless I agreed.','Alleged child-support threat'],
 ['2024-10-10','day','On 10 October 2024, Jill sent me an email with the subject test.','Email with subject test'],
 ['2025-11-03','day','I did not strike Jill on 3 November 2025.','Joe denies striking Jill'],
 ['2025-11-03','day','We separated on 3 November 2025.','Final separation']
]},{id:'jill-affidavit',name:'Jill Blogs',file:'JillBlogsAffidavit.pdf',paragraphs:[
 ['2017','year','Joe and I married in 2017.','Marriage'],
 ['2024-05-25','day','Johnny did not attend the agreed weekend visit on 25 May 2024.','Weekend visit did not occur'],
 ['2024-05-29','day','I made no threat to withdraw child support on 29 May 2024.','Jill denies child-support threat'],
 ['2024-10-10','day','On 10 October 2024, I sent Joe an email with the subject test.','Email with subject test'],
 ['2025-11-03','day','On 3 November 2025, Joe struck me across the face.','Jill alleges a strike'],
 ['2025-11-03','day','We separated on a final basis on 3 November 2025.','Final separation']
]}];
for(const source of data){
 const pdf=new jsPDF();pdf.setFont('helvetica','bold');pdf.setFontSize(20);pdf.text('Fictional affidavit',20,25);pdf.setFontSize(13);pdf.text(source.name,20,37);pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text('OCKER training example. Fictional parties and events; not a court filing.',20,48);
 const paragraphs=source.paragraphs.map((p,index)=>({id:source.id+'-p'+(index+1),page:1,label:String(index+1),text:p[2]}));
 paragraphs.forEach((p,index)=>pdf.text(pdf.splitTextToSize(p.label+'. '+p.text,170),20,65+index*26));
 const bytes=new Uint8Array(pdf.output('arraybuffer'));const asset=await makeAsset(bytes,source.file);asset.id=source.id+'-pdf';
 const document={id:source.id,title:source.name+' — fictional affidavit',kind:'affidavit',author:source.name,assetId:asset.id,paragraphs};record.documents.push(document);record.assets.push(asset);
 const intermediate={format:'ocker-document',version:'0.1.0',document,asset};await writeFile(new URL(source.id+'.document.json',root),JSON.stringify(intermediate,null,2)+'\n');await writeFile(new URL(source.file,web),bytes);
 for(const [index,[value,precision,summary,title]]of source.paragraphs.entries())record.events.push({id:source.id+'-e'+(index+1),title,summary,date:{precision,value},assertedBy:source.name,actorIds:[source.id.startsWith('joe')?'joe':'jill'],status:index===2||index===4?'disputed':'alleged',sources:[{documentId:source.id,paragraphId:paragraphs[index].id,page:1,quote:paragraphs[index].text}],narrative:index<2?'Family background':'Accounts of events'});
}
for(const [index,type]of ['supports','supports','contradicts','supports','contradicts','supports'].entries())record.relationships.push({id:'relation-'+(index+1),from:'joe-affidavit-e'+(index+1),to:'jill-affidavit-e'+(index+1),type,rationale:type==='supports'?'Both deponents give the same material account of this event.':'The deponents give opposing accounts of the same material proposition.',provenance:{method:'human',createdAt:stamp,authorId:'practitioner'}});
record.notes=[{id:'example-note',eventId:'joe-affidavit-e3',body:'Compare the two accounts and check the original paragraphs before drawing a conclusion.',position:{x:75,y:185},createdAt:stamp,updatedAt:stamp,authorId:'practitioner'}];
record.authorities=[{id:'example-precedent',eventId:'jill-affidavit-e5',title:'Fictional authority — replace with a real citation',citation:'Example v Example [2026] DEMO 1',type:'unspecified',color:'blue',body:'Demonstration only. This is not a real authority.',createdAt:stamp,updatedAt:stamp,authorId:'practitioner'}];
await verifyAssets(record);const json=exportRecord(record);await writeFile(new URL('joe-jill.ocker.json',root),json);await writeFile(new URL('joe-jill.ocker.json',web),json);
const minimal=createRecord('Empty valid chronology');minimal.id='minimal-example';minimal.createdAt=minimal.updatedAt=stamp;await writeFile(new URL('minimal.ocker.json',root),exportRecord(minimal));
console.log('Built fictional PDFs, intermediate documents and portable example ('+record.events.length+' events).');
