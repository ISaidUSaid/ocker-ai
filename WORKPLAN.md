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

Validation evidence and platform limits are recorded in VALIDATION.md. Implementation commit `6db6cebc617c94f5063c4a5cbf898490830bec15` is pushed to private origin/main and passed all GitHub CI jobs (web, Java and C#): https://github.com/ISaidUSaid/ocker-ai/actions/runs/40017749018. All implementation/review workers have finished. The remaining hosting decision and cross-platform acceptance limits are recorded in VALIDATION.md.

## Follow-up — 24 October 2026

- [x] Central public prompt library with build-time copying for all runtimes.
- [x] Clear LLM-first import flow, document type popup, PDF/DOCX/RTF/text/rich paste.
- [x] Glass/compact hover fixes; Show code and validated colour-coded OCKER editor in all RIs.
- [x] Original Joe/Jill test documents and verified production-derived sample with fresh annotations/common ground.
- [x] Provider shortcuts, notices and a single atomic Build action including relationships; advanced fields disclosed separately.
- [x] Java/C#/web workers finished. Shared/browser/framework/native builds and proportionate tests pass.

Naming remains unchanged. Adam ruled COBBER out because of existing software businesses and Australian marks 2255706 (class9) and 2369208 (classes9/42). OCKER remains the working name; Docker resemblance needs focused trademark assessment before public branding. `cobber.ai` is taken; Adam was comfortable with a path on isaidusaid.com, but that does not resolve the naming conflict. No domain, repository name, visibility or original product files were changed. Public hosting remains the existing separate blocker for the private GitHub plan.

## Private draft handoff — 24 October 2026

Adam confirmed that OCKER stays as the working title after the ChronoMate availability review. No rename is planned for this draft.

- [x] Reconcile the final delivery notes with the implemented document formats and combined example Build flow.
- [x] Verify that local HEAD matches origin/main and the web, Java and C# CI jobs all succeeded for the implementation commit above.
- [x] Keep the repository private, Apache-2.0 licensed and authored by Jenko.

The private draft implementation is complete. The outstanding live-example hosting decision, real-provider acceptance with a supplied key and cross-platform native GUI acceptance are explicitly separate from the completed automated build/test baseline. No account upgrade, public visibility change or package publication has been authorised or performed.

## Native visual parity — 24 October 2026

Adam requires the native RIs to share the web RI's visual design and drag/drop experience. The earlier native build/startup checks did not establish that parity; the first screenshots showed conventional desktop controls and a single-column board. This supersedes the visual-completion assumption in the handoff above.

- [x] Record the common design and interaction contract in `spec/PRESENTATION.md`.
- [x] Align JavaFX chronology, annotations, dialogs and example workspace with the web RI.
- [x] Align Avalonia chronology, annotations, dialogs and example workspace with the web RI.
- [x] Review new desktop/compact screenshots, exercise annotation dragging and verify builds/exports.

Java and C# workers completed their separate native implementations; the parent reviewed screenshots, corrected final dialog/layout/hit-test issues and exercised real native input on macOS. Both main boards and related-card modals accepted a pad drop, saved entered text and rendered the note. C# also passed a final invalid-drop check. Both native PNG/PDF exporters ran successfully after the changes. Java's full reactor install and eight tests passed; the .NET solution/core checks passed with zero warnings/errors. See VALIDATION.md for the precise scope. Browser RI code and original ISaidUSaid.com repositories were left unchanged. No workers remain active.

## Avalonia as the visual reference — 24 October 2026

Adam selected Avalonia's design for all six RIs, superseding the earlier web-first visual direction. Use the three numbered document/provider/review panels, teal serif headings, quiet paper surfaces and the same chronology interaction. The canonical transparent Ocker wordmark has lowercase `cker`, a brown hat worn by the O and five corks, including one in the middle. Branding belongs to demo shells, leaving reusable components host-controlled.

- [x] Generate and save the revised cork-hat wordmark with its prompt provenance.
- [x] Update the shared presentation contract to name Avalonia as the visual reference.
- [x] Complete all browser/native integrations and compare desktop/compact views.
- [x] Verify affected builds and interactions; prepare the private repository push.

The Java, C# and web workers finished. Parent review corrected the framework stylesheet imports, compacted the browser document controls, moved import/example paths to Start, and added shared Review save/export controls. All changes remain inside this checkout. The existing private-hosting and cross-platform GUI acceptance limits remain unchanged; no approval is pending for this local/private implementation.
