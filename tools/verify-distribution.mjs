// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {readFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,join} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve(process.argv[2]??'.work/distribution/ocker-ai-sdk-0.1.0');
const manifest=JSON.parse(await readFile(join(root,'MANIFEST.json'),'utf8'));
if(manifest.format!=='ocker-sdk-distribution'||!Array.isArray(manifest.files))throw new Error('Invalid SDK manifest.');
for(const entry of manifest.files) {
  const file=resolve(root,entry.path),path=relative(root,file);
  if(!path||path.startsWith('..')||isAbsolute(path))throw new Error('Unsafe manifest path.');
  const data=await readFile(file);
  if(data.length!==entry.bytes||createHash('sha256').update(data).digest('hex')!==entry.sha256)throw new Error('Distribution integrity failed: '+entry.path);
}
console.log(`Verified ${manifest.files.length} files in SDK ${manifest.version}; source ${manifest.sourceCommit}${manifest.sourceTreeDirty?' (working changes)':''}.`);
