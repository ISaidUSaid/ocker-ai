# Validation record — 23 October 2026

Author: Jenko <adam@isaidusaid.com>

This is a private draft 0.1.0. These checks establish the RI baseline; they are not a certification of legal conclusions or AI accuracy.

## Exercised locally

| Area | Result |
|---|---|
| JavaScript SDK | 11 Node tests: schema/reference/hash checks, annotations, real PDF.js parsing, mocked extraction/relationships, cancellation and credential separation |
| Specification | 16 schema, negative-input, semantic, integrity and round-trip checks; packaged schemas checked against the normative copies |
| Browser UI | 6 Playwright tests: filters, glass/none, source view, mobile annotations, spaces in note input, colour persistence, pin-based drag/drop, invalid-drop rejection, related-card modal, PDF-to-mocked-provider build, PNG/PDF downloads |
| Angular | Reusable package and full client-only example built with Angular 22; BreakpointObserver supplies device state |
| React | Reusable package/types and client-only example built; consumes the public core API |
| Node + Angular | Backend/Angular production build and 3 API tests; real multipart PDF import and a local mock completion server |
| Java | Java 21 Maven reactor installed; 7 JUnit tests pass, including shared fixture/PDF imports, successful mocked extraction and symmetric-relationship deduplication, invalid input and cancellation |
| C# | .NET 8 solution builds with zero warnings; console conformance checks exercise synthetic/shared records, extension preservation, PDF parsing, unknown IDs, cancellation and text-only LLM payloads |
| Native visual smoke tests | JavaFX and Avalonia apps opened the same 12-event record, rendered snapshots and generated full-board PNG/PDF exports; generated PDF pages were rendered with Poppler and visually inspected |
| Dependency reproducibility | Clean `npm ci` and all web builds passed; `npm audit` reported zero advisories for the locked npm dependency tree at validation time |

The shared fixture has 12 events, 2 embedded original PDFs, 6 support/contradiction links, a note and a coloured fictional precedent. The source PDFs were generated specifically for this repository. A separate example embeds an original synthetic video and a derived frame with hashes and selectors. There is no customer evidence in the examples.

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
mvn -f ri/java/pom.xml install
dotnet build 'ri/c#/Ocker.sln'
dotnet run --project 'ri/c#/tests/Ocker.Core.Tests'
```

The browser configuration uses installed Chrome on macOS when available and Playwright Chromium elsewhere. It starts its own local Vite server when needed. CI repeats the web/spec, Java and C# build/test paths. Native GUI screenshots require a display and are not part of headless CI.

## Boundaries and remaining verification

- No paid provider requests were made. Replacement adapters and HTTP mocks exercised extraction/relationship flows. Each integrator still needs to verify their chosen provider's response/CORS behaviour using their own key.
- Native apps received visual startup/export checks. Every native dialog and drag gesture has not received a cross-platform manual test on macOS, Windows and Linux. Web interactions have automated coverage; host-specific native behaviour still warrants normal integration acceptance testing.
- `npm audit` is scoped to npm dependencies, not a complete audit of Maven/NuGet or legal correctness. No dependency audit can establish AI accuracy.
- GitHub Pages currently refuses hosting for this private repository on the account plan. The manual deployment workflow is present. No account upgrade or public visibility change was made. Run the client-only example locally until hosting becomes available.
- No npm/Maven Central/NuGet packages were published. Buildable package sources and local artifacts are supplied for review.
- The RIs use ordinary public text-PDF libraries. They contain no OCR, production scoring, message matching, proprietary PDF reconstruction or product prompts/assets. A read-only source/spec/fixture boundary review found no live credentials or copied protected engines.
