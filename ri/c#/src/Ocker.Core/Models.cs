// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Ocker;

public sealed record DateValue(string Precision, string? Value = null, string? End = null, bool? Approximate = null, string? Basis = null);
public sealed record Selector(string Kind, double? Start = null, double? End = null, int? Page = null);
public sealed record Source(string DocumentId, string? ParagraphId = null, int? Page = null, string? Quote = null, string? AssetId = null, Selector? Selector = null);
public sealed record Paragraph(string Id, int Page, string Text, string? Label = null);
public sealed record Document(string Id, string Title, string Kind, List<Paragraph> Paragraphs, string? Author = null, string? AssetId = null);
public sealed record Actor(string Id, string Name, string? Role = null, Dictionary<string, JsonElement>? Extensions = null);
public sealed record OckerEvent(string Id, string Title, string Summary, DateValue Date, List<Source> Sources, string? AssertedBy = null, List<string>? ActorIds = null, string? Status = null, string? Narrative = null, Dictionary<string, JsonElement>? Extensions = null);
public sealed record Provenance(string Method, string CreatedAt, string? AuthorId = null);
public sealed record Relationship(string Id, string From, string To, string Type, string Rationale, Provenance Provenance, List<Source>? Sources = null, Dictionary<string, JsonElement>? Extensions = null);
public sealed record PinPosition(double X, double Y);
public sealed record Note(string Id, string EventId, string Body, PinPosition Position, string CreatedAt, string UpdatedAt, string? AuthorId = null, Dictionary<string, JsonElement>? Extensions = null);
public sealed record Authority(string Id, string EventId, string Title, string Citation, string Type, string Color, string CreatedAt, string UpdatedAt, string? Pinpoint = null, string? Court = null, string? Jurisdiction = null, string? SourceUrl = null, string? Body = null, string? AuthorId = null, Dictionary<string, JsonElement>? Extensions = null);
public sealed record Asset(string Id, string Name, string MediaType, string Sha256, long ByteLength, string? Data = null, string? Uri = null, string? DerivedFrom = null, Dictionary<string, JsonElement>? Selector = null, Dictionary<string, JsonElement>? Extensions = null);
public sealed record OckerRecord(string Format, string Version, string Id, string Title, string CreatedAt, string UpdatedAt, List<Actor> Actors, List<Document> Documents, List<OckerEvent> Events, List<Relationship> Relationships, List<Note> Notes, List<Authority> Authorities, List<Asset> Assets, Dictionary<string, JsonElement>? Extensions = null);
public sealed record Intermediate(string Format, string Version, Document Document, Asset? Asset = null);

public class OckerException(string message) : Exception(message);
public sealed class OckerValidationException(IReadOnlyList<string> errors) : OckerException(string.Join("; ", errors)) { public IReadOnlyList<string> Errors { get; } = errors; }
