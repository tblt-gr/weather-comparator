export const MAX_PERIOD_DAYS = 366;
export const MAX_CONCURRENT_WEATHER_REQUESTS = 6;

export function normalizeComparisonOffsets(offsets: readonly number[]) {
  return [...new Set(offsets)]
    .filter((offset) => Number.isInteger(offset) && offset > 0)
    .sort((left, right) => left - right);
}

export function normalizeWeatherOffsets(offsets: readonly number[]) {
  return [...new Set(offsets)].filter((offset) => Number.isInteger(offset) && offset >= 0);
}
