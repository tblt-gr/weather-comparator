export const THEME_COOKIE_NAME = "weather-compare.theme";

export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "dark";

export const THEME_COLORS: Record<Theme, string> = {
  light: "#eef1f5",
  dark: "#0a1322",
};

export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}
