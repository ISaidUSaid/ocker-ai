// SPDX-License-Identifier: Apache-2.0
package com.ocker.core;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class DoclingServeClientTest {
  private HttpServer server;
  private String lastBody;
  private String health = "{\"status\":\"ok\"}";
  private String conversion = response();

  @BeforeEach void start() throws IOException {
    server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
    server.createContext("/health", exchange -> reply(exchange, 200, health));
    server.createContext("/v1/convert/file", exchange -> { lastBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.ISO_8859_1); reply(exchange, 200, conversion); });
    server.start();
  }
  @AfterEach void stop() { server.stop(0); }

  @Test void postsCurrentDoclingMultipartContractAndRetainsOriginalPdf() throws Exception {
    Path file = Files.createTempFile("ocker-docling", ".pdf"); byte[] original = "%PDF-test".getBytes(StandardCharsets.UTF_8); Files.write(file, original);
    DoclingServeClient client = client(); client.testConnection();
    var parsed = Ocker.parsePdf(file, "document", "Evidence", "affidavit", OckerOptions.builder().doclingServe(client).build());
    assertAll(
        () -> assertTrue(lastBody.contains("name=\"files\"; filename=\"ocker-docling"), lastBody),
        () -> assertTrue(lastBody.contains("name=\"from_formats\"\r\n\r\npdf"), lastBody),
        () -> assertTrue(lastBody.contains("name=\"to_formats\"\r\n\r\njson"), lastBody),
        () -> assertTrue(lastBody.contains("name=\"do_ocr\"\r\n\r\ntrue"), lastBody),
        () -> assertTrue(lastBody.contains("name=\"do_table_structure\"\r\n\r\ntrue"), lastBody));
    assertArrayEquals(original, Base64.getDecoder().decode(parsed.asset().data())); assertEquals(3, parsed.document().paragraphs().size());
    assertEquals(1, parsed.document().paragraphs().get(0).page()); assertEquals("First page text", parsed.document().paragraphs().get(0).text());
    assertEquals(2, parsed.document().paragraphs().get(1).page()); assertEquals("Picture OCR text", parsed.document().paragraphs().get(1).text());
    assertEquals(3, parsed.document().paragraphs().get(2).page()); assertEquals("Name | Date\nJenko | 2026-10-28", parsed.document().paragraphs().get(2).text());
  }
  @Test void reportsMissingServerWithActionableMessage() throws Exception {
    int closedPort = server.getAddress().getPort(); server.stop(0);
    IOException error = assertThrows(IOException.class, () -> DoclingServeClient.builder().baseUrl("http://localhost:" + closedPort).build().testConnection());
    assertTrue(error.getMessage().contains("Could not reach Docling Serve")); assertTrue(error.getMessage().contains("Test connection"));
  }
  @Test void rejectsUnhealthyAndPartialResponses() throws Exception {
    health = "{\"status\":\"starting\"}";
    assertThrows(IOException.class, () -> client().testConnection());
    health = "{\"status\":\"ok\"}";
    conversion = "{\"status\":\"partial_success\",\"errors\":[{\"message\":\"page failed\"}]}";
    Path file = Files.createTempFile("ocker-docling-partial", ".pdf"); Files.writeString(file, "%PDF-test");
    IOException error = assertThrows(IOException.class, () -> Ocker.parsePdf(file, "document", "Evidence", "affidavit", OckerOptions.builder().doclingServe(client()).build()));
    assertTrue(error.getMessage().contains("did not succeed")); assertTrue(error.getMessage().contains("page failed"));
  }
  @Test void rejectsAnyBodyContentWithoutPageProvenance() throws Exception {
    conversion = "{\"status\":\"success\",\"document\":{\"json_content\":{\"body\":{\"children\":[{\"$ref\":\"#/texts/0\"},{\"$ref\":\"#/texts/1\"}]},\"texts\":[{\"text\":\"Attributed text\",\"prov\":[{\"page_no\":1}]},{\"text\":\"Unattributed text\"}]}}}";
    Path file = Files.createTempFile("ocker-docling-unattributed", ".pdf"); Files.writeString(file, "%PDF-test");
    IOException error = assertThrows(IOException.class, () -> Ocker.parsePdf(file, "document", "Evidence", "affidavit", OckerOptions.builder().doclingServe(client()).build()));
    assertTrue(error.getMessage().contains("missing page provenance"));
  }
  @Test void rejectsInvalidProvenanceAndUnknownBodyReferences() throws Exception {
    conversion = "{\"status\":\"success\",\"document\":{\"json_content\":{\"body\":{\"children\":[{\"$ref\":\"#/texts/0\"}]},\"texts\":[{\"text\":\"Bad page\",\"prov\":[{\"page_no\":0}]}]}}}";
    Path file = Files.createTempFile("ocker-docling-bad-page", ".pdf"); Files.writeString(file, "%PDF-test");
    IOException pageError = assertThrows(IOException.class, () -> Ocker.parsePdf(file, "document", "Evidence", "affidavit", OckerOptions.builder().doclingServe(client()).build()));
    assertTrue(pageError.getMessage().contains("invalid page provenance"));
    conversion = "{\"status\":\"success\",\"document\":{\"json_content\":{\"body\":{\"children\":[{\"$ref\":\"#/texts/99\"}]},\"texts\":[]}}}";
    IOException referenceError = assertThrows(IOException.class, () -> Ocker.parsePdf(file, "document", "Evidence", "affidavit", OckerOptions.builder().doclingServe(client()).build()));
    assertTrue(referenceError.getMessage().contains("unresolved reference"));
  }
  @Test void skipsFurnitureButRetainsRealisticTextNodes() throws Exception {
    conversion = "{\"status\":\"success\",\"document\":{\"json_content\":{\"body\":{\"children\":[{\"$ref\":\"#/texts/0\"},{\"$ref\":\"#/texts/1\"}]},\"texts\":[{\"text\":\"Header\",\"content_layer\":\"furniture\",\"prov\":[{\"page_no\":1}]},{\"text\":\"Body text\",\"content_layer\":\"body\",\"prov\":[{\"page_no\":2}]}]}}}";
    Path file = Files.createTempFile("ocker-docling-furniture", ".pdf"); Files.writeString(file, "%PDF-test");
    var parsed = Ocker.parsePdf(file, "document", "Evidence", "affidavit", OckerOptions.builder().doclingServe(client()).build());
    assertEquals(1, parsed.document().paragraphs().size()); assertEquals(2, parsed.document().paragraphs().getFirst().page()); assertEquals("Body text", parsed.document().paragraphs().getFirst().text());
  }
  @Test void rejectsUnsafeBaseUrls() {
    for (String url : List.of("ftp://localhost:5001", "http://user:pass@localhost:5001", "http://localhost:5001?x=1", "http://localhost:5001#fragment")) assertThrows(IllegalArgumentException.class, () -> DoclingServeClient.builder().baseUrl(url).build());
  }
  private DoclingServeClient client() { return DoclingServeClient.builder().baseUrl("http://localhost:" + server.getAddress().getPort()).build(); }
  private static void reply(HttpExchange exchange, int status, String body) throws IOException { byte[] data = body.getBytes(StandardCharsets.UTF_8); exchange.getResponseHeaders().set("Content-Type", "application/json"); exchange.sendResponseHeaders(status, data.length); try (OutputStream output = exchange.getResponseBody()) { output.write(data); } }
  private static String response() { return """
      {"status":"success","document":{"json_content":{"schema_name":"DoclingDocument",
      "body":{"children":[{"$ref":"#/texts/0"},{"$ref":"#/pictures/0"},{"$ref":"#/tables/0"}]},
      "texts":[{"text":"First page text","content_layer":"body","prov":[{"page_no":1}]},{"text":"Picture OCR text","content_layer":"body","prov":[{"page_no":2}]}],
      "pictures":[{"prov":[{"page_no":2}],"children":[{"$ref":"#/texts/1"}]}],
      "tables":[{"prov":[{"page_no":3}],"data":{"table_cells":[{"text":"Name","start_row_offset_idx":0,"start_col_offset_idx":0},{"text":"Date","start_row_offset_idx":0,"start_col_offset_idx":1},{"text":"Jenko","start_row_offset_idx":1,"start_col_offset_idx":0},{"text":"2026-10-28","start_row_offset_idx":1,"start_col_offset_idx":1}]}}]}}}
      """; }
}
