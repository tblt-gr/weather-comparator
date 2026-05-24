import type { City } from "@/types/weather"

type GeocodingResult = {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
}

type GeocodingResponse = {
  results?: GeocodingResult[]
}

export type OpenMeteoArchiveResponse = {
  daily?: {
    time?: string[]
    temperature_2m_max?: (number | null)[]
    temperature_2m_min?: (number | null)[]
  }
}

export async function searchCities(query: string): Promise<City[]> {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) {
    return []
  }

  const params = new URLSearchParams({
    name: trimmedQuery,
    count: "8",
    language: "fr",
    format: "json",
  })

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error("City search failed")
  }

  const payload = (await response.json()) as GeocodingResponse

  return (payload.results ?? []).map((result) => ({
    id: String(result.id),
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    admin1: result.admin1,
  }))
}

export async function fetchHistoricalWeather({
  city,
  month,
  year,
}: {
  city: City
  month: number
  year: number
}): Promise<OpenMeteoArchiveResponse> {
  const startDate = formatDate(year, month, 1)
  const endDate = formatDate(year, month, daysInMonth(year, month))
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "Europe/Paris",
  })

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error("Weather fetch failed")
  }

  return (await response.json()) as OpenMeteoArchiveResponse
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function formatDate(year: number, month: number, day: number) {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-")
}
