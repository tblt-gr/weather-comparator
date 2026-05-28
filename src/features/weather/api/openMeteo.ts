import {
  type DatePeriod,
  formatLocalDate,
  getComparableDateRangeByOffset,
} from "@/features/weather/logic/dates";
import {
  CLIMATE_NORMAL_END_YEAR,
  CLIMATE_NORMAL_START_YEAR,
} from "@/features/weather/logic/climateNormalYears";
import type { City } from "@/features/weather/types";

type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

export type OpenMeteoArchiveResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    is_forecast?: boolean[];
  };
};

const FORECAST_REQUEST_TIMEOUT_MS = 5000;

export function createEmptyDailyWeatherResponse(): OpenMeteoArchiveResponse {
  return {
    daily: {
      time: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
    },
  };
}

export function createWeatherRequestSignal(signal?: AbortSignal, timeoutMs = FORECAST_REQUEST_TIMEOUT_MS) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmedQuery,
    count: "8",
    language: "fr",
    format: "json",
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("City search failed");
  }

  const payload = (await response.json()) as GeocodingResponse;

  return (payload.results ?? []).map((result) => ({
    id: String(result.id),
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    admin1: result.admin1,
  }));
}

export async function fetchHistoricalWeather({
  city,
  offsetYears,
  period,
  signal,
}: {
  city: City;
  offsetYears: number;
  period: DatePeriod;
  signal?: AbortSignal;
}): Promise<OpenMeteoArchiveResponse> {
  const range = getComparableDateRangeByOffset({ offsetYears, period });

  if (!range) {
    return createEmptyDailyWeatherResponse();
  }

  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: range.startDate,
    end_date: range.endDate,
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "Europe/Paris",
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const reason = (body as { reason?: string }).reason;
    throw new Error(reason ?? "Weather fetch failed");
  }

  return (await response.json()) as OpenMeteoArchiveResponse;
}

export async function fetchForecastWeather({
  city,
  period,
  signal,
  today = formatLocalDate(new Date()),
  timeoutMs = FORECAST_REQUEST_TIMEOUT_MS,
}: {
  city: City;
  period: DatePeriod;
  signal?: AbortSignal;
  today?: string;
  timeoutMs?: number;
}): Promise<OpenMeteoArchiveResponse> {
  const startDate = period.startDate > today ? period.startDate : today;

  if (startDate > period.endDate) {
    return createEmptyDailyWeatherResponse();
  }

  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: startDate,
    end_date: period.endDate,
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "Europe/Paris",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    signal: createWeatherRequestSignal(signal, timeoutMs),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const reason = (body as { reason?: string }).reason;
    throw new Error(reason ?? "Forecast fetch failed");
  }

  return (await response.json()) as OpenMeteoArchiveResponse;
}

export async function fetchClimateNormalsRange({
  city,
  period,
  signal,
}: {
  city: City;
  period: DatePeriod;
  signal?: AbortSignal;
}): Promise<OpenMeteoArchiveResponse> {
  const startMonthDay = period.startDate.slice(5);
  const endMonthDay = period.endDate.slice(5);
  const isCrossYear = endMonthDay < startMonthDay;

  const startDate = `${CLIMATE_NORMAL_START_YEAR}-${startMonthDay}`;
  const endDate = `${isCrossYear ? CLIMATE_NORMAL_END_YEAR + 1 : CLIMATE_NORMAL_END_YEAR}-${endMonthDay}`;

  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "Europe/Paris",
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const reason = (body as { reason?: string }).reason;
    throw new Error(reason ?? "Climate normals fetch failed");
  }

  return (await response.json()) as OpenMeteoArchiveResponse;
}

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate.toISOString().slice(0, 10);
}
