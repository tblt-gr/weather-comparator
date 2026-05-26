import { type DatePeriod, formatLocalDate } from "./dateRange";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDatePeriod(period: DatePeriod): boolean {
  const { startDate, endDate } = period;
  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) return false;
  if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) return false;
  return startDate <= endDate;
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
