import { type DatePeriod, formatLocalDate } from "./dateRange";

export function normalizeDatePeriod(
  period: DatePeriod,
  changedField: keyof DatePeriod
): DatePeriod {
  if (period.startDate < period.endDate) {
    return period;
  }

  if (changedField === "startDate") {
    return {
      startDate: period.startDate,
      endDate: shiftDate(period.startDate, 1),
    };
  }

  return {
    startDate: period.startDate,
    endDate: shiftDate(period.startDate, 1),
  };
}

export function getMaximumStartDate(endDate: string) {
  return shiftDate(endDate, -1);
}

export function getMinimumEndDate(startDate: string) {
  return shiftDate(startDate, 1);
}

function shiftDate(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return formatLocalDate(nextDate);
}
