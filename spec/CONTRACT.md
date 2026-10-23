# Shared OCKER 0.1.0 implementation contract

This is the agreed wire model. JSON property names are lower camel case in every runtime. Entity IDs are opaque strings, unique within the record. Paragraph IDs are unique within their document, and are always resolved together with documentId. References must resolve. Dates preserve precision. Unknown fields are allowed only in `extensions` on record or entities; a compatible reader preserves them.

```ts
type DateValue = { precision: 'day'|'month'|'year'|'range'|'unknown'; value?: string; end?: string; approximate?: boolean; basis?: string };
type Source = { documentId: string; paragraphId?: string; page?: number; quote?: string; assetId?: string; selector?: {kind:'text'|'page'|'time'|'frame'; start?:number; end?:number; page?:number} };
type Paragraph = {id:string; page:number; label?:string; text:string};
type Document = {id:string; title:string; kind:'affidavit'|'order'|'report'; author?:string; assetId?:string; paragraphs:Paragraph[]};
type Event = {id:string; title:string; summary:string; date:DateValue; assertedBy?:string; actorIds?:string[]; sources:Source[]; status?:'alleged'|'agreed'|'disputed'|'unresolved'; narrative?:string; extensions?:object};
type Relationship = {id:string; from:string; to:string; type:'supports'|'contradicts'; rationale:string; provenance:{method:'llm'|'human'|'imported'; createdAt:string; authorId?:string}; sources?:Source[]; extensions?:object};
type Note = {id:string; eventId:string; body:string; position:{x:number;y:number}; createdAt:string; updatedAt:string; authorId?:string; extensions?:object};
type Authority = {id:string; eventId:string; title:string; citation:string; type:'binding'|'persuasive'|'unspecified'; color:'blue'|'lavender'|'mint'|'peach'|'slate'; pinpoint?:string; court?:string; jurisdiction?:string; sourceUrl?:string; body?:string; createdAt:string; updatedAt:string; authorId?:string; extensions?:object};
type Asset = {id:string; name:string; mediaType:string; sha256:string; byteLength:number; data?:string; uri?:string; derivedFrom?:string; selector?:object; extensions?:object};
type Record = {format:'ocker'; version:'0.1.0'; id:string; title:string; createdAt:string; updatedAt:string; actors:{id:string;name:string;role?:string;extensions?:object}[]; documents:Document[]; events:Event[]; relationships:Relationship[]; notes:Note[]; authorities:Authority[]; assets:Asset[]; extensions?:object};
type Intermediate = {format:'ocker-document'; version:'0.1.0'; document:Document; asset?:Asset};
```

`position.x/y` are unscaled pixel offsets of the note's pin relative to the event's outer top-left. The pin is the drag/drop point. Drop must hit an event card; invalid drops do not mutate the record. Authority flags stack at the outer edge away from the chronology centre line. View state (zoom, filters, selected related event) belongs to the component, not the portable record.

Sources contain exact source excerpts, never fabricated evidence. All paragraph/page/asset references must exist. `data` is plain RFC 4648 base64, not a data URI. Hashes are lowercase SHA-256 of decoded original bytes. `uri` is an optional external asset alternative, never silently fetched by a reader. A self-contained export includes `data` for every asset.

## Shared adapter model

Each library accepts options; no fixed model or secrets in code. A supplied completion adapter receives a task (`extract` or `relate`), public prompt text, input and cancellation. A built-in optional OpenAI-compatible HTTP adapter accepts endpoint, model and API key. It is just an adapter; users can replace it.

Extraction responds with `{events:[{title,summary,date,assertedBy?,status?,paragraphIds:string[],narrative?}]}`. The library assigns IDs and creates exact source locators from the intermediate document; it rejects unknown paragraph IDs. Relationship inference responds with `{relationships:[{from,to,type,rationale}]}` and the library validates IDs and permitted types, removes duplicates and attaches provenance. Use small documented public prompts written from scratch. Never load production prompts.

All libraries expose validate/import/export; text-PDF parsing; build chronology; find relationships; add/edit/delete notes and precedents. Mutations validate references. Progress callbacks/listeners report reading/extracting/relating/completed/error. Cancellation must be honoured. No provider call occurs when loading a saved record or the prebuilt demo.

## Browser package contract

`@ocker-ai/core` lives in `ri/js`, ESM JavaScript with TypeScript declarations. Public exports: `createRecord`, `validateRecord`, `parseRecord`, `exportRecord`, `parsePdf`, `buildChronology`, `findRelationships`, `createOpenAICompatibleAdapter`, and `mountChronology(element, record, options)` returning `{getRecord,setRecord,setOptions,destroy}`. Options: `onChange`, `onProgress`, `onError`, `llm`, `readOnly`, `locale`, `theme`, `labels`, `assetResolver`, `onEventClick`, `onSourceClick`, `animate`, `showToolbar`, `mobile`, `authorId`. UI dispatches `ocker:change` in addition to callbacks. CSS is light DOM, prefixed `ocker-`, driven by `--ocker-*` properties and host-supplied classes.

Angular/React wrappers delegate to the public browser package, not internal application functions. Angular uses BreakpointObserver to set `mobile` and Angular animation at its integration boundary. Node backend accepts multipart standard PDFs and exposes validated record/build/relationship endpoints with progress and cancellation support; its Angular front end uses the Angular reusable component. Java and C# use equivalent typed options objects and listeners/callbacks and expose native reusable UI components.
