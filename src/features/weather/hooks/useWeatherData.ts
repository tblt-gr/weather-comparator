"use client";

import { useQueries } from "@tanstack/react-query";

import type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
import { fetchForecastWeather, fetchHistoricalWeather } from "@/features/weather/api/openMeteo";
import {
  type DatePeriod,
  eachDateInRange,
  formatDisplayDate,
  getComparableDateRangeByOffset,
} from "@/features/weather/logic/dates";
import {
  getForecastDateRangeForPeriod,
  mergeArchiveAndForecastWeather,
} from "@/features/weather/logic/forecastWeather";
import { normalizeWeatherData } from "@/features/weather/logic/normalizeWeatherData";
import { formatLocalDate as formatToday } from "@/features/weather/logic/dates";
import { isValidDatePeriod } from "@/features/weather/logic/dates";
import type { City, WeatherYearDataset } from "@/features/weather/types";

export function getWeatherQueryKey(
  city: City,
  period: DatePeriod,
  offsetYears: number,
  showForecast: boolean
) {
  return [
    "weather",
    city.id,
    period.startDate,
    period.endDate,
    offsetYears,
    offsetYears === 0 ? (showForecast ? "forecast-on" : "forecast-off") : "archive-only",
  ] as const;
}

export function aggregateWeatherQueryErrors(
  queries: Array<{ error: unknown; offsetYears: number }>
) {
  const messages = queries.flatMap(({ error, offsetYears }) => {
    if (!error) {
      return [];
    }

    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
    const label = offsetYears === 0 ? "annee de reference" : `-${offsetYears} an${offsetYears > 1 ? "s" : ""}`;
    return [`${label}: ${message}`];
  });

  return messages.length > 0 ? messages.join(" | ") : null;
}

export function shouldIgnoreWeatherError({
  stage,
  offsetYears,
}: {
  stage: "archive" | "forecast";
  offsetYears: number;
}) {
  return stage === "forecast" && offsetYears === 0;
}

export async function fetchWeatherDataset({
  city,
  offsetYears,
  period,
  signal,
  today,
  showForecast = true,
}: {
  city: City;
  offsetYears: number;
  period: DatePeriod;
  signal: AbortSignal;
  today?: string;
  showForecast?: boolean;
}): Promise<WeatherYearDataset & { forecastFailed: boolean }> {
  const range = getComparableDateRangeByOffset({
    offsetYears,
    period,
    today,
  });

  if (range === null) {
    return {
      id: offsetYears === 0 ? "current" : `minus-${offsetYears}`,
      label: "",
      offsetYears,
      values: [],
      forecastFailed: false,
    };
  }

  const archiveResponse = await fetchHistoricalWeather({
    city,
    offsetYears,
    period,
    signal,
  });

  if (offsetYears !== 0) {
    return { ...normalizeWeatherData({ offsetYears, range, response: archiveResponse }), forecastFailed: false };
  }

  const forecastRange = showForecast
    ? getForecastDateRangeForPeriod({
        period,
        today: today ?? formatToday(new Date()),
      })
    : null;

  if (forecastRange === null) {
    return {
      ...normalizeWeatherData({
        offsetYears,
        range: { startDate: range.startDate, endDate: period.endDate },
        response: archiveResponse,
      }),
      forecastFailed: false,
    };
  }

  try {
    const forecastResponse = await fetchForecastWeather({
      city,
      period: forecastRange,
      signal,
      today,
    });

    return {
      ...normalizeWeatherData({
        offsetYears,
        range: {
          startDate: range.startDate,
          endDate: period.endDate,
        },
        response: mergeArchiveAndForecastWeather({
          archive: archiveResponse,
          forecast: forecastResponse,
        }),
      }),
      forecastFailed: false,
    };
  } catch (error) {
    if (!shouldIgnoreWeatherError({ stage: "forecast", offsetYears })) {
      throw error;
    }

    return {
      ...normalizeWeatherData({
        offsetYears,
        range: {
          startDate: range.startDate,
          endDate: period.endDate,
        },
        response: archiveResponse,
      }),
      forecastFailed: true,
    };
  }
}

export function mergeCurrentDatasetWithForecast({
  currentDataset,
  forecastResponse,
  period,
}: {
  currentDataset: WeatherYearDataset | undefined;
  forecastResponse?: OpenMeteoArchiveResponse;
  period: DatePeriod;
}) {
  if (!currentDataset || !forecastResponse?.daily?.time?.length) {
    return currentDataset;
  }

  const forecastDates = forecastResponse.daily.time ?? [];
  const forecastTmax = forecastResponse.daily.temperature_2m_max ?? [];
  const forecastTmin = forecastResponse.daily.temperature_2m_min ?? [];
  const forecastByDate = new Map(
    forecastDates.map((date, index) => [
      date,
      {
        date,
        tmax: forecastTmax[index] ?? null,
        tmin: forecastTmin[index] ?? null,
      },
    ])
  );
  const currentByDate = new Map(currentDataset.values.map((value) => [value.date, value] as const));
  const firstDate = currentDataset.values[0]?.date ?? period.startDate;

  return {
    ...currentDataset,
    label: `${formatDisplayDate(firstDate)} - ${formatDisplayDate(period.endDate)}`,
    values: eachDateInRange({ startDate: firstDate, endDate: period.endDate }).map((date, index) => {
      const forecastValue = forecastByDate.get(date);

      if (forecastValue) {
        return {
          date,
          day: index + 1,
          year: Number(date.slice(0, 4)),
          tmax: forecastValue.tmax,
          tmin: forecastValue.tmin,
          isForecast: true,
        };
      }

      const currentValue = currentByDate.get(date);

      if (currentValue) {
        return {
          ...currentValue,
          day: index + 1,
        };
      }

      return {
        date,
        day: index + 1,
        year: Number(date.slice(0, 4)),
        tmax: null,
        tmin: null,
        isForecast: false,
      };
    }),
  } satisfies WeatherYearDataset;
}

export function useWeatherData({
  city,
  offsets,
  period,
  showForecast,
}: {
  city: City | null;
  offsets: number[];
  period: DatePeriod;
  showForecast: boolean;
}) {
  const queries = useQueries({
    queries:
      city === null
        ? []
        : offsets.map((offsetYears) => ({
            queryKey: getWeatherQueryKey(city, period, offsetYears, showForecast),
            enabled: isValidDatePeriod(period) && getComparableDateRangeByOffset({ offsetYears, period }) !== null,
            queryFn: ({ signal }: { signal: AbortSignal }) =>
              fetchWeatherDataset({
                city,
                offsetYears,
                period,
                signal,
                showForecast,
              }),
            staleTime: 1000 * 60 * 60 * 24,
          })),
  });

  const rawData = queries
    .map((query) => query.data)
    .filter((dataset): dataset is WeatherYearDataset & { forecastFailed: boolean } => Boolean(dataset));

  const data = rawData
    .map((dataset) => {
      const stripped = { ...dataset };
      delete (stripped as { forecastFailed?: boolean }).forecastFailed;
      return stripped as WeatherYearDataset;
    })
    .sort((a, b) => a.offsetYears - b.offsetYears);

  const hasForecastWarning = rawData.some((d) => d.forecastFailed);

  const errorMessage = aggregateWeatherQueryErrors(
    queries.map((query, index) => ({
      error: query.error,
      offsetYears: offsets[index] ?? 0,
    }))
  );
  const isLoadingQueries = queries.some((query) => query.isLoading);

  return {
    data,
    hasForecastWarning,
    isLoading: data.length === 0 && isLoadingQueries,
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    error: errorMessage,
  };
}
