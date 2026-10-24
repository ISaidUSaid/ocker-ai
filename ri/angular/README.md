# Angular

Apache-2.0 · Jenko <adam@isaidusaid.com>

`@ocker-ai/angular` exports a standalone `OckerChronologyComponent`.

The current baseline is Angular/CDK/animations 22 with TypeScript 6. Install the built Angular and core tarballs together, as described in [Installing the SDK](../../DISTRIBUTION.md). For private packaging, use `npm pack ./ri/angular/dist` after building. Do not pack the source workspace as the distributable Angular library.

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

The demo queues PDF, DOCX, RTF and plain-text documents, selects document kinds and an LLM provider, imports portable records and loads the fictional Joe/Jill example. A provider notice explains transmission before the user chooses Build; keys stay only in memory. It runs entirely client-side. The library build uses ng-packagr and produces an Angular package under `ri/angular/dist`; registry publication is separate.

## Complete application boundary

```ts
import {Component} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideAnimations} from '@angular/platform-browser/animations';
import {OckerChronologyComponent} from '@ocker-ai/angular';
import {createRecord, parseRecord, type ChronologyOptions, type OckerRecord} from '@ocker-ai/core';

@Component({selector:'app-root', standalone:true, imports:[OckerChronologyComponent],
  template:'<ocker-chronology [record]="record" [options]="options" (recordChange)="save($event)" />'})
class App {
  record = createRecord('Matter chronology');
  options: ChronologyOptions = {theme:'glass', onError:error=>console.error(error)};
  load(json:string) { this.record = parseRecord(json); }
  save(next:OckerRecord) { this.record = next; /* Persist through the host's service. */ }
}
bootstrapApplication(App, {providers:[provideAnimations()]});
```

Add `@import '@ocker-ai/core/styles.css';` to the application's global CSS. The host calls `load` with its own fetched/imported JSON. The wrapper disposes its renderer when Angular destroys it and supplies BreakpointObserver device state. For headless data operations, import graph/builder helpers from `@ocker-ai/core/headless`.
