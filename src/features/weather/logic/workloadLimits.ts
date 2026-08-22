export const MAX_PERIOD_DAYS = 366;
export const MAX_COMPARISON_OFFSETS = 9;
export const MAX_WEATHER_DATASETS = MAX_COMPARISON_OFFSETS + 1;

export function limitComparisonOffsets(offsets: readonly number[]) {
  return [...new Set(offsets)]
    .filter((offset) => Number.isInteger(offset) && offset > 0)
    .sort((left, right) => left - right)
    .slice(0, MAX_COMPARISON_OFFSETS);
}

export function limitWeatherOffsets(offsets: readonly number[]) {
  return [...new Set(offsets)]
    .filter((offset) => Number.isInteger(offset) && offset >= 0)
    .slice(0, MAX_WEATHER_DATASETS);
}
