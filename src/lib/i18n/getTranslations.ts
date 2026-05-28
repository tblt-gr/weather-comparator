import { en } from "@/lib/i18n/locales/en";
import { fr } from "@/lib/i18n/locales/fr";
import type { Locale, Translations } from "@/lib/i18n/types";

export function getTranslations(locale: Locale): Translations {
  return locale === "en" ? en : fr;
}
