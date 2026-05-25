import type { OpenMeteoArchiveResponse } from "@/lib/api/openMeteo";
import { type DatePeriod, eachDateInRange, getPeriodLabel } from "@/lib/weather/dateRange";
import type { DailyTemperature, WeatherYearDataset } from "@/types/weather";

export function normalizeWeatherData({
  offsetYears,
  range,
  response,
}: {
  offsetYears: number;
  range: DatePeriod;
  response: OpenMeteoArchiveResponse;
}): WeatherYearDataset {
  const byDate = new Map<string, DailyTemperature>();
  const dates = response.daily?.time ?? [];
  const tmax = response.daily?.temperature_2m_max ?? [];
  const tmin = response.daily?.temperature_2m_min ?? [];

  dates.forEach((date, index) => {
    byDate.set(date, {
      date,
      day: 0,
      year: Number(date.slice(0, 4)),
      tmax: tmax[index] ?? null,
      tmin: tmin[index] ?? null,
    });
  });

  const values = eachDateInRange(range).map((date, index) => {
    const day = index + 1;
    const value = byDate.get(date);

    return value
      ? { ...value, day }
      : { date, day, year: Number(date.slice(0, 4)), tmax: null, tmin: null };
  });

  return {
    id: offsetYears === 0 ? "current" : `minus-${offsetYears}`,
    label: getPeriodLabel(range),
    offsetYears,
    values,
  };
}
