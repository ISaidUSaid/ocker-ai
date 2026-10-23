# Angular

Apache-2.0 · Jenko <adam@isaidusaid.com>

`@ocker-ai/angular` exports a standalone `OckerChronologyComponent`.

```ts
import {OckerChronologyComponent} from '@ocker-ai/angular';
// Add OckerChronologyComponent to your component's imports.
// Enable Angular animations in your application's providers.
const options = {theme: 'glass', animate: true};
```

```html
<ocker-chronology [record]="record" [options]="options"
  (recordChange)="saveInHost($event)" />
```

Import `@ocker-ai/core/styles.css` in your application stylesheet. The component uses CDK `BreakpointObserver` for compact/wide views and Angular animations at its boundary. The framework-neutral core renders the chronology. Standard HTML controls are used throughout; no Material UI is required.

Options are the core's `ChronologyOptions`: `theme: 'glass' | 'none'`, `themeVariables`, labels, locale, read-only mode and host callbacks. The change output and configured `onChange` callback both receive annotation updates. The host owns credentials and persistence.

From the repository root:

```sh
npm install
npm run build --workspace=@ocker-ai/angular
npm run start --workspace=@ocker-ai/angular-demo
npm run build --workspace=@ocker-ai/angular-demo
```

The demos explicitly mark asynchronous view changes for Angular change detection; the reusable renderer runs outside Angular and emits edits back through the change output. This keeps drag movement out of application change detection.

The demo queues PDF, DOCX, RTF and plain-text documents, selects document kinds and an LLM provider, imports portable records and loads the fictional Joe/Jill example. Provider calls require deliberate consent and a key held only in the tab. It runs entirely client-side. The library build uses ng-packagr and produces an Angular package under `ri/angular/dist`; registry publication is separate.
