"use client";

import { useMemo, type RefObject } from "react";

import { WeatherChart } from "@/features/weather/components/chart";
import { ExportButtons } from "@/features/weather/components/export";
import { ClimateSummaryBar } from "@/features/weather/components/summary";
import { Skeleton } from "@/components/ui/skeleton";
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
  const hasData = datasets.length > 0;

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="grid gap-4">
        <div className="flex min-w-0 items-center gap-3 lg:justify-between">
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

        {weatherIsLoading ? <ChartSkeleton /> : null}

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

function ChartSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className="overflow-x-auto">
        <div className="relative h-[420px] min-w-[760px]">
          {/* Y-axis tick labels — mirrors YAxis width={56} + left margin 8 */}
          <div
            className="absolute flex flex-col justify-between"
            style={{ left: 8, top: 16, bottom: 56, width: 56 }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="ml-auto h-2.5 w-8" />
            ))}
          </div>

          {/* Chart data area */}
          <div
            className="absolute"
            style={{ left: 64, top: 16, right: 24, bottom: 56 }}
          >
            {/* Horizontal grid lines */}
            {[0, 20, 40, 60, 80, 100].map((pct) => (
              <Skeleton
                key={pct}
                className="absolute left-0 right-0 h-px rounded-none opacity-60"
                style={{ top: `${pct}%` }}
              />
            ))}
            {/* Data series suggestions */}
            <Skeleton className="absolute left-0 right-0 h-3 rounded-full opacity-70" style={{ top: "28%" }} />
            <Skeleton className="absolute left-0 h-3 rounded-full opacity-45" style={{ top: "50%", right: "8%" }} />
          </div>

          {/* X-axis tick labels — bottom margin 56 */}
          <div
            className="absolute flex items-start justify-between pt-3"
            style={{ left: 64, right: 24, bottom: 0, height: 56 }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-12" />
            ))}
          </div>
        </div>
      </div>

      {/* Legend — mirrors ChartLegend flex-wrap gap-2 Button size="sm" */}
      <div className="flex flex-wrap gap-2">
        {[96, 80, 72].map((w) => (
          <Skeleton key={w} className="h-8 rounded-md" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}
