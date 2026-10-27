// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mkdir,copyFile,cp,readdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
/** Copy browser dependencies into a static asset directory. No model downloads at build time. */
export async function prepareDoclingAssets(target) {
  await mkdir(target,{recursive:true});
  const wasmDir=dirname(require.resolve('docling.rs-wasm/web'));
  const ortDir=dirname(require.resolve('onnxruntime-web/wasm'));
  await cp(fileURLToPath(new URL('../src/docling-runtime/',import.meta.url)),target,{recursive:true});
  for(const name of ['docling_wasm.js','docling_wasm_bg.wasm'])await copyFile(join(wasmDir,name),join(target,name));
  await mkdir(join(target,'ort'),{recursive:true});
  for(const name of await readdir(ortDir))if((name.endsWith('.wasm')||name.endsWith('.mjs'))&&!name.includes('webgpu')&&!name.includes('jsep')&&!name.includes('jspi'))await copyFile(join(ortDir,name),join(target,'ort',name));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(!process.argv[2])throw new Error('Supply the public Docling asset directory.');
  await prepareDoclingAssets(resolve(process.argv[2]));
}
