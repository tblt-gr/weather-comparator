import { type DatePeriod, formatLocalDate } from "./dateRange";
import { MAX_PERIOD_DAYS } from "@/features/weather/logic/workloadLimits";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ValidationErrorKey =
  | "error.invalidDate"
  | "error.beforeEndDate"
  | "error.periodTooLong";

export type DatePeriodErrors = {
  startDate?: ValidationErrorKey;
  endDate?: ValidationErrorKey;
};

function isValidDateString(date: string): boolean {
  return DATE_PATTERN.test(date) && !isNaN(new Date(date).getTime());
}

export function isValidDatePeriod(period: DatePeriod): boolean {
  const { startDate, endDate } = period;
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return false;
  return startDate <= endDate && getDatePeriodDayCount(period) <= MAX_PERIOD_DAYS;
}

export function getDatePeriodDayCount(period: DatePeriod) {
  const start = new Date(`${period.startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${period.endDate}T00:00:00.000Z`).getTime();

  return Math.floor((end - start) / 86_400_000) + 1;
}

export function validateDatePeriod(period: DatePeriod): DatePeriodErrors {
  const errors: DatePeriodErrors = {};

  if (!isValidDateString(period.startDate)) {
    errors.startDate = "error.invalidDate";
  }
  if (!isValidDateString(period.endDate)) {
    errors.endDate = "error.invalidDate";
  }
  if (!errors.startDate && !errors.endDate && period.startDate > period.endDate) {
    errors.startDate = "error.beforeEndDate";
  } else if (
    !errors.startDate &&
    !errors.endDate &&
    getDatePeriodDayCount(period) > MAX_PERIOD_DAYS
  ) {
    errors.endDate = "error.periodTooLong";
  }

  return errors;
}

export function normalizeDatePeriod(
  period: DatePeriod,
  changedField: keyof DatePeriod
): DatePeriod {
  if (period.startDate <= period.endDate) {
    return period;
  }

  if (changedField === "startDate") {
    return {
      startDate: period.startDate,
      endDate: shiftDate(period.startDate, 1),
    };
  }

  return {
    startDate: shiftDate(period.endDate, -1),
    endDate: period.endDate,
  };
}

function shiftDate(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return formatLocalDate(nextDate);
}
