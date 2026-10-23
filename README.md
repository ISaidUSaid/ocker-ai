# OCKER

**Open Chronology, Knowledge and Evidence Record**

Portable legal chronologies, embedded source evidence, notes, precedents and a small set of explainable relationships. Built for applications that want to exchange a chronology or embed a basic chronology UI without adopting another vendor's backend.

**Apache 2.0 · Jenko <adam@isaidusaid.com> · Draft 0.1.0**

This repository is private while the first release is being developed. Making it public is a separate decision. Nothing here changes the ISaidUSaid.com product or adds its OCKER exporter.

## Start with the browser example

Node 22.22.3+ is required.

```sh
npm install
npm run dev
```

Open the printed local URL. **Add your own documents**, choose a provider and model, enter your API key and choose **Build chronology**. That single action creates the events and compares the accounts for support and contradiction. The visible process steps and progress show the work as it happens. Keys stay in memory and out of exported records.

PDF, DOCX, RTF and plain text import into the same intermediate format. Browser examples also accept pasted rich text and HTML without executing its markup. Original file bytes remain attached as evidence; non-PDF paragraphs use logical page 1 rather than invented Word pagination. PDF imports require selectable text and do not perform OCR.

**Import OCKER file** opens an existing `.ocker.json` record. The separate **Joe and Jill Blogs Example Chronology** link loads a saved example converted from the tested production chronology, verified read-only on 24 October 2026. It contains the 46 displayed cards from that artifact, common ground, four direct contradiction links, the original test PDFs and fresh demonstration notes/precedents. No message matching, advanced relationship data, production annotations or private account identifiers are included. It is a saved import, not a new LLM result.

**Show code** exposes copyable integration examples using the selected theme, with no credentials. **Edit OCKER file** opens a pretty-printed JSON editor with syntax colours, formatting, Cancel and validated Apply. Browser editors use CodeMirror; native examples pair an editable text area with a synchronized coloured preview. Invalid edits leave the current record unchanged.

Provider shortcut buttons fill common provider endpoints and local Ollama without choosing a model. Switching providers clears the previous key. Browser examples support Anthropic Messages as well as chat-completions APIs; native shortcuts currently use chat-completions-compatible providers. Empty keys are allowed only for loopback providers. Browser CORS and local Ollama origin access remain host configuration responsibilities.

```sh
npm test
npm run check:spec
npm run build
npm run demo:build
```

The browser example is fully client-side. Angular and React examples are also client-side. Browser providers must permit CORS; use the Node-backed example if your provider requires a server.

## Repository layout

| Path | Deliverable |
|---|---|
| [`prompt-library`](prompt-library/README.md) | Canonical public extraction and relationship prompts, copied by each RI build |
| [`spec`](spec/README.md) | Normative format, JSON Schemas, intermediate document format, conformance rules and examples |
| [`ri/js`](ri/js/README.md) | ESM JavaScript SDK, configurable document/LLM adapters, reusable browser UI and standalone demo |
| [`ri/angular`](ri/angular/README.md) | Reusable Angular component and client-only example |
| [`ri/react`](ri/react/README.md) | Reusable React component and client-only example |
| [`ri/node.js`](ri/node.js/README.md) | Node backend with an Angular front end |
| [`ri/java`](ri/java/README.md) | Java library, reusable JavaFX UI and native example |
| [`ri/c#`](ri/c%23/README.md) | C# library, reusable Avalonia UI and native example |

## What it does

- Import/export versioned OCKER JSON and preserve extension data.
- Keep source paragraphs and original evidence bytes together, with byte lengths and SHA-256 hashes.
- Import PDF, DOCX, RTF, plain text and browser rich text; create reviewable intermediate JSON using public libraries.
- Build attributed chronology accounts using a supplied LLM adapter.
- Infer only **support** and **contradiction** relationships, with reasons and provenance.
- Filter/search/zoom, inspect source evidence and open a related-event web.
- Add, edit, delete and drag notes; attach coloured precedent tabs to outside event edges.
- Provide compact mobile notes, accessible controls and animations without sliding windows or lazy card rendering.
- Export the full JSON record and the selected visual view as PNG/PDF.
- Expose **Glass / None** dialog themes, palette overrides, options and callbacks for host applications.

## Deliberate limits

These are reference implementations, not a case-management product. They contain no behavioural scoring, message matching, message evidence system, OCR, scanned-PDF reconstruction, proprietary document-reading pipeline or production prompts. The PDF importer is intentionally basic. Images/video frames can be embedded in an OCKER record, but that does not add OCR or automatic video analysis to the importer.

Host applications own authentication, persistence, tenant boundaries, provider policy and branding. The built-in AI adapter supports a standard OpenAI-compatible chat-completion API; replace it for other APIs. No provider call is necessary to read or annotate an exported record.

## Packaging and integration

See [integration](spec/INTEGRATION.md), [security](spec/SECURITY.md) and each RI README. Package manifests include Apache-2.0 and Jenko authorship. Packages are buildable locally; publishing to npm, Maven Central or NuGet is a separate release action and has not been done.

The Pages workflow builds the JavaScript example. Deployment is manual and requires GitHub Pages to be enabled for this repository. The repository remains private unless Adam changes its visibility.

## Validation

Shared fictional PDFs and the authoritative `spec/examples/joe-jill.ocker.json` exercise 12 events, two embedded assets, six relationships, a note and a precedent. Browser and native tests use this same record rather than divergent examples. Test details and any remaining manual verification limits are recorded in [VALIDATION.md](VALIDATION.md).

The JSON schemas follow [Draft 2020-12](https://json-schema.org/draft/2020-12); the browser text importer uses the standard [PDF.js API](https://mozilla.github.io/pdf.js/examples/). Third-party dependencies retain their own licences. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
