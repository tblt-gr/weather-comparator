"use client"

import { useQueries } from "@tanstack/react-query"

import { fetchHistoricalWeather } from "@/lib/api/openMeteo"
import { getComparableDateRange, type DatePeriod } from "@/lib/weather/dateRange"
import { normalizeWeatherData } from "@/lib/weather/normalizeWeatherData"
import type { City, WeatherYearDataset } from "@/types/weather"

export function useWeatherData({
  city,
  period,
  years,
}: {
  city: City | null
  period: DatePeriod
  years: number[]
}) {
  const queries = useQueries({
    queries:
      city === null
        ? []
        : years.map((year) => ({
            queryKey: [
              "weather",
              city.id,
              city.latitude,
              city.longitude,
              period.startDate,
              period.endDate,
              year,
            ],
            enabled: getComparableDateRange({ period, year }) !== null,
            queryFn: async () => {
              const range = getComparableDateRange({ period, year })

              if (range === null) {
                return { year, values: [] }
              }

              const response = await fetchHistoricalWeather({ city, period, year })
              return normalizeWeatherData({ range, response, year })
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
