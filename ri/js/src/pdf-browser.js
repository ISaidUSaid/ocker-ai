// SPDX-License-Identifier: Apache-2.0
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
// Hosts can serve the standard PDF.js worker from their own asset pipeline.
export function configurePdfJs(workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc=workerSrc??`https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}
