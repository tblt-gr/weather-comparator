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
  const range = getArchiveDateRange(year, month)

  if (!range) {
    return {
      daily: {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
      },
    }
  }

  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: range.startDate,
    end_date: range.endDate,
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

export function getTodayDateString() {
  const today = new Date()
  return formatDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  )
}

export function getArchiveDateRange(year: number, month: number) {
  const today = getTodayDateString()
  const startDate = formatDate(year, month, 1)

  if (startDate > today) {
    return null
  }

  const requestedEndDate = formatDate(year, month, daysInMonth(year, month))

  return {
    startDate,
    endDate: requestedEndDate < today ? requestedEndDate : today,
  }
}
