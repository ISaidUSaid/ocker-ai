# JavaScript SDK and client-only example

Author: Jenko <adam@isaidusaid.com> · Apache-2.0

`@ocker-ai/core` is an ESM package with TypeScript declarations and plain browser CSS. It has no application-server dependency.

```js
import {parseRecord, mountChronology, parsePdf, buildChronology,
  findRelationships, createOpenAICompatibleAdapter} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

const view = mountChronology(container, parseRecord(ockerJson), {
  theme: 'glass',                  // 'none' removes the glass border/backdrop blur
  themeVariables: {primary: '#194d61', accent: '#d7a85d'},
  onChange: record => saveInYourApplication(record)
});
```

`parseRecord` and `exportRecord` check schema, references and embedded asset hashes. `validateRecord` checks structure/semantics without decoding every asset; use `verifyAssets` or `verifyAssetsSync` when validating an already-constructed record. The view verifies incoming records as well.

```js
const intermediate = await parsePdf(file, {
  kind: 'affidavit', workerSrc: '/assets/pdf.worker.min.mjs',
  signal, onProgress: progress => showProgress(progress)
});
const llm = createOpenAICompatibleAdapter({endpoint, model, apiKey});
let record = await buildChronology([intermediate], {llm, signal});
record = await findRelationships(record, {llm, signal});
```

No fixed model is selected. A host can replace the entire `llm` callback, PDF adapter or workbench pipeline. The built-in adapter uses standard chat-completion JSON; set `responseFormat: false` for compatible providers that do not accept the JSON response-format option. Browser providers must permit CORS.

The core's optional standard PDF.js worker fallback is versioned jsDelivr. Host applications can self-host it with `workerSrc`; the included demos do. There is no OCR or special scanned-PDF handling.

## UI options

`theme`, `themeVariables`, `labels`, `locale`, `readOnly`, `mobile`, `animate`, `showToolbar`, `authorId`, `onChange`, `onProgress`, `onError`, `onEventClick`, `onSourceClick`, `assetResolver` and `className` are supported. Values/callback signatures are declared in `src/index.d.ts`. Host CSS can override the prefixed classes and `--ocker-*` variables.

The returned handle has `getRecord`, `setRecord`, `setOptions` and `destroy`. Destroy the handle when its host unmounts. Notes are pin-anchored and authority flags use the target's outside edge. Responsive state comes from a component option or ResizeObserver; Angular wrappers supply BreakpointObserver state. All cards are rendered. Keys are not stored by the component.

The complete optional demo workbench is exported as `@ocker-ai/core/demo` (`mountWorkbench`). It includes file inputs, intermediate download, provider settings and deliberate send consent. It uses the same public SDK as the wrappers.

## Run/build/package

From the repository root:

```sh
npm install
npm run dev
npm test
npm run build
npm run demo:build
npm pack --workspace=@ocker-ai/core
```

The package publishes source ESM plus types/styles; the library build is also available in `dist/library`. Generated build output and caches are not committed. Package publication is not automatic.

## Documents and prompts

Use `parseDocument(file, {kind, title})` for PDF, DOCX, RTF, TXT or HTML, `parseText(text, options)` for plain text, or `parseRichText(html, options)` for rich content. HTML is parsed into evidence text, never executed. Original bytes and hashes remain in the intermediate asset; the LLM receives only attributed text paragraphs. The ordinary PDF importer performs no OCR. DOCX is read with Mammoth; formatting is not used to infer court-page numbers.

The canonical templates live in root `prompt-library/`. npm lifecycle hooks generate the package-local prompt module before development, tests, builds and packaging. Java and .NET copy/embed the same templates with their own build systems. Override the LLM callback for custom provider/prompt behaviour.
