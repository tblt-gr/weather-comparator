"use client";

import { createContext, useContext, useState } from "react";

import { en } from "@/lib/i18n/locales/en";
import { fr } from "@/lib/i18n/locales/fr";
import { resolveLocale } from "@/lib/i18n/resolveLocale";
import type { Locale, Translations } from "@/lib/i18n/types";

const LOCALE_KEY = "weather-compare.locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return resolveLocale(localStorage.getItem(LOCALE_KEY), navigator.language);
  });

  function setLocale(next: Locale) {
    localStorage.setItem(LOCALE_KEY, next);
    setLocaleState(next);
  }

  const t = locale === "en" ? en : fr;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
