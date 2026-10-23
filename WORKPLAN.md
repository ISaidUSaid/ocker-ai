# Delivery register

Owner: Jenko <adam@isaidusaid.com>

The repository remains private until Adam chooses to publish it. Only this checkout may be changed.

## Scope

- Complete versioned OCKER JSON contract, schema, intermediate document schema, examples and conformance tests.
- Six RIs: `ri/js`, `ri/angular`, `ri/react`, `ri/node.js`, `ri/java`, `ri/c#`.
- Embeddable components and libraries, with fully working example apps using the same public interfaces.
- Text-PDF import → page/paragraph intermediate representation → user-configured LLM extraction → chronology → simple support/contradiction assessment.
- Import/export, source inspection, date precision, filters, zoom, relationships/web view, notes, outside-edge precedent tabs, drag/drop, responsive layout and animations. No virtualisation.
- Evidence assets can carry base64 original bytes and video-frame selectors even though PDF import remains text-only.
- Upload-your-own and preloaded fictional Joe/Jill examples. No paid provider calls without a supplied key and deliberate action.
- Apache 2.0; Jenko authorship; no proprietary scoring, matching, OCR, extraction prompts or product assets.

## Progress

- [x] Create private GitHub repository and clone locally.
- [x] Record IP boundaries and shared implementation contract.
- [x] Write and validate spec, examples and conformance corpus.
- [x] JavaScript core, PDF/LLM adapters, reusable UI and live demo.
- [x] Angular and React reusable components and runnable demos; Node backend + Angular front end.
- [x] Java library and reusable JavaFX component/application.
- [x] C# library and reusable desktop component/application.
- [x] Validate all supported builds and workflows, inspect desktop/mobile UI and audit IP boundary.
- [x] Push private repository.
- [x] Prepare live example workflow; record private Pages hosting blocker.

Do not mark a runtime verified if its toolchain or provider integration has not actually been exercised. Record any remaining gaps here.

Hosting: GitHub Pages is blocked by the private-repository account plan. Keep the repo private. Deployment workflow is ready; no paid upgrade authorised.

Validation evidence and platform limits are recorded in VALIDATION.md. Implementation commit dcd5aed is pushed to private origin/main. GitHub native jobs passed. Added passing runtime smoke coverage for all three framework examples and corrected Angular async change detection. Final CI rerun follows that fix.
