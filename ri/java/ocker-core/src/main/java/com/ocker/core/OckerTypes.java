// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.*;

/** Contract value types. Extensions are the only forward-compatible unknown fields. */
public final class OckerTypes {
  private OckerTypes() {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record DateValue(String precision, String value, String end, Boolean approximate, String basis) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Selector(String kind, Double start, Double end, Integer page) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Source(String documentId, String paragraphId, Integer page, String quote, String assetId, Selector selector) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Paragraph(String id, int page, String label, String text) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Document(String id, String title, String kind, String author, String assetId, List<Paragraph> paragraphs) { public Document { paragraphs = List.copyOf(paragraphs == null ? List.of() : paragraphs); } }
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Actor(String id, String name, String role, Map<String,Object> extensions) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Event(String id, String title, String summary, DateValue date, String assertedBy, List<String> actorIds, List<Source> sources, String status, String narrative, Map<String,Object> extensions) { public Event { actorIds=List.copyOf(actorIds==null?List.of():actorIds); sources=List.copyOf(sources==null?List.of():sources); } }
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Provenance(String method, String createdAt, String authorId) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Relationship(String id, String from, String to, String type, String rationale, Provenance provenance, @JsonInclude(JsonInclude.Include.NON_EMPTY) List<Source> sources, Map<String,Object> extensions) { public Relationship { sources=List.copyOf(sources==null?List.of():sources); } }
  public record Position(double x, double y) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Note(String id, String eventId, String body, Position position, String createdAt, String updatedAt, String authorId, Map<String,Object> extensions) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Authority(String id, String eventId, String title, String citation, String type, String color, String pinpoint, String court, String jurisdiction, String sourceUrl, String body, String createdAt, String updatedAt, String authorId, Map<String,Object> extensions) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Asset(String id, String name, String mediaType, String sha256, long byteLength, String data, String uri, String derivedFrom, Map<String,Object> selector, Map<String,Object> extensions) {}
  @JsonInclude(JsonInclude.Include.NON_NULL) public record Intermediate(String format, String version, Document document, Asset asset) {}
}
