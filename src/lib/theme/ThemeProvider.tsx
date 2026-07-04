"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

import { parseTheme, THEME_COLORS, THEME_COOKIE_NAME, type Theme } from "@/lib/theme/theme";

type ThemeContextValue = {
  setTheme: (theme: Theme) => void;
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribe(callback: () => void) {
  const listener = () => callback();

  window.addEventListener("storage", listener);
  window.addEventListener("theme-change", listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("theme-change", listener);
  };
}

function getThemeCookieValue() {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.slice(THEME_COOKIE_NAME.length + 1);
}

function getSnapshot(): Theme {
  return parseTheme(getThemeCookieValue());
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => initialTheme);

  function setTheme(nextTheme: Theme) {
    document.cookie = `${THEME_COOKIE_NAME}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[nextTheme]);
    window.dispatchEvent(new Event("theme-change"));
  }

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
