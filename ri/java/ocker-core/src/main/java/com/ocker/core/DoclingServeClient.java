// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import static com.ocker.core.OckerTypes.*;

/** Converts PDFs through a Docling Serve instance using its public multipart file API. */
public final class DoclingServeClient {
  public static final String DEFAULT_BASE_URL = "http://localhost:5001";
  private final URI baseUrl;
  private final HttpClient http;
  private final Duration requestTimeout;

  private DoclingServeClient(Builder builder) {
    baseUrl = normalise(builder.baseUrl);
    requestTimeout = builder.requestTimeout;
    http = HttpClient.newBuilder().connectTimeout(builder.connectTimeout).build();
  }
  public static Builder builder() { return new Builder(); }
  public static DoclingServeClient local() { return builder().build(); }
  public URI baseUrl() { return baseUrl; }

  /** Checks that the service can be reached and reports a healthy status without submitting any document. */
  public void testConnection() throws IOException {
    JsonNode health = request(HttpRequest.newBuilder(endpoint("/health")).GET().timeout(requestTimeout).build(), null);
    if (!"ok".equalsIgnoreCase(health.path("status").asText())) throw new IOException("Docling Serve at " + baseUrl + " did not report health status ok.");
  }

  public Intermediate parsePdf(Path path, String documentId, String title, String kind, OckerOptions options) throws IOException {
    Objects.requireNonNull(path, "path");
    checkCancelled(options);
    byte[] original = Files.readAllBytes(path);
    byte[] body = multipart(path.getFileName().toString(), original);
    String boundary = new String(body, 0, Math.min(body.length, 80), StandardCharsets.ISO_8859_1).split("\\r\\n", 2)[0].substring(2);
    HttpRequest request = HttpRequest.newBuilder(endpoint("/v1/convert/file"))
        .timeout(requestTimeout).header("Accept", "application/json")
        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
        .POST(HttpRequest.BodyPublishers.ofByteArray(body)).build();
    JsonNode response = request(request, options);
    if (!"success".equalsIgnoreCase(response.path("status").asText())) throw new IOException("Docling Serve conversion did not succeed: " + compact(response.path("errors").toString()));
    JsonNode document = doclingDocument(response);
    List<Paragraph> paragraphs = paragraphs(documentId, document);
    if (paragraphs.isEmpty()) throw new IOException("Docling Serve returned no readable document content for " + path.getFileName());
    Asset asset = new Asset(UUID.randomUUID().toString(), path.getFileName().toString(), "application/pdf", hex(sha(original)), original.length, Base64.getEncoder().encodeToString(original), null, null, null, null);
    return new Intermediate("ocker-document", "0.1.0", new Document(documentId, title == null ? path.getFileName().toString() : title, kind == null ? "report" : kind, null, asset.id(), paragraphs), asset);
  }

  private JsonNode request(HttpRequest request, OckerOptions options) throws IOException {
    try {
      CompletableFuture<HttpResponse<String>> pending = http.sendAsync(request, HttpResponse.BodyHandlers.ofString());
      while (true) {
        try { checkCancelled(options); } catch (CancellationException error) { pending.cancel(true); throw error; }
        try { return response(pending.get(100, TimeUnit.MILLISECONDS)); }
        catch (TimeoutException ignored) { }
        catch (ExecutionException error) { throw unavailable(error.getCause()); }
      }
    } catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new IOException("Interrupted while contacting Docling Serve", error); }
    catch (CancellationException error) { throw error; }
  }
  private JsonNode response(HttpResponse<String> response) throws IOException {
    if (response.statusCode() < 200 || response.statusCode() >= 300) throw new IOException("Docling Serve at " + baseUrl + " returned HTTP " + response.statusCode() + ": " + compact(response.body()));
    try { return Ocker.JSON.readTree(response.body()); }
    catch (Exception error) { throw new IOException("Docling Serve at " + baseUrl + " returned invalid JSON", error); }
  }
  private IOException unavailable(Throwable error) { return new IOException("Could not reach Docling Serve at " + baseUrl + ". Start the service and use Test connection before importing PDFs.", error); }
  private static void checkCancelled(OckerOptions options) { if (options != null && options.cancellation.cancelled()) throw new CancellationException(); }
  private URI endpoint(String path) { return baseUrl.resolve(path.startsWith("/") ? path.substring(1) : path); }
  private static URI normalise(String value) {
    try {
      String url = value == null || value.isBlank() ? DEFAULT_BASE_URL : value.trim(); if (!url.endsWith("/")) url += "/";
      URI uri = URI.create(url);
      if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null || uri.getRawUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null) throw new IllegalArgumentException("Docling Serve URL must be an HTTP(S) base URL without credentials, query or fragment");
      return uri;
    } catch (IllegalArgumentException error) { throw new IllegalArgumentException("Invalid Docling Serve URL", error); }
  }
  private static String compact(String value) { if (value == null) return ""; value = value.replaceAll("\\s+", " ").trim(); return value.length() > 300 ? value.substring(0, 300) + "…" : value; }
  private static byte[] multipart(String filename, byte[] content) throws IOException {
    String boundary = "ocker-" + UUID.randomUUID(); ByteArrayOutputStream output = new ByteArrayOutputStream();
    field(output, boundary, "from_formats", "pdf"); field(output, boundary, "to_formats", "json"); field(output, boundary, "do_ocr", "true"); field(output, boundary, "do_table_structure", "true"); field(output, boundary, "image_export_mode", "placeholder");
    output.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"files\"; filename=\"" + quoted(filename) + "\"\r\nContent-Type: application/pdf\r\n\r\n").getBytes(StandardCharsets.UTF_8));
    output.write(content); output.write("\r\n".getBytes(StandardCharsets.UTF_8)); output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8)); return output.toByteArray();
  }
  private static void field(OutputStream output, String boundary, String name, String value) throws IOException { output.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"" + name + "\"\r\n\r\n" + value + "\r\n").getBytes(StandardCharsets.UTF_8)); }
  private static String quoted(String value) { return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "").replace("\n", ""); }

  private static JsonNode doclingDocument(JsonNode response) throws IOException {
    JsonNode candidate = response.path("document"); if (candidate.has("json_content")) candidate = candidate.path("json_content");
    else if (response.has("json_content")) candidate = response.path("json_content");
    if (!candidate.isObject() || (!candidate.has("body") && !candidate.has("texts"))) throw new IOException("Docling Serve response did not contain document.json_content");
    return candidate;
  }
  private static List<Paragraph> paragraphs(String documentId, JsonNode document) throws IOException {
    List<Content> content = new ArrayList<>(); Set<String> seenRefs = new HashSet<>();
    walk(document.path("body"), document, null, seenRefs, content);
    if (content.isEmpty()) { // A defensively supported shape for services that omit the body tree.
      for (String collection : List.of("texts", "tables", "pictures")) for (JsonNode node : document.path(collection)) walk(node, document, null, seenRefs, content);
    }
    List<Paragraph> paragraphs = new ArrayList<>(); Map<Integer, Integer> numbers = new HashMap<>();
    for (Content item : content) if (item.page != null && !item.text.isBlank()) { int number = numbers.merge(item.page, 1, Integer::sum); paragraphs.add(new Paragraph(documentId + "-p" + item.page + "-" + number, item.page, "p" + item.page + "." + number, item.text)); }
    return paragraphs;
  }
  private static void walk(JsonNode node, JsonNode document, Integer inheritedPage, Set<String> seenRefs, List<Content> output) throws IOException {
    if (node == null || node.isMissingNode() || node.isNull()) return;
    String ref = reference(node); if (ref != null) { if (!seenRefs.add(ref)) return; JsonNode resolved = resolve(document, ref); if (resolved == null) throw new IOException("Docling document contains an unresolved reference: " + ref); walk(resolved, document, inheritedPage, seenRefs, output); return; }
    if (node.isArray()) { for (JsonNode child : node) walk(child, document, inheritedPage, seenRefs, output); return; }
    if (!node.isObject()) return;
    if ("furniture".equalsIgnoreCase(node.path("content_layer").asText())) return;
    Integer page = page(node, inheritedPage);
    if (node.has("data") && node.path("data").isObject()) add(output, page, tableText(node.path("data")));
    else add(output, page, text(node));
    if (node.has("children")) walk(node.path("children"), document, page, seenRefs, output);
  }
  private static void add(List<Content> output, Integer page, String text) throws IOException { if (text != null && !text.isBlank()) { if (page == null) throw new IOException("Docling body content is missing page provenance."); output.add(new Content(page, text.trim())); } }
  private static String text(JsonNode node) { if (node.path("text").isTextual()) return node.path("text").asText(); return node.path("content").isTextual() ? node.path("content").asText() : ""; }
  private static String reference(JsonNode node) { for (String name : List.of("$ref", "cref")) if (node.path(name).isTextual()) return node.path(name).asText(); if (node.size() == 1 && node.path("self_ref").isTextual()) return node.path("self_ref").asText(); return null; }
  private static JsonNode resolve(JsonNode document, String ref) {
    if (!ref.startsWith("#/")) return null; JsonNode current = document;
    for (String piece : ref.substring(2).split("/")) { try { current = current.isArray() ? current.path(Integer.parseInt(piece)) : current.path(piece); } catch (NumberFormatException error) { return null; } }
    return current.isMissingNode() ? null : current;
  }
  private static Integer page(JsonNode node, Integer fallback) throws IOException {
    JsonNode prov = node.path("prov"); if (prov.isMissingNode() || prov.isNull()) return fallback;
    if (!prov.isArray() || prov.isEmpty() || !prov.get(0).path("page_no").isIntegralNumber() || prov.get(0).path("page_no").asInt() < 1) throw new IOException("Docling content has invalid page provenance.");
    return prov.get(0).path("page_no").asInt();
  }
  private static String tableText(JsonNode data) {
    JsonNode grid = data.path("grid"); if (grid.isArray()) { List<String> rows = new ArrayList<>(); for (JsonNode row : grid) { List<String> cells = new ArrayList<>(); for (JsonNode cell : row) cells.add(cell.isTextual() ? cell.asText() : cell.path("text").asText("")); rows.add(String.join(" | ", cells)); } return String.join("\n", rows).trim(); }
    JsonNode cells = data.path("table_cells"); if (!cells.isArray()) return ""; TreeMap<Integer, TreeMap<Integer, String>> rows = new TreeMap<>(); int sequence = 0;
    for (JsonNode cell : cells) { int row = cell.path("start_row_offset_idx").asInt(cell.path("row").asInt(0)); int column = cell.path("start_col_offset_idx").asInt(cell.path("col").asInt(sequence++)); rows.computeIfAbsent(row, ignored -> new TreeMap<>()).put(column, cell.path("text").asText("")); }
    return rows.values().stream().map(row -> String.join(" | ", row.values())).filter(value -> !value.isBlank()).collect(java.util.stream.Collectors.joining("\n"));
  }
  private static byte[] sha(byte[] value) { try { return MessageDigest.getInstance("SHA-256").digest(value); } catch (Exception error) { throw new IllegalStateException(error); } }
  private static String hex(byte[] value) { return HexFormat.of().formatHex(value); }
  private record Content(Integer page, String text) { }

  public static final class Builder {
    private String baseUrl = DEFAULT_BASE_URL; private Duration connectTimeout = Duration.ofSeconds(10); private Duration requestTimeout = Duration.ofMinutes(5);
    public Builder baseUrl(String value) { baseUrl = value; return this; }
    public Builder connectTimeout(Duration value) { connectTimeout = positive(value, "connect timeout"); return this; }
    public Builder requestTimeout(Duration value) { requestTimeout = positive(value, "request timeout"); return this; }
    public DoclingServeClient build() { return new DoclingServeClient(this); }
    private static Duration positive(Duration value, String name) { if (value == null || value.isZero() || value.isNegative()) throw new IllegalArgumentException(name + " must be positive"); return value; }
  }
}
