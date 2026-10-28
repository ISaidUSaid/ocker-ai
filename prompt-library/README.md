# Public prompt library

These are the complete public RI prompts. They contain no ISaidUSaid.com prompts, scoring, message matching or PDF processing logic.

Each locale has two complete system prompts:

- `extract.txt`: attributed chronology accounts grounded in supplied document paragraphs, including agreed accounts where supported.
- `relate.txt`: direct support and contradiction between accounts of the same proposition.

Supported locales are English (`en`), Spanish (`es`), Portuguese (`pt`), French (`fr`) and German (`de`). Prompt prose must stay in one language: JSON wire-format keys are deliberately canonical English because they are part of the OCKER format. Locale tags are normalised from browser or host language tags such as `pt-BR` and `de-AT`; unsupported tags fall back to English.

`node prompt-library/prepare.mjs` writes `dist/prompts.json` for every RI and a generated browser module for the JavaScript package. Java Maven copies the JSON into classpath resources; the .NET build embeds the same JSON as a resource. No runtime request to a prompt server is needed. The JavaScript API exposes `getPrompts(locale)` and accepts `locale` in `buildChronology` and `findRelationships`. English `EXTRACTION_PROMPT` and `RELATIONSHIP_PROMPT` exports remain available for existing integrations.

The adapters pass each template as a system instruction and the intermediate document or event collection separately as user data. Provider/model selection and keys belong to the host application, never these files. Hosts can replace the `llm` callback to customise provider integration.

Edit the locale templates here and rebuild. Generated copies are ignored by Git. Apache-2.0 · Jenko <adam@isaidusaid.com>
