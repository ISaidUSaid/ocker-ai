# Ocker public website

This is the dependency-free public site for `ocker.ai`. It generates one static page for each supported language:

- `/en/` English
- `/es/` Spanish
- `/pt/` Portuguese
- `/fr/` French
- `/de/` German

Build it with `node website/build.mjs`. Validate generated pages with `node website/test.mjs`.

The root page chooses a supported browser language and sends visitors to its shareable locale URL. The language menu always lets visitors override that choice.

`website/dist/` is generated deployment output and is intentionally not committed.
