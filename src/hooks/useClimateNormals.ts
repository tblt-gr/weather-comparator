"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchHistoricalWeather } from "@/lib/api/openMeteo"
import { normalizeWeatherData } from "@/lib/weather/normalizeWeatherData"
import { calculateClimateNormals } from "@/lib/weather/calculateClimateNormals"
import type { City, TemperatureMode } from "@/types/weather"

const normalYears = Array.from({ length: 30 }, (_, index) => 1991 + index)

export function useClimateNormals({
  city,
  enabled,
  month,
  temperatureMode,
}: {
  city: City
  enabled: boolean
  month: number
  temperatureMode: TemperatureMode
}) {
  return useQuery({
    enabled,
    queryKey: [
      "climate-normal",
      city.id,
      city.latitude,
      city.longitude,
      month,
      temperatureMode,
    ],
    queryFn: async () => {
      const datasets = await Promise.all(
        normalYears.map(async (year) => {
          const response = await fetchHistoricalWeather({ city, month, year })
          return normalizeWeatherData({ response, month, year })
        })
      )

      return calculateClimateNormals(datasets, temperatureMode)
    },
    staleTime: 1000 * 60 * 60 * 24 * 30,
  })
}
