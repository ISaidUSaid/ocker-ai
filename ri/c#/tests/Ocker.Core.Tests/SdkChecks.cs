// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ocker;

internal static class SdkChecks
{
    public static void Run()
    {
        var bytes = Encoding.UTF8.GetBytes("sdk evidence");
        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var asset = new Asset("asset", "evidence.txt", "text/plain", hash, bytes.Length, Convert.ToBase64String(bytes));
        var overrideAsset = asset with { Id = "override", Name = "override.txt" };
        var document = new Document("doc", "Evidence", "report", [new Paragraph("p", 1, "Exact retained evidence")], AssetId: asset.Id);
        var extensions = new Dictionary<string, JsonElement> { ["portable"] = JsonDocument.Parse("true").RootElement.Clone() };
        var one = new OckerEvent("one", "One", "one", new DateValue("day", "2026-01-01"), [new Source("doc", "p", 1, "Exact retained evidence")], Extensions: extensions);
        var two = one with { Id = "two", Title = "Two", Sources = [new Source("doc", "p", 1, "Exact retained evidence", overrideAsset.Id)] };
        var now = DateTimeOffset.UtcNow.ToString("O");
        var supports = new Relationship("r1", "two", "one", "supports", "because", new Provenance("human", now));
        var contradicts = new Relationship("r2", "one", "two", "contradicts", "but", new Provenance("human", now));
        var record = Ocker.Ocker.CreateRecord("SDK") with { Documents = [document], Assets = [asset, overrideAsset], Events = [one, two], Relationships = [supports, contradicts] };
        var graph = new OckerGraph(record);
        // Direct relation traversal is bidirectional, record ordered, and deduplicated over types.
        if (graph.GetRelatedEvents("one").Single().Id != "two" || graph.GetRelationships("one").Count != 2 || graph.GetRelatedEvents("one", "supports").Single().Id != "two") throw new Exception("Graph direct traversal/type filter failed.");
        try { graph.GetRelatedEvents("one", "other"); throw new Exception("Bad relationship type accepted."); } catch (OckerException) { }
        var returned = graph.GetEvent("one")!; returned.Sources.Clear(); returned.Extensions!["portable"] = JsonDocument.Parse("false").RootElement.Clone();
        if (graph.GetEvent("one")!.Sources.Count != 1 || !graph.GetEvent("one")!.Extensions!["portable"].GetBoolean()) throw new Exception("Graph event copy leaked mutable state.");
        var fallback = graph.GetEvidence("one").Single(); var overridden = graph.GetEvidence("two").Single();
        if (fallback.Asset?.Id != asset.Id || overridden.Asset?.Id != overrideAsset.Id || fallback.Paragraph?.Text != "Exact retained evidence") throw new Exception("Evidence fallback/override failed.");
        fallback.Document.Paragraphs.Clear(); if (graph.GetEvidence("one").Single().Document.Paragraphs.Count != 1) throw new Exception("Resolved evidence leaked document state.");
        // URI evidence remains a locator: graph resolution performs no network work.
        var uriAsset = new Asset("uri", "remote", "text/plain", hash, bytes.Length, null, "https://example.invalid/evidence");
        var uriRecord = record with { Assets = [uriAsset], Documents = [document with { AssetId = uriAsset.Id }], Events = [one with { Sources = [new Source("doc", "p")] }], Relationships = [] };
        if (new OckerGraph(uriRecord).GetEvidence("one").Single().Asset?.Uri != uriAsset.Uri) throw new Exception("External evidence locator was not preserved.");
        var builder = new OckerRecordBuilder(record); var first = builder.Build(); var second = builder.Build(); first.Events.Clear();
        if (second.Events.Count != 2 || record.Events.Count != 2) throw new Exception("Builder did not return independent snapshots.");
        var intermediate = new Intermediate("ocker-document", "0.1.0", document with { Id = "doc2", AssetId = "asset2" }, asset with { Id = "asset2" });
        if (new OckerRecordBuilder("Intermediate").AddIntermediate(intermediate).Build().Documents.Count != 1) throw new Exception("Builder intermediate import failed.");
        try { new OckerRecordBuilder("Bad intermediate").AddIntermediate(intermediate with { Asset = intermediate.Asset! with { Sha256 = new string('0', 64) } }); throw new Exception("Corrupt intermediate hash accepted."); } catch (OckerValidationException) { }
        try { new OckerRecordBuilder("Duplicate").AddDocument(document).AddDocument(document).Build(); throw new Exception("Builder accepted duplicate IDs."); } catch (OckerValidationException) { }
    }
}
