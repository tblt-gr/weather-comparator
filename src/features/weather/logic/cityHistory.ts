import type { City } from "@/features/weather/types";

const CITY_HISTORY_STORAGE_KEY = "weather-compare.cityHistory";
const CITY_HISTORY_LIMIT = 5;

function isCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const city = value as Record<string, unknown>;

  return (
    typeof city.id === "string" &&
    typeof city.name === "string" &&
    typeof city.latitude === "number" &&
    Number.isFinite(city.latitude) &&
    typeof city.longitude === "number" &&
    Number.isFinite(city.longitude) &&
    typeof city.country === "string" &&
    (city.admin1 === undefined || typeof city.admin1 === "string")
  );
}

export function loadCityHistory(): City[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawHistory = window.localStorage.getItem(CITY_HISTORY_STORAGE_KEY);

    if (!rawHistory) {
      return [];
    }

    const history: unknown = JSON.parse(rawHistory);

    return Array.isArray(history) ? history.filter(isCity).slice(0, CITY_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function addCityToHistory(city: City): City[] {
  if (typeof window === "undefined") {
    return [];
  }

  const history = [
    city,
    ...loadCityHistory().filter((recentCity) => recentCity.id !== city.id),
  ].slice(0, CITY_HISTORY_LIMIT);

  try {
    window.localStorage.setItem(CITY_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    return history;
  }

  return history;
}
