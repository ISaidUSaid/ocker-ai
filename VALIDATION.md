# Validation record — updated 29 October 2026

Author: Jenko <adam@isaidusaid.com>

This is the 0.1.0 validation history. The repository is now public; earlier dated sections describe the private development stages. Tests exercise the implementation and record contract, using mocked AI responses unless stated otherwise.

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

## Native visual and interaction alignment — 24 October 2026

The first native screenshots had functional controls but did not establish parity with the web design. JavaFX and Avalonia now use paired desktop cards around a fixed spine, serif headings, small status pills, white cards, pastel outside-edge flags, yellow pinned notes, floating dispensers and compact single-column layouts. Their example workspaces use numbered document/provider controls. `spec/PRESENTATION.md` records the shared default design; native window chrome and font rendering may differ.

Actual macOS native input verified these flows in both implementations: drag the note dispenser onto a card, type and save a note, and repeat inside a related-event modal. The saved body appeared in both the main and related views. A final C# empty-space drop cancelled without opening an editor. This review found and fixed button gesture interception, separate modal target maps, stale related cards, Java dialog stylesheet scope, incorrect note pin geometry, compact clipping and note overlays affecting card size. C# drop targeting now also checks the visible hit-tested card, so a clipped card cannot be selected through a toolbar.

Fresh desktop/compact snapshots were visually compared with the browser RI. Both native apps generated full-board PNG and PDF exports after the changes. Local evidence is intentionally ignored under `.work/`: `java-parity-delivery.png`, `csharp-parity-delivery.png`, `java-native-compact.png`, `csharp-compact-final-2.png`, `java-note-drop-verified.png`, `csharp-note-drop-final.png`, and native `*-parity-export.*` artifacts. Screenshots are review evidence, not published packages.

Final local verification: full Java Maven reactor install, eight JUnit tests with zero failures; .NET solution build with zero warnings/errors and passing shared fixture/PDF/cancellation checks. No provider selection, model configuration, record contract or browser RI implementation changed. These macOS checks do not claim exhaustive native GUI acceptance on Windows or Linux.

## Avalonia design and cork-hat branding — 24 October 2026

Adam selected Avalonia as the design reference for all six RIs. The browser demos and JavaFX now use its three numbered document/provider/review panels, teal serif headings, white paper cards and layered teal/gold chronology markers. The canonical transparent wordmark reads Ocker, with the brown hat lowered onto the O and five corks. Browser preparation copies it to each demo; Maven and .NET bundle it in example application resources. Reusable chronology components remain host-branded.

Final browser review caught and corrected missing shared stylesheet imports in the framework shells. The runtime smoke tests now check the actual styled card surface and save a newly added note through the Review panel's JSON export. Import and example controls sit in Start; provider configuration and rich paste expand only when needed; Review exposes Save JSON, PNG/PDF export, Edit OCKER file and Show code. Existing chronology toolbar exports remain available.

Validation passed after the final changes: 17 core tests, 16 specification checks, all four browser demo builds, 12 shared browser interaction tests and three framework runtime tests. The shared browser export test exercises the new Review PNG/PDF buttons against a filtered record. Java's eight tests and reactor package build passed; the .NET solution built with zero warnings/errors and its core checks passed. The Angular library and React library also built during the design pass. Angular still uses BreakpointObserver for device state.

Desktop and compact native captures were inspected, with final browser UI review in Chrome. Ignored evidence includes `.work/csharp-wordmark-desktop.png`, `csharp-wordmark-compact.png`, `java-wordmark-desktop.png`, `java-wordmark-compact.png`, `ocker-angular-final.png` and `ocker-web-final.png`. The earlier native drag/drop acceptance remains applicable because the current C# change only embeds the demo wordmark; Java retained its drag targeting and annotation mechanics while aligning layout. No real provider calls or additional Windows/Linux native GUI acceptance were performed. No ISaidUSaid.com source was changed.

## Glass card rims — 24 October 2026

Glass now paints an 8–9px frosted highlighted card rim across the browser, JavaFX and Avalonia controls, including compact and related-event cards. None retains its plain border. Card content remains opaque. Browser masking paints the rim on a non-interactive pseudo-element instead of applying a filter to the whole card, preserving note stacking. Native decoration retains the original outer border/layout insets and paints behind annotation overlays.

All four browser demo builds and 12 shared interaction tests passed. The tests check Glass/None card decoration, Glass cards in the related web, filtered PNG/PDF exports and the actual rendered pin centre against saved card-relative coordinates. Three framework runtime tests also passed with a Glass card assertion and annotation JSON round-trip. Java's eight tests and package build passed; the final .NET solution build had zero warnings/errors and its core checks passed during the native styling run. Native captures were inspected and the narrow in-app browser was visually checked; `.work/ocker-glass-cards.png` records the browser result. These checks do not add cross-platform native GUI acceptance or real provider requests.

## External SDK acceptance — 24 October 2026

The new SDK contract adds graph navigation and fluent record builders in JavaScript, Java and .NET without changing wire version 0.1.0. A headless JavaScript entry point excludes the UI renderer. Tests cover direct bidirectional relationships, filtering/deduplication, exact evidence resolution and document-asset fallback, snapshot isolation, builder order, unresolved references and embedded hash rejection. Graph navigation does not fetch external evidence URIs or call a provider.

Final local checks passed on Node 22.23.4, Java 21 and .NET 8: 21 JS tests, 16 spec checks, 11 Java tests, .NET conformance/SDK checks, 12 shared browser tests and three framework runtime tests. Native builds pass in Debug and Release with zero .NET warnings/errors. Review found that the solution previously declared Release without project mappings; those mappings are now present, and Release actually builds the projects.

Separate consumers exercise actual installed artifacts. The npm harness packs core, React and the ng-packagr Angular distribution, installs them with their own dependencies, rejects ESM resolution outside that installation, type-checks/builds React and Angular and renders both at mobile size. Each UI adds a note and receives its host callback. The headless consumer parses document text, builds a sourced event, resolves evidence, annotates and exports/imports it. Java uses a fresh private Maven repository and checks the loaded SDK JAR path, packaged schemas/prompts/licenses, annotations and JavaFX dependency compilation. .NET uses a fresh NuGet cache and source mapping which restricts Ocker packages to the newly built local feed; it resolves evidence, annotates, round-trips JSON and instantiates the Avalonia control. These consumers do not use workspace project references.

The distribution tool builds versioned npm tarballs, Maven POM/binary/source/Javadoc artifacts and NuGet packages. The private SDK archive includes the specification, public prompts, language guides, Apache-2.0 LICENSE/NOTICE, a source-commit manifest and SHA-256 checksums. The verification tool checks every manifest entry. The manual GitHub workflow prepares a private Actions artifact; it does not publish to registries or change visibility. See [distribution instructions](DISTRIBUTION.md) for installation, compatibility and reproduction commands.

The three SDK workers have finished. All writes remain in this repository. Real provider acceptance, additional native Windows/Linux visual acceptance and public package publication remain outside this handoff; earlier limitations still apply.

## App icons and first-run guidance — 26 October 2026

The accepted cork-hat wordmark remains in all six application headers. A transparent square O/hat icon is now copied by the four web build pipelines and embedded in the JavaFX and Avalonia example resources. Browser favicon and touch-icon URLs use that asset; native example windows load it explicitly. Reusable chronology controls keep their host's branding.

All four browser builds passed. Thirteen shared browser tests and three framework runtime tests passed, covering icon responses, document confirmation/removal, provider guidance, examples without credentials, mobile notes, drag/drop pin coordinates, relationships, JSON editing and filtered PNG/PDF exports. The setup regression caught a redundant connect-provider button after example loading, which was corrected. Java's eleven tests and package build passed; its example JAR contains both brand images. The .NET solution build passed with zero warnings/errors and its core checks passed. Native screenshots and the running browser example were inspected. Existing Angular CommonJS optimisation warnings remain; one development ResizeObserver notification occurred in the first browser run, while the final run passed without it.

These changes simplify the existing apps; they do not add signed installers or bundled models. Provider model selection and credential persistence are unchanged. No real provider requests or additional Windows/Linux native visual acceptance were performed. The Java, C# and framework workers are finished. All writes stayed inside Ocker; no ISaidUSaid.com source was changed.

## Public website and language release — 29 October 2026

The repository is public and https://ocker.ai serves the static website plus the client-only JavaScript demo on a Heroku Basic dyno. DNSimple handles the apex/www records and Heroku ACM has issued both certificates. No original ISaidUSaid.com source was changed.

The website has English, Spanish, Portuguese, French and German pages, browser-language selection, an explicit language selector, localised sponsor links, and localised specification landing pages. The shared prompt library now lives in `prompt-library/{en,es,pt,fr,de}/`; each RI build prepares its resources. Wire-format keys stay stable while the selected language controls AI instructions. Browser language changes preserve the loaded record, annotations and in-memory provider settings without a reload.

Visual QA covered the live site at 390/768/1440 pixels in all five languages and the release candidate at 320/390/768/1024/1440 pixels. Checks included page overflow, image loading, console errors, navigation, language selection, specification/demo links and licence downloads. The final narrow German and iPad layouts were inspected after fixing sponsor wrapping, long miniature-card labels, the placeholder hat, the freedom icon and the header tagline spacing. CSS/script content hashes prevent stale assets after a release.

Core validation: 26 JavaScript tests and 16 specification checks pass. The website build, five-language content checks and HTTP server integration checks pass. Native Maven/.NET builds and installed-package consumers were verified during this release. Paid AI calls were not made; provider and chronology-building behaviour uses controlled responses in automated tests.

Release regression checks also passed: all 14 shared browser scenarios (12 in the full run, followed by successful targeted reruns of two corrected accessible-label selectors), all three Angular/React/Node framework scenarios, and installed web SDK consumer acceptance. The real Docling PDF import has a scoped 180-second import allowance for its initial model download; normal UI assertions retain their short timeouts. Desktop drag/drop is checked at 1280×900 and compact annotation behaviour at 390×844.

The release CI also exposed stale Java consumer assertions for the pre-localisation `extract.txt` and `relate.txt` resources. The installed-package check now loads both prompts for all five locales from `prompts.json`, and performs a clean install so old build resources cannot mask packaging errors. The clean Java consumer run passed on 29 October 2026.
