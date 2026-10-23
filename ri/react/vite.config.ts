// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [dts({ include: ['src'], entryRoot: 'src' })],
  build: { lib: { entry: resolve(import.meta.dirname, 'src/index.tsx'), formats: ['es'], fileName: 'index' }, rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', '@ocker-ai/core'] } }
});
