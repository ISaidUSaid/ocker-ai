# Embedding OCKER

The intended integration is a reusable chronology surface inside an existing legal application. LEAP, Clio, Smokeball and other hosts can import/export the same record without adopting an RI application's storage, authentication or provider choice.

## JavaScript

```js
import {parseRecord, mountChronology, buildChronology, parsePdf} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

const record = parseRecord(await file.text()); // schema, references and embedded hashes checked
const view = mountChronology(container, record, {
  theme: 'glass',
  themeVariables: {primary: '#3b4573', accent: '#e7b867'},
  readOnly: false,
  onChange: next => host.saveChronology(next),
  onSourceClick: (source, event) => host.openEvidence(source, event),
  onError: error => host.showError(error.message)
});
view.setOptions({theme: 'none'});
// On unmount:
view.destroy();
```

The component does not own persistence. `getRecord()` returns a copy; `setRecord()` verifies the supplied record before replacing it. `onChange` and bubbling `ocker:change` emit a complete updated record after annotation mutations. `onEventClick`, `onSourceClick`, `assetResolver`, `labels`, `locale`, `animate`, `showToolbar`, `mobile` and `authorId` are available options. Referenced author IDs must exist in `actors`.

For basic PDF building, call `parsePdf(file, {kind:'affidavit', workerSrc:'/assets/pdf.worker.min.mjs'})`, review/store the intermediate object, then call `buildChronology([intermediate], {llm: yourAdapter, signal, onProgress})`. Relationship inference is a separate `findRelationships(record, options)` action. The returned record replaces the old one only after validation.

Use `createOpenAICompatibleAdapter({endpoint, model, apiKey})` if your provider implements chat completions. A custom `llm` callback receives `{task, prompt, input, signal}` and returns an object or JSON string. Do not force your organisation's provider/model choices into an exported file.

## Angular and React

`@ocker-ai/angular` exports a standalone chronology component with record/options inputs and change output. It uses `BreakpointObserver` for its device view and Angular animations at the integration boundary. `@ocker-ai/react` exports `OckerChronology` with record/options and change callbacks. Both use the same browser core and CSS, so they do not reimplement the wire format.

See [Angular](../ri/angular/README.md) and [React](../ri/react/README.md) for exact package names, selectors, props and build/run commands. Each has a runnable provider-configurable example. No application backend is required for these variants.

## Node-backed Angular

The [Node RI](../ri/node.js/README.md) hosts the basic PDF/build/relationship operations and serves an Angular front end using the reusable Angular chronology component. Provider keys are supplied at operation time. Allowed provider origins are server configuration, not untrusted request input. Long operations expose progress and cancellation. The embedding application is responsible for authenticating callers and scoping operation IDs if the loopback demo is deployed as a service.

## Java and C#

Java separates `ocker-core`, `ocker-javafx` and `ocker-example`. C# separates `Ocker.Core`, `Ocker.Avalonia` and `Ocker.Desktop`. Both expose typed options, replaceable completion adapters, cancellation/progress and reusable native chronology controls. See their README files for configuration examples, Maven/NuGet packaging and native UI run commands.

## Styling

Default dialog theme is `glass`; `none` disables the translucent border and backdrop blur. Palette overrides are separate. Browser classes are prefixed `ocker-`; CSS variables start `--ocker-`. Framework components do not require Material/MDC. A host may replace the CSS completely.

Notes use pin-relative coordinates and preserve those through zoom. Precedents derive the outside card edge, so importers do not have to reproduce a source viewport. Mobile devices use compact note markers and explicit annotation buttons. The RIs intentionally render every event card; they do not include the product's sliding-window machinery.
