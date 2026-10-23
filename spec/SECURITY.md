# Host integration and security

OCKER is a file format and a reference implementation, not a hosted case-management system. Authentication, tenant boundaries, storage access, privilege and retention policies belong to the embedding application.

- Keep API keys in memory or in the host's secure credential service. Never put them in `extensions`, exported records, source URLs or browser localStorage.
- Treat PDFs, source text, imported records and LLM output as untrusted data. The RIs render plain text, never imported HTML. Author notes and precedent bodies are plain text in 0.1.0.
- The Node example binds to loopback by default, bounds uploads and allowlists provider origins. Exposing it remotely requires host authentication, TLS, per-user operation ownership and rate limits. It is not an open proxy.
- Do not fetch asset URIs on import. Supply a deliberate resolver with an origin policy if your application needs linked evidence. Verify bytes before preview/download.
- Configure input, page, response and event limits appropriate to the application. The browser RI defaults to 25 MB text PDFs, 250 pages, 100 MB OCKER JSON, 160,000 document characters and 200,000 relationship-input characters. These are transparent RI limits, not a product processing system.
- The browser demo self-hosts the public PDF.js worker. The library allows `workerSrc`; without it the standard versioned worker is loaded from jsDelivr. This downloads code only; PDF bytes are parsed locally. Hosts with stricter CSP should self-host the worker.
- Provider calls send source text only after the user configures a provider and deliberately builds/relates. Calls can be cancelled. The reference demo makes no telemetry or scoring calls.
- Hashes detect changed bytes relative to the supplied digest; they do not certify who supplied the file. Protect the record itself when evidential authenticity matters.

Report security issues privately to adam@isaidusaid.com while the repository remains private. Do not attach client records or live keys to issues.
