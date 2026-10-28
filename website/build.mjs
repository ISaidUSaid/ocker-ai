import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { locales, sponsors } from './src/site.mjs';
import { renderPage, renderSpecPage } from './src/template.mjs';

const root = new URL('.', import.meta.url).pathname;
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, 'public'), dist, { recursive: true });
// These are project assets, copied at build time so website/public stays source-only.
await cp(join(root, '..', 'assets', 'ocker-wordmark.png'), join(dist, 'assets', 'ocker-wordmark.png'));
await cp(join(root, '..', 'assets', 'ocker-icon.png'), join(dist, 'favicon.png'));
await cp(join(root, '..', 'LICENSE'), join(dist, 'LICENSE'));
await cp(join(root, '..', 'NOTICE'), join(dist, 'NOTICE'));
globalThis.__LOCALES__ = locales;
for (const [locale, words] of Object.entries(locales)) {
  const directory = join(dist, locale);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), renderPage(locale, words, sponsors[locale]));
  await mkdir(join(directory, 'spec'), { recursive: true });
  await writeFile(join(directory, 'spec', 'index.html'), renderSpecPage(locale, words));
}
await writeFile(join(dist, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ocker</title><meta name="description" content="Open Chronology, Knowledge and Evidence Record"><link rel="icon" href="/favicon.png" type="image/png"><script>const x=(navigator.languages||[navigator.language||'en']).map(l=>l.toLowerCase().split('-')[0]).find(l=>['en','es','pt','fr','de'].includes(l))||'en';location.replace('/'+x+'/');</script></head><body><main><h1>Ocker</h1><p>Open Chronology, Knowledge and Evidence Record</p><p><a href="/en/">English</a> · <a href="/es/">Español</a> · <a href="/pt/">Português</a> · <a href="/fr/">Français</a> · <a href="/de/">Deutsch</a></p></main></body></html>`);
await mkdir(join(dist, 'spec'), { recursive: true });
await writeFile(join(dist, 'spec', 'index.html'), renderSpecPage('en', locales.en));
await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://ocker.ai/sitemap.xml\n');
const sitemap = ['/', '/spec/', ...Object.keys(locales).flatMap((locale) => [`/${locale}/`, `/${locale}/spec/`])]
  .map((path) => `  <url><loc>https://ocker.ai${path}</loc></url>`).join('\n');
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
console.log(`Built ${Object.keys(locales).length} localised Ocker pages in ${dist}`);
