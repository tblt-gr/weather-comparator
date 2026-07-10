"use client";

import { create } from "zustand";

import {
  type DatePeriod,
  getDefaultComparisonPeriod,
} from "@/features/weather/logic/dates";
import type { WeatherUrlState } from "@/features/weather/logic/urlState";
import { isForecastModel } from "@/features/weather/logic/weatherModels";
import type {
  City,
  ExtremeKind,
  ForecastModel,
  TemperatureMode,
} from "@/features/weather/types";

const CITY_STORAGE_KEY = "weather-compare.city";
const FORECAST_MODEL_STORAGE_KEY = "weather-compare.forecastModel";

type WeatherState = {
  city: City | null;
  period: DatePeriod;
  comparisonOffsets: number[];
  temperatureMode: TemperatureMode;
  forecastModel: ForecastModel;
  hiddenSeries: string[];
  hiddenExtremeKinds: ExtremeKind[];
  showNormals: boolean;
  showForecast: boolean;
  setCity: (city: City | null) => void;
  setPeriod: (period: DatePeriod) => void;
  toggleComparisonOffset: (offsetYears: number) => void;
  clearComparisonOffsets: () => void;
  setTemperatureMode: (mode: TemperatureMode) => void;
  setForecastModel: (model: ForecastModel) => void;
  toggleHiddenSeries: (seriesId: string) => void;
  toggleExtremeKind: (kind: ExtremeKind) => void;
  setShowNormals: (showNormals: boolean) => void;
  setShowForecast: (showForecast: boolean) => void;
  hydrateFromUrl: (state: WeatherUrlState) => void;
};

function persistCity(city: City | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (city === null) {
    window.localStorage.removeItem(CITY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(city));
}

export function loadPersistedCity() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawCity = window.localStorage.getItem(CITY_STORAGE_KEY);

  if (!rawCity) {
    return null;
  }

  try {
    return JSON.parse(rawCity) as City;
  } catch {
    return null;
  }
}

function persistForecastModel(model: ForecastModel) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FORECAST_MODEL_STORAGE_KEY, model);
}

export function loadPersistedForecastModel(): ForecastModel {
  if (typeof window === "undefined") {
    return "best_match";
  }

  const raw = window.localStorage.getItem(FORECAST_MODEL_STORAGE_KEY);

  return raw && isForecastModel(raw) ? raw : "best_match";
}

export function getInitialWeatherState(): Omit<
  WeatherState,
  | "setCity"
  | "setPeriod"
  | "toggleComparisonOffset"
  | "clearComparisonOffsets"
  | "setTemperatureMode"
  | "setForecastModel"
  | "toggleHiddenSeries"
  | "toggleExtremeKind"
  | "setShowNormals"
  | "setShowForecast"
  | "hydrateFromUrl"
> {
  return {
    city: null,
    period: getDefaultComparisonPeriod(),
    comparisonOffsets: [],
    temperatureMode: "tmax",
    forecastModel: "best_match",
    hiddenSeries: [],
    hiddenExtremeKinds: [],
    showNormals: false,
    showForecast: true,
  };
}

export const useWeatherStore = create<WeatherState>((set) => ({
  ...getInitialWeatherState(),
  setCity: (city) => {
    persistCity(city);
    set({ city });
  },
  setPeriod: (period) => set({ period }),
  toggleComparisonOffset: (offsetYears) =>
    set((state) => {
      const exists = state.comparisonOffsets.includes(offsetYears);

      return {
        comparisonOffsets: exists
          ? state.comparisonOffsets.filter((offset) => offset !== offsetYears)
          : [...state.comparisonOffsets, offsetYears].sort((a, b) => a - b),
        hiddenSeries: state.hiddenSeries.filter((seriesId) => seriesId !== `minus-${offsetYears}`),
      };
    }),
  clearComparisonOffsets: () =>
    set((state) => ({
      comparisonOffsets: [],
      hiddenSeries: state.hiddenSeries.filter((seriesId) => !seriesId.startsWith("minus-")),
    })),
  setTemperatureMode: (temperatureMode) => set({ temperatureMode }),
  setForecastModel: (forecastModel) => {
    persistForecastModel(forecastModel);
    set({ forecastModel });
  },
  toggleHiddenSeries: (seriesId) =>
    set((state) => ({
      hiddenSeries: state.hiddenSeries.includes(seriesId)
        ? state.hiddenSeries.filter((hiddenSeriesId) => hiddenSeriesId !== seriesId)
        : [...state.hiddenSeries, seriesId],
    })),
  toggleExtremeKind: (kind) =>
    set((state) => ({
      hiddenExtremeKinds: state.hiddenExtremeKinds.includes(kind)
        ? state.hiddenExtremeKinds.filter((hiddenKind) => hiddenKind !== kind)
        : [...state.hiddenExtremeKinds, kind],
    })),
  setShowNormals: (showNormals) => set({ showNormals }),
  setShowForecast: (showForecast) => set({ showForecast }),
  hydrateFromUrl: (state) => {
    if (state.city !== undefined) {
      persistCity(state.city);
    }

    if (state.forecastModel !== undefined) {
      persistForecastModel(state.forecastModel);
    }

    set((currentState) => ({
      city: state.city ?? currentState.city,
      period: state.period ?? currentState.period,
      comparisonOffsets:
        state.comparisonOffsets?.slice().sort((left, right) => left - right) ??
        currentState.comparisonOffsets,
      temperatureMode: state.temperatureMode ?? currentState.temperatureMode,
      forecastModel: state.forecastModel ?? currentState.forecastModel,
      showNormals: state.showNormals ?? currentState.showNormals,
      showForecast: state.showForecast ?? currentState.showForecast,
    }));
  },
}));
