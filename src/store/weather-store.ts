"use client"

import { create } from "zustand"

import {
  type DatePeriod,
  getDefaultComparisonPeriod,
} from "@/lib/weather/dateRange"
import type { City, TemperatureMode } from "@/types/weather"

const now = new Date()
const currentYear = now.getFullYear()
const CITY_STORAGE_KEY = "weather-compare.city"

type WeatherState = {
  city: City | null
  period: DatePeriod
  referenceYear: number
  selectedYears: number[]
  temperatureMode: TemperatureMode
  hiddenYears: number[]
  showNormals: boolean
  setCity: (city: City | null) => void
  setPeriod: (period: DatePeriod) => void
  setReferenceYear: (year: number) => void
  toggleYear: (year: number) => void
  setTemperatureMode: (mode: TemperatureMode) => void
  toggleHiddenYear: (year: number) => void
  setShowNormals: (showNormals: boolean) => void
}

function persistCity(city: City | null) {
  if (typeof window === "undefined") {
    return
  }

  if (city === null) {
    window.localStorage.removeItem(CITY_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(city))
}

export function loadPersistedCity() {
  if (typeof window === "undefined") {
    return null
  }

  const rawCity = window.localStorage.getItem(CITY_STORAGE_KEY)

  if (!rawCity) {
    return null
  }

  try {
    return JSON.parse(rawCity) as City
  } catch {
    return null
  }
}

export const useWeatherStore = create<WeatherState>((set) => ({
  city: null,
  period: getDefaultComparisonPeriod(now),
  referenceYear: currentYear,
  selectedYears: [],
  temperatureMode: "tmax",
  hiddenYears: [],
  showNormals: true,
  setCity: (city) => {
    persistCity(city)
    set({ city })
  },
  setPeriod: (period) =>
    set({
      period:
        period.startDate <= period.endDate
          ? period
          : { startDate: period.endDate, endDate: period.startDate },
    }),
  setReferenceYear: (referenceYear) =>
    set((state) => {
      const selectedYears = state.selectedYears.filter(
        (selectedYear) => selectedYear !== referenceYear
      )

      return {
        referenceYear,
        selectedYears,
        hiddenYears: [],
      }
    }),
  toggleYear: (year) =>
    set((state) => {
      if (year === state.referenceYear) {
        return state
      }

      const exists = state.selectedYears.includes(year)

      return {
        selectedYears: exists
          ? state.selectedYears.filter((selectedYear) => selectedYear !== year)
          : [...state.selectedYears, year].sort((a, b) => b - a),
        hiddenYears: state.hiddenYears.filter((hiddenYear) => hiddenYear !== year),
      }
    }),
  setTemperatureMode: (temperatureMode) => set({ temperatureMode }),
  toggleHiddenYear: (year) =>
    set((state) => ({
      hiddenYears: state.hiddenYears.includes(year)
        ? state.hiddenYears.filter((hiddenYear) => hiddenYear !== year)
        : [...state.hiddenYears, year],
    })),
  setShowNormals: (showNormals) => set({ showNormals }),
}))
