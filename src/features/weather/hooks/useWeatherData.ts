"use client";

import { useQueries } from "@tanstack/react-query";

import { fetchForecastWeather, fetchHistoricalWeather } from "@/features/weather/api/openMeteo";
import {
  type DatePeriod,
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
  offsetYears: number
) {
  return [
    "weather",
    city.id,
    period.startDate,
    period.endDate,
    offsetYears,
    offsetYears === 0 ? "forecast-aware" : "archive-only",
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
}: {
  city: City;
  offsetYears: number;
  period: DatePeriod;
  signal: AbortSignal;
  today?: string;
}) {
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
    } satisfies WeatherYearDataset;
  }

  const archiveResponse = await fetchHistoricalWeather({
    city,
    offsetYears,
    period,
    signal,
  });

  if (offsetYears !== 0) {
    return normalizeWeatherData({ offsetYears, range, response: archiveResponse });
  }

  const forecastRange = getForecastDateRangeForPeriod({
    period,
    today: today ?? formatToday(new Date()),
  });

  if (forecastRange === null) {
    return normalizeWeatherData({ offsetYears, range, response: archiveResponse });
  }

  try {
    const forecastResponse = await fetchForecastWeather({
      city,
      period: forecastRange,
      signal,
      today,
    });

    return normalizeWeatherData({
      offsetYears,
      range,
      response: mergeArchiveAndForecastWeather({
        archive: archiveResponse,
        forecast: forecastResponse,
      }),
    });
  } catch (error) {
    if (!shouldIgnoreWeatherError({ stage: "forecast", offsetYears })) {
      throw error;
    }

    return normalizeWeatherData({ offsetYears, range, response: archiveResponse });
  }
}

export function useWeatherData({
  city,
  offsets,
  period,
}: {
  city: City | null;
  offsets: number[];
  period: DatePeriod;
}) {
  const queries = useQueries({
    queries:
      city === null
        ? []
        : offsets.map((offsetYears) => ({
            queryKey: getWeatherQueryKey(city, period, offsetYears),
            enabled: isValidDatePeriod(period) && getComparableDateRangeByOffset({ offsetYears, period }) !== null,
            queryFn: async ({ signal }: { signal: AbortSignal }) => {
              return fetchWeatherDataset({
                city,
                offsetYears,
                period,
                signal,
              });
            },
            staleTime: 1000 * 60 * 60 * 24,
          })),
  });

  const data = queries
    .map((query) => query.data)
    .filter((dataset): dataset is WeatherYearDataset => Boolean(dataset))
    .sort((a, b) => a.offsetYears - b.offsetYears);

  const errorMessage = aggregateWeatherQueryErrors(
    queries.map((query, index) => ({
      error: query.error,
      offsetYears: offsets[index] ?? 0,
    }))
  );

  return {
    data,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    error: errorMessage,
  };
}
