export const THEME_COOKIE_NAME = "weather-compare.theme";

export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "dark";

export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}
