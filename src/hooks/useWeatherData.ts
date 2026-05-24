"use client"

import { useQueries } from "@tanstack/react-query"

import { fetchHistoricalWeather } from "@/lib/api/openMeteo"
import { normalizeWeatherData } from "@/lib/weather/normalizeWeatherData"
import type { City, WeatherYearDataset } from "@/types/weather"

export function useWeatherData({
  city,
  month,
  years,
}: {
  city: City
  month: number
  years: number[]
}) {
  const queries = useQueries({
    queries: years.map((year) => ({
      queryKey: [
        "weather",
        city.id,
        city.latitude,
        city.longitude,
        month,
        year,
      ],
      queryFn: async () => {
        const response = await fetchHistoricalWeather({ city, month, year })
        return normalizeWeatherData({ response, month, year })
      },
      staleTime: 1000 * 60 * 60 * 24,
    })),
  })

  const data = queries
    .map((query) => query.data)
    .filter((dataset): dataset is WeatherYearDataset => Boolean(dataset))
    .sort((a, b) => b.year - a.year)

  return {
    data,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
  }
}
