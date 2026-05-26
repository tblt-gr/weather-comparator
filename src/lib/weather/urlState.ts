import {
  type DatePeriod,
  getAvailableComparisonOffsets,
  getDefaultComparisonPeriod,
} from "@/lib/weather/dateRange";
import { isValidDatePeriod, validateDatePeriod } from "@/lib/weather/periodValidation";
import type { City, TemperatureMode } from "@/types/weather";

type EncodedCity = {
  admin1?: string;
  country: string;
  id: string;
  lat: number;
  lon: number;
  name: string;
};

export type WeatherUrlState = {
  city?: City | null;
  comparisonOffsets?: number[];
  period?: DatePeriod;
  showNormals?: boolean;
  temperatureMode?: TemperatureMode;
};

export function encodeCityParam(city: City) {
  const payload: EncodedCity = {
    id: city.id,
    name: city.name,
    lat: city.latitude,
    lon: city.longitude,
    country: city.country,
    ...(city.admin1 ? { admin1: city.admin1 } : {}),
  };

  return encodeURIComponent(JSON.stringify(payload));
}

export function decodeCityParam(value: string): City | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<EncodedCity>;

    if (
      typeof parsed.id !== "string" ||
      parsed.id.length === 0 ||
      typeof parsed.name !== "string" ||
      parsed.name.length === 0 ||
      typeof parsed.country !== "string" ||
      parsed.country.length === 0 ||
      typeof parsed.lat !== "number" ||
      !Number.isFinite(parsed.lat) ||
      typeof parsed.lon !== "number" ||
      !Number.isFinite(parsed.lon)
    ) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      latitude: parsed.lat,
      longitude: parsed.lon,
      country: parsed.country,
      ...(parsed.admin1 ? { admin1: parsed.admin1 } : {}),
    };
  } catch {
    return null;
  }
}

export function parseCompareParam(compare: string, period: DatePeriod) {
  const availableOffsets = new Set(getAvailableComparisonOffsets(period));
  const offsets = compare
    .split(",")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0 && availableOffsets.has(value));

  return [...new Set(offsets)].sort((left, right) => left - right);
}

export function parseWeatherUrlState(
  params: URLSearchParams,
  fallbackPeriod = getDefaultComparisonPeriod()
): WeatherUrlState {
  const nextState: WeatherUrlState = {};
  const cityParam = params.get("city");
  const start = params.get("start");
  const end = params.get("end");
  const compare = params.get("compare");
  const normals = params.get("normals");
  const temp = params.get("temp");

  if (cityParam) {
    const city = decodeCityParam(cityParam);

    if (city !== null) {
      nextState.city = city;
    }
  }

  let periodForCompare = fallbackPeriod;

  if (start && end) {
    const candidatePeriod = {
      startDate: start,
      endDate: end,
    };

    if (
      Object.keys(validateDatePeriod(candidatePeriod)).length === 0 &&
      isValidDatePeriod(candidatePeriod)
    ) {
      nextState.period = candidatePeriod;
      periodForCompare = candidatePeriod;
    }
  }

  if (compare !== null) {
    nextState.comparisonOffsets = parseCompareParam(compare, periodForCompare);
  }

  if (normals !== null) {
    nextState.showNormals = normals === "1";
  }

  if (temp !== null) {
    nextState.temperatureMode = temp === "tmin" ? "tmin" : "tmax";
  }

  return nextState;
}

export function serializeWeatherUrlState(state: {
  city: City | null;
  comparisonOffsets: number[];
  period: DatePeriod;
  showNormals: boolean;
  temperatureMode: TemperatureMode;
}) {
  const params = new URLSearchParams();

  if (state.city !== null) {
    params.set("city", encodeCityParam(state.city));
  }

  if (
    Object.keys(validateDatePeriod(state.period)).length === 0 &&
    isValidDatePeriod(state.period)
  ) {
    params.set("start", state.period.startDate);
    params.set("end", state.period.endDate);
  }

  const comparisonOffsets = [...new Set(state.comparisonOffsets)]
    .filter((offset) => Number.isInteger(offset) && offset > 0)
    .sort((left, right) => left - right);

  if (comparisonOffsets.length > 0) {
    params.set("compare", comparisonOffsets.join(","));
  }

  if (state.showNormals) {
    params.set("normals", "1");
  }

  if (state.temperatureMode !== "tmax") {
    params.set("temp", state.temperatureMode);
  }

  return params;
}
