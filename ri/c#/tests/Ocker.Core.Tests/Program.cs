// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Ocker;
using System.Net;
using System.Net.Http;
using System.Text;
using DocumentFormat.OpenXml.Packaging;
using W = DocumentFormat.OpenXml.Wordprocessing;

var chronology = Ocker.Ocker.CreateRecord("Synthetic record");
if (!Ocker.Ocker.GetPrompt(OckerPromptLocale.Es, "extract").StartsWith("Lee los párrafos", StringComparison.Ordinal) || !Ocker.Ocker.GetPrompt(OckerPromptLocale.Pt, "relate").StartsWith("Compare os relatos", StringComparison.Ordinal) || !Ocker.Ocker.GetPrompt(OckerPromptLocale.Fr, "extract").StartsWith("Lis les paragraphes", StringComparison.Ordinal) || !Ocker.Ocker.GetPrompt(OckerPromptLocale.De, "relate").StartsWith("Vergleiche die bereitgestellten", StringComparison.Ordinal)) throw new Exception("Locale prompt resources were not embedded correctly.");
if (OckerPromptLanguages.FromLanguageTag("pt-BR") != OckerPromptLocale.Pt || OckerPromptLanguages.FromLanguageTag("unavailable") != OckerPromptLocale.En) throw new Exception("Prompt locale fallback is incorrect.");
var document = new Document("doc", "Synthetic source", "report", [new Paragraph("p1", 1, "A synthetic source excerpt.")]);
var eventOne = new OckerEvent("event-1", "Synthetic event", "A test event", new DateValue("day", "2026-10-23"), [new Source("doc", "p1", 1, "A synthetic source excerpt.")]);
chronology = chronology with { Documents = [document], Events = [eventOne] };
chronology = Ocker.Ocker.AddNote(chronology, eventOne.Id, "A test note", new PinPosition(8, 8));
chronology = Ocker.Ocker.AddAuthority(chronology, new Authority("authority-1", eventOne.Id, "Synthetic precedent", "[2026] Test 1", "unspecified", "slate", DateTimeOffset.UtcNow.ToString("O"), DateTimeOffset.UtcNow.ToString("O")));
var json = Ocker.Ocker.ExportRecord(chronology);
var parsed = Ocker.Ocker.ParseRecord(json);
if (parsed.Events.Count != 1 || parsed.Notes.Count != 1 || parsed.Authorities.Count != 1) throw new Exception("Round trip failed.");
try { Ocker.Ocker.ParseRecord(json.Replace("\"title\": \"Synthetic record\"", "\"title\": \"Synthetic record\", \"unexpected\": true")); throw new Exception("Unknown field was accepted."); } catch (OckerException) { }
var extensionJson = json.Replace("\"title\": \"Synthetic record\"", "\"title\": \"Synthetic record\", \"extensions\": {\"portable\": true}");
if (!Ocker.Ocker.ExportRecord(Ocker.Ocker.ParseRecord(extensionJson)).Contains("\"portable\": true")) throw new Exception("Extensions did not round-trip.");
var secondDocument = new Document("doc-2", "Second", "report", [new Paragraph("p1", 1, "The same local paragraph id.")]);
Ocker.Ocker.ValidateRecord(chronology with { Documents = [document, secondDocument] });
try { Ocker.Ocker.ValidateRecord(chronology with { Notes = [chronology.Notes[0] with { EventId = "missing" }] }); throw new Exception("Invalid references were accepted."); } catch (OckerValidationException) { }
try { Ocker.Ocker.ValidateRecord(chronology with { Relationships = [new Relationship("relationship", "event-1", "event-1", "supports", "bad", new Provenance("bad", "not-a-date"))] }); throw new Exception("Bad provenance was accepted."); } catch (OckerValidationException) { }
try { Ocker.Ocker.ValidateRecord(chronology with { Events = [eventOne with { Date = new DateValue("day", "2026-99-99") }] }); throw new Exception("Invalid date was accepted."); } catch (OckerValidationException) { }
try { Ocker.Ocker.ValidateRecord(chronology with { Assets = [new Asset("asset", "x", "text/plain", new string('A', 64), 1, "eA==")] }); throw new Exception("Invalid hash was accepted."); } catch (OckerValidationException) { }
var eventTwo = eventOne with { Id = "event-2", Title = "Related event" };
var relation = new Relationship("relationship-1", eventOne.Id, eventTwo.Id, "supports", "Direct support", new Provenance("human", DateTimeOffset.UtcNow.ToString("O")));
var graphRecord = chronology with { Events = [eventOne, eventTwo], Relationships = [relation] };
var graph = new OckerGraph(graphRecord);
if (graph.GetEvent("missing") is not null || graph.GetRelatedEvents(eventOne.Id).Single().Id != eventTwo.Id) throw new Exception("Graph lookup or direct traversal failed.");
try { graph.GetNotes("missing"); throw new Exception("Unknown graph event was accepted."); } catch (OckerException) { }
var graphCopy = graph.GetRecord(); graphCopy.Events.Clear(); if (graph.GetRecord().Events.Count != 2) throw new Exception("Graph exposed mutable state.");
var built = new OckerRecordBuilder("Builder record").AddDocument(document).AddEvent(eventOne).AddNote(chronology.Notes.Single()).AddAuthority(chronology.Authorities.Single()).Build();
if (built.Events.Count != 1 || built.Notes.Count != 1) throw new Exception("Builder failed to construct a valid record.");
try { new OckerRecordBuilder("Bad").AddDocument(document).AddEvent(eventOne with { Sources = [new Source("missing")] }).Build(); throw new Exception("Builder accepted unresolved source."); } catch (OckerValidationException) { }
SdkChecks.Run();
var intermediate = new Intermediate("ocker-document", "0.1.0", document);
var extracted = await Ocker.Ocker.BuildChronologyAsync(intermediate, new OckerOptions { CompletionAdapter = new FixedAdapter("{\"events\":[{\"title\":\"From PDF text\",\"summary\":\"Synthetic extraction\",\"date\":{\"precision\":\"day\",\"value\":\"2026-10-23\"},\"paragraphIds\":[\"p1\"]}]} ") });
if (extracted.Single().Sources.Single().Quote != "A synthetic source excerpt.") throw new Exception("Extraction did not retain an exact source excerpt.");
var payloadBytes=System.Text.Encoding.UTF8.GetBytes("private-pdf-bytes");
var payloadAsset = new Asset("payload-asset", "source.pdf", "application/pdf", Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(payloadBytes)).ToLowerInvariant(), payloadBytes.Length, Convert.ToBase64String(payloadBytes));
var payloadIntermediate = new Intermediate("ocker-document", "0.1.0", document with { AssetId = payloadAsset.Id }, payloadAsset);
await Ocker.Ocker.BuildChronologyAsync(payloadIntermediate, new OckerOptions { CompletionAdapter = new NoAssetAdapter("{\"events\":[{\"title\":\"Text only\",\"summary\":\"Safe\",\"date\":{\"precision\":\"unknown\"},\"paragraphIds\":[\"p1\"]}]} ", payloadAsset.Data!) });
try { await Ocker.Ocker.BuildChronologyAsync(payloadIntermediate with {Asset=payloadAsset with {Sha256=new string('0',64)}},new OckerOptions {CompletionAdapter=new ThrowAdapter()});throw new Exception("Invalid intermediate asset accepted"); }catch(OckerException){}
var fixture = Path.GetFullPath("spec/examples/joe-jill.ocker.json");
if (!File.Exists(fixture)) throw new Exception("Required cross-runtime fixture is missing.");
var fixtureRecord = Ocker.Ocker.ParseRecord(await File.ReadAllTextAsync(fixture));
if (fixtureRecord.Events.Count == 0 || fixtureRecord.Relationships.Count == 0 || fixtureRecord.Notes.Count == 0 || fixtureRecord.Authorities.Count == 0) throw new Exception("Cross-runtime fixture lacks required chronology, relationship, note, or authority coverage.");
var doclingResponse = """
{
  "status": "success",
  "document": { "json_content": {
    "body": { "children": [
      { "$ref": "#/texts/0" }, { "$ref": "#/pictures/0" }, { "$ref": "#/tables/0" }
    ] },
    "texts": [
      { "self_ref": "#/texts/0", "text": "First page text", "prov": [{ "page_no": 1 }] },
      { "self_ref": "#/texts/1", "text": "Picture child text", "prov": [{ "page_no": 2 }] }
    ],
    "pictures": [
      { "self_ref": "#/pictures/0", "prov": [{ "page_no": 2 }], "children": [{ "$ref": "#/texts/1" }] }
    ],
    "tables": [
      { "self_ref": "#/tables/0", "prov": [{ "page_no": 3 }], "data": { "table_cells": [
        { "text": "Date", "start_row_offset_idx": 0, "start_col_offset_idx": 0 },
        { "text": "Event", "start_row_offset_idx": 0, "start_col_offset_idx": 1 },
        { "text": "2026-10-23", "start_row_offset_idx": 1, "start_col_offset_idx": 0 },
        { "text": "Hearing", "start_row_offset_idx": 1, "start_col_offset_idx": 1 }
      ] } }
    ]
  } }
}
""";
var handler = new StubDoclingHandler(request => request.RequestUri!.AbsolutePath == "/health"
    ? new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"status\":\"ok\"}", Encoding.UTF8, "application/json") }
    : new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(doclingResponse, Encoding.UTF8, "application/json") });
using var doclingHttp = new HttpClient(handler);
using var docling = new DoclingServeClient(doclingHttp, new DoclingServeOptions { BaseUrl = new Uri("http://docling.test:5001"), Timeout = TimeSpan.FromSeconds(5) });
await docling.TestConnectionAsync();
using var badHealthHttp = new HttpClient(new StubDoclingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"status\":\"warming_up\"}", Encoding.UTF8, "application/json") }));
using var badHealth = new DoclingServeClient(badHealthHttp, new DoclingServeOptions { BaseUrl = new Uri("http://docling.test:5001") });
try { await badHealth.TestConnectionAsync(); throw new Exception("Docling health response without status ok was accepted."); } catch (OckerException e) when (e.Message.Contains("unexpected health", StringComparison.OrdinalIgnoreCase)) { }
foreach (var invalidBaseUrl in new[] { "http://username:password@docling.test:5001", "http://docling.test:5001/?ignored=true", "http://docling.test:5001/#ignored", "http://docling.test:5001/?", "http://docling.test:5001/#" })
{
    try { using var invalid = new DoclingServeClient(new DoclingServeOptions { BaseUrl = new Uri(invalidBaseUrl) }); throw new Exception("Unsafe Docling base URL was accepted."); }
    catch (ArgumentException) { }
}
using var slowHttp = new HttpClient(new StubDoclingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new DelayedContent(TimeSpan.FromMilliseconds(250), "{\"status\":\"ok\"}") }));
using var slowDocling = new DoclingServeClient(slowHttp, new DoclingServeOptions { BaseUrl = new Uri("http://docling.test:5001"), Timeout = TimeSpan.FromMilliseconds(25) });
try { await slowDocling.TestConnectionAsync(); throw new Exception("Docling response-body timeout was accepted."); } catch (OckerException e) when (e.Message.Contains("timed out", StringComparison.OrdinalIgnoreCase)) { }
await using var sourcePdf = new MemoryStream(Encoding.UTF8.GetBytes("original-pdf-bytes"));
var parsedPdf = await Ocker.Ocker.ParsePdfAsync(sourcePdf, "docling-pdf", "Docling source", "affidavit", assetName: "source.pdf", options: new OckerOptions { DoclingServe = docling });
if (parsedPdf.Document.Paragraphs.Select(p => (p.Page, p.Text)).SequenceEqual(new[] { (1, "First page text"), (2, "Picture child text"), (3, "Date | Event\n2026-10-23 | Hearing") }) is false) throw new Exception("Docling JSON did not preserve body, picture-child, and table text by page.");
if (parsedPdf.Asset is not { } parsedAsset || parsedAsset.Data != Convert.ToBase64String(Encoding.UTF8.GetBytes("original-pdf-bytes")) || parsedAsset.Sha256 != Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes("original-pdf-bytes"))).ToLowerInvariant()) throw new Exception("Docling PDF import did not retain the original asset and hash.");
if (handler.LastMethod != "POST" || handler.LastPath != "/v1/convert/file" || handler.LastContentType != "multipart/form-data" || handler.LastBody is null || !handler.LastBody.Contains("files", StringComparison.Ordinal) || !handler.LastBody.Contains("to_formats", StringComparison.Ordinal) || !handler.LastBody.Contains("json", StringComparison.Ordinal) || !handler.LastBody.Contains("do_ocr", StringComparison.Ordinal) || !handler.LastBody.Contains("do_table_structure", StringComparison.Ordinal)) throw new Exception("Docling import did not use the documented multipart request.");
using var partialHttp = new HttpClient(new StubDoclingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(doclingResponse.Replace("\"success\"", "\"partial_success\"", StringComparison.Ordinal), Encoding.UTF8, "application/json") }));
using var partialDocling = new DoclingServeClient(partialHttp, new DoclingServeOptions { BaseUrl = new Uri("http://docling.test:5001") });
await using var partialPdf = new MemoryStream(Encoding.UTF8.GetBytes("partial-pdf"));
try { await Ocker.Ocker.ParsePdfAsync(partialPdf, "partial", "Partial", "report", options: new OckerOptions { DoclingServe = partialDocling }); throw new Exception("Partial Docling conversion was accepted."); } catch (OckerException e) when (e.Message.Contains("did not fully convert", StringComparison.OrdinalIgnoreCase)) { }
using var failureHttp = new HttpClient(new StubDoclingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"status\":\"failure\",\"errors\":[\"bad PDF\"]}", Encoding.UTF8, "application/json") }));
using var failureDocling = new DoclingServeClient(failureHttp, new DoclingServeOptions { BaseUrl = new Uri("http://docling.test:5001") });
await using var failurePdf = new MemoryStream(Encoding.UTF8.GetBytes("failure-pdf"));
try { await Ocker.Ocker.ParsePdfAsync(failurePdf, "failure", "Failure", "report", options: new OckerOptions { DoclingServe = failureDocling }); throw new Exception("Failed Docling conversion was accepted."); } catch (OckerException e) when (e.Message.Contains("did not fully convert", StringComparison.OrdinalIgnoreCase)) { }
const string missingPageResponse = "{\"status\":\"success\",\"document\":{\"json_content\":{\"body\":{\"children\":[{\"$ref\":\"#/texts/0\"}]},\"texts\":[{\"self_ref\":\"#/texts/0\",\"text\":\"Unattributed text\",\"prov\":[]}]}}}";
using var missingPageHttp = new HttpClient(new StubDoclingHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(missingPageResponse, Encoding.UTF8, "application/json") }));
using var missingPageDocling = new DoclingServeClient(missingPageHttp, new DoclingServeOptions { BaseUrl = new Uri("http://docling.test:5001") });
await using var missingPagePdf = new MemoryStream(Encoding.UTF8.GetBytes("missing-page-pdf"));
try { await Ocker.Ocker.ParsePdfAsync(missingPagePdf, "missing-page", "Missing page", "report", options: new OckerOptions { DoclingServe = missingPageDocling }); throw new Exception("Docling text without page provenance was accepted."); } catch (OckerException e) when (e.Message.Contains("page_no provenance", StringComparison.OrdinalIgnoreCase)) { }
using var unavailableHttp = new HttpClient(new StubDoclingHandler(_ => throw new HttpRequestException("offline")));
var unavailable = new DoclingServeClient(unavailableHttp, new DoclingServeOptions { BaseUrl = new Uri("http://offline.test:5001"), Timeout = TimeSpan.FromSeconds(1) });
try { await unavailable.TestConnectionAsync(); throw new Exception("Unavailable Docling server was accepted."); } catch (OckerException e) when (e.Message.Contains("unavailable", StringComparison.OrdinalIgnoreCase)) { } finally { unavailable.Dispose(); }
await using (var plain = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("First paragraph\nSecond paragraph"))) { var imported = await Ocker.Ocker.ParseTextDocumentAsync(plain, "source.txt", "txt-doc", "Text", "report"); if (imported.Document.Paragraphs.Count != 2 || imported.Asset?.Data is null) throw new Exception("Text import did not retain paragraphs and asset."); }
await using (var rtf = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(@"{\rtf1\ansi Caf\u233?} "))) { var imported = await Ocker.Ocker.ParseTextDocumentAsync(rtf, "source.rtf", "rtf-doc", "RTF", "report"); if (imported.Document.Paragraphs.Count == 0 || !imported.Document.Paragraphs[0].Text.Contains("Caf", StringComparison.Ordinal)) throw new Exception("Unicode RTF import failed."); }
await using (var docx = new MemoryStream()) { using (var word = WordprocessingDocument.Create(docx, DocumentFormat.OpenXml.WordprocessingDocumentType.Document, true)) { var main = word.AddMainDocumentPart(); main.Document = new W.Document(new W.Body(new W.Paragraph(new W.Run(new W.Text("DOCX retained paragraph"))))); main.Document.Save(); } docx.Position = 0; var imported = await Ocker.Ocker.ParseTextDocumentAsync(docx, "source.docx", "docx-doc", "DOCX", "report"); if (imported.Document.Paragraphs.Count == 0 || !imported.Document.Paragraphs[0].Text.Contains("DOCX", StringComparison.Ordinal)) throw new Exception("DOCX import failed."); }
await using (var invalid = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("not-a-docx"))) { try { await Ocker.Ocker.ParseTextDocumentAsync(invalid, "bad.docx", "bad-doc", "Bad", "report"); throw new Exception("Malformed DOCX was accepted."); } catch (Exception) { } }
try { await Ocker.Ocker.BuildChronologyAsync(intermediate, new OckerOptions { CompletionAdapter = new FixedAdapter("{\"events\":[{\"title\":\"Bad\",\"summary\":\"Bad\",\"date\":{\"precision\":\"unknown\"},\"paragraphIds\":[\"not-present\"]}]} ") }); throw new Exception("Unknown LLM paragraph ID was accepted."); } catch (OckerException) { }
using (var cancelled = new CancellationTokenSource()) { cancelled.Cancel(); try { await Ocker.Ocker.BuildChronologyAsync(intermediate, new OckerOptions { CompletionAdapter = new FixedAdapter("{}") }, cancelled.Token); throw new Exception("Cancelled extraction continued."); } catch (OperationCanceledException) { } }
Console.WriteLine("Synthetic, fixture, Docling multipart, malformed LLM ID and cancellation checks passed.");

sealed class FixedAdapter(string response) : IOckerCompletionAdapter { public Task<string> CompleteAsync(CompletionRequest request, CancellationToken cancellationToken) => Task.FromResult(response); }
sealed class NoAssetAdapter(string response, string forbidden) : IOckerCompletionAdapter { public Task<string> CompleteAsync(CompletionRequest request, CancellationToken cancellationToken) { if (request.Input.Contains(forbidden, StringComparison.Ordinal)) throw new Exception("Extraction payload contained asset bytes."); return Task.FromResult(response); } }

sealed class ThrowAdapter : IOckerCompletionAdapter {public Task<string> CompleteAsync(CompletionRequest request,CancellationToken token)=>throw new Exception("Provider must not be called for invalid evidence");}
sealed class StubDoclingHandler(Func<HttpRequestMessage, HttpResponseMessage> response) : HttpMessageHandler
{
    public string? LastMethod { get; private set; }
    public string? LastPath { get; private set; }
    public string? LastContentType { get; private set; }
    public string? LastBody { get; private set; }
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastMethod = request.Method.Method; LastPath = request.RequestUri?.AbsolutePath; LastContentType = request.Content?.Headers.ContentType?.MediaType;
        LastBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return response(request);
    }
}

sealed class DelayedContent(TimeSpan delay, string body) : HttpContent
{
    protected override bool TryComputeLength(out long length) { length = Encoding.UTF8.GetByteCount(body); return true; }
    protected override Task SerializeToStreamAsync(Stream stream, System.Net.TransportContext? context) => WriteAsync(stream, CancellationToken.None);
    protected override Task SerializeToStreamAsync(Stream stream, System.Net.TransportContext? context, CancellationToken cancellationToken) => WriteAsync(stream, cancellationToken);
    private async Task WriteAsync(Stream stream, CancellationToken cancellationToken)
    {
        await Task.Delay(delay, cancellationToken);
        await stream.WriteAsync(Encoding.UTF8.GetBytes(body), cancellationToken);
    }
}
