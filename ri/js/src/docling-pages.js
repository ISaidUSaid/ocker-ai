// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>

// Digital PDFs can contain whole scanned pages between their typed pages.
export function pagesWithoutText(doc, pageCount) {
  const readable = new Set();
  for (const item of [...(doc.texts ?? []), ...(doc.tables ?? [])]) {
    if (item.content_layer === 'furniture') continue;
    const text = item.text ?? item.data?.table_cells?.map(cell => cell.text ?? '').join(' ');
    if (text?.trim()) for (const prov of item.prov ?? []) readable.add(prov.page_no);
  }
  return Array.from({length: pageCount}, (_, i) => i + 1).filter(page => !readable.has(page));
}

export function mergeScannedPages(digital, scanned, pageNumbers) {
  const collections = ['texts', 'tables', 'pictures', 'groups'];
  const offsets = Object.fromEntries(collections.map(name => [name, digital[name]?.length ?? 0]));
  function remap(value) {
    if (Array.isArray(value)) return value.map(remap);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      if ((key === '$ref' || key === 'self_ref') && typeof item === 'string') {
        const match = /^#\/(texts|tables|pictures|groups)\/(\d+)$/.exec(item);
        if (match) return [key, `#/${match[1]}/${offsets[match[1]] + Number(match[2])}`];
      }
      if (key === 'page_no') {
        if (!Number.isInteger(item) || !pageNumbers[item - 1]) throw new Error('Docling returned an invalid scanned-page reference.');
        return [key, pageNumbers[item - 1]];
      }
      return [key, remap(item)];
    }));
  }
  const extra = remap(scanned);
  return {...digital,
    ...Object.fromEntries(collections.map(name => [name, [...(digital[name] ?? []), ...(extra[name] ?? [])]])),
    body: {...digital.body, children: [...(digital.body?.children ?? []), ...(extra.body?.children ?? [])]}
  };
}
