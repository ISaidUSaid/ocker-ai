// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;
import java.util.*;
import java.util.function.Consumer;
/** Per-call configuration. Keys are held only by an adapter instance in memory. */
public final class OckerOptions {
  public final CompletionAdapter llm; public final Consumer<Progress> progress; public final Cancellation cancellation; public final String authorId;
  private OckerOptions(Builder b) { llm=b.llm; progress=b.progress; cancellation=b.cancellation; authorId=b.authorId; }
  public static Builder builder(){ return new Builder(); }
  public static final class Builder { CompletionAdapter llm; Consumer<Progress> progress=p->{}; Cancellation cancellation=()->false; String authorId;
    public Builder llm(CompletionAdapter x){llm=x;return this;} public Builder onProgress(Consumer<Progress> x){progress=Objects.requireNonNull(x);return this;} public Builder cancellation(Cancellation x){cancellation=Objects.requireNonNull(x);return this;} public Builder authorId(String x){authorId=x;return this;} public OckerOptions build(){return new OckerOptions(this);} }
  public record Progress(String phase, String message) {} public interface Cancellation { boolean cancelled(); }
}
