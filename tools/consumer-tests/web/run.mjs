// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
// Tarball-only consumer acceptance. It deliberately installs outside the workspace.
import { mkdtemp, mkdir, cp, writeFile, readFile, realpath, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here=dirname(fileURLToPath(import.meta.url));
const repo=resolve(here,'../../..');
const work=await mkdtemp(join(repo,'.work/sdk-consumer-'));
const packDir=join(work,'tarballs');
const consumer=join(work,'consumer');
const node=process.execPath;
const run=(command,args,cwd=repo,extraEnv={})=>{const result=spawnSync(command,args,{cwd,encoding:'utf8',env:{...process.env,...extraEnv,npm_config_cache:join(repo,'.work/npm')}});if(result.status!==0)throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);return result.stdout;};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
try {
 await mkdir(packDir,{recursive:true});
 // --ignore-scripts avoids package lifecycle hooks; the caller must build distributions first.
 const packs=[['core','ri/js'],['react','ri/react'],['angular','ri/angular/dist']].map(([name,dir])=>{
   const output=run('npm',['pack','--ignore-scripts','--pack-destination',packDir],resolve(repo,dir));
   const file=output.trim().split(/\s+/).at(-1); return [name,join(packDir,file)];
 });
 for(const [,tar] of packs) assert(existsSync(tar),`Tarball missing: ${tar}`);
 await mkdir(consumer,{recursive:true});
 const deps=Object.fromEntries(packs.map(([name,tar])=>[`@ocker-ai/${name}`,`file:${tar}`]));
 await writeFile(join(consumer,'package.json'),JSON.stringify({name:'tarball-consumer',private:true,type:'module',dependencies:{...deps,react:'19.2.4','react-dom':'19.2.4','@angular/animations':'22.2.3','@angular/cdk':'22.2.3','@angular/common':'22.2.3','@angular/compiler':'22.2.3','@angular/core':'22.2.3','@angular/platform-browser':'22.2.3',rxjs:'7.8.2',tslib:'2.8.1'},devDependencies:{typescript:'6.0.3',vite:'8.3.5','@angular/build':'22.2.3','@angular/cli':'22.2.3','@angular/compiler-cli':'22.2.3','@playwright/test':'1.58.0','@types/react':'19.3.0','@types/react-dom':'19.3.0'}},null,2));
 run('npm',['install','--ignore-scripts','--package-lock=true'],consumer);
 run('npm',['ls','--all'],consumer);
 const installed=resolve(consumer,'node_modules');
 const consumerRequire=createRequire(join(consumer,'package.json'));
 await writeFile(join(consumer,'guard-loader.mjs'),`import {fileURLToPath} from 'node:url';import {resolve,sep} from 'node:path';const root=resolve(fileURLToPath(new URL('.',import.meta.url)));export async function resolve(specifier,context,next){const result=await next(specifier,context);if(result.url.startsWith('file:')){const path=fileURLToPath(result.url);if(path!==root&&!path.startsWith(root+sep))throw new Error('Consumer resolved outside its installation: '+path);}return result;}`.replace('const root=resolve(', 'const root=resolvePath(').replace('import {resolve,sep}', 'import {resolve as resolvePath,sep}'));
 await writeFile(join(consumer,'guard-register.mjs'),`import {register} from 'node:module';register('./guard-loader.mjs',import.meta.url);`);
 const guardedArgs=['--import',join(consumer,'guard-register.mjs')];
 const playwrightPath=consumerRequire.resolve('@playwright/test');
 assert(playwrightPath.startsWith(installed+'/'),`Playwright resolved outside disposable consumer: ${playwrightPath}`);
 const { chromium }=consumerRequire('@playwright/test');
 for(const name of ['@ocker-ai/core','@ocker-ai/react','@ocker-ai/angular']){
   const packagePath=await realpath(resolve(installed,name,'package.json'));
   assert(packagePath.startsWith(installed+'/'),`${name} resolved outside disposable consumer: ${packagePath}`);
 }
 await writeFile(join(consumer,'headless-check.mjs'),`import { createGraph, recordBuilder, ChronologyGraph, RecordBuilder, parseRecord, parseText, saveNote, exportRecord, EXTRACTION_PROMPT, RELATIONSHIP_PROMPT } from '@ocker-ai/core/headless';
for (const [name, value] of Object.entries({createGraph, recordBuilder, ChronologyGraph, RecordBuilder})) if (!value) throw new Error('Missing SDK export: '+name);
if (!EXTRACTION_PROMPT.trim() || !RELATIONSHIP_PROMPT.trim()) throw new Error('Extract or relate prompt is empty');
const intermediate=await parseText('Consumer document evidence.',{title:'consumer.txt',kind:'report'});
const paragraph=intermediate.document.paragraphs[0];
const record=recordBuilder('Consumer graph').addIntermediate(intermediate).addEvent({id:'consumer-event',title:'Consumer event',summary:'Evidence-backed consumer event.',date:{precision:'year',value:'2024'},sources:[{documentId:intermediate.document.id,paragraphId:paragraph.id,assetId:intermediate.asset?.id}],status:'unresolved'}).build();
const graph=createGraph(record);
if (graph.getEvidence('consumer-event').length !== 1) throw new Error('Graph did not resolve event evidence');
const noted=saveNote(record,{eventId:'consumer-event',body:'Consumer note',position:{x:1,y:1}});
if (noted.notes.length !== 1) throw new Error('saveNote did not update record');
const restored=parseRecord(exportRecord(noted));
if (restored.events[0]?.title !== 'Consumer event' || restored.notes[0]?.body !== 'Consumer note') throw new Error('Export/import round trip failed');`);
 run(node,[...guardedArgs,'headless-check.mjs'],consumer);
 for(const resource of ['src/styles.css','src/index.d.ts','src/schema.json','src/prompts.generated.json','LICENSE','NOTICE','README.md']) assert(existsSync(resolve(installed,'@ocker-ai/core',resource)),`Core package missing ${resource}`);
 await writeFile(join(consumer,'prepare-docling.mjs'),`import {prepareDoclingAssets} from '@ocker-ai/core/prepare-docling-assets';await prepareDoclingAssets('./public/docling');`);
 run(node,[...guardedArgs,'prepare-docling.mjs'],consumer);
 for(const resource of ['worker.js','pipeline.js','docling_wasm.js','docling_wasm_bg.wasm','LICENSE','ONNX-LICENSE','ONNX-ThirdPartyNotices.txt','ort/ort.wasm.min.mjs']) assert(existsSync(join(consumer,'public/docling',resource)),`Prepared Docling assets missing ${resource}`);
 // Compile minimal React and Angular consumers from copied fixtures. The application source only imports installed packages.
 await cp(join(here,'fixtures'),join(consumer,'fixtures'),{recursive:true});
 await mkdir(join(consumer,'react/src'),{recursive:true}); await cp(join(consumer,'fixtures/react-main.tsx'),join(consumer,'react/src/main.tsx')); await writeFile(join(consumer,'react/src/styles.d.ts'),"declare module '*.css';\n"); await cp(join(consumer,'fixtures/react-index.html'),join(consumer,'react/index.html'));
 await writeFile(join(consumer,'react/vite.config.ts'),"import {defineConfig} from 'vite'; export default defineConfig({esbuild:{jsx:'automatic'}});");
 await writeFile(join(consumer,'react/tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true},include:['src']},null,2));
 run(node,[...guardedArgs,join(installed,'typescript/bin/tsc'),'--noEmit','-p','tsconfig.json'],join(consumer,'react')); run(node,[...guardedArgs,join(installed,'vite/bin/vite.js'),'build'],join(consumer,'react'));
 await mkdir(join(consumer,'angular/src'),{recursive:true}); await cp(join(consumer,'fixtures/angular-main.ts'),join(consumer,'angular/src/main.ts')); await cp(join(consumer,'fixtures/angular-index.html'),join(consumer,'angular/src/index.html'));
 await writeFile(join(consumer,'angular/angular.json'),JSON.stringify({$schema:'./node_modules/@angular/cli/lib/config/schema.json',version:1,projects:{consumer:{projectType:'application',root:'.',sourceRoot:'src',architect:{build:{builder:'@angular/build:application',options:{outputPath:'dist',browser:'src/main.ts',index:'src/index.html',tsConfig:'tsconfig.app.json'}}}}}},null,2));
 await writeFile(join(consumer,'angular/tsconfig.app.json'),JSON.stringify({compilerOptions:{target:'ES2022',useDefineForClassFields:false,module:'ES2022',moduleResolution:'bundler',strict:true,skipLibCheck:true,outDir:'./out-tsc/app'},files:['src/main.ts']},null,2)); run(node,[...guardedArgs,join(installed,'@angular/cli/bin/ng.js'),'build'],join(consumer,'angular'));
 const serve=async(directory)=>{const root=resolve(directory);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.mjs':'text/javascript'};const server=createServer((req,res)=>{const pathName=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathName==='/favicon.ico'){res.statusCode=204;res.end();return;}const target=pathName==='/'?'/index.html':pathName;const file=resolve(root,'.'+target);if(!file.startsWith(root+sep)){res.statusCode=403;res.end();return;}readFile(file).then(body=>{res.statusCode=200;res.setHeader('content-type',types[extname(file)]??'application/octet-stream');res.end(body);},()=>{res.statusCode=404;res.end();});});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));return {server,url:`http://127.0.0.1:${server.address().port}`};};
 const chromeCandidates=process.env.CHROME_BIN?[process.env.CHROME_BIN]:['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
 const chrome=chromeCandidates.find(candidate=>existsSync(candidate));
 if (process.env.CHROME_BIN) assert(chrome,`CHROME_BIN does not exist: ${process.env.CHROME_BIN}`);
 if (!chrome) {const playwrightBrowsers=join(repo,'.work/playwright');process.env.PLAYWRIGHT_BROWSERS_PATH=playwrightBrowsers;run('npx',['playwright','install','chromium'],consumer,{PLAYWRIGHT_BROWSERS_PATH:playwrightBrowsers});}
 const browser=await chromium.launch(chrome?{headless:true,executablePath:chrome}:{headless:true});
 const verifyUi=async(name,directory)=>{const host=await serve(directory);const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(`${message.text()} (${message.location().url})`);});try{await page.goto(host.url,{waitUntil:'networkidle'});assert(await page.getByText('Consumer event',{exact:true}).isVisible(),`${name} did not render installed chronology`);assert(await page.locator('.ocker-theme-glass').count()>0,`${name} did not load glass theme CSS`);const card=page.locator('.ocker-card').first();await card.getByRole('button',{name:'Add note',exact:true}).click();await page.getByLabel('Your note').fill(`${name} consumer note`);await page.getByRole('button',{name:'Save note',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-testid=note-count]')?.textContent==='1');assert(errors.length===0,`${name} browser errors: ${errors.join('; ')}`);}finally{await page.close();await new Promise(ok=>host.server.close(ok));}};
 await verifyUi('React',join(consumer,'react/dist'));await verifyUi('Angular',join(consumer,'angular/dist/browser'));await browser.close();
 console.log(`SDK consumer acceptance passed: ${work}`);
} finally { if(process.env.KEEP_CONSUMER!=='1') await rm(work,{recursive:true,force:true}); }
