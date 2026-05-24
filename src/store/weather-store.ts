"use client"

import { create } from "zustand"

import type { City, TemperatureMode } from "@/types/weather"

const now = new Date()
const currentYear = now.getFullYear()

export const defaultCity: City = {
  id: "besancon-fr",
  name: "Besancon",
  latitude: 47.2488,
  longitude: 6.0182,
  country: "France",
  admin1: "Bourgogne-Franche-Comte",
}

type WeatherState = {
  city: City
  month: number
  referenceYear: number
  selectedYears: number[]
  temperatureMode: TemperatureMode
  hiddenYears: number[]
  showNormals: boolean
  setCity: (city: City) => void
  setMonth: (month: number) => void
  setReferenceYear: (year: number) => void
  toggleYear: (year: number) => void
  setTemperatureMode: (mode: TemperatureMode) => void
  toggleHiddenYear: (year: number) => void
  setShowNormals: (showNormals: boolean) => void
}

function defaultYears(referenceYear: number) {
  return [referenceYear, referenceYear - 1, referenceYear - 2, referenceYear - 3]
}

export const useWeatherStore = create<WeatherState>((set) => ({
  city: defaultCity,
  month: now.getMonth() + 1,
  referenceYear: currentYear,
  selectedYears: defaultYears(currentYear),
  temperatureMode: "tmax",
  hiddenYears: [],
  showNormals: false,
  setCity: (city) => set({ city }),
  setMonth: (month) => set({ month }),
  setReferenceYear: (referenceYear) =>
    set({
      referenceYear,
      selectedYears: defaultYears(referenceYear),
      hiddenYears: [],
    }),
  toggleYear: (year) =>
    set((state) => {
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
