"use client";

import { useMemo, useRef } from "react";

import { WeatherDashboardFilters } from "./WeatherDashboardFilters";
import { WeatherDashboardHeader } from "./WeatherDashboardHeader";
import { EmptyState, WeatherDashboardPanel } from "./WeatherDashboardPanel";
import { useClimateNormals } from "@/features/weather/hooks";
import { useGeolocatedCity } from "@/features/weather/hooks";
import { useWeatherData } from "@/features/weather/hooks";
import { useWeatherUrlState } from "@/features/weather/hooks";
import { detectColdWaves } from "@/features/weather/logic";
import { detectHeatwaves } from "@/features/weather/logic";
import { useWeatherStore } from "@/features/weather/store";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function WeatherDashboard() {
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
  const { t } = useLocale();
  const shareUrl = useWeatherUrlState();

  useGeolocatedCity();

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
  const visibleDatasets = useMemo(() => weather.data.filter((dataset) => !hiddenSeries.includes(dataset.id)), [hiddenSeries, weather.data]);
  const heatwaves = useMemo(() => detectHeatwaves(visibleDatasets), [visibleDatasets]);
  const coldWaves = useMemo(() => detectColdWaves(visibleDatasets), [visibleDatasets]);
  const hasCity = city !== null;

  return (
    <main className="app-ambient min-h-screen text-foreground">
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <WeatherDashboardHeader city={city} />
        <WeatherDashboardFilters
          city={city}
          comparisonOffsets={comparisonOffsets}
          onCityChange={setCity}
          onClearOffsets={clearComparisonOffsets}
          onPeriodChange={setPeriod}
          onShowNormalsChange={setShowNormals}
          onTemperatureModeChange={setTemperatureMode}
          onToggleOffset={toggleComparisonOffset}
          period={period}
          showNormals={showNormals}
          temperatureMode={temperatureMode}
        />
        {!hasCity ? (
          <EmptyState message={t["state.selectCity"]} />
        ) : (
          <WeatherDashboardPanel
            chartRef={chartRef}
            coldWaves={coldWaves}
            datasets={weather.data}
            heatwaves={heatwaves}
            hiddenSeries={hiddenSeries}
            normals={normals.data}
            onToggleSeries={toggleHiddenSeries}
            shareUrl={shareUrl}
            showNormals={showNormals}
            temperatureMode={temperatureMode}
            weatherError={weather.error}
            weatherIsError={weather.isError}
            weatherIsLoading={weather.isLoading}
            weatherNormalsFetching={normals.isFetching}
          />
        )}
      </div>
    </main>
  );
}
