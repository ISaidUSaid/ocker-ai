// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGraph,recordBuilder,createRecord,makeAsset,parseRecord,exportRecord,parseText,saveNote} from '../src/headless.js';

async function fixture() {
  const asset=await makeAsset(new TextEncoder().encode('An exact paragraph.'),'source.txt','text/plain');
  const document={id:'document',title:'An account',kind:'report',assetId:asset.id,paragraphs:[{id:'p1',page:1,text:'An exact paragraph.'}]};
  const source={documentId:document.id,paragraphId:'p1',quote:'exact paragraph'};
  const events=['first','second','third'].map(id=>({id,title:id,summary:'An account',date:{precision:'unknown'},sources:[source]}));
  const edge=(id,from,to,type)=>({id,from,to,type,rationale:'An attributed comparison',provenance:{method:'human',createdAt:new Date().toISOString()}});
  return recordBuilder('A host chronology').addEvent(events[0]).addEvent(events[1]).addEvent(events[2])
    .addRelationship(edge('r1','third','first','supports')).addRelationship(edge('r2','first','second','contradicts')).addRelationship(edge('r3','second','first','supports'))
    .addDocument(document).addAsset(asset).addActor({id:'author',name:'Author'}).build();
}
test('graph resolves direct bidirectional links once in record order and exact evidence with document asset fallback',async()=>{
  const record=await fixture(),graph=createGraph(record);
  assert.deepEqual(graph.getRelatedEvents('first').map(e=>e.id),['second','third']);
  assert.deepEqual(graph.getRelatedEvents('first','supports').map(e=>e.id),['second','third']);
  assert.deepEqual(graph.getRelatedEvents('first','contradicts').map(e=>e.id),['second']);
  assert.equal(graph.getRelationships('first').length,3);
  const evidence=graph.getEvidence('first')[0];
  assert.equal(evidence.source.quote,'exact paragraph');assert.equal(evidence.paragraph.text,'An exact paragraph.');
  assert.equal(evidence.document.id,'document');assert.equal(evidence.asset.id,record.assets[0].id);
  assert.equal(graph.getDocument('document').id,'document');assert.equal(graph.getActor('author').name,'Author');
  assert.equal(graph.getAsset(record.assets[0].id).mediaType,'text/plain');
  assert.equal(graph.getEvent('absent'),undefined);assert.equal(graph.getDocument('absent'),undefined);
  for(const method of ['getRelatedEvents','getRelationships','getNotes','getAuthorities','getEvidence'])assert.throws(()=>graph[method]('absent'),/Unknown event/);
  assert.throws(()=>graph.getRelationships('first','advanced'),/Unsupported relationship/);
});
test('graph is a snapshot and returned records, entities, evidence and annotation lists cannot mutate its indexes',async()=>{
  let record=await fixture();record=saveNote(record,{eventId:'first',body:'A note',position:{x:20,y:30}});
  const graph=createGraph(record);record.events[0].title='Changed input';graph.getRecord().events.length=0;
  graph.getEvent('first').sources.length=0;graph.getEvidence('first')[0].document.paragraphs.length=0;graph.getNotes('first')[0].body='Changed return';
  assert.equal(graph.getEvent('first').title,'first');assert.equal(graph.getEvidence('first').length,1);assert.equal(graph.getNotes('first')[0].body,'A note');
  assert.equal(graph.getAuthorities('first').length,0);assert.equal(graph.getRecord().events.length,3);
  assert.deepEqual(parseRecord(exportRecord(graph.getRecord())),graph.getRecord());
});
test('builders clone input entities, allow reference order independence and validate full records and embedded bytes',async()=>{
  const intermediate=await parseText('A paragraph.',{title:'Account.txt',kind:'affidavit'});
  const event={id:'event',title:'An event',summary:'An account',date:{precision:'unknown'},sources:[{documentId:intermediate.document.id,paragraphId:intermediate.document.paragraphs[0].id}]};
  const builder=recordBuilder('Matter').addEvent(event).addIntermediate(intermediate);event.title='Changed input';
  const built=builder.build();assert.equal(built.events[0].title,'An event');built.events[0].sources.length=0;
  assert.equal(builder.build().events[0].sources.length,1);
  const original=builder.build();const edited=recordBuilder(original).addActor({id:'actor',name:'An actor'}).build();
  assert.equal(original.actors.length,0);assert.equal(edited.actors.length,1);
  assert.throws(()=>recordBuilder('Invalid').addEvent(event).build(),/unresolved/);
  assert.throws(()=>recordBuilder(original).addEvent(original.events[0]).build(),/Duplicate id/);
  const corrupt=structuredClone(intermediate);corrupt.asset.sha256='0'.repeat(64);
  assert.throws(()=>recordBuilder('Invalid').addIntermediate(corrupt),/integrity/);
  const external=createRecord('External');external.assets=[{...intermediate.asset,sha256:'0'.repeat(64)}];
  assert.throws(()=>createGraph(external),/integrity/);assert.throws(()=>recordBuilder(external),/integrity/);
});
test('evidence resolution prefers an explicit source asset and never fetches an external URI',async()=>{
  const record=await fixture();const asset={...record.assets[0],id:'external',uri:'https://evidence.invalid/source.txt'};delete asset.data;record.assets.push(asset);record.events[0].sources[0].assetId=asset.id;
  const graph=createGraph(record);assert.equal(graph.getEvidence('first')[0].asset.uri,asset.uri);
  assert.equal(graph.getEvidence('second')[0].asset.id,record.assets[0].id);
});
