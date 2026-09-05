import type { WeatherConditionKind } from "@/features/weather/types";

export type WeatherIconTone =
  | "sun"
  | "mixed-sun"
  | "cloud"
  | "rain"
  | "drizzle"
  | "snow"
  | "ice"
  | "bolt"
  | "fog";

const WEATHER_ICON_TONES: Record<WeatherConditionKind, WeatherIconTone> = {
  clear: "sun",
  mainly_clear: "sun",
  partly_cloudy: "mixed-sun",
  overcast: "cloud",
  fog: "fog",
  drizzle: "drizzle",
  freezing_drizzle: "ice",
  rain: "rain",
  freezing_rain: "ice",
  snow: "snow",
  snow_grains: "snow",
  rain_showers: "rain",
  snow_showers: "snow",
  thunderstorm: "bolt",
  thunderstorm_hail: "bolt",
  unknown: "cloud",
};

export function getWeatherIconTone(kind: WeatherConditionKind): WeatherIconTone {
  return WEATHER_ICON_TONES[kind];
}

export const WEATHER_PART_COLORS = {
  cloud: "var(--muted-foreground)",
  sun: "var(--weather-sun, oklch(0.78 0.16 92))",
  rain: "var(--weather-rain, oklch(0.62 0.12 245))",
  drizzle: "var(--weather-drizzle, oklch(0.68 0.08 235))",
  snow: "var(--weather-snow, oklch(0.9 0.02 240))",
  ice: "var(--weather-ice, oklch(0.68 0.1 210))",
  bolt: "var(--weather-bolt, oklch(0.78 0.18 75))",
  fog: "var(--weather-fog, oklch(0.7 0.03 240))",
} as const;

export function getWeatherPartColor(tone: WeatherIconTone, index: number, count: number): string {
  if (tone === "sun") {
    return WEATHER_PART_COLORS.sun;
  }

  if (tone === "cloud") {
    return WEATHER_PART_COLORS.cloud;
  }

  if (tone === "mixed-sun") {
    return index === count - 1 ? WEATHER_PART_COLORS.cloud : WEATHER_PART_COLORS.sun;
  }

  return index === 0 ? WEATHER_PART_COLORS.cloud : WEATHER_PART_COLORS[tone];
}
