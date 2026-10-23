// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { allowedOrigins, requireAllowedProvider } from '../src/validation.js';
import request from 'supertest';
import { createApp } from '../src/server.js';

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

test('uploads a real text PDF and preserves canonical sources through mocked build and relate calls', async () => {
  const calls = [];
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
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  try {
    const port = provider.address().port;
    const endpoint = `http://127.0.0.1:${port}/v1/chat/completions`;
    const app = createApp({ providerOrigins: new Set([new URL(endpoint).origin]) });
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
    const related = await request(app).post('/api/relationships').send({ record: built.body.record, provider: providerConfig }).expect(200);
    assert.equal(related.body.record.relationships[0].type, 'contradicts');
    assert.deepEqual(calls.map(call => call.authorization), ['Bearer test-key-not-for-output', 'Bearer test-key-not-for-output']);
  } finally { await new Promise(resolve => provider.close(resolve)); }
});
