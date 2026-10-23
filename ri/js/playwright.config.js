// SPDX-License-Identifier: Apache-2.0
import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export default defineConfig({testDir:'browser',workers:1,timeout:30000,outputDir:'../../.work/browser-results',use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1280,height:900},headless:true,launchOptions:existsSync(chrome)?{executablePath:chrome}:{}},webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI,timeout:30000},reporter:'list'});
