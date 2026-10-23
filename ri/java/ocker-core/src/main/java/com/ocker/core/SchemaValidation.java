// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.networknt.schema.*;
import java.io.InputStream;
import java.util.*;

/** Loads the shared Draft 2020-12 schemas packaged with the Java library. */
final class SchemaValidation {
 private static final JsonSchema RECORD=load("ocker.schema.json"), DOCUMENT=load("document.schema.json");
 private SchemaValidation() {}
 static void record(JsonNode node){check(RECORD,node);} static void document(JsonNode node){check(DOCUMENT,node);}
 private static JsonSchema load(String resource){try(InputStream in=SchemaValidation.class.getResourceAsStream("/"+resource)){if(in==null)throw new IllegalStateException("Missing OCKER schema resource "+resource);return JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012).getSchema(in);}catch(Exception e){throw new IllegalStateException("Cannot load OCKER schema",e);}}
 private static void check(JsonSchema schema,JsonNode node){Set<ValidationMessage> messages=schema.validate(node);if(!messages.isEmpty())throw new Ocker.ValidationException(messages.stream().map(ValidationMessage::getMessage).sorted().toList());}
}
