// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
package com.ocker.core;

import java.util.Locale;

/**
 * The language used for public RI instructions sent to a completion provider.
 * The portable OCKER JSON keys remain English regardless of this choice.
 */
public enum PromptLocale {
    EN("en", "English"),
    ES("es", "Español"),
    PT("pt", "Português"),
    FR("fr", "Français"),
    DE("de", "Deutsch");

    private final String tag;
    private final String displayName;
    PromptLocale(String tag, String displayName) { this.tag = tag; this.displayName = displayName; }
    public String tag() { return tag; }
    public String displayName() { return displayName; }
    @Override public String toString() { return displayName; }

    /** Uses the primary BCP-47 language subtag and safely falls back to English. */
    public static PromptLocale fromLanguageTag(String value) {
        if (value == null || value.isBlank()) return EN;
        String primary = value.replace('_', '-').split("-", 2)[0].toLowerCase(Locale.ROOT);
        for (PromptLocale locale : values()) if (locale.tag.equals(primary)) return locale;
        return EN;
    }
    public static PromptLocale fromSystemLocale() { return fromLanguageTag(Locale.getDefault().toLanguageTag()); }
}
