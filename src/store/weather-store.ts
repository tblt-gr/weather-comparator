"use client"

import { create } from "zustand"

import type { City, TemperatureMode } from "@/types/weather"

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const CITY_STORAGE_KEY = "weather-compare.city"

type WeatherState = {
  city: City | null
  month: number
  referenceYear: number
  selectedYears: number[]
  temperatureMode: TemperatureMode
  hiddenYears: number[]
  showNormals: boolean
  setCity: (city: City | null) => void
  setMonth: (month: number) => void
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
  month: now.getMonth() + 1,
  referenceYear: currentYear,
  selectedYears: [],
  temperatureMode: "tmax",
  hiddenYears: [],
  showNormals: true,
  setCity: (city) => {
    persistCity(city)
    set({ city })
  },
  setMonth: (month) =>
    set((state) => ({
      month:
        state.referenceYear === currentYear && month > currentMonth
          ? currentMonth
          : month,
    })),
  setReferenceYear: (referenceYear) =>
    set((state) => {
      const selectedYears = state.selectedYears.filter(
        (selectedYear) => selectedYear !== referenceYear
      )

      return {
        referenceYear,
        month:
          referenceYear === currentYear && state.month > currentMonth
            ? currentMonth
            : state.month,
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
