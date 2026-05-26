import type { Locale } from "@/lib/i18n/types";

export function resolveLocale(stored: string | null, browserLang: string): Locale {
  if (stored === "fr" || stored === "en") return stored;
  return browserLang.startsWith("fr") ? "fr" : "en";
}
