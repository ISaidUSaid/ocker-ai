// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import java.time.Instant;
import java.util.*;
import static com.ocker.core.OckerTypes.*;

/** Fluent, provider-free construction of a validated portable OCKER record. */
public final class OckerRecordBuilder {
  private final OckerRecord base;
  private final List<Actor> actors;
  private final List<Document> documents;
  private final List<Event> events;
  private final List<Relationship> relationships;
  private final List<Note> notes;
  private final List<Authority> authorities;
  private final List<Asset> assets;

  private OckerRecordBuilder(OckerRecord base) {
    this.base = copy(base);
    actors = new ArrayList<>(copyAll(base.actors(), Actor.class)); documents = new ArrayList<>(copyAll(base.documents(), Document.class));
    events = new ArrayList<>(copyAll(base.events(), Event.class)); relationships = new ArrayList<>(copyAll(base.relationships(), Relationship.class));
    notes = new ArrayList<>(copyAll(base.notes(), Note.class)); authorities = new ArrayList<>(copyAll(base.authorities(), Authority.class)); assets = new ArrayList<>(copyAll(base.assets(), Asset.class));
  }

  public static OckerRecordBuilder create(String title) { return new OckerRecordBuilder(Ocker.createRecord(title)); }
  public static OckerRecordBuilder from(OckerRecord record) { Ocker.validateStrict(record); return new OckerRecordBuilder(record); }
  public OckerRecordBuilder addActor(Actor value) { actors.add(copy(value)); return this; }
  public OckerRecordBuilder addAsset(Asset value) { assets.add(copy(value)); return this; }
  public OckerRecordBuilder addDocument(Document value) { documents.add(copy(value)); return this; }
  public OckerRecordBuilder addEvent(Event value) { events.add(copy(value)); return this; }
  public OckerRecordBuilder addRelationship(Relationship value) { relationships.add(copy(value)); return this; }
  public OckerRecordBuilder addNote(Note value) { notes.add(copy(value)); return this; }
  public OckerRecordBuilder addAuthority(Authority value) { authorities.add(copy(value)); return this; }
  public OckerRecordBuilder addIntermediate(Intermediate value) {
    if (value == null || value.document() == null) throw new Ocker.ValidationException(List.of("intermediate document required"));
    Ocker.validateIntermediate(value);
    documents.add(copy(value.document())); if (value.asset() != null) assets.add(copy(value.asset())); return this;
  }
  public OckerRecordBuilder addIntermediateDocument(Intermediate value) { return addIntermediate(value); }

  /** Validates references and embedded asset hashes before returning an independent snapshot. */
  public OckerRecord build() {
    OckerRecord built = new OckerRecord(base.format(), base.version(), base.id(), base.title(), base.createdAt(), Instant.now().toString(),
      actors, documents, events, relationships, notes, authorities, assets, base.extensions());
    Ocker.validateStrict(built);
    return copy(built);
  }

  private static <T> List<T> copyAll(List<T> values, Class<T> type) { return values.stream().map(value -> Ocker.JSON.convertValue(value, type)).toList(); }
  private static OckerRecord copy(OckerRecord value) { return Ocker.JSON.convertValue(value, OckerRecord.class); }
  private static Actor copy(Actor value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Actor.class); }
  private static Asset copy(Asset value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Asset.class); }
  private static Document copy(Document value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Document.class); }
  private static Event copy(Event value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Event.class); }
  private static Relationship copy(Relationship value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Relationship.class); }
  private static Note copy(Note value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Note.class); }
  private static Authority copy(Authority value) { return Ocker.JSON.convertValue(Objects.requireNonNull(value), Authority.class); }
}
