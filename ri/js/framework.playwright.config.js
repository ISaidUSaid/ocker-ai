// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../..',import.meta.url));
const chrome=process.platform==='linux'?'/usr/bin/google-chrome':'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const server=(command,url)=>({command,url,cwd,reuseExistingServer:!process.env.CI,timeout:30000});
export default defineConfig({testDir:'framework-browser',workers:1,timeout:30000,outputDir:'../../.work/framework-browser-results',reporter:'list',
 use:{headless:true,viewport:{width:1100,height:900},launchOptions:existsSync(chrome)?{executablePath:chrome}:{}},
 webServer:[server('python3 -m http.server 8871 --bind 127.0.0.1 --directory ri/angular/demo/dist/browser','http://127.0.0.1:8871'),server('python3 -m http.server 8872 --bind 127.0.0.1 --directory ri/react/demo/dist','http://127.0.0.1:8872'),{...server('node ri/node.js/src/server.js','http://127.0.0.1:8873/api/health'),env:{PORT:'8873',HOST:'127.0.0.1'}}]});
