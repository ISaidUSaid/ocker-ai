// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {readFile,writeFile} from 'node:fs/promises';
const prompts={};
for(const name of ['extract','relate']) {
  const value=(await readFile(new URL(name+'.txt',import.meta.url),'utf8')).trim();
  if(!value)throw new Error('Empty prompt: '+name);
  prompts[name]=value;
}
await writeFile(new URL('../ri/js/src/prompts.generated.json',import.meta.url),JSON.stringify(prompts,null,2)+'\n');
