// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { allowedOrigins, requireAllowedProvider } from '../src/validation.js';
import request from 'supertest';
import { createApp, doclingConfig } from '../src/server.js';

test('only accepts configured provider origins', () => {
  const origins = allowedOrigins('https://api.example.test, https://llm.example.test/v1');
  assert.equal(requireAllowedProvider('https://api.example.test/v1/chat', origins), 'https://api.example.test/v1/chat');
  assert.throws(() => requireAllowedProvider('http://127.0.0.1:9999', origins), /not allowed/);
});

test('server does not proxy a provider outside its allowlist', async () => {
  const app = createApp({ providerOrigins: new Set(['https://llm.example.test']) });
  await request(app).get('/api/health').expect(200, { ok: true });
  const response = await request(app).post('/api/records/build').send({ intermediate: {}, provider: { endpoint: 'http://127.0.0.1:8787', model: 'example', apiKey: 'memory-only' } }).expect(400);
  assert.match(response.body.error, /not allowed/);
});

test('Docling configuration comes from trusted server settings', () => {
  assert.deepEqual(doclingConfig({}), { endpoint: 'http://localhost:5001', timeoutMs: 300000 });
  assert.deepEqual(doclingConfig({ DOCLING_SERVE_URL: 'https://docling.example.test/', DOCLING_TIMEOUT_MS: '1200' }), { endpoint: 'https://docling.example.test', timeoutMs: 1200 });
  assert.throws(() => doclingConfig({ DOCLING_SERVE_URL: 'file:///tmp/docling' }), /HTTP\(S\)/);
  assert.throws(() => doclingConfig({ DOCLING_SERVE_URL: 'https://user:secret@docling.example.test' }), /must not include credentials/);
  assert.throws(() => doclingConfig({ DOCLING_TIMEOUT_MS: '0' }), /positive integer/);
});

test('reports the configured Docling service without accepting a browser-supplied URL', async () => {
  const calls = [];
  const docling = createServer((req, res) => {
    calls.push(req.url);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ status: 'ok' }));
  });
  await new Promise(resolve => docling.listen(0, '127.0.0.1', resolve));
  try {
    const endpoint = `http://127.0.0.1:${docling.address().port}`;
    const app = createApp({ docling: { endpoint, timeoutMs: 1200 } });
    const response = await request(app).get('/api/docling/health?endpoint=https://untrusted.example.test').expect(200);
    assert.deepEqual(response.body, { ok: true, endpoint });
    assert.deepEqual(calls, ['/health']);
  } finally { await new Promise(resolve => docling.close(resolve)); }
});

test('uploads a PDF through Docling and builds relationships before returning the chronology', async () => {
  const calls = [];
  const doclingCalls = [];
  const docling = createServer((req, res) => {
    doclingCalls.push({ url: req.url, contentType: req.headers['content-type'] });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ status: 'success', document: { json_content: {
      pages: { 1: {}, 2: {} }, body: { children: [{ $ref: '#/texts/0' }, { $ref: '#/texts/1' }] },
      texts: [
        { text: 'The parties discussed child support.', prov: [{ page_no: 1, charspan: [0, 36] }] },
        { text: 'The accounts differ on the date.', prov: [{ page_no: 2, charspan: [0, 35] }] }
      ]
    } } }));
  });
  const provider = createServer(async (req, res) => {
    const body = await new Promise(resolve => { let text = ''; req.on('data', chunk => text += chunk); req.on('end', () => resolve(JSON.parse(text))); });
    calls.push({ authorization: req.headers.authorization, body });
    const input = JSON.parse(body.messages[1].content);
    const extract = body.messages[0].content.includes('Extract a basic legal chronology');
    const content = extract
      ? { events: input.paragraphs.slice(0, 2).map((paragraph, index) => ({ title: `Account ${index + 1}`, summary: paragraph.text, date: { precision: 'unknown' }, paragraphIds: [paragraph.id], status: 'alleged' })) }
      : { relationships: [{ from: input.events[0].id, to: input.events[1].id, type: 'contradicts', rationale: 'The fictional accounts differ.' }] };
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }));
  });
  await new Promise(resolve => docling.listen(0, '127.0.0.1', resolve));
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  try {
    const port = provider.address().port;
    const endpoint = `http://127.0.0.1:${port}/v1/chat/completions`;
    const doclingEndpoint = `http://127.0.0.1:${docling.address().port}`;
    const app = createApp({ providerOrigins: new Set([new URL(endpoint).origin]), docling: { endpoint: doclingEndpoint, timeoutMs: 1200 } });
    const pdf = await readFile(new URL('../../js/demo/public/examples/JoeBlogsAffidavit.pdf', import.meta.url));
    const imported = await request(app).post('/api/documents').attach('file', pdf, { filename: 'JoeBlogsAffidavit.pdf', contentType: 'application/pdf' }).expect(200);
    assert.equal(imported.body.format, 'ocker-document');
    assert.match(imported.body.asset.sha256, /^[a-f0-9]{64}$/);
    assert.ok(imported.body.document.paragraphs.length >= 2);
    const providerConfig = { endpoint, model: 'mock-model', apiKey: 'test-key-not-for-output' };
    const built = await request(app).post('/api/records/build').send({ intermediate: imported.body, provider: providerConfig }).expect(200);
    assert.equal(built.body.record.events.length, 2);
    assert.equal(built.body.record.events[0].sources[0].documentId, imported.body.document.id);
    assert.equal(built.text.includes(providerConfig.apiKey), false);
    assert.equal(built.body.record.relationships[0].type, 'contradicts');
    assert.deepEqual(calls.map(call => call.authorization), ['Bearer test-key-not-for-output', 'Bearer test-key-not-for-output']);
    assert.deepEqual(doclingCalls.map(call => call.url), ['/v1/convert/file']);
    assert.match(doclingCalls[0].contentType, /^multipart\/form-data;/);
  } finally { await Promise.all([new Promise(resolve => provider.close(resolve)), new Promise(resolve => docling.close(resolve))]); }
});

test('accepts a plain-text document through the bounded upload route', async () => {
  const app = createApp();
  const imported = await request(app)
    .post('/api/documents')
    .field('kind', 'report')
    .attach('file', Buffer.from('On 3 March 2026, the parties exchanged the requested documents.\n\nThe response arrived the following day.', 'utf8'), { filename: 'case-note.txt', contentType: 'text/plain' })
    .expect(200);
  assert.equal(imported.body.format, 'ocker-document');
  assert.equal(imported.body.document.kind, 'report');
  assert.equal(imported.body.document.paragraphs.length, 2);
});

test('accepts HTML uploads while excluding script text from chronology paragraphs', async () => {
  const app = createApp();
  const html = '<h1>Evidence note</h1><p>Documents were exchanged on 3 March 2026.</p><script>not evidence</script><style>.hidden{display:none}</style>';
  const imported = await request(app)
    .post('/api/documents')
    .field('kind', 'report')
    .attach('file', Buffer.from(html, 'utf8'), { filename: 'note.html', contentType: 'text/html' })
    .expect(200);
  const text = imported.body.document.paragraphs.map(paragraph => paragraph.text).join(' ');
  assert.match(text, /Documents were exchanged/);
  assert.doesNotMatch(text, /not evidence/);
});
