// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
namespace Ocker;

/// <summary>A read-only, independent navigation snapshot over a validated OCKER record.</summary>
public sealed class OckerGraph
{
    private readonly OckerRecord _record;
    private readonly Dictionary<string, OckerEvent> _events;
    private readonly Dictionary<string, Document> _documents;
    private readonly Dictionary<string, Actor> _actors;
    private readonly Dictionary<string, Asset> _assets;

    public OckerGraph(OckerRecord record)
    {
        Ocker.ValidateRecord(record);
        _record = Snapshot(record);
        _events = _record.Events.ToDictionary(x => x.Id);
        _documents = _record.Documents.ToDictionary(x => x.Id);
        _actors = _record.Actors.ToDictionary(x => x.Id);
        _assets = _record.Assets.ToDictionary(x => x.Id);
    }

    public OckerRecord GetRecord() => Snapshot(_record);
    public OckerEvent? GetEvent(string id) => _events.TryGetValue(id, out var value) ? Copy(value) : null;
    public Document? GetDocument(string id) => _documents.TryGetValue(id, out var value) ? Copy(value) : null;
    public Actor? GetActor(string id) => _actors.TryGetValue(id, out var value) ? Copy(value) : null;
    public Asset? GetAsset(string id) => _assets.TryGetValue(id, out var value) ? Copy(value) : null;

    public IReadOnlyList<Relationship> GetRelationships(string eventId, string? type = null)
    {
        RequireEvent(eventId); RequireType(type);
        return _record.Relationships.Where(x => (x.From == eventId || x.To == eventId) && (type is null || x.Type == type)).Select(Copy).ToList();
    }

    public IReadOnlyList<OckerEvent> GetRelatedEvents(string eventId, string? type = null)
    {
        RequireEvent(eventId); RequireType(type);
        var ids = _record.Relationships.Where(x => (x.From == eventId || x.To == eventId) && (type is null || x.Type == type))
            .Select(x => x.From == eventId ? x.To : x.From).ToHashSet();
        return _record.Events.Where(x => ids.Contains(x.Id)).Select(Copy).ToList();
    }

    public IReadOnlyList<Note> GetNotes(string eventId) { RequireEvent(eventId); return _record.Notes.Where(x => x.EventId == eventId).Select(Copy).ToList(); }
    public IReadOnlyList<Authority> GetAuthorities(string eventId) { RequireEvent(eventId); return _record.Authorities.Where(x => x.EventId == eventId).Select(Copy).ToList(); }
    public IReadOnlyList<ResolvedEvidence> GetEvidence(string eventId)
    {
        RequireEvent(eventId);
        return _events[eventId].Sources.Select(source =>
        {
            var document = _documents[source.DocumentId];
            var paragraph = source.ParagraphId is null ? null : document.Paragraphs.FirstOrDefault(x => x.Id == source.ParagraphId);
            var assetId = source.AssetId ?? document.AssetId;
            return new ResolvedEvidence(Copy(source), Copy(document), paragraph is null ? null : Copy(paragraph), assetId is not null && _assets.TryGetValue(assetId, out var asset) ? Copy(asset) : null);
        }).ToList();
    }

    private void RequireEvent(string id) { if (!_events.ContainsKey(id)) throw new OckerException($"Unknown event {id}."); }
    private static void RequireType(string? type) { if (type is not null && type is not ("supports" or "contradicts")) throw new OckerException("Relationship type must be supports or contradicts."); }
    private static OckerRecord Snapshot(OckerRecord record) => Ocker.ParseRecord(Ocker.ExportRecord(record));
    private static T Copy<T>(T value) => System.Text.Json.JsonSerializer.Deserialize<T>(System.Text.Json.JsonSerializer.Serialize(value))!;
}

public sealed record ResolvedEvidence(Source Source, Document Document, Paragraph? Paragraph, Asset? Asset);

/// <summary>Fluent, provider-free construction of one validated independent OCKER record.</summary>
public sealed class OckerRecordBuilder
{
    private OckerRecord _record;
    public OckerRecordBuilder(string title) : this(Ocker.CreateRecord(title)) { }
    public OckerRecordBuilder(OckerRecord record) { Ocker.ValidateRecord(record); _record = Ocker.ParseRecord(Ocker.ExportRecord(record)); }
    public static OckerRecordBuilder FromRecord(OckerRecord record) => new(record);
    public OckerRecordBuilder AddActor(Actor value) { _record = _record with { Actors = [.. _record.Actors, Copy(value)] }; return this; }
    public OckerRecordBuilder AddAsset(Asset value) { _record = _record with { Assets = [.. _record.Assets, Copy(value)] }; return this; }
    public OckerRecordBuilder AddDocument(Document value) { _record = _record with { Documents = [.. _record.Documents, Copy(value)] }; return this; }
    public OckerRecordBuilder AddEvent(OckerEvent value) { _record = _record with { Events = [.. _record.Events, Copy(value)] }; return this; }
    public OckerRecordBuilder AddRelationship(Relationship value) { _record = _record with { Relationships = [.. _record.Relationships, Copy(value)] }; return this; }
    public OckerRecordBuilder AddNote(Note value) { _record = _record with { Notes = [.. _record.Notes, Copy(value)] }; return this; }
    public OckerRecordBuilder AddAuthority(Authority value) { _record = _record with { Authorities = [.. _record.Authorities, Copy(value)] }; return this; }
    public OckerRecordBuilder AddIntermediate(Intermediate value)
    {
        Ocker.ValidateIntermediate(value);
        if (value.Asset is not null) AddAsset(value.Asset);
        AddDocument(value.Document); return this;
    }
    public OckerRecord Build()
    {
        var next = _record with { UpdatedAt = DateTimeOffset.UtcNow.ToString("O") };
        Ocker.ValidateRecord(next);
        return Ocker.ParseRecord(Ocker.ExportRecord(next));
    }
    private static T Copy<T>(T value) => System.Text.Json.JsonSerializer.Deserialize<T>(System.Text.Json.JsonSerializer.Serialize(value))!;
}
