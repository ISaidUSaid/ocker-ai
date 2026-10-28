// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.consumer;

import com.ocker.core.*;
import com.ocker.core.OckerTypes.Note;
import com.ocker.core.OckerTypes.Position;
import com.ocker.fx.ChronologyView;
import java.net.URI;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ConsumerAcceptanceTest {
  @Test void installedArtifactsSupportHeadlessSdkAndJavafxCompilation() throws Exception {
    Path expectedRepository = Path.of(System.getProperty("consumer.repository")).toRealPath();
    URI coreLocation = Ocker.class.getProtectionDomain().getCodeSource().getLocation().toURI();
    Path coreJar = Path.of(coreLocation).toRealPath();
    assertTrue(coreJar.startsWith(expectedRepository), () -> "OCKER resolved outside installed repository: " + coreJar);
    assertTrue(coreJar.getFileName().toString().endsWith(".jar"));
    assertNotNull(ChronologyView.class); // Maven compiles the UI dependency without a workspace source link.
    assertNotNull(Ocker.class.getResourceAsStream("/ocker.schema.json"));
    assertNotNull(Ocker.class.getResourceAsStream("/prompts.json"));
    for (PromptLocale locale : PromptLocale.values()) {
      assertFalse(Ocker.prompt(locale, "extract").isBlank());
      assertFalse(Ocker.prompt(locale, "relate").isBlank());
    }
    assertNotNull(Ocker.class.getResourceAsStream("/LICENSE"));
    assertNotNull(Ocker.class.getResourceAsStream("/NOTICE"));

    String fixture = new String(Objects.requireNonNull(getClass().getResourceAsStream("/joe-jill.ocker.json")).readAllBytes());
    OckerRecord record = Ocker.importRecord(fixture);
    OckerGraph graph = Ocker.graph(record);
    String relatedEvent = record.events().stream().map(event -> event.id()).filter(id -> !graph.getRelatedEvents(id).isEmpty()).findFirst().orElseThrow();
    assertFalse(graph.getRelatedEvents(relatedEvent).isEmpty());
    OckerRecord annotated = Ocker.recordBuilder(record)
      .addNote(new Note("consumer-note", relatedEvent, "consumer annotation", new Position(4, 5), Instant.now().toString(), Instant.now().toString(), null, null))
      .build();
    assertNotNull(Ocker.importRecord(Ocker.exportRecord(annotated)));
  }
}
