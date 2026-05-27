"use client";

import { useQueries } from "@tanstack/react-query";

import { fetchHistoricalWeather } from "@/features/weather/api";
import {
  type DatePeriod,
  getComparableDateRangeByOffset,
} from "@/features/weather/logic/dates";
import { normalizeWeatherData } from "@/features/weather/logic";
import { isValidDatePeriod } from "@/features/weather/logic/dates";
import type { City, WeatherYearDataset } from "@/features/weather/types";

export function getWeatherQueryKey(
  city: City,
  period: DatePeriod,
  offsetYears: number
) {
  return ["weather", city.id, period.startDate, period.endDate, offsetYears] as const;
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
              const range = getComparableDateRangeByOffset({
                offsetYears,
                period,
              });

              if (range === null) {
                return {
                  id: offsetYears === 0 ? "current" : `minus-${offsetYears}`,
                  label: "",
                  offsetYears,
                  values: [],
                };
              }

              const response = await fetchHistoricalWeather({
                city,
                offsetYears,
                period,
                signal,
              });
              return normalizeWeatherData({ offsetYears, range, response });
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
