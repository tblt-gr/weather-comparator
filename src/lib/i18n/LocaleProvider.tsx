"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

import { en } from "@/lib/i18n/locales/en";
import { fr } from "@/lib/i18n/locales/fr";
import { resolveLocale } from "@/lib/i18n/resolveLocale";
import type { Locale, Translations } from "@/lib/i18n/types";

const LOCALE_KEY = "weather-compare.locale";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Locale {
  return resolveLocale(localStorage.getItem(LOCALE_KEY), navigator.language, "fr");
}

function getServerSnapshot(): Locale {
  return "fr";
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setLocale(next: Locale) {
    localStorage.setItem(LOCALE_KEY, next);
    window.dispatchEvent(new StorageEvent("storage", { key: LOCALE_KEY, newValue: next }));
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
