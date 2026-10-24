// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
using Ocker;
using Ocker.Avalonia;
var record = Ocker.Ocker.ParseRecord(await File.ReadAllTextAsync("joe-jill.ocker.json"));
if (string.IsNullOrWhiteSpace(Ocker.Ocker.ExtractPrompt) || string.IsNullOrWhiteSpace(Ocker.Ocker.RelatePrompt)) throw new Exception("Packaged prompts are unavailable.");
var graph = new OckerGraph(record);
var evt = record.Events.First(x => graph.GetRelatedEvents(x.Id).Count > 0);
var evidence = graph.GetEvidence(evt.Id);
if (evidence.Count == 0 || evidence[0].Document.Id != evt.Sources[0].DocumentId) throw new Exception("Evidence resolution failed.");
var stamp = DateTimeOffset.UtcNow.ToString("O");
var note = new Note("consumer-note", evt.Id, "Consumer annotation", new PinPosition(4, 5), stamp, stamp);
var next = new OckerRecordBuilder(record).AddNote(note).Build();
var restored = Ocker.Ocker.ParseRecord(Ocker.Ocker.ExportRecord(next));
if (restored.Notes.Count != record.Notes.Count + 1 || new OckerGraph(restored).GetNotes(evt.Id).All(x => x.Id != note.Id)) throw new Exception("Annotation/export round trip failed.");
_ = new ChronologyView { Record = restored, Options = new ChronologyViewOptions { Theme = "none" } };
var assembly = typeof(OckerGraph).Assembly.Location;
if (assembly.Contains("/ri/c#/src/", StringComparison.Ordinal)) throw new Exception("consumer resolved source instead of package");
Console.WriteLine(assembly);
