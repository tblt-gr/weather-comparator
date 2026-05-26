"use client";

import { Thermometer } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { HeatwaveOverlay } from "@/components/chart/HeatwaveOverlay";
import { palette, WeatherChart } from "@/components/chart/WeatherChart";
import { CitySearch } from "@/components/weather/CitySearch";
import { ClimateSummaryBar } from "@/components/weather/ClimateSummaryBar";
import { ExportButtons } from "@/components/weather/ExportButtons";
import { PeriodPicker } from "@/components/weather/PeriodPicker";
import { SeasonalNormalsToggle } from "@/components/weather/SeasonalNormalsToggle";
import { TemperatureToggle } from "@/components/weather/TemperatureToggle";
import { ThemeToggle } from "@/components/weather/ThemeToggle";
import { YearSelector } from "@/components/weather/YearSelector";
import { useClimateNormals } from "@/hooks/useClimateNormals";
import { useWeatherData } from "@/hooks/useWeatherData";
import { detectHeatwaves } from "@/lib/weather/detectHeatwaves";
import { loadPersistedCity, useWeatherStore } from "@/store/weather-store";

export function WeatherDashboard() {
  return <WeatherDashboardContent />;
}

function WeatherDashboardContent() {
  const {
    city,
    period,
    comparisonOffsets,
    temperatureMode,
    hiddenSeries,
    showNormals,
    setCity,
    setPeriod,
    toggleComparisonOffset,
    clearComparisonOffsets,
    setTemperatureMode,
    toggleHiddenSeries,
    setShowNormals,
  } = useWeatherStore();

  useEffect(() => {
    const persisted = loadPersistedCity();
    if (persisted) setCity(persisted);
  }, [setCity]);

  const weather = useWeatherData({
    city,
    offsets: [0, ...comparisonOffsets],
    period,
  });
  const normals = useClimateNormals({
    city,
    enabled: showNormals,
    period,
    temperatureMode,
  });
  const chartRef = useRef<HTMLDivElement | null>(null);
  const visibleDatasets = useMemo(
    () => weather.data.filter((dataset) => !hiddenSeries.includes(dataset.id)),
    [hiddenSeries, weather.data]
  );
  const heatwaves = useMemo(() => detectHeatwaves(visibleDatasets), [visibleDatasets]);
  const datasetColors = useMemo(
    () =>
      Object.fromEntries(
        weather.data.map((dataset, index) => [dataset.id, palette[index % palette.length]])
      ) as Record<string, string>,
    [weather.data]
  );
  const hasCity = city !== null;
  const hasData = weather.data.length > 0;

  return (
    <main className="app-ambient min-h-screen text-foreground">
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="glass-panel overflow-hidden rounded-2xl">
          <div className="h-[3px] bg-gradient-to-r from-primary/40 via-primary to-primary/20" />
          <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Thermometer className="size-5" />
              </div>
              <div>
                <h1 className="text-lg leading-tight font-semibold tracking-tight">
                  Météo Compare
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground" suppressHydrationWarning>
                  Comparaison des températures quotidiennes
                  {city ? (
                    <span className="font-medium text-foreground">
                      {" · "}
                      {city.name}, {city.country}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TemperatureToggle onChange={setTemperatureMode} value={temperatureMode} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Filters */}
        <section
          aria-label="Filtres de comparaison"
          className="glass-panel grid gap-4 rounded-2xl p-4 lg:items-end lg:grid-cols-[minmax(240px,340px)_minmax(360px,520px)_1fr_auto]"
        >
          <CitySearch key={city?.id ?? "empty"} city={city} onCityChange={setCity} />
          <PeriodPicker period={period} onPeriodChange={setPeriod} />
          <YearSelector
            onClearOffsets={clearComparisonOffsets}
            onToggleOffset={toggleComparisonOffset}
            period={period}
            selectedOffsets={comparisonOffsets}
          />
          <div className="flex items-end">
            <SeasonalNormalsToggle checked={showNormals} onCheckedChange={setShowNormals} />
          </div>
        </section>

        {/* Data */}
        <section className="glass-panel rounded-2xl p-4">
          {!hasCity ? (
            <EmptyState message="Sélectionnez une ville pour afficher les données." />
          ) : (
            <div className="grid gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <ClimateSummaryBar
                  datasets={weather.data}
                  heatwaves={heatwaves}
                  normals={normals.data}
                  showNormals={showNormals}
                  temperatureMode={temperatureMode}
                />
                <ExportButtons chartRef={chartRef} datasets={visibleDatasets} />
              </div>

              {weather.isLoading ? <LoadingState /> : null}

              {weather.isError ? (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-destructive">
                  {weather.error ?? "Impossible de charger les données météo."}
                </div>
              ) : null}

              {!weather.isLoading && !weather.isError && hasData ? (
                <div ref={chartRef}>
                  <WeatherChart
                    datasets={weather.data}
                    heatwaves={heatwaves}
                    hiddenSeries={hiddenSeries}
                    normals={normals.data}
                    onToggleSeries={toggleHiddenSeries}
                    showNormals={showNormals}
                    temperatureMode={temperatureMode}
                  />
                </div>
              ) : null}

              {!weather.isLoading && !weather.isError && !hasData ? (
                <EmptyState message="Aucune donnée disponible pour cette période." />
              ) : null}

              {showNormals && normals.isFetching ? (
                <p className="text-sm text-muted-foreground">
                  Calcul de la normale climatique 1991-2020…
                </p>
              ) : null}

              <HeatwaveOverlay colors={datasetColors} heatwaves={heatwaves} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card flex min-h-[360px] items-center justify-center rounded-xl border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-2 animate-bounce rounded-full bg-primary/50"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Chargement des données météo…</p>
    </div>
  );
}
