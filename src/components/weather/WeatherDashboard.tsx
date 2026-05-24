"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"

import { HeatwaveOverlay } from "@/components/chart/HeatwaveOverlay"
import { WeatherChart } from "@/components/chart/WeatherChart"
import { CitySearch } from "@/components/weather/CitySearch"
import { ClimateSummaryBar } from "@/components/weather/ClimateSummaryBar"
import { ExportButtons } from "@/components/weather/ExportButtons"
import { MonthPicker } from "@/components/weather/MonthPicker"
import { SeasonalNormalsToggle } from "@/components/weather/SeasonalNormalsToggle"
import { TemperatureToggle } from "@/components/weather/TemperatureToggle"
import { YearSelector } from "@/components/weather/YearSelector"
import { useClimateNormals } from "@/hooks/useClimateNormals"
import { useWeatherData } from "@/hooks/useWeatherData"
import { detectHeatwaves } from "@/lib/weather/detectHeatwaves"
import { useWeatherStore } from "@/store/weather-store"

export function WeatherDashboard() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <WeatherDashboardContent />
    </QueryClientProvider>
  )
}

function WeatherDashboardContent() {
  const {
    city,
    month,
    referenceYear,
    selectedYears,
    temperatureMode,
    hiddenYears,
    showNormals,
    setCity,
    setMonth,
    setReferenceYear,
    toggleYear,
    setTemperatureMode,
    toggleHiddenYear,
    setShowNormals,
  } = useWeatherStore()
  const weather = useWeatherData({
    city,
    month,
    years: selectedYears,
  })
  const normals = useClimateNormals({
    city,
    enabled: showNormals,
    month,
    temperatureMode,
  })
  const chartRef = useRef<HTMLDivElement | null>(null)
  const visibleDatasets = useMemo(
    () =>
      weather.data.filter((dataset) => !hiddenYears.includes(dataset.year)),
    [hiddenYears, weather.data]
  )
  const heatwaves = useMemo(
    () => detectHeatwaves(visibleDatasets),
    [visibleDatasets]
  )

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b pb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Meteo historique
          </p>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                Comparaison des temperatures quotidiennes
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                {city.name}, {city.country} - selectionnez un mois, des annees
                et le type de temperature a comparer.
              </p>
            </div>
            <TemperatureToggle
              onChange={setTemperatureMode}
              value={temperatureMode}
            />
          </div>
        </header>

        <section
          aria-label="Filtres de comparaison"
          className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[minmax(260px,360px)_minmax(280px,420px)_1fr_auto]"
        >
          <CitySearch city={city} onCityChange={setCity} />
          <MonthPicker
            month={month}
            onMonthChange={setMonth}
            onYearChange={setReferenceYear}
            referenceYear={referenceYear}
          />
          <YearSelector
            onToggleYear={toggleYear}
            referenceYear={referenceYear}
            selectedYears={selectedYears}
          />
          <div className="flex items-end">
            <SeasonalNormalsToggle
              checked={showNormals}
              onCheckedChange={setShowNormals}
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <ClimateSummaryBar
              datasets={weather.data}
              heatwaves={heatwaves}
              normals={normals.data}
              referenceYear={referenceYear}
              temperatureMode={temperatureMode}
            />
            <ExportButtons chartRef={chartRef} datasets={visibleDatasets} />
          </div>
          {weather.isLoading ? (
            <div className="flex min-h-[420px] animate-pulse items-center justify-center rounded-lg bg-stone-100 text-sm text-stone-500">
              Chargement des donnees meteo...
            </div>
          ) : null}
          {weather.isError ? (
            <div className="flex min-h-[360px] items-center justify-center text-sm text-red-700">
              Impossible de charger les donnees meteo.
            </div>
          ) : null}
          {!weather.isLoading && !weather.isError ? (
            <div ref={chartRef}>
              <WeatherChart
                datasets={weather.data}
                heatwaves={heatwaves}
                hiddenYears={hiddenYears}
                normals={normals.data}
                onToggleYear={toggleHiddenYear}
                referenceYear={referenceYear}
                showNormals={showNormals}
                temperatureMode={temperatureMode}
              />
            </div>
          ) : null}
          {showNormals && normals.isFetching ? (
            <p className="text-sm text-stone-500">
              Calcul de la normale climatique 1991-2020...
            </p>
          ) : null}
          <HeatwaveOverlay heatwaves={heatwaves} />
        </section>
      </div>
    </main>
  )
}
