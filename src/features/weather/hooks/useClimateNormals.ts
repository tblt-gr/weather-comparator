"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchClimateNormalsRange } from "@/features/weather/api";
import {
  buildClimateDatasetsFromRange,
  calculateClimateNormals,
} from "@/features/weather/logic";
import { type DatePeriod, isValidDatePeriod } from "@/features/weather/logic/dates";
import type { City, TemperatureMode } from "@/features/weather/types";

export function useClimateNormals({
  city,
  enabled,
  period,
  temperatureMode,
}: {
  city: City | null;
  enabled: boolean;
  period: DatePeriod;
  temperatureMode: TemperatureMode;
}) {
  return useQuery({
    enabled: enabled && city !== null && isValidDatePeriod(period),
    queryKey: [
      "climate-normal",
      city?.id ?? "no-city",
      city?.latitude ?? 0,
      city?.longitude ?? 0,
      period.startDate,
      period.endDate,
    ],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      if (city === null) return [];

      const response = await fetchClimateNormalsRange({ city, period, signal });
      return buildClimateDatasetsFromRange(response, period);
    },
    select: (datasets) => calculateClimateNormals(datasets, temperatureMode),
    staleTime: 1000 * 60 * 60 * 24 * 30,
  });
}
