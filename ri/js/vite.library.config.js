// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {defineConfig} from 'vite';
export default defineConfig({build:{outDir:'dist/library',lib:{entry:'src/index.js',formats:['es'],fileName:'ocker'},rollupOptions:{external:['pdfjs-dist/legacy/build/pdf.mjs','pdfjs-dist/build/pdf.mjs','jspdf','html-to-image']}}});
