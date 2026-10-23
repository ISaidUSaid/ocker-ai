// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';import addFormats from 'ajv-formats';
import {parseRecord,exportRecord,verifyAssets,validateRecord} from '../../ri/js/src/model.js';
const load=async name=>JSON.parse(await readFile(new URL('../'+name,import.meta.url),'utf8'));
const schema=await load('ocker.schema.json'),intermediate=await load('document.schema.json');
assert.deepEqual(schema,JSON.parse(await readFile(new URL('../../ri/js/src/schema.json',import.meta.url),'utf8')),'Published and packaged schemas drifted');
assert.deepEqual(intermediate,JSON.parse(await readFile(new URL('../../ri/js/src/document.schema.json',import.meta.url),'utf8')),'Packaged intermediate schema drifted');
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);const check=ajv.compile(schema),checkDocument=ajv.compile(intermediate);let count=0;
for(const file of await readdir(new URL('../examples/',import.meta.url))){if(!file.endsWith('.json'))continue;const value=await load('examples/'+file);const validator=file.endsWith('.document.json')?checkDocument:check;assert(validator(value),file+': '+JSON.stringify(validator.errors));if(value.format==='ocker'){await verifyAssets(value);assert.deepEqual(parseRecord(exportRecord(value)),value);}count++;}
const base=await load('examples/joe-jill.ocker.json');
const cases=[['unknown version',r=>r.version='9.0.0'],['unknown property',r=>r.privateField='not an extension'],['missing title',r=>delete r.title],['orphan source',r=>r.events[0].sources[0].documentId='missing'],['invalid date',r=>r.events[0].date={precision:'day',value:'2024-02-30'}],['false precision',r=>r.events[0].date={precision:'unknown',value:'2024'}],['broken hash',r=>r.assets[0].byteLength++],['unsupported relation',r=>r.relationships[0].type='behaviour'],['bad selector',r=>r.events[0].sources[0].selector={kind:'time',start:100,end:20}],['orphan note',r=>r.notes[0].eventId='missing']];
for(const [name,mutate]of cases){const value=structuredClone(base);mutate(value);assert.throws(()=>parseRecord(JSON.stringify(value)),undefined,name);count++;}
const ext=structuredClone(base);ext.extensions={'example.com/host':{nested:{keep:true}}};assert.deepEqual(parseRecord(exportRecord(ext)).extensions,ext.extensions);count++;
console.log(`${count} schema, semantic, integrity and round-trip checks passed.`);
