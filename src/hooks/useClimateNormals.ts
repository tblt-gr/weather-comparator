"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchHistoricalWeather } from "@/lib/api/openMeteo"
import { calculateClimateNormals } from "@/lib/weather/calculateClimateNormals"
import { getComparableDateRange, type DatePeriod } from "@/lib/weather/dateRange"
import { normalizeWeatherData } from "@/lib/weather/normalizeWeatherData"
import type { City, TemperatureMode } from "@/types/weather"

const normalYears = Array.from({ length: 30 }, (_, index) => 1991 + index)

export function useClimateNormals({
  city,
  enabled,
  period,
  temperatureMode,
}: {
  city: City | null
  enabled: boolean
  period: DatePeriod
  temperatureMode: TemperatureMode
}) {
  return useQuery({
    enabled: enabled && city !== null,
    queryKey: [
      "climate-normal",
      city?.id ?? "no-city",
      city?.latitude ?? 0,
      city?.longitude ?? 0,
      period.startDate,
      period.endDate,
      temperatureMode,
    ],
    queryFn: async () => {
      if (city === null) {
        return []
      }

      const datasets = await Promise.all(
        normalYears.map(async (year) => {
          const range = getComparableDateRange({ period, year })

          if (range === null) {
            return { year, values: [] }
          }

          const response = await fetchHistoricalWeather({ city, period, year })
          return normalizeWeatherData({ range, response, year })
        })
      )

      return calculateClimateNormals(datasets, temperatureMode)
    },
    staleTime: 1000 * 60 * 60 * 24 * 30,
  })
}
