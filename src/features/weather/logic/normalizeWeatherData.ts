import type { OpenMeteoArchiveResponse } from "@/features/weather/api";
import {
  type DatePeriod,
  eachDateInRange,
  getPeriodLabel,
} from "@/features/weather/logic/dateRange";
import type { DailyTemperature, WeatherYearDataset } from "@/features/weather/types";

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
