"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend } from "./ChartLegend";
import { formatLocalDate } from "@/features/weather/logic/dates";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";
import type {
  ClimateNormal,
  ColdWavePeriod,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/features/weather/types";

export const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.68 0.16 205)",
  "oklch(0.7 0.16 135)",
  "oklch(0.66 0.18 285)",
  "oklch(0.72 0.17 78)",
  "oklch(0.66 0.16 18)",
];

type WeatherChartProps = {
  datasets: WeatherYearDataset[];
  temperatureMode: TemperatureMode;
  hiddenSeries: string[];
  normals?: ClimateNormal[];
  heatwaves?: HeatwavePeriod[];
  coldWaves?: ColdWavePeriod[];
  showNormals: boolean;
  onToggleSeries: (seriesId: string) => void;
};

type ChartRow = {
  day: number;
  label: string;
  tickLabel: string;
  normal?: number | null;
  [year: string]: number | string | null | undefined;
};

export function WeatherChart({
  datasets,
  temperatureMode,
  hiddenSeries,
  normals,
  heatwaves = [],
  coldWaves = [],
  showNormals,
  onToggleSeries,
}: WeatherChartProps) {
  const { locale, t } = useLocale();
  const tooltipDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }),
    [locale]
  );
  const chartShellRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const colors = useMemo(
    () =>
      Object.fromEntries(
        datasets.map((dataset, index) => [dataset.id, palette[index % palette.length]])
      ) as Record<string, string>,
    [datasets]
  );
  const rows = useMemo(
    () => buildChartRows(datasets, temperatureMode, normals),
    [datasets, normals, temperatureMode]
  );
  const monthBoundaryDays = useMemo(() => getMonthBoundaryDays(rows), [rows]);
  const todayBoundaryDay = useMemo(() => getTodayBoundaryDay(rows), [rows]);
  const forecastBoundaryDay = useMemo(
    () => getDisplayedForecastBoundaryDay(todayBoundaryDay, getForecastBoundaryDay(datasets)),
    [datasets, todayBoundaryDay]
  );
  const visibleDatasets = useMemo(
    () => datasets.filter((dataset) => !hiddenSeries.includes(dataset.id)),
    [datasets, hiddenSeries]
  );

  useEffect(() => {
    const element = chartShellRef.current;
    let frameId = 0;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setChartWidth(element.clientWidth);
    };

    const scheduleWidthUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateWidth();
      });
    };

    updateWidth();

    const observer = new ResizeObserver(scheduleWidthUpdate);
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  if (datasets.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
        {t["state.chartNoData"]}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]" ref={chartShellRef}>
          {chartWidth > 0 ? (
            <LineChart
              data={rows}
              height={420}
              margin={{ bottom: 56, left: 8, right: 24, top: 16 }}
              width={Math.max(chartWidth, 760)}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.72} />
              {monthBoundaryDays.map((day) => (
                <ReferenceLine
                  ifOverflow="extendDomain"
                  key={day}
                  stroke="var(--border)"
                  strokeOpacity={0.95}
                  strokeWidth={1.5}
                  x={day}
                />
              ))}
              {todayBoundaryDay !== null ? (
                <ReferenceLine
                  ifOverflow="extendDomain"
                  stroke="var(--foreground)"
                  strokeDasharray="5 4"
                  strokeOpacity={0.9}
                  strokeWidth={1.5}
                  x={todayBoundaryDay}
                />
              ) : null}
              {forecastBoundaryDay !== null ? (
                <ReferenceLine
                  ifOverflow="extendDomain"
                  stroke="var(--chart-1)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.9}
                  strokeWidth={1.5}
                  x={forecastBoundaryDay}
                />
              ) : null}
              <ReferenceLine
                ifOverflow="extendDomain"
                label={{ fill: "var(--muted-foreground)", fontSize: 11, position: "insideTopLeft", value: "0°C" }}
                stroke="var(--muted-foreground)"
                strokeDasharray="6 3"
                strokeOpacity={0.6}
                strokeWidth={1}
                y={0}
              />
              <XAxis
                angle={-45}
                axisLine={false}
                dataKey="day"
                height={76}
                stroke="var(--muted-foreground)"
                textAnchor="end"
                tickFormatter={(value) => rows.find((row) => row.day === value)?.tickLabel ?? String(value)}
                tickLine={false}
                tickMargin={14}
              />
              <YAxis
                axisLine={false}
                stroke="var(--muted-foreground)"
                tickFormatter={(value) => `${value} °C`}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  const visiblePayload = payload?.filter(
                    (entry) => typeof entry.value === "number"
                  );

                  if (!active || !visiblePayload?.length) {
                    return null;
                  }

                  return (
                    <div className="rounded-xl border border-white/40 bg-popover/90 p-3 text-sm text-popover-foreground shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl dark:border-white/10 dark:shadow-black/30">
                      <p className="mb-2 font-medium">
                        {typeof visiblePayload[0]?.payload?.label === "string"
                          ? tooltipDateFormatter.format(
                              new Date(`${visiblePayload[0].payload.label}T00:00:00.000Z`)
                            )
                          : String(label)}
                      </p>
                      <div className="grid gap-1">
                        {visiblePayload.map((entry) => (
                          <div
                            className="flex items-center justify-between gap-6"
                            key={String(entry.dataKey ?? entry.name)}
                          >
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-medium">
                              {typeof entry.value === "number"
                                ? `${entry.value.toFixed(1)} °C`
                                : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {heatwaves.map((heatwave) => {
                return (
                  <ReferenceArea
                    fill={getHeatwaveFill(heatwave.kind)}
                    fillOpacity={heatwave.kind === "canicule" ? 0.28 : 0.2}
                    ifOverflow="extendDomain"
                    key={`${heatwave.datasetId}-${heatwave.start}`}
                    stroke={getHeatwaveFill(heatwave.kind)}
                    strokeOpacity={heatwave.kind === "canicule" ? 0.65 : 0.45}
                    x1={heatwave.startDay}
                    x2={heatwave.endDay}
                  />
                );
              })}
              {coldWaves.map((coldWave) => {
                return (
                  <ReferenceArea
                    fill={getColdWaveFill(coldWave.kind)}
                    fillOpacity={coldWave.kind === "grand_froid" ? 0.28 : 0.2}
                    ifOverflow="extendDomain"
                    key={`${coldWave.datasetId}-${coldWave.start}`}
                    stroke={getColdWaveFill(coldWave.kind)}
                    strokeOpacity={coldWave.kind === "grand_froid" ? 0.65 : 0.45}
                    x1={coldWave.startDay}
                    x2={coldWave.endDay}
                  />
                );
              })}
              {visibleDatasets.map((dataset) =>
                dataset.id === "current" ? (
                  <Fragment key={dataset.id}>
                    <Line
                      connectNulls={false}
                      dataKey="currentObserved"
                      dot={false}
                      key="currentObserved"
                      name={dataset.label}
                      stroke={colors[dataset.id]}
                      strokeOpacity={1}
                      strokeWidth={3}
                      type="monotone"
                    />
                    <Line
                      connectNulls={false}
                      dataKey="currentForecast"
                      dot={false}
                      key="currentForecast"
                      legendType="none"
                      name={dataset.label}
                      stroke={colors[dataset.id]}
                      strokeDasharray="7 4"
                      strokeOpacity={0.7}
                      strokeWidth={3}
                      type="monotone"
                    />
                  </Fragment>
                ) : (
                  <Line
                    connectNulls={false}
                    dataKey={dataset.id}
                    dot={false}
                    key={dataset.id}
                    name={dataset.label}
                    stroke={colors[dataset.id]}
                    strokeOpacity={0.7}
                    strokeWidth={2}
                    type="monotone"
                  />
                )
              )}
              {showNormals ? (
                <Line
                  connectNulls={false}
                  dataKey="normal"
                  dot={false}
                  name={t["chart.normalLine"]}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="6 5"
                  strokeWidth={2}
                  type="monotone"
                />
              ) : null}
            </LineChart>
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/25 text-sm text-muted-foreground backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              {t["state.chartLoading"]}
            </div>
          )}
        </div>
      </div>

      <ChartLegend
        colors={colors}
        hiddenSeries={hiddenSeries}
        onToggleSeries={onToggleSeries}
        series={datasets.map((dataset) => ({
          id: dataset.id,
          label: dataset.label,
        }))}
      />
    </div>
  );
}

export function buildChartRows(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode,
  normals?: ClimateNormal[]
) {
  const maxDays = Math.max(0, ...datasets.map((dataset) => dataset.values.length));
  const normalByDay = new Map(normals?.map((normal) => [normal.day, normal.value]));
  const labelsByDay = new Map<number, string>();
  datasets.forEach((dataset) => {
    dataset.values.forEach((value) => {
      if (!labelsByDay.has(value.day)) {
        labelsByDay.set(value.day, value.date);
      }
    });
  });
  const datasetValuesByDay = datasets.map((dataset) => ({
    id: dataset.id,
    firstForecastDay: dataset.values.find((value) => value.isForecast)?.day ?? null,
    valuesByDay: new Map(dataset.values.map((value) => [value.day, value] as const)),
  }));

  return Array.from({ length: maxDays }, (_, index) => {
    const day = index + 1;
    const row: ChartRow = {
      day,
      label: labelsByDay.get(day) ?? "",
      tickLabel: formatChartDateTick(labelsByDay.get(day) ?? ""),
      normal: normalByDay.get(day) ?? null,
    };

    datasetValuesByDay.forEach((dataset) => {
      const value = dataset.valuesByDay.get(day);

      if (dataset.id === "current") {
        const shouldBridgeForecast =
          dataset.firstForecastDay !== null && day === dataset.firstForecastDay - 1;

        row.currentObserved = value?.isForecast ? null : value?.[temperatureMode] ?? null;
        row.currentForecast =
          value?.isForecast || shouldBridgeForecast ? value?.[temperatureMode] ?? null : null;
        return;
      }

      row[dataset.id] = value?.[temperatureMode] ?? null;
    });

    return row;
  });
}

export function getForecastBoundaryDay(datasets: WeatherYearDataset[]) {
  const currentDataset = datasets.find((dataset) => dataset.id === "current");
  const firstForecastDay = currentDataset?.values.find((value) => value.isForecast)?.day;

  return typeof firstForecastDay === "number" ? firstForecastDay : null;
}

export function getDisplayedForecastBoundaryDay(
  todayBoundaryDay: number | null,
  forecastBoundaryDay: number | null
) {
  if (forecastBoundaryDay === null) {
    return null;
  }

  return forecastBoundaryDay === todayBoundaryDay ? null : forecastBoundaryDay;
}

export function getMonthBoundaryDays(rows: ChartRow[]) {
  return rows
    .filter((row) => typeof row.label === "string" && row.label.slice(8, 10) === "01")
    .map((row) => row.day);
}

export function getTodayBoundaryDay(rows: ChartRow[], today = formatLocalDate(new Date())) {
  const matchingRow = rows.find((row) => row.label === today);

  return matchingRow?.day ?? null;
}

export function formatChartDateTick(value: string | number) {
  const text = String(value);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!parts) {
    return text;
  }

  const [, year, month, day] = parts;

  return `${day}/${month}/${year.slice(2)}`;
}

export function formatTooltipDate(value: string | number, locale: Locale = "fr") {
  const text = String(value);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!parts) {
    return text;
  }

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return fmt.format(new Date(`${text}T00:00:00.000Z`));
}

export function getHeatwaveFill(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "oklch(0.62 0.24 28)" : "oklch(0.74 0.18 62)";
}

export function getColdWaveFill(kind: ColdWavePeriod["kind"]) {
  return kind === "grand_froid" ? "oklch(0.55 0.22 250)" : "oklch(0.68 0.18 230)";
}
