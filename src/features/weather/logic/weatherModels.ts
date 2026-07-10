import type { ForecastModel } from "@/features/weather/types";

export const FORECAST_MODELS: readonly ForecastModel[] = [
  "best_match",
  "ecmwf_ifs025",
  "gfs_seamless",
  "icon_seamless",
  "meteofrance_seamless",
];

export function isForecastModel(value: string): value is ForecastModel {
  return (FORECAST_MODELS as readonly string[]).includes(value);
}
