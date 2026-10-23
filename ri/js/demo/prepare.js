// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {copyFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const target=process.argv[2]?resolve(process.argv[2]):new URL('public/pdf.worker.min.mjs',import.meta.url);
if(typeof target==='string')await mkdir(dirname(target),{recursive:true});
await copyFile(new URL('../../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url),target);
