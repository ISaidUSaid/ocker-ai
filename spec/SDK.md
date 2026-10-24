# SDK integration contract

Author: Jenko <adam@isaidusaid.com> · Apache-2.0

The SDK model and UI are independent integration paths. Importing, validating, navigating, annotating and rendering an existing chronology needs no LLM, API key, demo application or application server.

## Graph navigation

Create a graph from a validated, independent snapshot of an OCKER record. Its indexes are conveniences over the portable IDs; they do not add cycles or fields to exported JSON. Rebuild the graph when the host changes its record. Returned model values must not expose mutable graph state; use copies or immutable values as appropriate to the runtime.

The graph provides `getRecord`, `getEvent`, `getDocument`, `getActor`, `getAsset`, `getRelationships`, `getRelatedEvents`, `getNotes`, `getAuthorities` and `getEvidence` (idiomatic PascalCase in .NET). Entity lookups return an absent result for an unknown ID. Event-scoped queries reject an unknown event ID. Relationship queries optionally filter `supports` or `contradicts`, traverse both ends and return each directly related event once, in record order. They do not imply transitive relationships.

Each resolved evidence item contains the original source locator, its document, an optional paragraph and an optional asset. Resolve the asset from `source.assetId`, falling back to `document.assetId`. Preserve source order and exact text. External asset URIs remain references: graph queries never fetch them.

## Record building

Provide a fluent record builder starting from a title or an existing record. Methods add an actor, asset, document, event, relationship, note, authority or a complete intermediate document plus its source asset. Entities use the existing public model types. Adding entities can occur in any order; `build` validates the complete record, including references and embedded asset integrity, then returns an independent snapshot. Invalid builds throw the runtime's normal validation exception. No builder operation mutates the original record or calls a provider.

The JSON format/version remains 0.1.0. SDK conveniences are not new wire fields. Graph and builder helpers do not own persistence, authentication, provider credentials or UI state.

## Consumer acceptance

Test built distribution artifacts in standalone consumer projects with their own dependency installation, not source aliases or workspace links. Verify headless import/navigation/build/annotation/export, schema and prompt resources, and UI package compilation/rendering. Consumer checks must verify that SDK resolution points to the installed artifact and must not silently fall back to the checkout's source or dependencies. Keep disposable consumer files under `.work/` in this repository; dependencies and resources are consumed from packaged artifacts.

Distribution must include Apache-2.0 licensing, authorship, supported runtime versions, exact install instructions and reproducible checksums. Preparing a private distribution does not publish packages to public registries or change repository visibility.
