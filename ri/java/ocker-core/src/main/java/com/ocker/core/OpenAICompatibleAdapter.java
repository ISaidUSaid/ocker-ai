// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;
import com.fasterxml.jackson.databind.*; import com.fasterxml.jackson.databind.node.*; import java.net.URI; import java.net.http.*; import java.time.Duration;
/** Optional generic chat-completions adapter. It never persists its configuration. */
public final class OpenAICompatibleAdapter implements CompletionAdapter {
 private final String endpoint, model, key; private final ObjectMapper json=new ObjectMapper(); private final HttpClient http=HttpClient.newHttpClient();
 public OpenAICompatibleAdapter(String endpoint,String model,String apiKey){this.endpoint=endpoint;this.model=model;this.key=apiKey;}
 public JsonNode complete(String task,String prompt,JsonNode input,OckerOptions.Cancellation cancel) throws Exception { if(cancel.cancelled()) throw new java.util.concurrent.CancellationException(); ObjectNode body=json.createObjectNode().put("model",model).put("response_format","json_object"); ArrayNode m=body.putArray("messages"); m.addObject().put("role","system").put("content",prompt); m.addObject().put("role","user").put("content",input.toString()); HttpRequest.Builder b=HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(90)).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))); if(key!=null&&!key.isBlank())b.header("Authorization","Bearer "+key); HttpResponse<String> r=http.send(b.build(),HttpResponse.BodyHandlers.ofString()); if(r.statusCode()/100!=2)throw new IllegalStateException("LLM returned HTTP "+r.statusCode()); JsonNode n=json.readTree(r.body()); return json.readTree(n.path("choices").path(0).path("message").path("content").asText()); }
}
