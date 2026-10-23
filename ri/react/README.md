# React

Apache-2.0 · Jenko <adam@isaidusaid.com>

`@ocker-ai/react` exports the reusable `OckerChronology` component. It owns the browser mount lifecycle and delegates the portable model and rendering to `@ocker-ai/core`.

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

The client-only example has the fictional Joe/Jill record, file import, text-PDF queue, document kinds, provider settings, consent, build/relationship operations and cancellation. No backend is used. The chosen provider must permit browser CORS. Publishing the package is a separate action.
