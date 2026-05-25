export type DatePeriod = {
  startDate: string;
  endDate: string;
};

export type ComparableDateRange = DatePeriod;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
  year: "numeric",
});

export function getDefaultComparisonPeriod(today = new Date()): DatePeriod {
  const todayDate = formatLocalDate(today);

  return {
    startDate: `${todayDate.slice(0, 8)}01`,
    endDate: todayDate,
  };
}

export function getComparableDateRange({
  period,
  today = formatLocalDate(new Date()),
  year,
}: {
  period: DatePeriod;
  today?: string;
  year: number;
}): ComparableDateRange | null {
  const startDate = setDateYear(period.startDate, year);
  const requestedDays = daysBetween(period.startDate, period.endDate);
  const requestedEndDate = addDays(startDate, requestedDays);

  if (startDate > today) {
    return null;
  }

  return {
    startDate,
    endDate: requestedEndDate < today ? requestedEndDate : today,
  };
}

export function getComparableDateRangeByOffset({
  offsetYears,
  period,
  today = formatLocalDate(new Date()),
}: {
  offsetYears: number;
  period: DatePeriod;
  today?: string;
}): ComparableDateRange | null {
  const startDate = shiftDateYears(period.startDate, -offsetYears);
  const endDate = shiftDateYears(period.endDate, -offsetYears);

  if (startDate > today) {
    return null;
  }

  return {
    startDate,
    endDate: endDate < today ? endDate : today,
  };
}

export function getPeriodLabel(range: DatePeriod) {
  return `${range.startDate} - ${range.endDate}`;
}

export function eachDateInRange(range: DatePeriod) {
  const dates: string[] = [];
  let date = parseDate(range.startDate);
  const endDate = parseDate(range.endDate);

  while (date <= endDate) {
    dates.push(formatLocalDate(date));
    date = addDaysToDate(date, 1);
  }

  return dates;
}

function shiftDateYears(date: string, deltaYears: number) {
  return setDateYear(date, Number(date.slice(0, 4)) + deltaYears);
}

export function formatLocalDate(date: Date) {
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function setDateYear(date: string, year: number) {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const clampedDay = Math.min(day, daysInMonth(year, month));

  return [year, String(month).padStart(2, "0"), String(clampedDay).padStart(2, "0")].join("-");
}

function daysBetween(startDate: string, endDate: string) {
  return Math.max(
    0,
    Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86_400_000)
  );
}

function addDays(date: string, days: number) {
  return formatLocalDate(addDaysToDate(parseDate(date), days));
}

function addDaysToDate(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
