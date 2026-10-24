// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Ocker;
using UglyToad.PdfPig.Writer;
using UglyToad.PdfPig.Content;
using DocumentFormat.OpenXml.Packaging;
using W = DocumentFormat.OpenXml.Wordprocessing;

var chronology = Ocker.Ocker.CreateRecord("Synthetic record");
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
foreach (var pdfName in new[] { "JoeBlogsAffidavit.pdf", "JillBlogsAffidavit.pdf" }) { await using var pdf = File.OpenRead(Path.Combine("ri/js/demo/public/examples", pdfName)); var parsedPdf = await Ocker.Ocker.ParsePdfAsync(pdf, Guid.NewGuid().ToString("N"), pdfName, "affidavit"); if (parsedPdf.Document.Paragraphs.Count == 0) throw new Exception("Text PDF produced no intermediate paragraphs."); }
await using (var plain = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("First paragraph\nSecond paragraph"))) { var imported = await Ocker.Ocker.ParseTextDocumentAsync(plain, "source.txt", "txt-doc", "Text", "report"); if (imported.Document.Paragraphs.Count != 2 || imported.Asset?.Data is null) throw new Exception("Text import did not retain paragraphs and asset."); }
await using (var rtf = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(@"{\rtf1\ansi Caf\u233?} "))) { var imported = await Ocker.Ocker.ParseTextDocumentAsync(rtf, "source.rtf", "rtf-doc", "RTF", "report"); if (imported.Document.Paragraphs.Count == 0 || !imported.Document.Paragraphs[0].Text.Contains("Caf", StringComparison.Ordinal)) throw new Exception("Unicode RTF import failed."); }
await using (var docx = new MemoryStream()) { using (var word = WordprocessingDocument.Create(docx, DocumentFormat.OpenXml.WordprocessingDocumentType.Document, true)) { var main = word.AddMainDocumentPart(); main.Document = new W.Document(new W.Body(new W.Paragraph(new W.Run(new W.Text("DOCX retained paragraph"))))); main.Document.Save(); } docx.Position = 0; var imported = await Ocker.Ocker.ParseTextDocumentAsync(docx, "source.docx", "docx-doc", "DOCX", "report"); if (imported.Document.Paragraphs.Count == 0 || !imported.Document.Paragraphs[0].Text.Contains("DOCX", StringComparison.Ordinal)) throw new Exception("DOCX import failed."); }
await using (var invalid = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("not-a-docx"))) { try { await Ocker.Ocker.ParseTextDocumentAsync(invalid, "bad.docx", "bad-doc", "Bad", "report"); throw new Exception("Malformed DOCX was accepted."); } catch (Exception) { } }
var blankBuilder = new PdfDocumentBuilder(); blankBuilder.AddPage(PageSize.A4); await using var blankPdf = new MemoryStream(blankBuilder.Build()); try { await Ocker.Ocker.ParsePdfAsync(blankPdf, "blank", "Blank", "report"); throw new Exception("Image-only/blank PDF was accepted."); } catch (OckerException e) when (e.Message.Contains("no extractable text", StringComparison.OrdinalIgnoreCase)) { }
try { await Ocker.Ocker.BuildChronologyAsync(intermediate, new OckerOptions { CompletionAdapter = new FixedAdapter("{\"events\":[{\"title\":\"Bad\",\"summary\":\"Bad\",\"date\":{\"precision\":\"unknown\"},\"paragraphIds\":[\"not-present\"]}]} ") }); throw new Exception("Unknown LLM paragraph ID was accepted."); } catch (OckerException) { }
using (var cancelled = new CancellationTokenSource()) { cancelled.Cancel(); try { await Ocker.Ocker.BuildChronologyAsync(intermediate, new OckerOptions { CompletionAdapter = new FixedAdapter("{}") }, cancelled.Token); throw new Exception("Cancelled extraction continued."); } catch (OperationCanceledException) { } }
Console.WriteLine("Synthetic, fixture, PDF, malformed LLM ID and cancellation checks passed.");

sealed class FixedAdapter(string response) : IOckerCompletionAdapter { public Task<string> CompleteAsync(CompletionRequest request, CancellationToken cancellationToken) => Task.FromResult(response); }
sealed class NoAssetAdapter(string response, string forbidden) : IOckerCompletionAdapter { public Task<string> CompleteAsync(CompletionRequest request, CancellationToken cancellationToken) { if (request.Input.Contains(forbidden, StringComparison.Ordinal)) throw new Exception("Extraction payload contained asset bytes."); return Task.FromResult(response); } }

sealed class ThrowAdapter : IOckerCompletionAdapter {public Task<string> CompleteAsync(CompletionRequest request,CancellationToken token)=>throw new Exception("Provider must not be called for invalid evidence");}
