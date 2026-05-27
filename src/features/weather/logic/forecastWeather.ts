import type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
import type { DatePeriod } from "@/features/weather/logic/dates";

export function getForecastDateRangeForPeriod({
  period,
  today,
}: {
  period: DatePeriod;
  today: string;
}): DatePeriod | null {
  const startDate = period.startDate > today ? period.startDate : addDays(today, 1);

  if (startDate > period.endDate) {
    return null;
  }

  return {
    startDate,
    endDate: period.endDate,
  };
}

export function mergeArchiveAndForecastWeather({
  archive,
  forecast,
}: {
  archive: OpenMeteoArchiveResponse;
  forecast: OpenMeteoArchiveResponse;
}): OpenMeteoArchiveResponse {
  const daily = new Map<
    string,
    { tmax: number | null; tmin: number | null; isForecast: boolean }
  >();

  const forecastDates = forecast.daily?.time ?? [];
  const forecastTmax = forecast.daily?.temperature_2m_max ?? [];
  const forecastTmin = forecast.daily?.temperature_2m_min ?? [];

  forecastDates.forEach((date, index) => {
    daily.set(date, {
      tmax: forecastTmax[index] ?? null,
      tmin: forecastTmin[index] ?? null,
      isForecast: true,
    });
  });

  const archiveDates = archive.daily?.time ?? [];
  const archiveTmax = archive.daily?.temperature_2m_max ?? [];
  const archiveTmin = archive.daily?.temperature_2m_min ?? [];

  archiveDates.forEach((date, index) => {
    daily.set(date, {
      tmax: archiveTmax[index] ?? null,
      tmin: archiveTmin[index] ?? null,
      isForecast: false,
    });
  });

  const sortedDates = [...daily.keys()].sort((a, b) => a.localeCompare(b));

  return {
    daily: {
      time: sortedDates,
      temperature_2m_max: sortedDates.map((date) => daily.get(date)?.tmax ?? null),
      temperature_2m_min: sortedDates.map((date) => daily.get(date)?.tmin ?? null),
      is_forecast: sortedDates.map((date) => daily.get(date)?.isForecast ?? false),
    },
  };
}

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate.toISOString().slice(0, 10);
}
