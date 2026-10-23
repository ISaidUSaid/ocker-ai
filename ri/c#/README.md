# C# / Avalonia

Apache-2.0 · Jenko <adam@isaidusaid.com>

.NET 8 supplies `Ocker.Core` (records, schema validation, text-PDF import and replaceable LLM operations), `Ocker.Avalonia` (reusable native `ChronologyView`) and `Ocker.Desktop` (the cross-platform example).

From the repository root:

```sh
dotnet build 'ri/c#/Ocker.sln'
dotnet run --project 'ri/c#/src/Ocker.Desktop'
dotnet run --project 'ri/c#/tests/Ocker.Core.Tests'
```

Open a saved record or queue PDF, DOCX, RTF and plain-text documents. The example has in-memory provider settings, document kinds, progress/cancellation, source excerpts and original evidence download, editable notes, outside-edge coloured precedents, related-event cards and PNG/PDF export. Compact mode follows window width; the reusable view can also receive explicit `Mobile` state. All cards remain mounted.

The default presentation follows the [shared browser/native design](../../spec/PRESENTATION.md): paired desktop cards, compact single-column layout, pinned paper notes and outside precedent flags. Main and related-card boards each have their own drag target context. Drop the red pin inside a visible card; empty-space drops cancel. Compact cards offer explicit annotation actions.

```csharp
var work = new OckerOptions {
    CompletionAdapter = new OpenAiCompatibleAdapter(httpClient, endpoint, model, key),
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

`IOckerCompletionAdapter` is replaceable. `ChronologyViewOptions` supplies callbacks, read-only mode, device mode and `ChronologyPalette` brushes. Host applications own storage, identity and provider policy. The core uses PdfPig for ordinary text extraction; there is no OCR. Provider keys stay inside the adapter and are not exported. Import and export validate the shared schema, references and embedded hashes. Intermediate objects are checked before sending text to a provider.

The desktop example accepts `--record=/absolute/file.ocker.json`, `--snapshot=/absolute/preview.png`, and optional `--export-prefix=/absolute/export` for native smoke tests without a provider.

Builds produce local NuGet packages (`Ocker.AI.Core`, `Ocker.AI.Avalonia`), version 0.1.0. They are not published automatically.
