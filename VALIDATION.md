# Validation record — updated 24 October 2026

Author: Jenko <adam@isaidusaid.com>

This is a private draft 0.1.0. These checks establish the RI baseline; they are not a certification of legal conclusions or AI accuracy.

## Exercised locally

| Area | Result |
|---|---|
| JavaScript SDK | 11 Node tests: schema/reference/hash checks, annotations, real PDF.js parsing, mocked extraction/relationships, cancellation and credential separation |
| Specification | 16 schema, negative-input, semantic, integrity and round-trip checks; packaged schemas checked against the normative copies |
| Browser UI | 7 Playwright tests: filters, glass/none, source view, mobile annotations, spaces in note input, colour persistence, pin-based drag/drop, invalid-drop rejection, related-card modal, PDF-to-mocked-provider build, PNG/PDF downloads, derivative-frame labelling |
| Framework runtime | 3 additional browser smoke tests: Angular, React and Node-backed Angular each load the sample, switch to compact view and retain a new note |
| Angular | Reusable package and full client-only example built with Angular 22; BreakpointObserver supplies device state |
| React | Reusable package/types and client-only example built; consumes the public core API |
| Node + Angular | Backend/Angular production build and 3 API tests; real multipart PDF import and a local mock completion server |
| Java | Java 21 Maven reactor installed; 7 JUnit tests pass, including shared fixture/PDF imports, successful mocked extraction and symmetric-relationship deduplication, invalid input and cancellation |
| C# | .NET 8 solution builds with zero warnings; console conformance checks exercise synthetic/shared records, extension preservation, PDF parsing, unknown IDs, cancellation and text-only LLM payloads |
| Native visual smoke tests | JavaFX and Avalonia apps opened the same 12-event record, rendered snapshots and generated full-board PNG/PDF exports; generated PDF pages were rendered with Poppler and visually inspected |
| Dependency reproducibility | Clean `npm ci` and all web builds passed; `npm audit` reported zero advisories for the locked npm dependency tree at validation time |

The shared fixture has 12 events, 2 embedded original PDFs, 6 support/contradiction links, a note and a coloured fictional precedent. The source PDFs were generated specifically for this repository. A separate example embeds an original synthetic video and a derived frame with hashes and selectors. There is no customer evidence in the examples.

Final implementation commit `2a8676a` passed [all GitHub CI jobs](https://github.com/ISaidUSaid/ocker-ai/actions/runs/39957378878): web, Java and C#.

## Reproduce

From the repository root with Node 22.22.3+, Java 21/Maven and .NET 8:

```sh
npm ci
npm test
npm run check:spec
npm run build
npm run demo:build
npm run build --workspace=@ocker-ai/angular
npm run build --workspace=@ocker-ai/angular-demo
npm run build --workspace=@ocker-ai/react
npm run build --workspace=@ocker-ai/react-demo
npm test --workspace=@ocker-ai/node-demo
npm run build --workspace=@ocker-ai/node-demo
npx playwright install chromium
node node_modules/@playwright/test/cli.js test -c ri/js/playwright.config.js
node node_modules/@playwright/test/cli.js test -c ri/js/framework.playwright.config.js
mvn -f ri/java/pom.xml install
dotnet build 'ri/c#/Ocker.sln'
dotnet run --project 'ri/c#/tests/Ocker.Core.Tests'
```

The browser configuration uses installed Chrome on macOS/Linux when available and Playwright Chromium elsewhere. It starts its own local Vite server when needed. CI repeats the web/spec, Java and C# build/test paths. Native GUI screenshots require a display and are not part of headless CI.

## Boundaries and remaining verification

- No paid provider requests were made. Replacement adapters and HTTP mocks exercised extraction/relationship flows. Each integrator still needs to verify their chosen provider's response/CORS behaviour using their own key.
- Native apps received visual startup/export checks. Every native dialog and drag gesture has not received a cross-platform manual test on macOS, Windows and Linux. Web interactions have automated coverage; host-specific native behaviour still warrants normal integration acceptance testing.
- `npm audit` is scoped to npm dependencies, not a complete audit of Maven/NuGet or legal correctness. No dependency audit can establish AI accuracy.
- GitHub Pages currently refuses hosting for this private repository on the account plan. The manual deployment workflow is present. No account upgrade or public visibility change was made. Run the client-only example locally until hosting becomes available.
- No npm/Maven Central/NuGet packages were published. Buildable package sources and local artifacts are supplied for review.
- The RIs use ordinary public text-PDF libraries. They contain no OCR, production scoring, message matching, proprietary PDF reconstruction or product prompts/assets. A read-only source/spec/fixture boundary review found no live credentials or copied protected engines.

## RI workflow update — 24 October 2026

- Shared public prompts now live only in `prompt-library/extract.txt` and `relate.txt`. npm prebuild/predev/pretest/prepack hooks, Maven resources and .NET embedded resources copy them before use. `npm pack --dry-run` confirms the generated browser prompt module and editor helpers are included.
- PDF, DOCX, RTF, TXT and browser rich-HTML/paste imports preserve original source bytes and produce canonical intermediates. Tests cover Unicode RTF, DOCX parsing/expansion limits, malformed and cancelled imports, HTML text extraction without execution and asset integrity.
- The no-key sample now uses the actual Joe/Jill test PDFs and the 46 displayed events from their tested chronology. The raw stored artifact was read-only verified on 24 October against the prior review snapshot: unchanged, generated 20 October. Only allowlisted event/source data and four direct contradiction links were retained. Fresh annotations replace production test notes; a Briginshaw research flag links to the official High Court record. All quoted paragraphs are checked against original PDF page text.
- Glass now clips the opaque content fill to the padding box, leaving its translucent rim visible; WebKit backdrop filters are included. Source/primary hover buttons retain contrast and compact sizing. The actual in-app browser was visually checked, including the colour-highlighted JSON editor.
- All examples expose code, document-type confirmation after selection, pretty-printed JSON editing and validated Apply. Browser editors use CodeMirror; native editors use editable JSON plus a coloured preview with long embedded values abbreviated only in the preview. Provider keys never enter editor JSON.
- One Build action completes extraction and relationship comparison before applying a record. Provider notices replace consent checkboxes; endpoint/protocol live in advanced settings. Presets leave models unchanged and clear previous keys. Keyless requests are restricted to loopback endpoints. Browser examples include Anthropic Messages support; native presets use chat-completions APIs.
- Passed: 17 JS core/import/provider tests; 16 spec checks; 12 browser interaction tests; 3 Angular/React/Node runtime tests including JSON Apply; 5 Node API tests; all browser/library builds; 8 Java core tests and full Maven reactor; .NET solution build/core tests with zero warnings. npm audit reports zero vulnerabilities. No paid LLM calls were made; provider wire formats and combined-build behaviour were exercised with mocks.
- The updated native windows compile and their data paths pass tests. New native dialog interactions still need normal acceptance checks on each supported operating system; no claim of exhaustive cross-platform GUI validation is made.

## Final private draft verification — 24 October 2026

The latest implementation is `6db6cebc617c94f5063c4a5cbf898490830bec15`; local HEAD and origin/main were verified to match. The GitHub API confirms that all three jobs in [run 40017749018](https://github.com/ISaidUSaid/ocker-ai/actions/runs/40017749018) completed successfully: web (including browser and framework interaction tests), Java, and C#. Earlier validation sections retain the baseline history; the 24 October workflow update describes the current sample and test counts.

OCKER remains the working title at Adam's direction. This handoff does not make the repository public, publish packages or resolve the private-repository Pages restriction. No original ISaidUSaid.com files were changed.
