# Docling PDF conversion

OCKER preserves the uploaded PDF as the evidence asset and uses Docling's JSON document tree to create page-attributed source paragraphs. This includes text nested beneath picture entries and table-cell text where Docling returns it. OCKER does not export Docling's JSON as a replacement for the original PDF.

## Browser hosts

The JavaScript, Angular and React examples process PDFs in the browser. Before a browser build, copy the Docling runtime assets to the public directory that sits beside the PDF.js worker:

```js
// scripts/prepare-docling-assets.mjs
import {prepareDoclingAssets} from '@ocker-ai/core/prepare-docling-assets';

await prepareDoclingAssets('public/assets/docling');
```

Run this script before the application build. With a PDF.js worker at `/assets/pdf.worker.min.mjs`, `parsePdf` and `parseDocument` default to `/assets/docling/`. The browser downloads any model data it needs during local processing; the PDF is not sent to Docling Serve.

```js
const intermediate = await parseDocument(file, {
  kind: 'affidavit',
  workerSrc: '/assets/pdf.worker.min.mjs',
  docling: {
    assetBaseUrl: '/assets/docling/',
    modelBaseUrl: '/assets/docling-models/',
    ocrLanguage: 'en',
    tableStructure: true
  }
});
```

The first PDF import downloads hundreds of megabytes of models; allow time for this and keep the tab open. Later imports can reuse the browser HTTP cache. The browser worker runs on the device CPU and reports progress; slower devices and long scans take longer. Cancel stops the worker. No document bytes are sent to the model download hosts.

`assetBaseUrl` locates the copied worker/runtime files. Set `modelBaseUrl` only when the host serves Docling model assets from a chosen location. `ocrLanguage` accepts `en`, `ch` or `cyrillic`; `tableStructure` defaults to enabled. PDF.js rasterises pages for the Docling worker and does not extract the source text.

## Server-backed hosts

Node, Java and C# use Docling Serve at `http://localhost:5001` by default. For a local Python virtual environment:

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install docling-serve
docling-serve run
```

Alternatively, bind the container only to loopback:

```sh
docker run --rm -p 127.0.0.1:5001:5001 quay.io/docling-project/docling-serve
```

The service exposes `GET /health` for a connection check and accepts PDF conversion on `POST /v1/convert/file`. Node reads `DOCLING_SERVE_URL` and `DOCLING_TIMEOUT_MS` at startup; browser callers cannot select a Docling server. Java and C# expose their typed Docling Serve client/options for the same endpoint and timeout settings.

## Licensing

OCKER source code and documentation are Apache-2.0. Docling Serve, the Docling browser runtime, ONNX runtime files and model assets have their own licences and distribution terms. Using or copying those dependencies does not relabel them as Apache-2.0.

## Runtime and model assets

The browser adapter pins `docling.rs-wasm` 2.52.9 and ONNX Runtime Web 1.30.0. It uses Docling's digital converter for native PDF text, then OCRs any pages without extracted text and merges them back at their original page numbers. All-scan PDFs use the scanned converter. Blank pages may legitimately have no source paragraphs. Table extraction is enabled by default. This browser runtime is a separate implementation from Python Docling Serve; their extraction results can differ.

By default, model data comes from the upstream Hugging Face repositories `pivozavrus/docling-rs-models` and `SWHL/RapidOCR`, with PaddleOCR dictionaries from GitHub. For an offline deployment, serve the runtime assets and model files locally, then set `modelBaseUrl`. The configured directory needs the layout model, `ocr_det.onnx`, the TableFormer encoder/decoder files, and the selected OCR recognition model and dictionary. See the versioned `REC_MODELS`, `MODEL_BASE` and `TF_DIRS` definitions in `ri/js/src/docling-runtime/pipeline.js` for the exact filenames used by this release. A missing required model stops import; OCKER does not switch back to the removed parser.

## Browser smoke test

Run `npm run dev`, then `node tools/test-docling-browser.mjs` in another terminal. Set `OCKER_DEMO_URL` if the demo uses a different port and `CHROME_BIN` if Chrome is installed elsewhere. This opt-in test creates its own mixed typed/scanned PDF, runs the real browser OCR models, checks original page order and a negated witness statement, and asserts that processing makes no external upload requests. It needs network access for the first model downloads. The normal unit tests use deterministic Docling JSON fixtures and do not download models.
