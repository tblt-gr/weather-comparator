export const THEME_COOKIE_NAME = "weather-compare.theme";

export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "dark";

export const THEME_COLORS: Record<Theme, string> = {
  light: "#f0f3f7",
  dark: "#090f1c",
};

export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}
