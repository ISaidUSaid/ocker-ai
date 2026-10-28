// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
// This exercises the production server through HTTP so routes cannot quietly escape their roots.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { server } from './server.mjs';

server.listen(0, '127.0.0.1');
await once(server, 'listening');
const { port } = server.address();
const origin = `http://127.0.0.1:${port}`;

async function request(path, options = {}) {
  return fetch(origin + path, { redirect: 'manual', ...options });
}

try {
  const home = await request('/en/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /^text\/html/);
  assert.match(await home.text(), /Every event/);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');

  const locale = await request('/de/');
  assert.equal(locale.status, 200);
  assert.match(await locale.text(), /Jedes Ereignis/);

  const redirect = await request('/demo?lang=fr');
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/demo/?lang=fr');

  const demo = await request('/demo/');
  assert.equal(demo.status, 200);
  assert.match(demo.headers.get('content-type'), /^text\/html/);

  const spec = await request('/spec/');
  assert.equal(spec.status, 200);
  assert.match(await spec.text(), /A portable record for legal chronologies/);

  const localizedSpec = await request('/fr/spec/');
  assert.equal(localizedSpec.status, 200);
  assert.match(await localizedSpec.text(), /Un dossier portable pour les chronologies juridiques/);

  const schema = await request('/spec/ocker.schema.json');
  assert.equal(schema.status, 200);
  assert.equal(schema.headers.get('content-type'), 'application/json');
  assert.equal((await schema.json()).title, 'OCKER 0.1.0 record');

  const wasm = await request('/demo/docling/docling_wasm_bg.wasm');
  assert.equal(wasm.status, 200);
  assert.equal(wasm.headers.get('content-type'), 'application/wasm');
  assert.match(wasm.headers.get('cache-control'), /max-age=3600/);

  const favicon = await request('/favicon.png');
  assert.equal(favicon.status, 200);
  assert.equal(favicon.headers.get('content-type'), 'image/png');
  const licence = await request('/LICENSE');
  assert.equal(licence.status, 200);
  assert.match(await licence.text(), /Apache License/);
  const notice = await request('/NOTICE');
  assert.equal(notice.status, 200);
  assert.match(await notice.text(), /docling/i);

  const stylesheet = await request('/assets/site.css');
  assert.equal(stylesheet.status, 200);
  const etag = stylesheet.headers.get('etag');
  assert.ok(etag, 'static responses provide an ETag');
  assert.equal((await request('/assets/site.css', { headers: { 'If-None-Match': etag } })).status, 304);

  const head = await request('/assets/site.css', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-type'), 'text/css; charset=utf-8');
  assert.equal(await head.text(), '');

  const unsupported = await request('/en/', { method: 'POST' });
  assert.equal(unsupported.status, 405);
  assert.equal(unsupported.headers.get('allow'), 'GET, HEAD');

  // Encoded dot segments must never expose files outside a route root.
  for (const path of ['/demo/%2e%2e/%2e%2e/package.json', '/spec/%2e%2e/%2e%2e/package.json', '/assets/%2e%2e/%2e%2e/package.json']) {
    const response = await request(path);
    assert.notEqual(response.status, 200, `${path} must not be served`);
  }

  console.log('Website server integration checks passed.');
} finally {
  // Undici keeps reusable local sockets alive; close them so this test never holds CI open.
  server.closeAllConnections?.();
  server.close();
  await once(server, 'close');
}
