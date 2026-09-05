export { reverseGeocode } from "@/features/weather/api/nominatim";
export {
  createEmptyDailyWeatherResponse,
  fetchClimateNormalsRange,
  fetchForecastWeather,
  fetchHistoricalWeather,
  FORECAST_DAILY_VARIABLES,
  searchCities,
} from "@/features/weather/api/openMeteo";
export type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
