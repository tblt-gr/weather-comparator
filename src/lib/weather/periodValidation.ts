import { type DatePeriod, formatLocalDate } from "./dateRange";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(date: string): boolean {
  return DATE_PATTERN.test(date) && !isNaN(new Date(date).getTime());
}

export function isValidDatePeriod(period: DatePeriod): boolean {
  const { startDate, endDate } = period;
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return false;
  return startDate <= endDate;
}

export type DatePeriodErrors = {
  startDate?: string;
  endDate?: string;
};

export function validateDatePeriod(period: DatePeriod): DatePeriodErrors {
  const errors: DatePeriodErrors = {};

  if (!isValidDateString(period.startDate)) {
    errors.startDate = "Date invalide";
  }
  if (!isValidDateString(period.endDate)) {
    errors.endDate = "Date invalide";
  }
  if (!errors.startDate && !errors.endDate && period.startDate > period.endDate) {
    errors.startDate = "Doit être antérieure à la date de fin";
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
