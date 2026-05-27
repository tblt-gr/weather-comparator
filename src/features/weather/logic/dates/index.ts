export {
  eachDateInRange,
  formatLocalDate,
  getAvailableComparisonOffsets,
  getComparableDateRange,
  getComparableDateRangeByOffset,
  getDefaultComparisonPeriod,
  getPeriodLabel,
  OPEN_METEO_HISTORICAL_START_DATE,
} from "@/features/weather/logic/dates/dateRange";
export type {
  ComparableDateRange,
  DatePeriod,
} from "@/features/weather/logic/dates/dateRange";
export {
  isValidDatePeriod,
  normalizeDatePeriod,
  validateDatePeriod,
} from "@/features/weather/logic/dates/periodValidation";
export type {
  DatePeriodErrors,
  ValidationErrorKey,
} from "@/features/weather/logic/dates/periodValidation";
