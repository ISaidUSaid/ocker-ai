// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;
import com.fasterxml.jackson.databind.JsonNode;
/** Pluggable completion transport; implementations must check cancellation before network work. */
@FunctionalInterface public interface CompletionAdapter { JsonNode complete(String task, String prompt, JsonNode input, OckerOptions.Cancellation cancellation) throws Exception; }
