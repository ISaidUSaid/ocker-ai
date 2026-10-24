// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import static com.ocker.core.OckerTypes.*;
import static org.junit.jupiter.api.Assertions.*;

class OckerSdkTest {
  @Test void graphIsBidirectionalOrderedFilteredAndResolvesFallbackEvidence() {
    OckerGraph graph = Ocker.graph(record());
    assertEquals(List.of("r1", "r2"), graph.getRelationships("e1").stream().map(Relationship::id).toList());
    assertEquals(List.of("r1"), graph.getRelationships("e1", "supports").stream().map(Relationship::id).toList());
    assertEquals(List.of("e2", "e3"), graph.getRelatedEvents("e1").stream().map(Event::id).toList());
    assertEquals(List.of("e1"), graph.getRelatedEvents("e2", "supports").stream().map(Event::id).toList());
    OckerGraph.Evidence evidence = graph.getEvidence("e1").getFirst();
    assertEquals("d1", evidence.document().id()); assertEquals("p1", evidence.paragraph().id());
    assertEquals("a1", evidence.asset().id()); assertEquals("quoted account", evidence.source().quote());
    assertEquals(List.of("n1"), graph.getNotes("e1").stream().map(Note::id).toList());
    assertEquals(List.of("a1-note"), graph.getAuthorities("e1").stream().map(Authority::id).toList());
    assertTrue(graph.getEvent("missing").isEmpty()); assertTrue(graph.getDocument("missing").isEmpty());
    assertThrows(Ocker.ValidationException.class, () -> graph.getRelatedEvents("missing"));
    assertThrows(IllegalArgumentException.class, () -> graph.getRelationships("e1", "other"));
  }

  @Test void graphReturnsIndependentSnapshots() {
    OckerGraph graph = Ocker.graph(record());
    Map<String, Object> returned = new LinkedHashMap<>(graph.getRecord().extensions()); returned.put("changed", true);
    OckerRecord changed = new OckerRecord(graph.getRecord().format(), graph.getRecord().version(), graph.getRecord().id(), graph.getRecord().title(), graph.getRecord().createdAt(), graph.getRecord().updatedAt(), graph.getRecord().actors(), graph.getRecord().documents(), graph.getRecord().events(), graph.getRecord().relationships(), graph.getRecord().notes(), graph.getRecord().authorities(), graph.getRecord().assets(), returned);
    assertTrue(changed.extensions().containsKey("changed"));
    assertFalse(graph.getRecord().extensions().containsKey("changed"));
  }

  @Test void builderBuildsIndependentRoundTripAndRejectsInvalidReferencesAndHashes() throws Exception {
    OckerRecord original = record();
    OckerRecord built = OckerRecordBuilder.from(original).build();
    assertEquals(original.events().size(), built.events().size()); assertNotSame(original, built);
    assertEquals(built, Ocker.parseRecord(Ocker.exportRecord(built)));
    Intermediate intermediate = new Intermediate("ocker-document", "0.1.0", original.documents().getFirst(), original.assets().getFirst());
    OckerRecord viaIntermediate = OckerRecordBuilder.create("new record").addIntermediate(intermediate).build();
    assertEquals(1, viaIntermediate.documents().size()); assertEquals(1, viaIntermediate.assets().size());
    Document dangling = new Document("bad-document", "Bad", "report", null, "missing", List.of());
    assertThrows(Ocker.ValidationException.class, () -> OckerRecordBuilder.create("bad").addDocument(dangling).build());
    Asset corrupt = new Asset("bad-asset", "bad.txt", "text/plain", "00", 3, Base64.getEncoder().encodeToString("bad".getBytes(StandardCharsets.UTF_8)), null, null, null, null);
    assertThrows(Ocker.ValidationException.class, () -> OckerRecordBuilder.create("bad").addAsset(corrupt).build());
  }

  private static OckerRecord record() {
    String now = Instant.parse("2026-01-01T00:00:00Z").toString();
    byte[] bytes = "source bytes".getBytes(StandardCharsets.UTF_8);
    Asset asset = new Asset("a1", "source.txt", "text/plain", hash(bytes), bytes.length, Base64.getEncoder().encodeToString(bytes), "https://example.test/source.txt", null, null, null);
    Document document = new Document("d1", "Account", "affidavit", "Jill", "a1", List.of(new Paragraph("p1", 1, "p1", "quoted account")));
    Source source = new Source("d1", "p1", 1, "quoted account", null, new Selector("text", null, null, 1));
    Event first = event("e1", "First", source); Event second = event("e2", "Second", source); Event third = event("e3", "Third", source);
    Actor actor = new Actor("person", "Jill", "author", Map.of());
    Provenance provenance = new Provenance("human", now, "person");
    Relationship supports = new Relationship("r1", "e1", "e2", "supports", "same account", provenance, List.of(source), Map.of());
    Relationship contradicts = new Relationship("r2", "e3", "e1", "contradicts", "different account", provenance, List.of(), Map.of());
    Note note = new Note("n1", "e1", "review", new Position(1, 2), now, now, "person", Map.of());
    Authority authority = new Authority("a1-note", "e1", "Authority", "Citation", "persuasive", "blue", null, null, null, "https://example.test/authority", "body", now, now, "person", Map.of());
    return new OckerRecord("ocker", "0.1.0", "record", "SDK", now, now, List.of(actor), List.of(document), List.of(first, second, third), List.of(supports, contradicts), List.of(note), List.of(authority), List.of(asset), Map.of("stable", true));
  }
  private static Event event(String id, String title, Source source) { return new Event(id, title, title, new DateValue("day", "2026-01-01", null, null, null), "Jill", List.of("person"), List.of(source), "unresolved", null, Map.of()); }
  private static String hash(byte[] value) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value)); } catch (Exception error) { throw new AssertionError(error); } }
}
