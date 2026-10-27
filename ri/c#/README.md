# C# / Avalonia

Apache-2.0 · Jenko <adam@isaidusaid.com>

.NET 8 supplies `Ocker.Core` (records, schema validation, Docling Serve PDF import and replaceable LLM operations), `Ocker.Avalonia` (reusable native `ChronologyView`) and `Ocker.Desktop` (the cross-platform example).

From the repository root:

```sh
dotnet build 'ri/c#/Ocker.sln'
dotnet run --project 'ri/c#/src/Ocker.Desktop'
dotnet run --project 'ri/c#/tests/Ocker.Core.Tests'
```

Open a saved record or queue PDF, DOCX, RTF and plain-text documents. PDF import sends the original file to [Docling Serve](https://github.com/docling-project/docling-serve), which performs OCR and returns its structured JSON; the SDK retains page-specific text, picture-child text, table cells and the original PDF asset/hash. The example has in-memory provider and Docling endpoint settings, a connection test, document kinds, progress/cancellation, source excerpts and original evidence download, editable notes, outside-edge coloured precedents, related-event cards and PNG/PDF export. Compact mode follows window width; the reusable view can also receive explicit `Mobile` state. All cards remain mounted.

The default presentation follows the [shared browser/native design](../../spec/PRESENTATION.md): paired desktop cards, compact single-column layout, pinned paper notes and outside precedent flags. Main and related-card boards each have their own drag target context. Drop the red pin inside a visible card; empty-space drops cancel. Compact cards offer explicit annotation actions.

```csharp
using var docling = new DoclingServeClient(new DoclingServeOptions {
    BaseUrl = new Uri("http://localhost:5001"), // configurable; this is the default
    Timeout = TimeSpan.FromMinutes(2)
});
await docling.TestConnectionAsync(cancellationToken);

var work = new OckerOptions {
    CompletionAdapter = new OpenAiCompatibleAdapter(httpClient, endpoint, model, key),
    DoclingServe = docling,
    OnProgress = progress => ShowProgress(progress)
};
var intermediate = await Ocker.ParsePdfAsync(stream, documentId, title, "affidavit",
    options: work, cancellationToken: cancellationToken);
var events = await Ocker.BuildChronologyAsync(intermediate, work, cancellationToken);
// The host adds the returned document/asset/events to its record transaction.
var view = new ChronologyView {
    Record = record,
    Options = new ChronologyViewOptions {
        Theme = "glass", // "none" removes the translucent border and owner blur
        Animate = true,
        OnChange = next => SaveInHost(next),
        OnError = error => ShowError(error)
    }
};
```

`IOckerCompletionAdapter` is replaceable. `ChronologyViewOptions` supplies callbacks, read-only mode, device mode and `ChronologyPalette` brushes. Host applications own storage, identity and provider policy. PDF import uses Docling Serve's documented `POST /v1/convert/file` multipart endpoint with `to_formats=json`, `do_ocr=true`, and `do_table_structure=true`; a PDF cannot silently fall back to a local basic parser. `TestConnectionAsync` calls `GET /health` and requires `{"status":"ok"}`. `DoclingServeOptions` defaults to `http://localhost:5001` and a two-minute timeout that covers the full HTTP response, and accepts cancellation through `ParsePdfAsync` or `TestConnectionAsync`. The base URL must be an absolute HTTP(S) endpoint without credentials, a query, or a fragment. Provider keys stay inside the adapter and are not exported. Import and export validate the shared schema, references and embedded hashes. Intermediate objects are checked before sending text to a provider.

The desktop example accepts `--record=/absolute/file.ocker.json`, `--snapshot=/absolute/preview.png`, and optional `--export-prefix=/absolute/export` for native smoke tests without a provider.

Builds produce local NuGet packages (`Ocker.AI.Core`, `Ocker.AI.Avalonia`), version 0.1.0. They are not published automatically.

## Headless SDK

`OckerGraph` is an independent validated snapshot for direct (non-transitive) relationship navigation and exact source resolution. It returns absent values for unknown entity IDs, rejects unknown event queries, and never fetches external asset URIs.

```csharp
using Ocker;
using OckerApi = Ocker.Ocker;

var graph = new OckerGraph(OckerApi.ParseRecord(json));
var related = graph.GetRelatedEvents(eventId, "supports");
var evidence = graph.GetEvidence(eventId); // source, document, optional paragraph and asset

var next = new OckerRecordBuilder("Matter chronology")
    .AddIntermediate(intermediate)
    .AddEvent(anEvent)
    .Build(); // complete schema/reference/hash validation, no provider call
```

The builder copies its input and returns an independent record. It accepts actors, assets, documents, events, relationships, notes, authorities and intermediate documents in any order.

Private-feed installation requires .NET 8.0 or later; the UI package additionally requires Avalonia 11.x:

```sh
dotnet nuget add source /path/to/ocker-nuget --name ocker-private
dotnet add package Ocker.AI.Core --version 0.1.0
dotnet add package Ocker.AI.Avalonia --version 0.1.0
```

Build packages locally with `dotnet pack 'ri/c#/Ocker.sln' -o .work/ocker-nuget`. Run `tools/consumer-tests/dotnet/run.sh` for an isolated package-consumer check: it creates `.work/ocker-nuget/` and `.work/consumer-nuget-packages/`, restores only from that local feed plus NuGet.org for public transitives, and validates the fixture, graph, builder, packaged prompts, and Avalonia compilation. Keep distribution private; no command in this repository publishes to a public registry. The packages include the schemas and public extraction/relationship prompt resources used for validation and adapters.

## Complete provider-free annotation function

```csharp
using Ocker;
using OckerApi = Ocker.Ocker;

static string AddReviewNote(string json)
{
    var record = OckerApi.ParseRecord(json);
    var evt = record.Events.FirstOrDefault() ?? throw new InvalidOperationException("No events.");
    var stamp = DateTimeOffset.UtcNow.ToString("O");
    var note = new Note(Guid.NewGuid().ToString("N"), evt.Id, "Check the original account.",
        new PinPosition(40, 80), stamp, stamp);
    var next = new OckerRecordBuilder(record).AddNote(note).Build();
    return OckerApi.ExportRecord(next);
}
```

This function uses only Core. Add `Ocker.AI.Avalonia` and put `ChronologyView` in an Avalonia host when a UI is needed. Build source packages with normal NuGet.org access for their public dependencies; the package consumer check restricts `Ocker.AI.*` to the freshly built local feed using source mapping. See [distribution instructions](../../DISTRIBUTION.md) for shared-project installation and the current compatibility/acceptance matrix.
