# Angular + Node

Apache-2.0 · Jenko <adam@isaidusaid.com>

The Angular front end uses the reusable chronology component. The Node server performs ordinary text-PDF import, LLM chronology extraction and simple support/contradiction assessment with the public JavaScript core.

From the repository root:

```sh
npm install
npm run build --workspace=@ocker-ai/angular
npm run build --workspace=@ocker-ai/node-demo
OCKER_ALLOWED_PROVIDER_ORIGINS=https://your-provider.example npm start --workspace=@ocker-ai/node-demo
```

Open `http://127.0.0.1:3000`. Start by adding documents, opening a saved OCKER record, or trying the shared example. Enter the full chat-completions endpoint, selected model and key; Build deliberately sends document text to the selected provider. Keys are per-operation inputs and are never written into OCKER JSON.

- `POST /api/documents`: multipart `file` plus optional `kind`; returns intermediate JSON.
- `POST /api/records/build`: `intermediates`, optional `title`, and `provider` (`endpoint`, `model`, `apiKey`).
- `POST /api/relationships`: `record` and `provider`.
- Send `X-Ocker-Operation-Id`; poll `GET /api/operations/:id`, cancel with `DELETE /api/operations/:id`.

Provider origins must be in `OCKER_ALLOWED_PROVIDER_ORIGINS`. Arbitrary URL fetching is not exposed. Defaults: loopback `HOST`, `PORT=3000`, 25 MB PDF limit and 40 MB JSON limit. Override with `HOST`, `PORT`, `OCKER_MAX_UPLOAD_BYTES`, `OCKER_MAX_RECORD_BYTES` and `OCKER_CLIENT_ORIGIN` as appropriate. This is a local RI; a deployed host must add authentication, tenant isolation, retention/rate limits and provider governance before exposing it remotely.

```sh
npm test --workspace=@ocker-ai/node-demo
```

Tests exercise real text-PDF parsing and an HTTP mock provider, without paid model calls.
