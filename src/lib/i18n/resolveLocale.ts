import type { Locale } from "@/lib/i18n/types";

export function resolveLocale(
  stored: string | null,
  browserLang?: string,
  fallback: Locale = "en"
): Locale {
  if (stored === "fr" || stored === "en") return stored;
  if (browserLang?.startsWith("fr")) return "fr";
  if (browserLang?.startsWith("en")) return "en";
  return fallback;
}
