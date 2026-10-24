# OCKER Java SDK and JavaFX view

Apache-2.0 · Jenko <adam@isaidusaid.com>

The Java reference implementation requires Java 21 and Maven. `ocker-core` is a headless SDK for portable OCKER 0.1.0 records. `ocker-javafx` adds the reusable JavaFX 21 `ChronologyView`; hosts retain ownership of storage, credentials, provider selection, authentication and branding. The SDK never calls a provider while importing, validating, constructing a record with the fluent builder, navigating or annotating a record.

Build private Maven artifacts, including source and Javadoc JARs, into a chosen local repository:

```sh
mvn -Dmaven.repo.local="$PWD/.work/m2" -f ri/java/pom.xml install
```

For the extracted SDK bundle, this minimal consumer `pom.xml` uses its Maven directory. Replace `/absolute/path/to/ocker-ai-sdk-0.1.0` with your extraction path. Omit the JavaFX dependency for a headless application:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId><artifactId>chronology-host</artifactId><version>1.0.0</version>
  <properties><maven.compiler.release>21</maven.compiler.release></properties>
  <repositories><repository>
    <id>ocker-private</id>
    <url>file:///absolute/path/to/ocker-ai-sdk-0.1.0/maven</url>
  </repository></repositories>
  <dependencies>
    <dependency><groupId>com.ocker</groupId><artifactId>ocker-core</artifactId><version>0.1.0</version></dependency>
    <dependency><groupId>com.ocker</groupId><artifactId>ocker-javafx</artifactId><version>0.1.0</version></dependency>
  </dependencies>
  <build><plugins><plugin>
    <artifactId>maven-compiler-plugin</artifactId><version>3.13.0</version>
  </plugin></plugins></build>
</project>
```

Alternatively, after building sources locally, point Maven at the installed repository with `-Dmaven.repo.local=/absolute/path/to/.work/m2`. The installed `ocker-core` JAR contains the shared schemas, prompts, `LICENSE` and `NOTICE`; its SHA-256 can be reproduced with `shasum -a 256 .work/m2/com/ocker/ocker-core/0.1.0/ocker-core-0.1.0.jar`.

## Headless SDK

```java
var record = Ocker.importRecord(json);              // strict schema, refs and asset hashes
var graph = Ocker.graph(record);                    // validated independent snapshot
var related = graph.getRelatedEvents(eventId, "supports");
var evidence = graph.getEvidence(eventId);          // source, document, paragraph, resolved asset

var next = Ocker.recordBuilder(record)
    .addNote(note)
    .build();                                       // validates only when complete
var exported = Ocker.exportRecord(next);
```

`OckerGraph` resolves direct relationships from either endpoint, de-duplicates related events in record order, and supports the `supports` and `contradicts` filters. Unknown entity lookups return `Optional.empty`; event-scoped graph queries reject unknown event IDs. Evidence preserves source order and exact source text. It uses `source.assetId` first, then falls back to `document.assetId`, and never fetches an external URI.

`OckerRecordBuilder.create(title)` and `OckerRecordBuilder.from(record)` add the public model types: actors, assets, documents, events, relationships, notes, authorities, or complete intermediate documents. Add in any order. `build()` validates strict references and embedded asset hashes and returns an independent snapshot without mutating the input.

## JavaFX

JavaFX 21 is required at runtime for `ocker-javafx`:

```java
var view = new ChronologyView(record, ChronologyViewOptions.builder()
    .theme(ChronologyViewOptions.Theme.GLASS)
    .onChange(next -> saveInHost(next))
    .onError(error -> reportInHost(error))
    .build());
```

The view is an independent native control. Keep JavaFX work on the application thread. The example host demonstrates normal text-PDF, TXT, RTF and DOCX import, selected-provider extraction, related-account assessment, source evidence, notes, authorities, JSON editing and PNG/PDF export. PDF extraction uses PDFBox text only; image-only PDFs are rejected without OCR.

Run the example after local installation:

```sh
mvn -Dmaven.repo.local="$PWD/.work/m2" -f ri/java/ocker-example/pom.xml javafx:run
```

The example accepts `--record=/absolute/file.ocker.json`, `--snapshot=/absolute/preview.png`, `--theme=none` and `--export-prefix=/absolute/export` through `-Djavafx.args`. It keeps provider keys in memory and excludes them from OCKER exports.

Validate the reactor and the built-artifact consumer separately:

```sh
mvn -Dmaven.repo.local="$PWD/.work/m2" -f ri/java/pom.xml test
tools/consumer-tests/java/run.sh
```

The consumer script uses `mvn` from PATH; set `MAVEN_BIN` to another installed Maven executable if required. It copies only the test fixture and consumer source into `.work/consumer-java`, installs the SDK JARs/POMs into a fresh `.work/consumer-m2`, and compiles the consumer against those JARs. No reactor source dependency is used.
