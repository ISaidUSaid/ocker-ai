# Java / JavaFX

Apache-2.0 · Jenko <adam@isaidusaid.com>

Java 21 and Maven are required. The modules are `ocker-core` (portable records and processing), `ocker-javafx` (reusable `ChronologyView`) and `ocker-example` (the native host application).

From the repository root:

```sh
mvn -f ri/java/pom.xml install
mvn -f ri/java/ocker-example/pom.xml javafx:run
mvn -f ri/java/pom.xml test
```

Open a saved OCKER file, or queue ordinary text PDFs with their document kind. Enter a provider endpoint, model and key, then approve sending text before building. Settings stay in memory. A failed or cancelled operation leaves the displayed record unchanged. The application supports source excerpts/original downloads, filters, zoom, note pins, outside-edge coloured authorities, a related-account web and PNG/PDF export.

```java
var options = OckerOptions.builder()
    .llm(new OpenAICompatibleAdapter(endpoint, model, key))
    .cancellation(() -> cancelled.get())
    .onProgress(progress -> showProgress(progress))
    .build();
var document = Ocker.parsePdf(path, documentId, title, "affidavit", options);
var record = Ocker.buildChronology(Ocker.createRecord("Matter chronology"), document, options);
record = Ocker.findRelationships(record, options);

var view = new ChronologyView(record, ChronologyViewOptions.builder()
    .theme(ChronologyViewOptions.Theme.GLASS) // NONE is plain, without owner blur
    .animate(true)
    .onChange(next -> saveInHost(next))
    .onError(error -> reportInHost(error))
    .build());
```

`CompletionAdapter` is replaceable. PDF import uses ordinary PDFBox text extraction, without OCR. JSON import/export checks the shared schema, references and embedded byte hashes. `parseIntermediate` / `exportIntermediate` preserve reviewable PDF paragraphs and the source asset. Sources and attributed accounts are separate from legal findings.

Style `ChronologyView` with JavaFX stylesheets and its `-ocker-*` looked-up colours. Compact layout follows control width; all cards remain mounted. JavaFX UI work belongs on the application thread; the example runs parsing/provider operations on a worker.

For a reproducible native smoke test, the example accepts `--record=/absolute/file.ocker.json`, `--snapshot=/absolute/preview.png` and optional `--export-prefix=/absolute/export`. Pass these through the Maven plugin's `-Djavafx.args` property. No key is needed for reading the sample.

Artifacts are installed locally by Maven; this repository does not publish to Maven Central.
