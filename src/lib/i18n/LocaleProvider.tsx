"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

import { getTranslations } from "@/lib/i18n/getTranslations";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, LOCALE_KEY } from "@/lib/i18n/locale";
import { resolveLocale } from "@/lib/i18n/resolveLocale";
import type { Locale, Translations } from "@/lib/i18n/types";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
  };
}

function readLocaleCookie(): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${LOCALE_COOKIE_NAME}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

function getSnapshot(): Locale {
  return resolveLocale(readLocaleCookie(), undefined, DEFAULT_LOCALE);
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => initialLocale);
  const t = getTranslations(locale);

  function setLocale(next: Locale) {
    localStorage.setItem(LOCALE_KEY, next);
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new StorageEvent("storage", { key: LOCALE_KEY, newValue: next }));
  }

  useEffect(() => {
    if (readLocaleCookie() === null) {
      const detected = resolveLocale(null, navigator.language, DEFAULT_LOCALE);
      if (detected !== locale) setLocale(detected);
    }
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t["app.title"];

    let descriptionMeta = document.head.querySelector('meta[name="description"]');

    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.setAttribute("name", "description");
      document.head.appendChild(descriptionMeta);
    }

    descriptionMeta.setAttribute("content", t["app.subtitle"]);
  }, [locale, t]);

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
