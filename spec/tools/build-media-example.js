// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {readFile,writeFile} from 'node:fs/promises';
import {createRecord,makeAsset,exportRecord} from '../../ri/js/src/model.js';
const video=await makeAsset(new Uint8Array(await readFile(new URL('../../.work/example-video.mp4',import.meta.url))),'example-video.mp4','video/mp4');video.id='example-video';
const frame=await makeAsset(new Uint8Array(await readFile(new URL('../../.work/example-frame.png',import.meta.url))),'frame-at-500ms.png','image/png');frame.id='example-frame';frame.derivedFrom=video.id;frame.selector={kind:'time',start:500,end:500};
const r=createRecord('Embedded video and derived frame example');r.id='video-frame-example';r.createdAt=r.updatedAt='2026-10-23T00:00:00Z';r.assets=[video,frame];r.documents=[{id:'observation-report',title:'Fictional observation report',kind:'report',assetId:video.id,paragraphs:[{id:'p1',page:1,text:'A solid blue-green frame is visible at 500 milliseconds.'}]}];r.events=[{id:'frame-observation',title:'A frame from the original video',summary:'Fictional media specimen; no automated analysis performed.',date:{precision:'unknown'},sources:[{documentId:'observation-report',paragraphId:'p1',page:1,assetId:frame.id,selector:{kind:'time',start:500,end:500},quote:r.documents[0].paragraphs[0].text}]}];
await writeFile(new URL('../examples/video-frame.ocker.json',import.meta.url),exportRecord(r));
