# OCKER development

- Write only inside this checkout. The surrounding ISaidUSaid.com repositories are read-only references.
- Author: Jenko <adam@isaidusaid.com>. Apache-2.0 for the specification and original code. Keep comments plain, direct and useful.
- Do not copy scoring engines, behavioural ontologies, message matching, advanced PDF extraction, OCR, scanned-PDF handling, production prompts, credentials, private data, branding or artwork.
- Import standard text PDFs using ordinary public PDF libraries. Reject image-only PDFs clearly. No OCR fallback.
- Only `supports` and `contradicts` relationships. They are attributed assessments, not findings of fact.
- No message functionality, evidence-message buttons, sliding windows, virtualisation or lazy card loading.
- All client variants run without an application backend. API keys stay in memory and never enter an OCKER export.
- Use native semantic controls, accessible keyboard behaviour, responsive layouts, drag/drop and motion preferences. Angular device changes use BreakpointObserver and animation uses Angular animations.
- Keep reusable packages separate from example applications. Host applications own provider/model selection, credentials, persistence, authentication and branding.
- Don't commit build outputs, dependency caches, screenshots, logs or secrets. Put temporary files and caches under `.work/`.
- Use the shared contract in `spec/CONTRACT.md`; coordinate changes before changing field names.
