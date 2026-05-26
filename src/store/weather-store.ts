"use client";

import { create } from "zustand";

import { type DatePeriod, getDefaultComparisonPeriod } from "@/lib/weather/dateRange";
import type { WeatherUrlState } from "@/lib/weather/urlState";
import type { City, TemperatureMode } from "@/types/weather";

const CITY_STORAGE_KEY = "weather-compare.city";

type WeatherState = {
  city: City | null;
  period: DatePeriod;
  comparisonOffsets: number[];
  temperatureMode: TemperatureMode;
  hiddenSeries: string[];
  showNormals: boolean;
  setCity: (city: City | null) => void;
  setPeriod: (period: DatePeriod) => void;
  toggleComparisonOffset: (offsetYears: number) => void;
  clearComparisonOffsets: () => void;
  setTemperatureMode: (mode: TemperatureMode) => void;
  toggleHiddenSeries: (seriesId: string) => void;
  setShowNormals: (showNormals: boolean) => void;
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

export function getInitialWeatherState(): Omit<
  WeatherState,
  | "setCity"
  | "setPeriod"
  | "toggleComparisonOffset"
  | "clearComparisonOffsets"
  | "setTemperatureMode"
  | "toggleHiddenSeries"
  | "setShowNormals"
  | "hydrateFromUrl"
> {
  return {
    city: null,
    period: getDefaultComparisonPeriod(),
    comparisonOffsets: [],
    temperatureMode: "tmax",
    hiddenSeries: [],
    showNormals: false,
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
  toggleHiddenSeries: (seriesId) =>
    set((state) => ({
      hiddenSeries: state.hiddenSeries.includes(seriesId)
        ? state.hiddenSeries.filter((hiddenSeriesId) => hiddenSeriesId !== seriesId)
        : [...state.hiddenSeries, seriesId],
    })),
  setShowNormals: (showNormals) => set({ showNormals }),
  hydrateFromUrl: (state) => {
    if (state.city !== undefined) {
      persistCity(state.city);
    }

    set((currentState) => ({
      city: state.city ?? currentState.city,
      period: state.period ?? currentState.period,
      comparisonOffsets:
        state.comparisonOffsets?.slice().sort((left, right) => left - right) ??
        currentState.comparisonOffsets,
      temperatureMode: state.temperatureMode ?? currentState.temperatureMode,
      showNormals: state.showNormals ?? currentState.showNormals,
    }));
  },
}));
