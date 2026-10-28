// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.wasm':'application/wasm', '.pdf':'application/pdf', '.md':'text/plain; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml' };

export const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, {Allow:'GET, HEAD'}).end(); return; }
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') { res.writeHead(200, {'Content-Type':'application/json'}).end('{"status":"ok"}'); return; }
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
      res.writeHead(308, {Location:'https://ocker.ai' + url.pathname + url.search}).end(); return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/demo') { res.writeHead(308,{Location:'/demo/' + url.search}).end(); return; }
    const demo = pathname.startsWith('/demo/');
    const spec = pathname.startsWith('/spec/') && !['/spec/','/spec/index.html'].includes(pathname);
    const base = resolve(root, demo ? 'ri/js/dist/demo' : spec ? 'spec' : 'website/dist');
    let relative = demo ? pathname.slice(6) : spec ? pathname.slice(6) : pathname.slice(1);
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const path = resolve(base, relative);
    if (!path.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    const info = await stat(path);
    if (!info.isFile()) { res.writeHead(404).end('Not found'); return; }
    const ext = extname(path);
    res.setHeader('Content-Type', types[ext] || (['LICENSE', 'NOTICE'].some(name => path.endsWith(sep + name)) ? 'text/plain; charset=utf-8' : 'application/octet-stream'));
    // Revalidate stable URLs so a release cannot pair new markup with yesterday's styles.
    res.setHeader('Cache-Control', ext === '.wasm' ? 'public, max-age=3600' : 'no-cache');
    const etag = 'W/"' + info.size + '-' + Math.trunc(info.mtimeMs) + '"';
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) { res.writeHead(304).end(); return; }
    const compress = /\bgzip\b/.test(req.headers['accept-encoding'] || '') && ['.html','.js','.mjs','.css','.json','.svg','.txt','.md'].includes(ext);
    res.setHeader('Vary', 'Accept-Encoding');
    if (compress) res.setHeader('Content-Encoding', 'gzip');
    else res.setHeader('Content-Length', info.size);
    res.writeHead(200);
    if (req.method === 'HEAD') { res.end(); return; }
    if (compress) await pipeline(createReadStream(path), createGzip(), res);
    else await pipeline(createReadStream(path), res);
  } catch (error) {
    if (!res.headersSent) res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : error instanceof URIError ? 400 : 500).end('Unable to serve this page');
    else res.destroy();
  }
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log('Ocker website listening on port ' + (process.env.PORT || 4173)));
}
