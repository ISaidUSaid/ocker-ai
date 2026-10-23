// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { assertRecord, buildChronology, createProviderAdapter, findRelationships, parseDocument } from '@ocker-ai/core';
import { DEFAULT_MAX_UPLOAD_BYTES, allowedOrigins, requireAllowedProvider } from './validation.js';

const supportedDocument = /\.(pdf|docx|rtf|txt|html?)$/i;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.OCKER_MAX_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES), files: 1 }, fileFilter: (_req, file, done) => done(null, supportedDocument.test(file.originalname)) });

export function createApp({ providerOrigins = allowedOrigins() } = {}) {
  const app = express();
  const operations = new Map();
  app.use(cors({ origin: process.env.OCKER_CLIENT_ORIGIN?.split(',').filter(Boolean) ?? true }));
  app.use(express.json({ limit: Number(process.env.OCKER_MAX_RECORD_BYTES ?? 40*1024*1024) }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/operations/:id', (req, res) => {
    const operation = operations.get(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Unknown operation.' });
    return res.json({ id: req.params.id, phase: operation.phase, done: operation.done, error: operation.error });
  });
  app.delete('/api/operations/:id', (req, res) => {
    const operation = operations.get(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Unknown operation.' });
    operation.controller.abort(); operation.phase = 'cancelled'; operation.done = true;
    return res.status(202).json({ cancelled: true });
  });
  app.post('/api/documents', upload.single('file'), async (req, res, next) => {
    try { if (!req.file) throw new Error('Upload one PDF, DOCX, RTF, text or HTML document in the file field.'); const kind=req.body?.kind??'report';if(!['affidavit','order','report'].includes(kind))throw new Error('Unsupported document kind');res.json(await parseUploadedDocument(req.file,kind)); } catch (error) { next(error); }
  });
  app.post('/api/records/build', async (req, res, next) => {
    const operation = operationFor(req, operations);
    try { const adapter = adapterFor(req.body?.provider, providerOrigins); const extracted = await buildChronology(Array.isArray(req.body?.intermediates) ? req.body.intermediates : [req.body?.intermediate], { llm: adapter, signal: operation.controller.signal, onProgress: progress => operation.phase = phaseOf(progress), title: req.body?.title }); operation.phase='Finding relationships'; const record = await findRelationships(extracted, { llm: adapter, signal: operation.controller.signal, onProgress: progress => operation.phase = phaseOf(progress) }); assertRecord(record); operation.done = true; res.json({ record }); } catch (error) { finishError(operation, error); next(error); }
  });
  app.post('/api/relationships', async (req, res, next) => {
    const operation = operationFor(req, operations);
    try { assertRecord(req.body?.record); const adapter = adapterFor(req.body?.provider, providerOrigins); const record = await findRelationships(req.body.record, { llm: adapter, signal: operation.controller.signal, onProgress: progress => operation.phase = phaseOf(progress) }); assertRecord(record); operation.done = true; res.json({ record }); } catch (error) { finishError(operation, error); next(error); }
  });
  const frontend = fileURLToPath(new URL('../frontend/dist/browser/', import.meta.url));
  if (existsSync(frontend)) app.use(express.static(frontend));
  app.use((error, _req, res, _next) => { const status = error?.code === 'LIMIT_FILE_SIZE' ? 413 : 400; res.status(status).json({ error: error instanceof Error ? error.message : 'Request failed.' }); });
  return app;
}

function operationFor(req, operations) { const id = req.get('X-Ocker-Operation-Id') || crypto.randomUUID(); const operation = { controller: new AbortController(), phase: 'starting', done: false, error: undefined }; operations.set(id, operation); req.on('aborted', () => operation.controller.abort()); return operation; }
function phaseOf(progress) { return typeof progress === 'string' ? progress : progress?.stage ?? progress?.phase ?? 'working'; }
function finishError(operation, error) { operation.done = true; operation.error = error instanceof Error ? error.message : 'Request failed.'; }
function isLoopback(endpoint) { const host=new URL(endpoint).hostname.toLowerCase(); return host==='localhost'||host==='127.0.0.1'||host==='[::1]'; }
function adapterFor(provider, origins) {
  if (!provider?.endpoint || !provider?.model) throw new Error('Provider endpoint and model are required for this operation.');
  const endpoint=requireAllowedProvider(provider.endpoint, origins);
  if (!provider.apiKey && !isLoopback(endpoint)) throw new Error('An API key is required unless the provider endpoint is on this machine.');
  return createProviderAdapter({ protocol:provider.protocol ?? 'openai', endpoint, model:provider.model, apiKey:provider.apiKey, options:provider.options });
}

export async function parseUploadedDocument(file,kind='report') {
  return parseDocument(new Uint8Array(file.buffer), { title: file.originalname, kind, maxBytes: Number(process.env.OCKER_MAX_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES) });
}

// Kept as a compatibility alias for API consumers that imported the original PDF-only helper.
export const parseTextPdf = parseUploadedDocument;

if (process.argv[1] === new URL(import.meta.url).pathname) createApp().listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => console.log('OCKER API listening'));
