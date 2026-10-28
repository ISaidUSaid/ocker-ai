import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { locales } from './src/site.mjs';

for (const locale of Object.keys(locales)) {
  const page = await readFile(join('website', 'dist', locale, 'index.html'), 'utf8');
  assert.match(page, new RegExp(`<html lang="${locale === 'pt' ? 'pt-BR' : locale}">`));
  assert.match(page, /Apache 2\.0/);
  assert.match(page, /https:\/\/github\.com\/ISaidUSaid\/ocker-ai/);
  assert.match(page, new RegExp(`/demo/\\?lang=${locale}`));
  assert.match(page, /isaidusaid-logo\.png/);
  assert.match(page, new RegExp(`/${locale}/spec/`));
  assert.doesNotMatch(page, /Email from|Messages between|School email|School report|♧|tiny-hat/i);
  const guide = await readFile(join('website', 'dist', locale, 'spec', 'index.html'), 'utf8');
  assert.match(guide, new RegExp(`<html lang="${locale === 'pt' ? 'pt-BR' : locale}">`));
  assert.match(guide, /ocker-wordmark\.png/);
}
const root = await readFile(join('website', 'dist', 'index.html'), 'utf8');
assert.match(root, /navigator\.languages/);
assert.match(root, /<a href="\/en\/">English<\/a>/);
for (const file of ['LICENSE', 'NOTICE', 'favicon.png', 'robots.txt', 'sitemap.xml', 'assets/ocker-wordmark.png']) {
  await access(join('website', 'dist', file));
}
const robots = await readFile(join('website', 'dist', 'robots.txt'), 'utf8');
assert.match(robots, /Sitemap: https:\/\/ocker\.ai\/sitemap\.xml/);
const sitemap = await readFile(join('website', 'dist', 'sitemap.xml'), 'utf8');
for (const locale of Object.keys(locales)) assert.match(sitemap, new RegExp(`https://ocker\\.ai/${locale}/spec/`));
console.log(`Validated ${Object.keys(locales).length} localised static pages.`);
