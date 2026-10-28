// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mkdir,readFile,writeFile} from 'node:fs/promises';

export const SUPPORTED_LOCALES=['en','es','pt','fr','de'];
export const DEFAULT_LOCALE='en';

export function normaliseLocale(value,fallback=DEFAULT_LOCALE) {
  const candidate=String(value??'').trim().toLowerCase().replace('_','-').split('-')[0];
  return SUPPORTED_LOCALES.includes(candidate)?candidate:(SUPPORTED_LOCALES.includes(fallback)?fallback:DEFAULT_LOCALE);
}

const prompts={};
for(const locale of SUPPORTED_LOCALES) {
  prompts[locale]={};
  for(const name of ['extract','relate']) {
    const value=(await readFile(new URL(`./${locale}/${name}.txt`,import.meta.url),'utf8')).trim();
    if(!value)throw new Error(`Empty ${locale} prompt: ${name}`);
    prompts[locale][name]=value;
  }
}
const generated={defaultLocale:DEFAULT_LOCALE,supportedLocales:SUPPORTED_LOCALES,locales:prompts};
await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
await writeFile(new URL('./dist/prompts.json',import.meta.url),JSON.stringify(generated,null,2)+'\n');
await writeFile(new URL('../ri/js/src/prompts.generated.json',import.meta.url),JSON.stringify(generated,null,2)+'\n');
