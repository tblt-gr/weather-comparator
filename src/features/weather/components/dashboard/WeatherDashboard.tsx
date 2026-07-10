"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { WeatherDashboardFilters } from "./WeatherDashboardFilters";
import { WeatherDashboardHeader } from "./WeatherDashboardHeader";
import { EmptyState, WeatherDashboardPanel } from "./WeatherDashboardPanel";
import { palette } from "@/features/weather/components/chart";
import { ColdWaveOverlay, HeatwaveOverlay } from "@/features/weather/components/extremes";
import { useClimateNormals } from "@/features/weather/hooks/useClimateNormals";
import { useGeolocatedCity } from "@/features/weather/hooks/useGeolocatedCity";
import { usePersistedForecastModel } from "@/features/weather/hooks/usePersistedForecastModel";
import { useWeatherData } from "@/features/weather/hooks/useWeatherData";
import { useWeatherUrlState } from "@/features/weather/hooks/useWeatherUrlState";
import { detectColdWaves, detectHeatwaves } from "@/features/weather/logic/extremes";
import { useWeatherStore } from "@/features/weather/store";
import type { ExtremeKind } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function WeatherDashboard() {
  const {
    city,
    period,
    comparisonOffsets,
    temperatureMode,
    forecastModel,
    hiddenSeries,
    hiddenExtremeKinds,
    showNormals,
    showForecast,
    setCity,
    setPeriod,
    toggleComparisonOffset,
    clearComparisonOffsets,
    setTemperatureMode,
    setForecastModel,
    toggleHiddenSeries,
    toggleExtremeKind,
    setShowNormals,
    setShowForecast,
  } = useWeatherStore();
  const { t } = useLocale();
  const shareUrl = useWeatherUrlState();
  const [filtersOpen, setFiltersOpen] = useState(false);

  useGeolocatedCity();
  usePersistedForecastModel();

  const weather = useWeatherData({
    city,
    offsets: [0, ...comparisonOffsets],
    period,
    showForecast,
    forecastModel,
  });
  const normals = useClimateNormals({
    city,
    enabled: showNormals,
    period,
    temperatureMode,
  });
  useEffect(() => {
    if (weather.isError) {
      toast.error(weather.error ?? t["state.loadError"]);
    }
  }, [weather.isError, weather.error, t]);

  useEffect(() => {
    if (weather.hasForecastWarning) {
      toast.warning(t["forecast.unavailable"]);
    }
  }, [weather.hasForecastWarning, t]);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const visibleDatasets = useMemo(() => weather.data.filter((dataset) => !hiddenSeries.includes(dataset.id)), [hiddenSeries, weather.data]);
  const detectedHeatwaves = useMemo(() => detectHeatwaves(visibleDatasets), [visibleDatasets]);
  const detectedColdWaves = useMemo(() => detectColdWaves(visibleDatasets), [visibleDatasets]);
  const availableExtremeKinds = useMemo<Record<ExtremeKind, boolean>>(
    () => ({
      canicule: detectedHeatwaves.some((heatwave) => heatwave.kind === "canicule"),
      vague_de_chaleur: detectedHeatwaves.some((heatwave) => heatwave.kind === "vague_de_chaleur"),
      vague_de_froid: detectedColdWaves.some((coldWave) => coldWave.kind === "vague_de_froid"),
      grand_froid: detectedColdWaves.some((coldWave) => coldWave.kind === "grand_froid"),
    }),
    [detectedHeatwaves, detectedColdWaves]
  );
  const heatwaves = useMemo(
    () => detectedHeatwaves.filter((heatwave) => !hiddenExtremeKinds.includes(heatwave.kind)),
    [detectedHeatwaves, hiddenExtremeKinds]
  );
  const coldWaves = useMemo(
    () => detectedColdWaves.filter((coldWave) => !hiddenExtremeKinds.includes(coldWave.kind)),
    [detectedColdWaves, hiddenExtremeKinds]
  );
  const datasetColors = useMemo(
    () => Object.fromEntries(
      weather.data.map((dataset, index) => [dataset.id, palette[index % palette.length]])
    ) as Record<string, string>,
    [weather.data]
  );
  const hasCity = city !== null;

  return (
    <main id="main-content" className="app-ambient min-h-screen text-foreground">
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <WeatherDashboardHeader
          city={city}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
        />
        <div className={filtersOpen ? "block" : "hidden lg:block"} id="dashboard-filters">
          <WeatherDashboardFilters
            availableExtremeKinds={availableExtremeKinds}
            city={city}
            comparisonOffsets={comparisonOffsets}
            hiddenExtremeKinds={hiddenExtremeKinds}
            forecastModel={forecastModel}
            onCityChange={setCity}
            onClearOffsets={clearComparisonOffsets}
            onForecastModelChange={setForecastModel}
            onPeriodChange={setPeriod}
            onShowForecastChange={setShowForecast}
            onShowNormalsChange={setShowNormals}
            onTemperatureModeChange={setTemperatureMode}
            onToggleExtremeKind={toggleExtremeKind}
            onToggleOffset={toggleComparisonOffset}
            period={period}
            showForecast={showForecast}
            showNormals={showNormals}
            temperatureMode={temperatureMode}
          />
        </div>
        {!hasCity ? (
          <EmptyState message={t["state.selectCity"]} />
        ) : (
          <>
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
            <HeatwaveOverlay colors={datasetColors} heatwaves={heatwaves} />
            <ColdWaveOverlay colors={datasetColors} coldWaves={coldWaves} />
          </>
        )}
      </div>
    </main>
  );
}
