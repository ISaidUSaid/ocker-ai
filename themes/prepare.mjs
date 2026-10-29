// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mkdir,readdir,copyFile} from 'node:fs/promises';
const destination=new URL('../ri/js/src/themes/',import.meta.url);
await mkdir(destination,{recursive:true});
for(const name of await readdir(new URL('.',import.meta.url)))if(name.endsWith('.css')||name==='index.js')await copyFile(new URL(name,import.meta.url),new URL(name,destination));
