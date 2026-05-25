import type { OpenMeteoArchiveResponse } from "@/lib/api/openMeteo"
import { type DatePeriod, eachDateInRange } from "@/lib/weather/dateRange"
import type { DailyTemperature, WeatherYearDataset } from "@/types/weather"

export function normalizeWeatherData({
  range,
  response,
  year,
}: {
  range: DatePeriod
  response: OpenMeteoArchiveResponse
  year: number
}): WeatherYearDataset {
  const byDate = new Map<string, DailyTemperature>()
  const dates = response.daily?.time ?? []
  const tmax = response.daily?.temperature_2m_max ?? []
  const tmin = response.daily?.temperature_2m_min ?? []

  dates.forEach((date, index) => {
    byDate.set(date, {
      date,
      day: 0,
      year,
      tmax: tmax[index] ?? null,
      tmin: tmin[index] ?? null,
    })
  })

  const values = eachDateInRange(range).map((date, index) => {
    const day = index + 1
    const value = byDate.get(date)

    return value ? { ...value, day } : { date, day, year, tmax: null, tmin: null }
  })

  return { year, values }
}
