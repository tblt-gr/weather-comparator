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
import { useWeatherData } from "@/features/weather/hooks/useWeatherData";
import { useWeatherUrlState } from "@/features/weather/hooks/useWeatherUrlState";
import { detectColdWaves, detectHeatwaves } from "@/features/weather/logic/extremes";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const heatwaves = useMemo(() => detectHeatwaves(visibleDatasets), [visibleDatasets]);
  const coldWaves = useMemo(() => detectColdWaves(visibleDatasets), [visibleDatasets]);
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
