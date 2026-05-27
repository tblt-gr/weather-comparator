export { reverseGeocode } from "@/features/weather/api/nominatim";
export {
  createEmptyDailyWeatherResponse,
  fetchClimateNormalsRange,
  fetchForecastWeather,
  fetchHistoricalWeather,
  searchCities,
} from "@/features/weather/api/openMeteo";
export type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
