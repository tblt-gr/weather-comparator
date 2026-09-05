import type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
import type { DatePeriod } from "@/features/weather/logic/dates";
import type {
  ForecastHorizonDays,
  ForecastOutlookDay,
  UvRiskLevel,
  WeatherCondition,
  WeatherConditionKind,
} from "@/features/weather/types";

export const UV_RISK_COLORS: Record<UvRiskLevel, string> = {
  low: "oklch(0.58 0.19 142)",
  moderate: "oklch(0.78 0.16 95)",
  high: "oklch(0.67 0.2 50)",
  very_high: "oklch(0.56 0.23 25)",
  extreme: "oklch(0.48 0.22 305)",
};

export const UV_RISK_BANDS: { level: UvRiskLevel; range: string }[] = [
  { level: "low", range: "0–2" },
  { level: "moderate", range: "3–5" },
  { level: "high", range: "6–7" },
  { level: "very_high", range: "8–10" },
  { level: "extreme", range: "11+" },
];

const WEATHER_CODE_KINDS: Record<number, WeatherConditionKind> = {
  0: "clear",
  1: "mainly_clear",
  2: "partly_cloudy",
  3: "overcast",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "freezing_drizzle",
  57: "freezing_drizzle",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "freezing_rain",
  67: "freezing_rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow_grains",
  80: "rain_showers",
  81: "rain_showers",
  82: "rain_showers",
  85: "snow_showers",
  86: "snow_showers",
  95: "thunderstorm",
  96: "thunderstorm_hail",
  99: "thunderstorm_hail",
};

const WIND_CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function formatWindCardinal(degrees: number | null | undefined): string | null {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) {
    return null;
  }

  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % WIND_CARDINALS.length;

  return WIND_CARDINALS[index] ?? null;
}

export function getUvRiskLevel(value: number | null | undefined): UvRiskLevel | null {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) {
    return null;
  }

  const index = Math.round(value);

  if (index <= 2) {
    return "low";
  }

  if (index <= 5) {
    return "moderate";
  }

  if (index <= 7) {
    return "high";
  }

  if (index <= 10) {
    return "very_high";
  }

  return "extreme";
}

export function getWeatherCondition(code: number | null | undefined): WeatherCondition {
  if (code === null || code === undefined) {
    return { kind: "unknown", code: code ?? null };
  }

  return {
    kind: WEATHER_CODE_KINDS[code] ?? "unknown",
    code,
  };
}

export function buildForecastOutlook({
  response,
  period,
  today,
  horizonDays,
}: {
  response?: OpenMeteoArchiveResponse;
  period: DatePeriod;
  today: string;
  horizonDays: ForecastHorizonDays;
}): ForecastOutlookDay[] {
  const daily = response?.daily;
  const dates = daily?.time ?? [];

  if (!daily || dates.length === 0) {
    return [];
  }

  const horizonEnd = addForecastDays(today, horizonDays - 1);
  const startDate = maxDate(today, period.startDate);
  const endDate = minDate(horizonEnd, period.endDate);

  if (startDate > endDate) {
    return [];
  }

  return dates.flatMap((date, index) => {
    if (date < startDate || date > endDate) {
      return [];
    }

    return [
      {
        date,
        condition: getWeatherCondition(daily.weather_code?.[index] ?? null),
        tmax: daily.temperature_2m_max?.[index] ?? null,
        tmin: daily.temperature_2m_min?.[index] ?? null,
        precipitationSum: daily.precipitation_sum?.[index] ?? null,
        precipitationProbability: daily.precipitation_probability_max?.[index] ?? null,
        uvIndex: daily.uv_index_max?.[index] ?? null,
        windSpeedMax: daily.wind_speed_10m_max?.[index] ?? null,
        windGustsMax: daily.wind_gusts_10m_max?.[index] ?? null,
        windDirection: daily.wind_direction_10m_dominant?.[index] ?? null,
        humidityMean: daily.relative_humidity_2m_mean?.[index] ?? null,
      },
    ];
  });
}

export function addForecastDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate.toISOString().slice(0, 10);
}

function maxDate(left: string, right: string) {
  return left > right ? left : right;
}

function minDate(left: string, right: string) {
  return left < right ? left : right;
}
