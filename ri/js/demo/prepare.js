// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {copyFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const target=process.argv[2]?resolve(process.argv[2]):new URL('public/pdf.worker.min.mjs',import.meta.url);
if(typeof target==='string')await mkdir(dirname(target),{recursive:true});
await copyFile(new URL('../../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url),target);

const output=join(dirname(typeof target==='string'?target:fileURLToPath(target)),'examples');
await mkdir(output,{recursive:true});
for(const name of ['joe-jill.ocker.json'])await copyFile(new URL('../../../spec/examples/'+name,import.meta.url),join(output,name));
for(const name of ['JoeBlogsAffidavit.pdf','JillBlogsAffidavit.pdf'])await copyFile(new URL('../../../spec/examples/source/'+name,import.meta.url),join(output,name));

const brandingDirectory=process.argv[2]?dirname(target):fileURLToPath(new URL('public/assets/',import.meta.url));
await mkdir(brandingDirectory,{recursive:true});
for(const name of ['ocker-wordmark.png','ocker-icon.png']) {
  await copyFile(new URL('../../../assets/'+name,import.meta.url),join(brandingDirectory,name));
}
