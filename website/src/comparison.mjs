// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { comparisonCopy } from './comparison-copy.mjs';

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderComparison(locale, sponsor) {
  const copy = comparisonCopy[locale];
  const text = value => esc(value.replaceAll('{brand}', sponsor.name));
  const status = included => `<span class="comparison-status ${included ? 'included' : 'unavailable'}"><span aria-hidden="true">${included ? '✓' : '—'}</span><span class="sr-only">${esc(included ? copy.yes : copy.no)}</span></span>`;
  const headerBrand = esc(sponsor.name).replace(/([a-zéêç])([A-Z])/g, '$1<wbr>$2').replace(/\.com$/, '<wbr><span class="comparison-domain-suffix">.com</span>');
  const headers = `<thead><tr><th scope="col">${esc(copy.capability)}</th><th scope="col">Ocker.ai</th><th scope="col"><a href="${esc(sponsor.url)}">${headerBrand}</a></th></tr></thead>`;
  const groups = copy.groups.map((group, index) => `<tbody><tr class="comparison-group"><th colspan="3" scope="rowgroup">${esc(group.title)}</th></tr>${group.rows.map((label, row) => {
    const open = index === 0 || index === 3;
    const hosted = index !== 3 || row === 0;
    return `<tr><th scope="row">${esc(label)}</th><td>${index === 3 && row === 0 ? `<span class="comparison-demo">${esc(copy.demo)}</span>` : status(open)}</td><td>${status(hosted)}</td></tr>`;
  }).join('')}</tbody>`).join('');
  return `<section class="comparison wrap" id="compare" aria-labelledby="comparison-title">
    <h2 id="comparison-title">${text(copy.title)}</h2><p class="comparison-intro">${text(copy.intro)}</p>
    <table class="comparison-table"><caption class="sr-only">${text(copy.title)}</caption><colgroup><col class="capability-column"><col><col></colgroup>${headers}${groups}</table>
    <details class="comparison-details"><summary>${esc(copy.details)}</summary>
      <table class="comparison-table"><caption class="sr-only">${esc(copy.details)}</caption><colgroup><col class="capability-column"><col><col></colgroup>${headers}<tbody>${copy.patterns.map(([label, definition]) => `<tr><th scope="row">${esc(label)}<p>${esc(definition)}</p></th><td>${status(false)}</td><td>${status(true)}</td></tr>`).join('')}</tbody></table>
    </details>
    <p class="comparison-actions"><a class="button outline" href="/demo/?lang=${locale}">${esc(copy.tryOcker)}</a><a class="button primary" href="${esc(sponsor.url)}">${text(copy.exploreSponsor)} <span aria-hidden="true">↗</span></a></p>
  </section>`;
}
