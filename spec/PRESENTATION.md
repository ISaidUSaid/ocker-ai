# One chronology design across the reference implementations

Author: Jenko <adam@isaidusaid.com> · Apache-2.0

The reference applications should look like the same application, whether they run in a browser, JavaFX or Avalonia. The chronology, paper notes, outside-edge precedent flags and direct manipulation are part of OCKER's identity. A native port must not replace them with a generic list or data grid.

This is the default RI presentation contract, not a restriction on the portable file format. Integrators can replace styling through CSS, native stylesheets, palettes and options. Platform window chrome, font rasterisation and file pickers may differ; the chronology's layout and interaction model should remain recognisable.

## Shared defaults

| Element | Default |
|---|---|
| Workspace | `#f4f7f9`, with white surfaces and generous spacing |
| Primary / text / muted | `#194d61` / `#213b48` / `#617985` |
| Borders / accent | `#d6e1e7` / `#d7a85d` |
| Typography | Georgia or a comparable serif for chronology headings; system sans-serif for controls and body |
| Cards | White, 16px corners, thin border, subtle shadow, approximately 24px internal padding |
| Card reading order | Date, title, account author, status pill, summary, actions |
| Common ground pill | `#e4f0e9` background, `#306747` text |
| Disputed pill | `#f9e7e7` background, `#9a3d42` text |
| Other status pills | Quiet neutral fill and muted text |
| Desktop layout | Two equal columns, an approximately 80px central gutter, a continuous spine and per-card markers; right column staggered |
| Compact layout | One column, wrapping titles/actions, compact annotation markers; no desktop dispensers |
| Paper notes | Yellow paper, visible red pin, folded corner, body margins and small edit/delete controls |
| Precedent flags | Blue `#b7d9e8`, lavender `#d6c9e5`, mint `#c3dfcf`, peach `#ecd0bb`, slate `#c5d1d7` |
| Desktop dispensers | Approximately 100×88px note pad and 100×36px precedent pad at the workspace's lower outside corner |
| Dialog themes | `glass`: translucent rim and blurred owner/backdrop; `none`: opaque, plain dialog |

Long titles and summaries wrap inside their column. Content length must not move the spine or change the opposing column's width. Status colour belongs to the status pill, not a large saturated card background. The primary card action is **Source evidence**; **Related (count)** is explicit when links exist.

## Shared interaction

- Dragging a note shows a semi-transparent paper preview. The pointer travels with the red pin, and that pin must land inside an event rectangle before a drop is accepted.
- Store the pin in unscaled coordinates relative to the same outer card rectangle used for rendering. Zoom applies to both the card and its annotations.
- A drop outside cards cancels without changing the record. Moving an existing note preserves its body and identity.
- Precedents attach to the far outside edge regardless of the drop location: left of the left chronology column, right of the right column. Their selected colour survives save, import and export.
- Compact mode provides add-note/add-precedent actions and a small notes marker. It must not depend on dragging from a desktop pad.
- The related-event modal uses the same cards connected as a web. It fits the owner window, retains annotation controls, and requires an explicit close action rather than closing on an accidental outside click.
- The source reader, note editor and precedent editor use the same typography, spacing and dialog theme as the chronology.
- All RIs keep the complete record rendered. Animations are short, optional, and must not interfere with dragging or reading.
- Visual exports retain the selected view, labels, annotations and readable layout. Exporting must not mutate the live record.

## Example application flow

Keep the same document-first hierarchy: add or paste documents; connect a provider with a user-selected model/key; build chronology and compare accounts together. Saved-file import and the Joe/Jill example are separate paths. Provider configuration must not crowd the chronology or turn the application into a row of equally prominent buttons.

Every example includes theme selection, provider disclosure, progress/cancellation, **Show code** and **Edit OCKER file**. Host-specific integrations can move these controls, but should retain their names and purpose.

## Review checklist

Compare the same record at desktop and compact widths, including long titles, common ground, a contradiction, a paper note and a precedent flag. Inspect the related web and a glass/plain dialog. Exercise a valid drop, invalid drop, note move and zoomed drop, then export and re-import the record. Build success alone does not establish visual or interaction parity.
