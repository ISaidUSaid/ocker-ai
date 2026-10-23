// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.*;
import static com.ocker.core.OckerTypes.*;
/** Portable OCKER record. Collections are copied at construction. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OckerRecord(String format, String version, String id, String title, String createdAt, String updatedAt,
  List<Actor> actors, List<Document> documents, List<Event> events, List<Relationship> relationships,
  List<Note> notes, List<Authority> authorities, List<Asset> assets, Map<String,Object> extensions) {
  public OckerRecord { actors=List.copyOf(actors==null?List.of():actors); documents=List.copyOf(documents==null?List.of():documents); events=List.copyOf(events==null?List.of():events); relationships=List.copyOf(relationships==null?List.of():relationships); notes=List.copyOf(notes==null?List.of():notes); authorities=List.copyOf(authorities==null?List.of():authorities); assets=List.copyOf(assets==null?List.of():assets); }
}
