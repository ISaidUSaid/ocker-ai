// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import java.util.*;
import static com.ocker.core.OckerTypes.*;

/** Read-only, direct graph navigation over a validated OCKER record snapshot. */
public final class OckerGraph {
  /** Evidence resolved without fetching an external asset URI. */
  public record Evidence(Source source, Document document, Paragraph paragraph, Asset asset) {}

  private final OckerRecord record;
  private final Map<String, Event> events;
  private final Map<String, Document> documents;
  private final Map<String, Actor> actors;
  private final Map<String, Asset> assets;

  public OckerGraph(OckerRecord record) {
    Ocker.validateStrict(record);
    this.record = copy(record);
    events = index(this.record.events(), Event::id);
    documents = index(this.record.documents(), Document::id);
    actors = index(this.record.actors(), Actor::id);
    assets = index(this.record.assets(), Asset::id);
  }

  public static OckerGraph from(OckerRecord record) { return new OckerGraph(record); }

  public OckerRecord getRecord() { return copy(record); }
  public Optional<Event> getEvent(String id) { return Optional.ofNullable(events.get(id)).map(OckerGraph::copy); }
  public Optional<Document> getDocument(String id) { return Optional.ofNullable(documents.get(id)).map(OckerGraph::copy); }
  public Optional<Actor> getActor(String id) { return Optional.ofNullable(actors.get(id)).map(OckerGraph::copy); }
  public Optional<Asset> getAsset(String id) { return Optional.ofNullable(assets.get(id)).map(OckerGraph::copy); }

  public List<Relationship> getRelationships(String eventId) { return getRelationships(eventId, null); }
  public List<Relationship> getRelationships(String eventId, String type) {
    requireEvent(eventId);
    if (type != null && !Set.of("supports", "contradicts").contains(type)) {
      throw new IllegalArgumentException("Unknown relationship type: " + type);
    }
    return record.relationships().stream()
      .filter(relationship -> eventId.equals(relationship.from()) || eventId.equals(relationship.to()))
      .filter(relationship -> type == null || type.equals(relationship.type()))
      .map(OckerGraph::copy).toList();
  }

  public List<Event> getRelatedEvents(String eventId) { return getRelatedEvents(eventId, null); }
  public List<Event> getRelatedEvents(String eventId, String type) {
    requireEvent(eventId);
    Set<String> related = new HashSet<>();
    for (Relationship relationship : getRelationships(eventId, type)) {
      related.add(eventId.equals(relationship.from()) ? relationship.to() : relationship.from());
    }
    return record.events().stream().filter(event -> related.contains(event.id())).map(OckerGraph::copy).toList();
  }

  public List<Note> getNotes(String eventId) {
    requireEvent(eventId);
    return record.notes().stream().filter(note -> eventId.equals(note.eventId())).map(OckerGraph::copy).toList();
  }

  public List<Authority> getAuthorities(String eventId) {
    requireEvent(eventId);
    return record.authorities().stream().filter(authority -> eventId.equals(authority.eventId())).map(OckerGraph::copy).toList();
  }

  public List<Evidence> getEvidence(String eventId) {
    Event event = events.get(eventId);
    if (event == null) throw unknownEvent(eventId);
    return event.sources().stream().map(this::resolve).toList();
  }

  private Evidence resolve(Source source) {
    Document document = documents.get(source.documentId());
    Paragraph paragraph = source.paragraphId() == null ? null : document.paragraphs().stream()
      .filter(candidate -> source.paragraphId().equals(candidate.id())).findFirst().orElse(null);
    Asset asset = assets.get(source.assetId() == null ? document.assetId() : source.assetId());
    return new Evidence(copy(source), copy(document), paragraph == null ? null : copy(paragraph), asset == null ? null : copy(asset));
  }

  private void requireEvent(String eventId) { if (!events.containsKey(eventId)) throw unknownEvent(eventId); }
  private static Ocker.ValidationException unknownEvent(String eventId) { return new Ocker.ValidationException(List.of("event missing " + eventId)); }
  private static <T> Map<String, T> index(List<T> values, java.util.function.Function<T, String> id) {
    Map<String, T> result = new LinkedHashMap<>();
    for (T value : values) result.put(id.apply(value), value);
    return Map.copyOf(result);
  }
  private static OckerRecord copy(OckerRecord value) { return Ocker.JSON.convertValue(value, OckerRecord.class); }
  private static Event copy(Event value) { return Ocker.JSON.convertValue(value, Event.class); }
  private static Document copy(Document value) { return Ocker.JSON.convertValue(value, Document.class); }
  private static Actor copy(Actor value) { return Ocker.JSON.convertValue(value, Actor.class); }
  private static Asset copy(Asset value) { return Ocker.JSON.convertValue(value, Asset.class); }
  private static Relationship copy(Relationship value) { return Ocker.JSON.convertValue(value, Relationship.class); }
  private static Note copy(Note value) { return Ocker.JSON.convertValue(value, Note.class); }
  private static Authority copy(Authority value) { return Ocker.JSON.convertValue(value, Authority.class); }
  private static Source copy(Source value) { return Ocker.JSON.convertValue(value, Source.class); }
  private static Paragraph copy(Paragraph value) { return Ocker.JSON.convertValue(value, Paragraph.class); }
}
