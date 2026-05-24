"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"

import { HeatwaveOverlay } from "@/components/chart/HeatwaveOverlay"
import { WeatherChart } from "@/components/chart/WeatherChart"
import { CitySearch } from "@/components/weather/CitySearch"
import { ClimateSummaryBar } from "@/components/weather/ClimateSummaryBar"
import { ExportButtons } from "@/components/weather/ExportButtons"
import { MonthPicker } from "@/components/weather/MonthPicker"
import { SeasonalNormalsToggle } from "@/components/weather/SeasonalNormalsToggle"
import { TemperatureToggle } from "@/components/weather/TemperatureToggle"
import { ThemeToggle } from "@/components/weather/ThemeToggle"
import { YearSelector } from "@/components/weather/YearSelector"
import { useClimateNormals } from "@/hooks/useClimateNormals"
import { useWeatherData } from "@/hooks/useWeatherData"
import { detectHeatwaves } from "@/lib/weather/detectHeatwaves"
import { loadPersistedCity, useWeatherStore } from "@/store/weather-store"

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
  useEffect(() => {
    const persistedCity = loadPersistedCity()

    if (persistedCity && city === null) {
      setCity(persistedCity)
    }
  }, [city, setCity])

  const weather = useWeatherData({
    city,
    month,
    years: [referenceYear, ...selectedYears],
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
  const hasCity = city !== null
  const hasData = weather.data.length > 0

  return (
    <main className="app-ambient min-h-screen overflow-hidden text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-2xl px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-primary">
                Meteo historique
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                Comparaison des temperatures quotidiennes
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {city ? `${city.name}, ${city.country}` : "Aucune ville"}
                {" - selectionnez un mois, des annees et le type de temperature a comparer."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TemperatureToggle
                onChange={setTemperatureMode}
                value={temperatureMode}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <section
          aria-label="Filtres de comparaison"
          className="glass-panel grid gap-4 rounded-2xl p-4 lg:grid-cols-[minmax(260px,360px)_minmax(280px,420px)_1fr_auto]"
        >
          <CitySearch key={city?.id ?? "empty"} city={city} onCityChange={setCity} />
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

        <section className="glass-panel grid gap-4 rounded-2xl p-4">
          {!hasCity ? (
            <div className="glass-card flex min-h-[360px] items-center justify-center rounded-xl border-dashed text-sm text-muted-foreground">
              Selectionnez une ville pour afficher les donnees.
            </div>
          ) : (
            <>
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
                <div className="glass-card flex min-h-[420px] animate-pulse items-center justify-center rounded-xl text-sm text-muted-foreground">
                  Chargement des donnees meteo...
                </div>
              ) : null}
              {weather.isError ? (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-destructive">
                  Impossible de charger les donnees meteo.
                </div>
              ) : null}
              {!weather.isLoading && !weather.isError && hasData ? (
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
              {!weather.isLoading && !weather.isError && !hasData ? (
                <div className="glass-card flex min-h-[360px] items-center justify-center rounded-xl border-dashed text-sm text-muted-foreground">
                  Aucune donnee disponible pour cette periode.
                </div>
              ) : null}
              {showNormals && normals.isFetching ? (
                <p className="text-sm text-muted-foreground">
                  Calcul de la normale climatique 1991-2020...
                </p>
              ) : null}
              <HeatwaveOverlay heatwaves={heatwaves} />
            </>
          )}
        </section>
      </div>
    </main>
  )
}
