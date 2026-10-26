# React

Apache-2.0 · Jenko <adam@isaidusaid.com>

`@ocker-ai/react` exports the reusable `OckerChronology` component. It owns the browser mount lifecycle and delegates the portable model and rendering to `@ocker-ai/core`.

Install its tarball and the core tarball together using the [private SDK distribution](../../DISTRIBUTION.md). The peer range starts at React 18; current standalone consumer acceptance exercises React 19 with its TypeScript types. Other React major versions have not received that acceptance run.

```tsx
import {OckerChronology} from '@ocker-ai/react';
import '@ocker-ai/core/styles.css';

<OckerChronology record={record} onChange={setRecord}
  theme="glass" animate={true}
  onSourceClick={(source, event) => openInHost(source, event)} />
```

The props combine `record`/`className` with the core's `ChronologyOptions`: theme, palette variables, labels, locale, read-only mode, callbacks and more. Use `theme="none"` for plain dialogs. The host owns provider policy, persistence and authentication.

From the repository root:

```sh
npm install
npm run build --workspace=@ocker-ai/react
npm run dev --workspace=@ocker-ai/react-demo
npm run build --workspace=@ocker-ai/react-demo
npm pack --workspace=@ocker-ai/react
```

The client-only example starts with document import, opening a saved OCKER record, or the fictional Joe/Jill example, then guides the user through provider settings, build/relationship operations and cancellation. No backend is used. The chosen provider must permit browser CORS. Publishing the package is a separate action.

## Complete component boundary

```tsx
import {useState} from 'react';
import {OckerChronology} from '@ocker-ai/react';
import {parseRecord, type OckerRecord} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

export function MatterChronology({initialJson, persist}: {
  initialJson:string; persist:(record:OckerRecord)=>void;
}) {
  const [record,setRecord] = useState(()=>parseRecord(initialJson));
  return <OckerChronology record={record} theme="glass"
    onChange={next=>{setRecord(next);persist(next);}}
    onError={error=>console.error(error)} />;
}
```

The wrapper mounts and destroys the renderer with React. Its record prop is controlled; replace that state to load a new chronology. `initialJson` above is only the initial value. For server-side processing, graph and builder helpers are available from `@ocker-ai/core/headless`; mount the visual component only on the browser client.
