import { daysInMonth, formatDate } from "@/lib/api/openMeteo"
import type { OpenMeteoArchiveResponse } from "@/lib/api/openMeteo"
import type { DailyTemperature, WeatherYearDataset } from "@/types/weather"

export function normalizeWeatherData({
  response,
  month,
  year,
}: {
  response: OpenMeteoArchiveResponse
  month: number
  year: number
}): WeatherYearDataset {
  const byDate = new Map<string, DailyTemperature>()
  const dates = response.daily?.time ?? []
  const tmax = response.daily?.temperature_2m_max ?? []
  const tmin = response.daily?.temperature_2m_min ?? []

  dates.forEach((date, index) => {
    const day = Number(date.slice(8, 10))
    byDate.set(date, {
      date,
      day,
      year,
      tmax: tmax[index] ?? null,
      tmin: tmin[index] ?? null,
    })
  })

  const values = Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1
    const date = formatDate(year, month, day)

    return (
      byDate.get(date) ?? {
        date,
        day,
        year,
        tmax: null,
        tmin: null,
      }
    )
  })

  return { year, values }
}
