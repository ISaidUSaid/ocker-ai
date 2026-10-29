import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { locales, sponsors } from './src/site.mjs';
import { comparisonCopy } from './src/comparison-copy.mjs';

for (const locale of Object.keys(locales)) {
  const page = await readFile(join('website', 'dist', locale, 'index.html'), 'utf8');
  assert.match(page, new RegExp(`<html lang="${locale === 'pt' ? 'pt-BR' : locale}">`));
  assert.match(page, /Apache 2\.0/);
  assert.match(page, /https:\/\/github\.com\/ISaidUSaid\/ocker-ai/);
  assert.match(page, new RegExp(`/demo/\\?lang=${locale}`));
  assert.match(page, /isaidusaid-logo\.png/);
  assert.match(page, new RegExp(`/${locale}/spec/`));
  assert.doesNotMatch(page, /Email from|Messages between|School email|School report|♧|tiny-hat/i);
  const comparison = page.split('id="compare"')[1].split('<section class="wrap why"')[0];
  assert.ok(comparison.includes(sponsors[locale].name));
  assert.ok(comparison.includes(sponsors[locale].url));
  assert.doesNotMatch(comparison, /Docling|evidenceRequirements|SHIFTING_TIMEFRAME|\{brand\}/);
  if (locale !== 'en') assert.doesNotMatch(comparison, /ISaidUSaid\.com|isaidusaid\.com/);
  const patterns = comparisonCopy[locale].patterns;
  assert.equal(patterns.length, 14);
  assert.equal(new Set(patterns.map(([label]) => label)).size, 14);
  assert.ok(comparison.includes(patterns[13][0]));
  // The portable-file row is supported by both; reusable components remain Ocker-only.
  const tables = comparison.split('<details')[0];
  const rows = [...tables.matchAll(/<tr><th scope="row">([\s\S]*?)<\/tr>/g)].map(match => match[0]);
  assert.equal(rows.length, 25);
  assert.equal((rows[9].match(/comparison-status included/g) || []).length, 2);
  assert.equal((rows[21].match(/comparison-status included/g) || []).length, 1);
  assert.equal((rows[21].match(/comparison-status unavailable/g) || []).length, 1);
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
