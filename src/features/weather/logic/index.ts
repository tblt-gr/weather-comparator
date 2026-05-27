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
export {
  eachDateInRange,
  getAvailableComparisonOffsets,
  getComparableDateRangeByOffset,
  getDefaultComparisonPeriod,
  getPeriodLabel,
} from "@/features/weather/logic/dates";
export type { ComparableDateRange, DatePeriod } from "@/features/weather/logic/dates";
export { exportWeatherCsv } from "@/features/weather/logic/exports";
export { normalizeWeatherData } from "@/features/weather/logic/normalizeWeatherData";
export {
  isValidDatePeriod,
  validateDatePeriod,
} from "@/features/weather/logic/dates";
export type { DatePeriodErrors, ValidationErrorKey } from "@/features/weather/logic/dates";
export {
  buildColdWaveStats,
  buildHeatwaveStats,
  detectColdWaves,
  detectHeatwaves,
} from "@/features/weather/logic/extremes";
export type { ColdWaveStats, HeatwaveStats } from "@/features/weather/logic/extremes";
export {
  decodeCityParam,
  encodeCityParam,
  parseCompareParam,
  parseWeatherUrlState,
  serializeWeatherUrlState,
} from "@/features/weather/logic/urlState";
export type { WeatherUrlState } from "@/features/weather/logic/urlState";
