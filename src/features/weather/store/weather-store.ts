"use client";

import { create } from "zustand";

import {
  type DatePeriod,
  getDefaultComparisonPeriod,
} from "@/features/weather/logic/dates";
import type { WeatherUrlState } from "@/features/weather/logic/urlState";
import type { City, ExtremeKind, TemperatureMode } from "@/features/weather/types";

const CITY_STORAGE_KEY = "weather-compare.city";

type WeatherState = {
  city: City | null;
  period: DatePeriod;
  comparisonOffsets: number[];
  temperatureMode: TemperatureMode;
  hiddenSeries: string[];
  hiddenExtremeKinds: ExtremeKind[];
  showNormals: boolean;
  setCity: (city: City | null) => void;
  setPeriod: (period: DatePeriod) => void;
  toggleComparisonOffset: (offsetYears: number) => void;
  clearComparisonOffsets: () => void;
  setTemperatureMode: (mode: TemperatureMode) => void;
  toggleHiddenSeries: (seriesId: string) => void;
  toggleExtremeKind: (kind: ExtremeKind) => void;
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
  | "toggleExtremeKind"
  | "setShowNormals"
  | "hydrateFromUrl"
> {
  return {
    city: null,
    period: getDefaultComparisonPeriod(),
    comparisonOffsets: [],
    temperatureMode: "tmax",
    hiddenSeries: [],
    hiddenExtremeKinds: [],
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
  toggleExtremeKind: (kind) =>
    set((state) => ({
      hiddenExtremeKinds: state.hiddenExtremeKinds.includes(kind)
        ? state.hiddenExtremeKinds.filter((hiddenKind) => hiddenKind !== kind)
        : [...state.hiddenExtremeKinds, kind],
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
