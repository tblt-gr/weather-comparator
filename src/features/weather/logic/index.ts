export {
  averageDatasetTemperature,
  buildClimateDatasetsFromRange,
  calculateClimateNormals,
} from "@/features/weather/logic/calculateClimateNormals";
export {
  CLIMATE_NORMAL_END_YEAR,
  CLIMATE_NORMAL_START_YEAR,
  CLIMATE_NORMAL_YEAR_COUNT,
} from "@/features/weather/logic/climateNormalYears";
export { buildColdWaveStats } from "@/features/weather/logic/coldWaveStats";
export type { ColdWaveStats } from "@/features/weather/logic/coldWaveStats";
export {
  eachDateInRange,
  getAvailableComparisonOffsets,
  getComparableDateRangeByOffset,
  getDefaultComparisonPeriod,
  getPeriodLabel,
} from "@/features/weather/logic/dates";
export type { ComparableDateRange, DatePeriod } from "@/features/weather/logic/dates";
export { detectColdWaves } from "@/features/weather/logic/detectColdWaves";
export { detectHeatwaves } from "@/features/weather/logic/detectHeatwaves";
export { exportWeatherCsv } from "@/features/weather/logic/exports";
export { buildHeatwaveStats } from "@/features/weather/logic/heatwaveStats";
export type { HeatwaveStats } from "@/features/weather/logic/heatwaveStats";
export { normalizeWeatherData } from "@/features/weather/logic/normalizeWeatherData";
export {
  isValidDatePeriod,
  validateDatePeriod,
} from "@/features/weather/logic/dates";
export type { DatePeriodErrors, ValidationErrorKey } from "@/features/weather/logic/dates";
export {
  decodeCityParam,
  encodeCityParam,
  parseCompareParam,
  parseWeatherUrlState,
  serializeWeatherUrlState,
} from "@/features/weather/logic/urlState";
export type { WeatherUrlState } from "@/features/weather/logic/urlState";
