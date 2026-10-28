# JavaScript SDK and client-only example

Author: Jenko <adam@isaidusaid.com> · Apache-2.0

`@ocker-ai/core` is an ESM package with TypeScript declarations and plain browser CSS. Browser PDF conversion runs locally through Docling after the host prepares its static assets; Node PDF conversion calls Docling Serve. DOCX, RTF, text and HTML imports keep their existing local paths.

Install the core tarball from the [private SDK distribution](../../DISTRIBUTION.md). Public registry publication has not occurred. Node 22.22.3+ is the current SDK baseline. Browser hosts need a modern ESM bundler; UI mounting belongs on the client, while the headless entry point can run on a server.

## Headless records, graph and builder

```js
import {parseText, recordBuilder, createGraph, saveNote, exportRecord} from '@ocker-ai/core/headless';

export async function makeChronology() {
  const document = await parseText('The parties met on 1 June 2024.', {
    title: 'An account.txt', kind: 'affidavit'
  });
  const paragraph = document.document.paragraphs[0];
  const record = recordBuilder('Matter chronology')
    .addIntermediate(document)
    .addEvent({id: 'meeting', title: 'The parties met', summary: paragraph.text,
      date: {precision: 'day', value: '2024-06-01'},
      sources: [{documentId: document.document.id, paragraphId: paragraph.id, page: paragraph.page, quote: paragraph.text}]})
    .build();
  const graph = createGraph(record);
  const evidence = graph.getEvidence('meeting');
  const annotated = saveNote(record, {eventId: 'meeting', body: 'Check the original account.', position: {x: 40, y: 80}});
  return {evidence, json: exportRecord(annotated)};
}
```

This needs no DOM, LLM or key. The graph indexes a validated snapshot and returns independent copies. It exposes event/document/actor/asset lookups, direct bidirectional related events, relationship filters, annotations and resolved evidence. Missing entity lookups return `undefined`; queries scoped to a missing event throw. External evidence URIs are never fetched by navigation. Rebuild the graph after changing its source record.

`recordBuilder(titleOrRecord)` / `RecordBuilder` accept actors, documents, assets, events, relationships, notes, authorities and complete intermediates. Add in any order; `build()` validates the whole record and embedded hashes. Its input entities and returned records are copied. The wire format remains 0.1.0.

## Browser UI

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
  kind: 'affidavit',
  workerSrc: '/assets/pdf.worker.min.mjs',
  docling: {
    assetBaseUrl: '/assets/docling/',
    ocrLanguage: 'en',
    tableStructure: true
  },
  signal, onProgress: progress => showProgress(progress)
});
const llm = createOpenAICompatibleAdapter({endpoint, model, apiKey});
let record = await buildChronology([intermediate], {llm, locale: navigator.language, signal});
record = await findRelationships(record, {llm, locale: navigator.language, signal});
```

No fixed model is selected. A host can replace the entire `llm` callback or workbench pipeline. The built-in adapter uses standard chat-completion JSON; set `responseFormat: false` for compatible providers that do not accept the JSON response-format option. Browser providers must permit CORS.

Prepare the browser Docling runtime before the application build, normally beside the self-hosted PDF.js worker:

```js
import {prepareDoclingAssets} from '@ocker-ai/core/prepare-docling-assets';

await prepareDoclingAssets('public/assets/docling');
```

With `workerSrc: '/assets/pdf.worker.min.mjs'`, the default `assetBaseUrl` is `/assets/docling/`. Set `assetBaseUrl` explicitly when assets live elsewhere; set `modelBaseUrl` only when the host serves model assets from a chosen location. `ocrLanguage` accepts `en`, `ch` or `cyrillic`, and `tableStructure` defaults to enabled. PDF.js rasterises pages for the local Docling worker; Docling produces the source text. Model downloads or local model hosting are host concerns. See the repository [Docling setup](../../docs/docling.md).

## UI options

`theme`, `themeVariables`, `labels`, `locale`, `readOnly`, `mobile`, `animate`, `showToolbar`, `authorId`, `onChange`, `onProgress`, `onError`, `onEventClick`, `onSourceClick`, `assetResolver` and `className` are supported. Values/callback signatures are declared in `src/index.d.ts`. Host CSS can override the prefixed classes and `--ocker-*` variables.

The returned handle has `getRecord`, `setRecord`, `setOptions` and `destroy`. Destroy the handle when its host unmounts. Notes are pin-anchored and authority flags use the target's outside edge. Responsive state comes from a component option or ResizeObserver; Angular wrappers supply BreakpointObserver state. All cards are rendered. Keys are not stored by the component.

The optional demo workbench is exported as `@ocker-ai/core/demo` (`mountWorkbench`). It includes file inputs, intermediate download, provider settings and a provider notice; choosing Build deliberately starts transmission. It uses the same public SDK as the wrappers. The reusable chronology renderer has no branded header or provider form.

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

Use `parseDocument(file, {kind, title, docling})` for PDF, DOCX, RTF, TXT or HTML, `parseText(text, options)` for plain text, or `parseRichText(html, options)` for rich content. HTML is parsed into evidence text, never executed. Original bytes and hashes remain in the intermediate asset; the LLM receives only attributed text paragraphs. PDF conversion reads Docling's full JSON document tree so text nested beneath pictures and table-cell text can become page-attributed paragraphs. DOCX is read with Mammoth; formatting is not used to infer court-page numbers.

In Node, set `docling: {endpoint, timeoutMs}` on `parsePdf` or `parseDocument`; the defaults are `http://localhost:5001` and 300000 ms. `testDoclingConnection({endpoint, timeoutMs, signal})` checks the configured service before an import. A browser host does not use the `endpoint` setting.

The canonical templates live in root `prompt-library/`. They have complete English, Spanish, Portuguese, French and German versions. `locale` accepts a language or region tag such as `pt-BR`; OCKER selects `pt` and falls back safely to English for unsupported languages. `getPrompts(locale)` exposes the selected pair. JSON field names remain English so an OCKER file travels safely between language versions. npm lifecycle hooks generate the package-local prompt module before development, tests, builds and packaging. Java and .NET copy/embed the same templates with their own build systems. Override the LLM callback for custom provider/prompt behaviour.
