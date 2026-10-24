// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;
using Json.Schema;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace Ocker;

public static class Ocker
{
    public static string ExtractPrompt => LoadPrompt("extract.txt");
    public static string RelatePrompt => LoadPrompt("relate.txt");
    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true, DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };

    public static OckerRecord CreateRecord(string title, string? authorId = null)
    {
        var now = DateTimeOffset.UtcNow.ToString("O");
        return new OckerRecord("ocker", "0.1.0", NewId(), title, now, now, [], [], [], [], [], [], [], authorId is null ? null : new());
    }
    public static string ExportRecord(OckerRecord record) { ValidateRecord(record); var json = JsonSerializer.Serialize(record, Json); ValidateRecordJson(json); return json; }
    public static OckerRecord ParseRecord(string json)
    {
        ValidateRecordJson(json); OckerRecord record; try { record = JsonSerializer.Deserialize<OckerRecord>(json, Json) ?? throw new OckerException("Record JSON is empty."); } catch (JsonException ex) { throw new OckerException("Record JSON does not match the OCKER schema: " + ex.Message); }
        ValidateRecord(record); return record;
    }
    public static void ValidateRecord(OckerRecord record)
    {
        ValidateRecordJson(JsonSerializer.Serialize(record,Json));
        var errors = new List<string>();
        if (record.Format != "ocker" || record.Version != "0.1.0") errors.Add("Unsupported OCKER record format or version.");
        if (string.IsNullOrWhiteSpace(record.Id) || record.Id.Length > 255 || string.IsNullOrWhiteSpace(record.Title)) errors.Add("Record id and title are required.");
        if (!DateTimeOffset.TryParse(record.CreatedAt, out _) || !DateTimeOffset.TryParse(record.UpdatedAt, out _)) errors.Add("Record timestamps must be ISO date-times.");
        var all = record.Actors.Select(x => x.Id).Concat(record.Documents.Select(x => x.Id)).Concat(record.Events.Select(x => x.Id)).Concat(record.Relationships.Select(x => x.Id)).Concat(record.Notes.Select(x => x.Id)).Concat(record.Authorities.Select(x => x.Id)).Concat(record.Assets.Select(x => x.Id)).ToList();
        if (all.Any(string.IsNullOrWhiteSpace) || all.Distinct(StringComparer.Ordinal).Count() != all.Count) errors.Add("IDs must be non-empty and unique within a record.");
        var docs = record.Documents.GroupBy(x => x.Id).ToDictionary(x => x.Key, x => x.First()); var events = record.Events.Select(x => x.Id).ToHashSet(); var assets = record.Assets.GroupBy(x => x.Id).ToDictionary(x => x.Key, x => x.First());
        var paragraphs = record.Documents.SelectMany(d => d.Paragraphs.Select(p => (d.Id, p.Id))).ToHashSet();
        foreach (var d in record.Documents) { if (d.Kind is not ("affidavit" or "order" or "report")) errors.Add($"Document {d.Id} has invalid kind."); if (d.AssetId is not null && !assets.ContainsKey(d.AssetId)) errors.Add($"Document {d.Id} refers to an unknown asset."); if (d.Paragraphs.Any(p => string.IsNullOrWhiteSpace(p.Id) || p.Page < 1 || string.IsNullOrWhiteSpace(p.Text)) || d.Paragraphs.Select(p => p.Id).Distinct().Count() != d.Paragraphs.Count) errors.Add($"Document {d.Id} has invalid or duplicate paragraph IDs."); }
        foreach (var e in record.Events)
        {
            ValidateDate(e.Date, e.Id, errors); if (e.Status is not null && e.Status is not ("alleged" or "agreed" or "disputed" or "unresolved")) errors.Add($"Event {e.Id} has invalid status.");
            foreach (var s in e.Sources) ValidateSource(s, paragraphs, docs, assets, errors);
            if (e.ActorIds?.Any(id => !record.Actors.Any(a => a.Id == id)) == true) errors.Add($"Event {e.Id} refers to an unknown actor.");
        }
        foreach (var r in record.Relationships) { if (!events.Contains(r.From) || !events.Contains(r.To) || r.From == r.To) errors.Add($"Relationship {r.Id} has invalid event references."); if (string.IsNullOrWhiteSpace(r.Rationale) || r.Type is not ("supports" or "contradicts") || r.Provenance.Method is not ("llm" or "human" or "imported") || !DateTimeOffset.TryParse(r.Provenance.CreatedAt, out _)) errors.Add($"Relationship {r.Id} has invalid type or provenance."); foreach (var s in r.Sources ?? []) ValidateSource(s, paragraphs, docs, assets, errors); }
        foreach (var n in record.Notes) if (!events.Contains(n.EventId)) errors.Add($"Note {n.Id} refers to an unknown event.");
        foreach (var a in record.Authorities) { if (!events.Contains(a.EventId)) errors.Add($"Authority {a.Id} refers to an unknown event."); if (a.Type is not ("binding" or "persuasive" or "unspecified") || a.Color is not ("blue" or "lavender" or "mint" or "peach" or "slate")) errors.Add($"Authority {a.Id} has invalid type or color."); }
        foreach (var a in record.Assets) { if (string.IsNullOrWhiteSpace(a.Data) && string.IsNullOrWhiteSpace(a.Uri)) errors.Add($"Asset {a.Id} requires data or uri."); if (a.Sha256.Length != 64 || a.Sha256.Any(c => !char.IsAsciiHexDigit(c)) || a.Sha256 != a.Sha256.ToLowerInvariant()) errors.Add($"Asset {a.Id} has an invalid SHA-256 hash."); if (!string.IsNullOrEmpty(a.Data)) { try { var bytes = Convert.FromBase64String(a.Data); if (bytes.LongLength != a.ByteLength || Sha256(bytes) != a.Sha256) errors.Add($"Asset {a.Id} data, length or hash is invalid."); } catch { errors.Add($"Asset {a.Id} data is not RFC 4648 base64."); } } }
        var actors=record.Actors.Select(a=>a.Id).ToHashSet();
        foreach(var evt in record.Events)foreach(var actor in evt.ActorIds??[])if(!actors.Contains(actor))errors.Add("Unresolved event actor "+actor);
        var pairs=new HashSet<string>();
        foreach(var edge in record.Relationships){if(edge.From==edge.To)errors.Add("Self relationship");var pair=string.Join("|",new[]{edge.From,edge.To}.Order())+"|"+edge.Type;if(!pairs.Add(pair))errors.Add("Duplicate relationship");if(edge.Provenance.AuthorId is not null&&!actors.Contains(edge.Provenance.AuthorId))errors.Add("Unresolved relationship author");}
        foreach(var note in record.Notes){if(note.AuthorId is not null&&!actors.Contains(note.AuthorId))errors.Add("Unresolved note author");if(DateTimeOffset.Parse(note.UpdatedAt)<DateTimeOffset.Parse(note.CreatedAt))errors.Add("Note update precedes creation");}
        foreach(var authority in record.Authorities){if(authority.AuthorId is not null&&!actors.Contains(authority.AuthorId))errors.Add("Unresolved authority author");if(authority.SourceUrl is not null&&(!Uri.TryCreate(authority.SourceUrl,UriKind.Absolute,out var uri)||uri.Scheme is not ("http" or "https")))errors.Add("Authority URL requires HTTP(S)");}
        foreach(var asset in record.Assets){var seen=new HashSet<string>{asset.Id};var parent=asset.DerivedFrom;while(parent is not null){if(!seen.Add(parent)){errors.Add("Asset derivation cycle");break;}if(!assets.TryGetValue(parent,out var previous)){errors.Add("Unresolved derived asset");break;}parent=previous.DerivedFrom;}}
        if (errors.Count > 0) throw new OckerValidationException(errors);
    }
    private static readonly Lazy<JsonSchema> DocumentSchema=new(()=>{using var stream=typeof(Ocker).Assembly.GetManifestResourceStream("Ocker.Schemas.document.schema.json")!;using var reader=new StreamReader(stream);return JsonSchema.FromText(reader.ReadToEnd());});
    public static Intermediate ParseIntermediate(string json) {var node=JsonNode.Parse(json);if(!DocumentSchema.Value.Evaluate(node).IsValid)throw new OckerException("Invalid intermediate schema");var value=JsonSerializer.Deserialize<Intermediate>(json,Json)??throw new OckerException("Intermediate required");ValidateIntermediate(value);return value;}
    public static string ExportIntermediate(Intermediate value) {ValidateIntermediate(value);return JsonSerializer.Serialize(value,Json);}
    public static void ValidateIntermediate(Intermediate intermediate) {
        if(!DocumentSchema.Value.Evaluate(JsonSerializer.SerializeToNode(intermediate,Json)).IsValid)throw new OckerException("Invalid intermediate schema");
        var temporary=CreateRecord("Intermediate validation") with {Documents=[intermediate.Document],Assets=intermediate.Asset is null?[]:[intermediate.Asset]};ValidateRecord(temporary);
        if(intermediate.Document.Paragraphs.Count==0)throw new OckerException("Intermediate has no text paragraphs");
    }
    private static void ValidateSource(Source s, HashSet<(string, string)> paragraphs, Dictionary<string, Document> docs, Dictionary<string, Asset> assets, List<string> errors)
    { if (!docs.TryGetValue(s.DocumentId, out var document)) { errors.Add($"Source refers to unknown document {s.DocumentId}."); return; } if (s.ParagraphId is not null && !paragraphs.Contains((s.DocumentId, s.ParagraphId))) errors.Add($"Source refers to unknown paragraph {s.ParagraphId}."); if(s.Selector?.Start is not null&&s.Selector.End is not null&&s.Selector.End<s.Selector.Start)errors.Add("Selector end precedes start"); if(s.Page is not null&&!document.Paragraphs.Any(p=>p.Page==s.Page))errors.Add("Unresolved source page");if (s.Page is < 1) errors.Add("Source page must be positive."); if (s.AssetId is not null && !assets.ContainsKey(s.AssetId)) errors.Add($"Source refers to unknown asset {s.AssetId}."); if (s.Selector is not null && (s.Selector.Start is < 0 || s.Selector.End is < 0 || s.Selector.Page is < 1 || s.Selector.Kind is not ("text" or "page" or "time" or "frame"))) errors.Add("Source selector is invalid."); if (s.Quote is not null && s.ParagraphId is not null) { var paragraph = document.Paragraphs.FirstOrDefault(p => p.Id == s.ParagraphId); if (paragraph is not null && !paragraph.Text.Contains(s.Quote, StringComparison.Ordinal)) errors.Add($"Source quote for paragraph {s.ParagraphId} is not an exact excerpt."); } }
    private static void ValidateDate(DateValue date, string eventId, List<string> errors)
    { var ok = date.Precision switch { "day" => date.Value is not null && System.Text.RegularExpressions.Regex.IsMatch(date.Value, @"^\d{4}-\d{2}-\d{2}$") && DateOnly.TryParse(date.Value, out _), "month" => date.Value is not null && System.Text.RegularExpressions.Regex.IsMatch(date.Value, @"^\d{4}-(0[1-9]|1[0-2])$"), "year" => date.Value is not null && System.Text.RegularExpressions.Regex.IsMatch(date.Value, @"^\d{4}$"), "range" => date.Value is not null && date.End is not null && DateOnly.TryParse(date.Value, out var start) && DateOnly.TryParse(date.End, out var end) && start <= end, "unknown" => date.Value is null && date.End is null, _ => false }; if (!ok) errors.Add($"Event {eventId} has an invalid date value for its precision."); }
    private static readonly Lazy<JsonSchema> RecordSchema = new(() => { using var stream = typeof(Ocker).Assembly.GetManifestResourceStream("Ocker.Schemas.ocker.schema.json") ?? throw new OckerException("Embedded OCKER schema is missing."); using var reader = new StreamReader(stream); return JsonSchema.FromText(reader.ReadToEnd()); });
    private static string LoadPrompt(string name) { using var stream = typeof(Ocker).Assembly.GetManifestResourceStream("Ocker.Prompts." + name) ?? throw new OckerException($"Embedded prompt {name} is missing."); using var reader = new StreamReader(stream, Encoding.UTF8); return reader.ReadToEnd(); }
    private static void ValidateRecordJson(string rawJson) { var node = JsonNode.Parse(rawJson) ?? throw new OckerException("Record JSON is empty."); var result = RecordSchema.Value.Evaluate(node, new EvaluationOptions { OutputFormat = OutputFormat.List }); if (!result.IsValid) throw new OckerValidationException(new[]{"Record JSON does not conform to the OCKER schema."}); }
    public static async Task<Intermediate> ParsePdfAsync(Stream pdf, string documentId, string title, string kind, string? author = null, string? assetName = null, OckerOptions? options = null, CancellationToken cancellationToken = default)
    {
        options?.OnProgress?.Invoke(new(OckerProgressStage.Reading, "Reading PDF", 0));
        using var copy = new MemoryStream(); await pdf.CopyToAsync(copy, cancellationToken); var bytes = copy.ToArray(); cancellationToken.ThrowIfCancellationRequested();
        try
        {
            using var input = new MemoryStream(bytes); using var document = PdfDocument.Open(input);
            var paragraphs = new List<Paragraph>();
            foreach (var page in document.GetPages()) { cancellationToken.ThrowIfCancellationRequested(); var text = ContentOrderTextExtractor.GetText(page).Trim(); if (text.Length > 0) paragraphs.Add(new(NewId(), page.Number, text)); }
            if (paragraphs.Count == 0) throw new OckerException("This PDF has no extractable text and may be scanned. OCKER does not perform OCR.");
            var asset = new Asset(NewId(), assetName ?? title + ".pdf", "application/pdf", Sha256(bytes), bytes.LongLength, Convert.ToBase64String(bytes));
            var result = new Intermediate("ocker-document", "0.1.0", new(documentId, title, kind, paragraphs, author, asset.Id), asset); ValidateIntermediate(result);
            options?.OnProgress?.Invoke(new(OckerProgressStage.Completed, "PDF parsed", 1)); return result;
        } catch (OckerException) { throw; } catch (Exception ex) { options?.OnError?.Invoke(ex); throw new OckerException("PDF could not be read: " + ex.Message); }
    }
    public static async Task<Intermediate> ParseTextDocumentAsync(Stream input, string fileName, string documentId, string title, string kind, string? author = null, OckerOptions? options = null, CancellationToken cancellationToken = default)
    {
        using var copy = new MemoryStream(); await input.CopyToAsync(copy, cancellationToken); var bytes = copy.ToArray(); var extension = Path.GetExtension(fileName).ToLowerInvariant();
        string text = extension switch { ".txt" => Encoding.UTF8.GetString(bytes), ".rtf" => System.Text.RegularExpressions.Regex.Replace(RtfPipe.Rtf.ToHtml(Encoding.UTF8.GetString(bytes)), "<[^>]+>", " "), ".docx" => ReadDocx(bytes), _ => throw new OckerException("Supported text document types are .txt, .rtf, and .docx.") };
        var lines = text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Where(x => !string.IsNullOrWhiteSpace(x)).ToList(); if (lines.Count == 0) throw new OckerException("Document contains no extractable text.");
        var asset = new Asset(NewId(), fileName, extension == ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : extension == ".rtf" ? "application/rtf" : "text/plain", Sha256(bytes), bytes.LongLength, Convert.ToBase64String(bytes)); var document = new Document(documentId, title, kind, lines.Select(line => new Paragraph(NewId(), 1, line)).ToList(), author, asset.Id); var result = new Intermediate("ocker-document", "0.1.0", document, asset); ValidateIntermediate(result); return result;
    }
    private static string ReadDocx(byte[] bytes) { using var stream = new MemoryStream(bytes); using var document = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(stream, false); return string.Join("\n", document.MainDocumentPart?.Document.Body?.Elements<DocumentFormat.OpenXml.Wordprocessing.Paragraph>().Select(p => p.InnerText) ?? []); }
    public static async Task<IReadOnlyList<OckerEvent>> BuildChronologyAsync(Intermediate intermediate, OckerOptions options, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();ValidateIntermediate(intermediate); var adapter = options.CompletionAdapter ?? throw new OckerException("A completion adapter is required to build a chronology."); options.OnProgress?.Invoke(new(OckerProgressStage.Extracting, "Extracting chronology", 0));
        var text = JsonSerializer.Serialize(intermediate.Document, Json); var response = await adapter.CompleteAsync(new("extract", ExtractPrompt, text), cancellationToken); cancellationToken.ThrowIfCancellationRequested();
        using var json = JsonDocument.Parse(response); var events = new List<OckerEvent>(); var valid = intermediate.Document.Paragraphs.Select(p => p.Id).ToHashSet();
        foreach (var item in json.RootElement.GetProperty("events").EnumerateArray()) { var ids = item.GetProperty("paragraphIds").EnumerateArray().Select(x => x.GetString()!).ToList(); if (ids.Count == 0 || ids.Any(id => !valid.Contains(id))) throw new OckerException("Extraction returned empty or unknown paragraph IDs."); var d = item.GetProperty("date").Deserialize<DateValue>(Json) ?? throw new OckerException("Extraction returned an invalid date."); events.Add(new(NewId(), item.GetProperty("title").GetString() ?? "Untitled event", item.GetProperty("summary").GetString() ?? "", d, ids.Select(id => { var p = intermediate.Document.Paragraphs.Single(x => x.Id == id); return new Source(intermediate.Document.Id, id, p.Page, p.Text); }).ToList(), GetString(item,"assertedBy"), null, GetString(item,"status"), GetString(item,"narrative"))); }
        ValidateRecord(CreateRecord("Extraction validation") with {Documents=[intermediate.Document],Assets=intermediate.Asset is null?[]:[intermediate.Asset],Events=events}); options.OnProgress?.Invoke(new(OckerProgressStage.Completed, "Chronology extracted", 1)); return events;
    }
    public static async Task<IReadOnlyList<Relationship>> FindRelationshipsAsync(IEnumerable<OckerEvent> events, OckerOptions options, CancellationToken cancellationToken = default)
    { cancellationToken.ThrowIfCancellationRequested();var adapter = options.CompletionAdapter ?? throw new OckerException("A completion adapter is required to find relationships."); var list = events.ToList(); options.OnProgress?.Invoke(new(OckerProgressStage.Relating, "Assessing relationships", 0)); var response = await adapter.CompleteAsync(new("relate", RelatePrompt, JsonSerializer.Serialize(list, Json)), cancellationToken); using var json = JsonDocument.Parse(response); cancellationToken.ThrowIfCancellationRequested();var ids = list.Select(e => e.Id).ToHashSet(); var seen = new HashSet<string>(); var output = new List<Relationship>(); foreach (var r in json.RootElement.GetProperty("relationships").EnumerateArray()) { var from = r.GetProperty("from").GetString()!; var to = r.GetProperty("to").GetString()!; var type = r.GetProperty("type").GetString()!; var rationale = r.GetProperty("rationale").GetString(); if (!ids.Contains(from) || !ids.Contains(to) || from == to || type is not ("supports" or "contradicts") || string.IsNullOrWhiteSpace(rationale)) throw new OckerException("Relationship inference returned invalid IDs, type, or rationale."); var pair = string.CompareOrdinal(from, to) < 0 ? from + "|" + to : to + "|" + from; if (!seen.Add(pair+"|"+type)) continue; output.Add(new(NewId(), from, to, type, rationale, new("llm", DateTimeOffset.UtcNow.ToString("O"), options.AuthorId))); } options.OnProgress?.Invoke(new(OckerProgressStage.Completed, "Relationships assessed", 1)); return output; }
    public static OckerRecord AddNote(OckerRecord r, string eventId, string body, PinPosition position, string? authorId = null) => Mutate(r, notes: [..r.Notes, new(NewId(), eventId, body, position, DateTimeOffset.UtcNow.ToString("O"), DateTimeOffset.UtcNow.ToString("O"), authorId)]);
    public static OckerRecord EditNote(OckerRecord r, Note note) => Mutate(r, notes: r.Notes.Select(n => n.Id == note.Id ? note with { UpdatedAt = DateTimeOffset.UtcNow.ToString("O") } : n).ToList());
    public static OckerRecord DeleteNote(OckerRecord r, string id) => Mutate(r, notes: r.Notes.Where(n => n.Id != id).ToList());
    public static OckerRecord AddAuthority(OckerRecord r, Authority authority) => Mutate(r, authorities: [..r.Authorities, authority]);
    public static OckerRecord EditAuthority(OckerRecord r, Authority authority) => Mutate(r, authorities: r.Authorities.Select(a => a.Id == authority.Id ? authority with { UpdatedAt = DateTimeOffset.UtcNow.ToString("O") } : a).ToList());
    public static OckerRecord DeleteAuthority(OckerRecord r, string id) => Mutate(r, authorities: r.Authorities.Where(a => a.Id != id).ToList());
    private static OckerRecord Mutate(OckerRecord r, List<Note>? notes = null, List<Authority>? authorities = null) { var next = r with { Notes = notes ?? r.Notes, Authorities = authorities ?? r.Authorities, UpdatedAt = DateTimeOffset.UtcNow.ToString("O") }; ValidateRecord(next); return next; }
    private static string? GetString(JsonElement e, string name) => e.TryGetProperty(name, out var value) ? value.GetString() : null;
    private static string NewId() => Guid.NewGuid().ToString("N"); private static string Sha256(byte[] input) => Convert.ToHexString(SHA256.HashData(input)).ToLowerInvariant();
}
