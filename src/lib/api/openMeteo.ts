import { type DatePeriod, getComparableDateRangeByOffset } from "@/lib/weather/dateRange";
import type { City } from "@/types/weather";

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
  };
};

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
    return {
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
      },
    };
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

  const startDate = `1991-${startMonthDay}`;
  const endDate = `${isCrossYear ? 2021 : 2020}-${endMonthDay}`;

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
