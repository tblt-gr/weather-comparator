"use client";

import { useQueries } from "@tanstack/react-query";

import { fetchHistoricalWeather } from "@/lib/api/openMeteo";
import { type DatePeriod, getComparableDateRangeByOffset } from "@/lib/weather/dateRange";
import { normalizeWeatherData } from "@/lib/weather/normalizeWeatherData";
import type { City, WeatherYearDataset } from "@/types/weather";

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
            queryKey: [
              "weather",
              city.id,
              city.latitude,
              city.longitude,
              period.startDate,
              period.endDate,
              offsetYears,
            ],
            enabled: getComparableDateRangeByOffset({ offsetYears, period }) !== null,
            queryFn: async () => {
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

  const firstError = queries.find((q) => q.error)?.error;
  const errorMessage =
    firstError instanceof Error ? firstError.message : firstError ? String(firstError) : null;

  return {
    data,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    error: errorMessage,
  };
}
