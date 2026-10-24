# Embedding OCKER

The intended integration is a reusable chronology surface inside an existing legal application. LEAP, Clio, Smokeball and other hosts can import/export the same record without adopting an RI application's storage, authentication or provider choice.

For exact private package installation and compatibility, start with [Installing the SDK](../DISTRIBUTION.md). The [SDK contract](SDK.md) defines graph, builder and consumer acceptance semantics. The libraries need no provider to import, navigate, annotate or display an existing file.

## Headless object model

Node and browser application logic can import `@ocker-ai/core/headless`, which excludes the UI renderer. Java uses `com.ocker:ocker-core`; .NET uses `Ocker.AI.Core`. UI packages are optional.

```js
import {parseRecord, createGraph, recordBuilder, exportRecord} from '@ocker-ai/core/headless';

export function inspectAndExtend(json, actor) {
  const record = parseRecord(json);
  const graph = createGraph(record);
  const first = record.events[0];
  const related = first ? graph.getRelatedEvents(first.id) : [];
  const evidence = first ? graph.getEvidence(first.id) : [];
  const next = recordBuilder(record).addActor(actor).build();
  return {related, evidence, json: exportRecord(next)};
}
```

The graph indexes an independent validated snapshot. Lookups return model copies, not mutable graph internals. Relationships are direct and bidirectional; an optional `supports`/`contradicts` filter is available. Evidence helpers resolve a source's document, optional paragraph and asset, including document-asset fallback. They never fetch external URIs. Rebuild a graph after changing a record. Plain entity lookups return an absent result; event-scoped queries reject missing event IDs.

Builders accept the existing model types in any order and validate the complete record, including references and embedded byte hashes, at `build`. Java exposes `OckerRecordBuilder` / `Ocker.recordBuilder`; .NET exposes `OckerRecordBuilder`. A builder does not mutate its starting record or call a provider. See the per-language guides for code.

## JavaScript

```js
import {parseRecord, mountChronology, buildChronology, findRelationships, parsePdf} from '@ocker-ai/core';
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

For basic PDF building, call `parsePdf(file, {kind:'affidavit', workerSrc:'/assets/pdf.worker.min.mjs'})`, review/store the intermediate object, then call `buildChronology([intermediate], {llm: yourAdapter, signal, onProgress})`. At the SDK level, relationship inference is the separate `findRelationships(record, options)` function. The example apps compose both functions into one **Build chronology** action and replace the displayed record only after both stages succeed. Hosts can use the same composition:

```js
const options = {llm: yourAdapter, signal, onProgress};
const proposed = await buildChronology(intermediates, options);
const complete = await findRelationships(proposed, options);
view.setRecord(complete);
```

Use `createOpenAICompatibleAdapter({endpoint, model, apiKey})` if your provider implements chat completions. A custom `llm` callback receives `{task, prompt, input, signal}` and returns an object or JSON string. Do not force your organisation's provider/model choices into an exported file.

## Angular and React

`@ocker-ai/angular` exports a standalone chronology component with record/options inputs and change output. It uses `BreakpointObserver` for its device view and Angular animations at the integration boundary. `@ocker-ai/react` exports `OckerChronology` with record/options and change callbacks. Both use the same browser core and CSS, so they do not reimplement the wire format.

See [Angular](../ri/angular/README.md) and [React](../ri/react/README.md) for exact package names, selectors, props and build/run commands. Each has a runnable provider-configurable example. No application backend is required for these variants.

## Node-backed Angular

The [Node RI](../ri/node.js/README.md) hosts the basic PDF/build/relationship operations and serves an Angular front end using the reusable Angular chronology component. Provider keys are supplied at operation time. Allowed provider origins are server configuration, not untrusted request input. Long operations expose progress and cancellation. The embedding application is responsible for authenticating callers and scoping operation IDs if the loopback demo is deployed as a service.

## Java and C#

Java separates `ocker-core`, `ocker-javafx` and `ocker-example`. C# separates `Ocker.Core`, `Ocker.Avalonia` and `Ocker.Desktop`. Both expose typed options, replaceable completion adapters, cancellation/progress and reusable native chronology controls. See their README files for configuration examples, Maven/NuGet packaging and native UI run commands.

## Styling

Default theme is `glass`; chronology cards have a frosted rim and dialogs have a translucent border and backdrop blur. `none` uses plain opaque surfaces. Palette overrides are separate. Browser classes are prefixed `ocker-`; CSS variables start `--ocker-`. Framework components do not require Material/MDC. A host may replace the CSS completely.

Notes use pin-relative coordinates and preserve those through zoom. Precedents derive the outside card edge, so importers do not have to reproduce a source viewport. Mobile devices use compact note markers and explicit annotation buttons. The RIs intentionally render every event card; they do not include the product's sliding-window machinery.

## Example workbench utilities

Browser examples share `@ocker-ai/core/demo/code`, `/demo/editor`, `/demo/providers` and `/demo/documents` helpers. The JSON editor takes `getRecord`, `onApply` and `theme` callbacks, validates the complete record including references and embedded hashes before applying, and never serialises provider controls. The reusable chronology packages remain independent of those example controls.

Provider shortcuts use documented endpoints from [OpenAI](https://developers.openai.com/api/reference/overview), [Anthropic](https://platform.claude.com/docs/en/api/overview), [Gemini](https://ai.google.dev/gemini-api/docs/openai), [Mistral](https://docs.mistral.ai/api/endpoint/chat), [Groq](https://console.groq.com/docs/openai), [OpenRouter](https://openrouter.ai/docs/api_reference/overview), and [Ollama](https://docs.ollama.com/api/openai-compatibility). No model is selected by a shortcut. Direct browser Anthropic calls opt into its browser-access header only for explicit user-initiated requests. The Node example requires configured provider origin allowlisting.
