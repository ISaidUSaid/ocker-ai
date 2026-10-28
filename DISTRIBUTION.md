# Installing the Ocker SDK

Author: Jenko <adam@isaidusaid.com> · Apache-2.0

The SDK can be used as a headless object model, an optional document/LLM pipeline, an embeddable UI, or any combination. Loading, navigating, editing and displaying an existing chronology requires no LLM or API key. The embedding application owns persistence, authentication and provider policy.

## Private distribution

Packages are currently supplied in `ocker-ai-sdk-0.1.0.tar.gz`, not public registries. The bundle contains `npm/` tarballs, a `maven/` repository, `nuget/` packages, the specification, public prompts, integration guides, `LICENSE`, `NOTICE`, `MANIFEST.json` and `SHA256SUMS`. A web-only bundle contains only the npm packages and common documentation. No registry credentials are needed to build or use the private artifacts; ordinary third-party dependencies still need an accessible package source or cache.

Verify the archive before extracting, then verify its contents:

```sh
shasum -a 256 -c ocker-ai-sdk-0.1.0.tar.gz.sha256
tar -xzf ocker-ai-sdk-0.1.0.tar.gz
cd ocker-ai-sdk-0.1.0
shasum -a 256 -c SHA256SUMS
```

On systems with GNU coreutils, `sha256sum -c` is equivalent. Checksums detect changed downloads; they are not a publisher signature. Check `sourceCommit` and `sourceTreeDirty` in the manifest when assessing provenance.

## JavaScript / Node

From your own application, install the tarball using its extracted absolute path:

```sh
npm install /path/to/ocker-ai-sdk-0.1.0/npm/ocker-ai-core-0.1.0.tgz
```

```js
import {parseRecord, createGraph, recordBuilder, exportRecord} from '@ocker-ai/core/headless';

const record = parseRecord(ockerJson);
const graph = createGraph(record);
const event = graph.getEvent(record.events[0]?.id);
if (event) {
  const related = graph.getRelatedEvents(event.id);
  const evidence = graph.getEvidence(event.id);
  // evidence entries resolve the source locator, document, paragraph and asset.
}
const next = recordBuilder(record).addActor({id: 'practitioner', name: 'Practitioner'}).build();
const json = exportRecord(next);
```

The `headless` entry point imports no UI renderer. Entity lookups return `undefined` for missing IDs; event-scoped queries reject missing events. Results are independent copies. Rebuild the graph after applying changes. IDs remain the portable relationship representation; graph helpers do not add cyclic references to JSON.

## Web UI

For plain JavaScript, import `mountChronology` from `@ocker-ai/core` and its `styles.css`. For framework applications, install the core tarball and the matching framework tarball in the same command so npm can satisfy their peer dependency locally:

```sh
npm install /path/to/npm/ocker-ai-core-0.1.0.tgz /path/to/npm/ocker-ai-react-0.1.0.tgz
# Or: the core tarball plus ocker-ai-angular-0.1.0.tgz
```

See `spec/INTEGRATION.md` and the language guides for complete hosts, CSS imports, callbacks and disposal. Angular is packaged from ng-packagr's `ri/angular/dist`, not its source workspace. The reusable components contain no Ocker header, provider form or demo document loader.

## Java

Add a Maven repository pointing to the extracted `maven/` directory (or serve that directory from your private artifact server), then depend on `com.ocker:ocker-core:0.1.0`. Add `com.ocker:ocker-javafx:0.1.0` only if you need the UI. The bundle includes the parent POM, dependency metadata, source and Javadoc JARs. Third-party Maven dependencies continue to resolve from your configured repositories. See `ri/java/README.md` for the complete POM and code.

## C# / .NET

Add the extracted `nuget/` directory as a local package source, alongside NuGet.org for public dependencies:

```sh
dotnet nuget add source /path/to/ocker-ai-sdk-0.1.0/nuget --name OckerPrivate
dotnet add package Ocker.AI.Core --version 0.1.0
# For the native UI:
dotnet add package Ocker.AI.Avalonia --version 0.1.0
```

For shared projects, prefer a repository-local `NuGet.Config` with source mapping for `Ocker.AI.*` rather than changing machine-wide settings. `OckerGraph` and `OckerRecordBuilder` live in Core; Avalonia is optional. See the C# guide for complete code.

## Compatibility and acceptance

| Component | Current integration baseline |
|---|---|
| JavaScript / Node | ESM, TypeScript declarations, Node 22.22.3+; browser host needs modern ES modules and a bundler for bare npm imports |
| Angular | Angular/CDK/animations 22; tested 22.2.3 with TypeScript 6 |
| React | Peer range 18+, consumer acceptance currently exercises React 19; other major versions are not acceptance-tested |
| Java core / JavaFX | Java 21; JavaFX 21.0.5 for UI |
| .NET core / Avalonia | .NET 8; Avalonia 11.3.0 for UI |

Native GUI acceptance has been exercised on macOS. Windows/Linux native visual acceptance and real-provider acceptance remain host integration checks. A browser provider must permit CORS; a backend adapter can keep credentials on the server. Importing saved records makes no provider call.

## Building distributions from this repository

Install npm dependencies, Java 21/Maven, .NET 8 and `tar`, then run:

```sh
npm ci
npm run sdk:distribution
# Browser packages only:
npm run sdk:distribution:web
```

Outputs go under `.work/distribution/`. `MAVEN_BIN`, `MAVEN_REPO_LOCAL` and `DOTNET_BIN` can select installed toolchains. `--skip-build` is intended only for packaging already-built matching artifacts; NuGet packages are still produced from their projects. `sdk:distribution` builds packages but does not run the browser consumer suite. Run the documented consumer checks or the CI workflow before distributing a release.

The manual SDK distribution workflow uploads a GitHub Actions artifact. Release bundles may also be attached to GitHub releases. This workflow does not publish to npm, Maven Central or NuGet.org; registry publication requires verified package ownership and credentials. All original code and specification sources are available under Apache 2.0.
