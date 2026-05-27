"use client";

import { useMemo, type RefObject } from "react";

import { ColdWaveOverlay } from "@/features/weather/components/chart";
import { HeatwaveOverlay } from "@/features/weather/components/chart";
import { palette, WeatherChart } from "@/features/weather/components/chart";
import { ExportButtons } from "@/features/weather/components/controls";
import { ClimateSummaryBar } from "@/features/weather/components/summary";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ClimateNormal, ColdWavePeriod, HeatwavePeriod, TemperatureMode, WeatherYearDataset } from "@/features/weather/types";

type WeatherDashboardPanelProps = {
  chartRef: RefObject<HTMLDivElement | null>;
  coldWaves: ColdWavePeriod[];
  datasets: WeatherYearDataset[];
  heatwaves: HeatwavePeriod[];
  hiddenSeries: string[];
  normals?: ClimateNormal[];
  shareUrl: string | null;
  showNormals: boolean;
  temperatureMode: TemperatureMode;
  weatherError: string | null;
  weatherIsError: boolean;
  weatherIsLoading: boolean;
  weatherNormalsFetching: boolean;
  onToggleSeries: (seriesId: string) => void;
};

export function WeatherDashboardPanel({
  chartRef,
  coldWaves,
  datasets,
  heatwaves,
  hiddenSeries,
  normals,
  shareUrl,
  showNormals,
  temperatureMode,
  weatherError,
  weatherIsError,
  weatherIsLoading,
  weatherNormalsFetching,
  onToggleSeries,
}: WeatherDashboardPanelProps) {
  const { t } = useLocale();
  const visibleDatasets = useMemo(
    () => datasets.filter((dataset) => !hiddenSeries.includes(dataset.id)),
    [datasets, hiddenSeries]
  );
  const datasetColors = useMemo(
    () =>
      Object.fromEntries(
        datasets.map((dataset, index) => [dataset.id, palette[index % palette.length]])
      ) as Record<string, string>,
    [datasets]
  );
  const hasData = datasets.length > 0;

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ClimateSummaryBar
            coldWaves={coldWaves}
            datasets={datasets}
            heatwaves={heatwaves}
            normals={normals}
            showNormals={showNormals}
            temperatureMode={temperatureMode}
          />
          <ExportButtons chartRef={chartRef} datasets={visibleDatasets} shareUrl={shareUrl} />
        </div>

        {weatherIsLoading ? <LoadingState /> : null}

        {weatherIsError ? (
          <div className="flex min-h-[360px] items-center justify-center text-sm text-destructive">
            {weatherError ?? t["state.loadError"]}
          </div>
        ) : null}

        {!weatherIsLoading && !weatherIsError && hasData ? (
          <div ref={chartRef}>
            <WeatherChart
              coldWaves={coldWaves}
              datasets={datasets}
              heatwaves={heatwaves}
              hiddenSeries={hiddenSeries}
              normals={normals}
              onToggleSeries={onToggleSeries}
              showNormals={showNormals}
              temperatureMode={temperatureMode}
            />
          </div>
        ) : null}

        {!weatherIsLoading && !weatherIsError && !hasData ? (
          <EmptyState message={t["state.noData"]} />
        ) : null}

        {showNormals && weatherNormalsFetching ? (
          <p className="text-sm text-muted-foreground">{t["state.computingNormals"]}</p>
        ) : null}

        <HeatwaveOverlay colors={datasetColors} heatwaves={heatwaves} />
        <ColdWaveOverlay colors={datasetColors} coldWaves={coldWaves} />
      </div>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
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
