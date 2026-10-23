# Public prompt library

These are the complete public RI prompts. They contain no ISaidUSaid.com prompts, scoring, message matching or PDF processing logic.

- `extract.txt`: attributed chronology accounts grounded in supplied document paragraphs, including agreed accounts where supported.
- `relate.txt`: direct support and contradiction between accounts of the same proposition.

Document text is untrusted data. The adapters pass each template as a system instruction and the intermediate document or event collection separately as user data. Provider/model selection and keys belong to the host application, never these files.

`node prompt-library/prepare.mjs` copies these UTF-8 templates into the browser package's generated JSON module. All web build, development and test entry points run it before using the core. `prepack` also includes the generated module in a published package. Java Maven copies the same files into classpath resources; the .NET build embeds the same files as resources. No runtime request to a prompt server is needed.

Edit templates here and rebuild. Generated copies are ignored by Git. Hosts can replace the `llm` callback to customise prompt construction and provider integration.

Apache-2.0 · Jenko <adam@isaidusaid.com>
