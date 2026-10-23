// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {defineConfig} from 'vite';
export default defineConfig({base:'./',publicDir:'demo/public',server:{fs:{allow:['../..','../../spec']}},build:{outDir:'dist/demo',emptyOutDir:true}});
