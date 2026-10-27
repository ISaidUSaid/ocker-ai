# OCKER 0.1.0

**Open Chronology, Knowledge and Evidence Record**

Author: Jenko <adam@isaidusaid.com> · Apache-2.0 · Draft 0.1.0

OCKER is a portable record of attributed chronology accounts, their source evidence, simple relationships, practitioner notes and legal-authority references. It is intended for interchange between independent products. A record can be read, displayed and exported without an AI service or access to its originating application.

The normative schemas are [ocker.schema.json](ocker.schema.json) and [document.schema.json](document.schema.json). They use [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12). The additional semantic rules below are normative too; a JSON Schema validator alone cannot check cross-references or evidence hashes. The schema `$id` is an identifier. Readers do not have to contact that URL.

## 1. Conformance and terminology

**MUST**, **MUST NOT**, **SHOULD** and **MAY** express requirements. A producer writes a record; a consumer reads one; an editor modifies one. A conforming 0.1.0 producer writes valid UTF-8 JSON satisfying both the schema and semantic rules. A conforming consumer rejects unsupported major versions, reports invalid records, and never quietly repairs source evidence or invents a value to make a record valid.

OCKER distinguishes an **account** from the **occurrence it describes**. Two event entries may describe opposing accounts of the same occurrence. Their relationship is an attributed assessment; neither the presence of a link nor the use of an AI service establishes truth, admissibility or a court finding.

Media type: `application/vnd.ocker+json`. Recommended extension: `.ocker.json`. Intermediate documents use `.document.json`. An OCKER file contains one record, not a stream of partial patches. IDs are case-sensitive opaque strings and are not database access credentials.

Profiles:

- **Core record:** portable entities, references and metadata; evidence may be embedded or explicitly external.
- **Self-contained record:** every asset has verified embedded `data`. This is the preferred exchange profile when the recipient should be able to inspect the evidence offline.
- **Linked record:** at least one asset relies on a `uri`. The viewer must label unavailable external evidence and must not imply that all evidence was included.

The RI accepts core records, emits embedded original PDFs when it builds a chronology, and preserves linked assets without fetching them automatically. ZIP/container packaging and digital signatures are intentionally not specified in 0.1.0; applications may add them in namespaced extensions.

## 2. Root record

| Property | Meaning |
|---|---|
| `format` | Constant `ocker` |
| `version` | Constant `0.1.0`; the wire contract version, not an extraction-model version |
| `id`, `title` | Stable record identifier and human-readable title |
| `createdAt`, `updatedAt` | ISO 8601 date-times with a UTC designator or explicit offset |
| `actors` | Identified people or organisations, including authors of annotations |
| `documents` | Imported affidavits, orders or reports and their retained text paragraphs |
| `events` | Attributed, source-linked chronology accounts |
| `relationships` | Support/contradiction assessments between event accounts |
| `notes` | Human annotations separate from source evidence |
| `authorities` | Human-supplied precedent/reference tabs attached to event accounts |
| `assets` | Original or derived evidence bytes and integrity metadata |
| `extensions` | Optional application-owned metadata |

All arrays are present, even when empty. Every top-level entity ID MUST be unique across the record. Paragraph IDs MUST be unique within their own document; a paragraph is resolved by `(documentId, paragraphId)`. All event, actor, document and asset references MUST resolve within the record. Copying an entity between records requires copying its dependencies or assigning new references.

A consumer MUST preserve unrecognised extension content when it exports an otherwise compatible record. Unknown properties outside `extensions` are invalid in 0.1.0. Extension keys SHOULD use a controlled namespace, for example `example.com/matter`. Extensions MUST NOT override the meaning of core properties.

Arrays do not establish chronology order. Consumers SHOULD sort known dates chronologically, retain stable order for equal dates and put unknown dates separately or at the end. Filtering and layout are view state, not deletion of the underlying record.

## 3. Documents and intermediate artifacts

A document has `id`, `title`, `kind` (`affidavit`, `order`, `report`) and `paragraphs`. Optional `author` is the source author name; `assetId` identifies the original file. A paragraph has `id`, one-based `page`, optional source `label`, and exact extracted `text`. A label is not an array offset and may be a printed paragraph number.

An intermediate object has `format: "ocker-document"`, `version: "0.1.0"`, one `document` and an optional `asset`. It is a reviewable boundary between document text extraction and chronology generation. Its document asset reference, when supplied, MUST resolve to the included asset. An extractor must not label its own AI summary as extracted source text.

The RIs import PDF, DOCX, RTF and plain text; browser examples also accept rich-text/HTML paste without executing its markup. Non-PDF text uses logical page 1 rather than invented word-processor pagination. PDF conversion uses Docling's structured JSON output: browser RIs run the Docling worker locally and Node, Java and C# use Docling Serve. Producers retain the original PDF as the asset and create page-attributed paragraphs from the returned document tree, including text nested under pictures and table-cell text where present. Encrypted, malformed or unreadable PDFs may be rejected. These implementation details do not restrict OCKER files created by other capable producers.

## 4. Dates

An event's required `date` object has `precision` and optional `value`, `end`, `approximate`, `basis`.

| Precision | `value` | `end` |
|---|---|---|
| `year` | `YYYY` | Omit |
| `month` | `YYYY-MM` | Omit |
| `day` | Calendar-valid `YYYY-MM-DD` | Omit |
| `range` | Calendar-valid start day | Calendar-valid end day, not before start |
| `unknown` | Omit | Omit |

`approximate` means the source itself or the producer's identified interpretation is approximate. `basis` describes that interpretation, such as an explicit source date or an inference from a surrounding passage. It is not another date value. Year/month precision MUST NOT be exported as an invented first day of a month or year.

Occurrence dates are civil dates, not midnight timestamps. Source/capture and audit timestamps are separate. 0.1.0 does not encode timed occurrences with competing timezones; producers needing that detail should retain it in source evidence and a documented extension rather than silently convert it into a different calendar date.

## 5. Events and source selectors

An event requires `id`, `title`, `summary`, `date` and `sources`. Optional `assertedBy` describes whose account is recorded; `actorIds` holds resolvable actor IDs. `status` is `alleged`, `agreed`, `disputed` or `unresolved`. These are the producer's account classifications, not legal determinations. `narrative` is a human-readable grouping label, not a new source.

Every source has `documentId` and may have `paragraphId`, one-based `page`, exact `quote`, `assetId` and `selector`. A cited paragraph and page MUST exist in that document. When a paragraph and quote are supplied, the quote MUST be an exact substring of the paragraph text. A consumer must not reconstruct a missing quote using an LLM. Original sources remain separate from summaries, annotations and relationship rationales.

A selector has `kind`, optional `start`, `end`, `page`:

- `text`: zero-based character offsets in the selected paragraph's Unicode text; producers should document non-BMP offset conventions in extensions when interoperating with UTF-16 hosts.
- `page`: one-based page in the cited document/asset.
- `time`: non-negative start/end milliseconds in the referenced media's timebase.
- `frame`: non-negative zero-based frame indices in the referenced video.

An end position MUST NOT precede its start. A selector identifies a location, not a second copy of the evidence. Video-frame image assets can identify their parent video via `derivedFrom` and retain the parent's time/frame selector. Frames are derivative evidence, not original videos. A parent asset reference MUST resolve; derivation chains MUST NOT contain cycles.

## 6. Relationships

A relationship requires `id`, `from`, `to`, `type`, `rationale`, `provenance` and may include its own `sources`.

- `supports`: one account provides direct corroboration of the same material proposition.
- `contradicts`: the accounts give incompatible accounts of the same material proposition.

Endpoints are different existing event IDs. The two types are symmetric in 0.1.0, so reversing endpoints does not create a second distinct relationship of the same type. A producer MUST NOT create duplicate unordered endpoint/type tuples. The same pair may carry different attributed assessments, but must explain them in the rationale and extensions if required; it cannot duplicate an identical type tuple.

`provenance.method` is `llm`, `human` or `imported`; `createdAt` is required; `authorId`, if present, resolves to an actor. A rationale is required and describes why the accounts were linked. Lack of corroboration alone is not a contradiction. The RIs do not implement behavioural scoring, message matching or other relationship categories.

## 7. Notes and authorities

A note has an event target, plain-text `body`, creator/time metadata and `position: {x,y}`. These coordinates are unscaled CSS-pixel offsets from the event's outer rectangle to the note's **pin**. They are not percentages, content-pane offsets or viewport positions. An editor must transform the pin through current zoom when dragging. Dropping into empty space must leave the previous record unchanged. Implementations may offer a non-drag keyboard/mobile alternative.

An authority has an event target, `title`, `citation`, `type` (`binding`, `persuasive`, `unspecified`) and `color` (`blue`, `lavender`, `mint`, `peach`, `slate`), plus optional `pinpoint`, `court`, `jurisdiction`, HTTP(S) `sourceUrl` and plain-text application `body`. The type is the annotation author's classification; applications should retain the relevant jurisdiction and reasoning rather than imply universal binding effect.

Both annotation types require `createdAt`, `updatedAt`; an update must not predate creation. Optional `authorId` resolves to an actor. Neither type is original source evidence. Editors must preserve that distinction when rendering and exporting. Precedent tab position is derived from the target card's outside edge; it does not depend on the pixel at which the user dropped the dispenser.

The browser RI uses a small mobile note marker and a notes dialog; desktop notes use a visible pin and dispensers. All record entries remain in the DOM. There is no sliding window, virtualisation or lazy card loading.

## 8. Evidence integrity and linked content

Assets require `id`, `name`, `mediaType`, lowercase hexadecimal `sha256`, `byteLength` and at least `data` or `uri`. `data` is standard padded RFC 4648 base64, without a `data:` prefix. The digest is SHA-256 over decoded bytes, not over the base64 text, a storage ETag or a rendered preview. Byte length also refers to decoded bytes. Consumers MUST verify both before presenting embedded bytes as intact evidence.

A matching digest establishes consistency with the supplied digest, not authenticity, acquisition history or truth. OCKER 0.1.0 does not claim a signature or chain-of-custody guarantee. Producers can preserve richer source/capture provenance in an extension without inventing missing information.

A URI is an explicit external dependency. Consumers MUST NOT silently fetch it. A host may provide an `assetResolver`; the UI can invoke it following a deliberate user action and must verify the returned bytes against the same hash and length before use. Applications should restrict which schemes/origins they allow and keep resolver credentials out of exported JSON.

## 9. AI adapters and callbacks

An LLM is optional. It can generate proposed chronology events and proposed support/contradiction links from ordinary text. It is not needed for reading, viewing, annotating or exporting a saved OCKER record.

RIs expose configurable adapter interfaces, options objects and progress/cancellation hooks. The built-in HTTP adapter targets user-configured OpenAI-compatible chat-completion endpoints. Endpoint, model, API key and provider-specific headers are runtime configuration, never record properties. Hosts can replace this adapter entirely. Browser use requires the selected provider to permit direct browser requests; the Node RI offers the backend alternative.

Public extraction prompts are small and purpose-built for the RI. Source paragraph IDs returned by an LLM MUST be checked against supplied text. Unknown IDs, unsupported relationship types and malformed responses must be rejected before changes are committed. Cancellation leaves the previous record intact. The specification does not require or disclose a particular product's extraction pipeline, ontology, scoring algorithm, cache, search vectors or proprietary prompts.

## 10. Presentation, themes and accessibility

Core data must not depend on a CSS framework. Browser components use semantic controls, plain text rendering and `--ocker-*` properties. `theme: "glass"` gives dialogs a translucent border and blurred backdrop; `theme: "none"` gives plain opaque dialogs. Colours/fonts/spacing are separately overridable through theme variables/options or host CSS. JavaFX and Avalonia expose the equivalent typed options and palette hooks.

Keyboard input within fields belongs to those fields; card activation shortcuts only apply when the card itself is focused. Dialogs keep focus inside, have labelled headings and a close action. Related-event dialogs do not close on an accidental backdrop click. Motion should respect the operating system's reduced-motion preference. Mobile variants provide explicit add-note/add-precedent controls instead of relying on drag gestures.

JSON export retains the whole record. PNG/PDF visual exports reflect the selected filters and zoom and preserve annotations and theme. A visual export is not a substitute for an evidence-complete OCKER JSON export.

## 11. Evolution

0.1.0 is a draft contract. A major version changes incompatible core semantics; a minor version adds a compatible capability under a defined profile; a patch fixes documentation or validation without silently changing meaning. Consumers must not interpret unknown versions as 0.1.0. Experimental fields belong in namespaced extensions until standardised.

Before a release, run the schema/semantic conformance corpus and round-trip the shared examples through every RI. Release notes must distinguish implemented, compiled, tested and manually inspected features. The current publication state and validation commands are recorded in the repository root.
