import { addForecastDays, formatWindCardinal } from "@/features/weather/logic/forecastOutlook";
import type { Locale, Translations } from "@/lib/i18n/types";
import type { UvRiskLevel } from "@/features/weather/types";

const WEEKDAY_FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "short" }),
  en: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short" }),
};

export const UV_LEVEL_KEYS: Record<UvRiskLevel, keyof Translations> = {
  low: "forecast.uv.low",
  moderate: "forecast.uv.moderate",
  high: "forecast.uv.high",
  very_high: "forecast.uv.veryHigh",
  extreme: "forecast.uv.extreme",
};

export function formatOutlookDayLabel(date: string, today: string, locale: Locale, t: Translations) {
  if (date === today) {
    return t["forecast.today"];
  }

  if (date === addForecastDays(today, 1)) {
    return t["forecast.tomorrow"];
  }

  return WEEKDAY_FORMATTERS[locale].format(new Date(`${date}T12:00:00.000Z`));
}

export function formatOutlookDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export function formatCompactTemp(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}°`;
}

export function formatPrecipitation(
  sum: number | null,
  probability: number | null,
  t: Translations
) {
  const amount = sum === null ? "—" : `${trimNumber(sum)} mm`;

  if (probability === null) {
    return amount;
  }

  return `${amount} · ${t["forecast.precipChance"].replace("{percent}", String(Math.round(probability)))}`;
}

export function formatWind(
  speed: number | null,
  gusts: number | null,
  direction: number | null,
  t: Translations
) {
  if (speed === null) {
    return t["forecast.wind"];
  }

  const cardinal = formatWindCardinal(direction);
  const gustLabel = gusts === null ? "" : ` (${Math.round(gusts)})`;

  return `${cardinal ? `${cardinal} ` : ""}${Math.round(speed)}${gustLabel} km/h`;
}

export function formatHumidity(value: number | null, t: Translations) {
  if (value === null) {
    return t["forecast.humidity"];
  }

  return `${t["forecast.humidity"]} ${Math.round(value)} %`;
}

export function formatUvLabel(value: number | null, t: Translations) {
  return value === null ? t["forecast.uv"] : `${t["forecast.uv"]} ${trimNumber(value)}`;
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
