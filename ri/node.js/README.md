# Angular + Node

Apache-2.0 · Jenko <adam@isaidusaid.com>

The Angular front end uses the reusable chronology component. The Node server uses Docling Serve for document conversion, then uses the public JavaScript core for LLM chronology extraction and simple support/contradiction assessment.

From the repository root:

```sh
npm install
npm run build --workspace=@ocker-ai/angular
npm run build --workspace=@ocker-ai/node-demo
OCKER_ALLOWED_PROVIDER_ORIGINS=https://your-provider.example npm start --workspace=@ocker-ai/node-demo
```

Open `http://127.0.0.1:3000`. Start by adding documents, opening a saved OCKER record, or trying the shared example. Enter the full chat-completions endpoint, selected model and key; Build deliberately sends document text to the selected provider. Keys are per-operation inputs and are never written into OCKER JSON.

Start Docling Serve before importing documents. Its default address is `http://localhost:5001`:

```sh
pip install docling-serve
docling-serve run
```

Use the **Document conversion service** disclosure in the UI to test the configured connection. The browser cannot choose the Docling server: the Node backend reads the trusted `DOCLING_SERVE_URL` environment variable. Set `DOCLING_TIMEOUT_MS` to control conversion and connection timeouts; both default to `http://localhost:5001` and `300000` milliseconds respectively.

- `GET /api/docling/health`: checks the configured Docling Serve connection.
- `POST /api/documents`: multipart `file` plus optional `kind`; converts through the configured Docling Serve instance and returns intermediate JSON.
- `POST /api/records/build`: `intermediates`, optional `title`, and `provider` (`endpoint`, `model`, `apiKey`).
- `POST /api/relationships`: `record` and `provider`.
- Send `X-Ocker-Operation-Id`; poll `GET /api/operations/:id`, cancel with `DELETE /api/operations/:id`.

Provider origins must be in `OCKER_ALLOWED_PROVIDER_ORIGINS`. Arbitrary provider or Docling URL fetching is not exposed to the browser. Defaults: loopback `HOST`, `PORT=3000`, 25 MB PDF limit and 40 MB JSON limit. Override with `HOST`, `PORT`, `OCKER_MAX_UPLOAD_BYTES`, `OCKER_MAX_RECORD_BYTES`, `OCKER_CLIENT_ORIGIN`, `DOCLING_SERVE_URL` and `DOCLING_TIMEOUT_MS` as appropriate. This is a local RI; a deployed host must add authentication, tenant isolation, retention/rate limits and provider governance before exposing it remotely.

```sh
npm test --workspace=@ocker-ai/node-demo
```

Tests exercise the configured Docling health connection, ordinary document parsing and an HTTP mock provider, without paid model calls.
