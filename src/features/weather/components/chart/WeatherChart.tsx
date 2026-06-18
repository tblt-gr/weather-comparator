"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  type TooltipContentProps,
  type XAxisTickContentProps,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend } from "./ChartLegend";
import { formatDisplayDate, formatLocalDate } from "@/features/weather/logic/dates";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { Locale } from "@/lib/i18n/types";
import type {
  ClimateNormal,
  ColdWavePeriod,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/features/weather/types";

type ExtremeAreaSegment = {
  x1: number;
  x2: number;
  isForecast: boolean;
};

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

type TooltipEntry = NonNullable<TooltipContentProps<number, string>["payload"]>[number];

type SeriesAnimation = {
  observedDuration: number;
  forecastBegin: number;
  forecastDuration: number;
};

type CurrentObservedLineAnimation = {
  animationDuration: number;
  isAnimationActive: boolean;
};

type CurrentForecastLineAnimation = {
  animationBegin: number;
  animationDuration: number;
  isAnimationActive: boolean;
};

type SeriesLineSignatures = Map<string, string>;

type TooltipExtremeEntry = {
  key: string;
  label: string;
  color: string;
};

const SERIES_ANIMATION_MS = 1500;
const UPDATE_ANIMATION_MS = 400;
const NORMALS_LINE_STROKE_DASHARRAY = "6 5";

type NormalsLineConfig = {
  isAnimationActive: boolean;
  strokeDasharray: string;
  strokeWidth: number;
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
  const reducedMotion = useReducedMotion();
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
  const normalsLineConfig = useMemo(() => getNormalsLineConfig(), []);
  // Longest visible curve sets the reference speed; every series scales to it.
  const referenceSegmentCount = useMemo(() => {
    const maxPointCount = Math.max(0, ...visibleDatasets.map((dataset) => dataset.values.length));
    return Math.max(0, maxPointCount - 1);
  }, [visibleDatasets]);
  const currentSeriesAnimation = useMemo(
    () =>
      getCurrentSeriesAnimation(
        datasets.find((dataset) => dataset.id === "current"),
        referenceSegmentCount,
        SERIES_ANIMATION_MS
      ),
    [datasets, referenceSegmentCount]
  );
  const chartAriaLabel = useMemo(
    () =>
      t["chart.ariaDescription"].replace("{series}", datasets.map((d) => d.label).join(", ")),
    [datasets, t]
  );
  const tooltipExtremeEntriesByDay = useMemo(
    () =>
      new Map(
        rows.map((row) => [
          row.day,
          getTooltipExtremeEntries(row.day, heatwaves, coldWaves, locale),
        ])
      ),
    [coldWaves, heatwaves, locale, rows]
  );
  const tooltipTropicalNightsByDay = useMemo(
    () =>
      new Map(
        rows.map((row) => [
          row.day,
          getTooltipTropicalNightEntries(row.day, visibleDatasets, colors, t["chart.tropicalNight"]),
        ])
      ),
    [colors, rows, t, visibleDatasets]
  );

  // A line plays its full draw-in only when its key first appears (React mount).
  // On later renders (Y-domain rescale, mode toggle, …) recharts re-animates the
  // same line by morphing prev → new points; those lines are NOT "fresh" so they
  // use the shorter UPDATE_ANIMATION_MS. Freshness = keys absent from the previous
  // committed render. We track that in a ref (updated post-commit) rather than
  // state on purpose: a state update would re-render with a new duration on a line
  // whose animationId is unchanged, which restarts/replays its animation (see
  // recharts JavascriptAnimate, whose effect deps include `begin` and `duration`).
  const seriesLineKeys = useMemo(() => getSeriesLineKeys(visibleDatasets), [visibleDatasets]);
  const seriesLineKeysDependency = useMemo(
    () => getSeriesLineKeysDependency(seriesLineKeys),
    [seriesLineKeys]
  );
  const seriesLineSignatures = useMemo(
    () => getSeriesLineSignatures(visibleDatasets, temperatureMode),
    [temperatureMode, visibleDatasets]
  );
  const lastCommittedLineSignaturesRef = useRef<SeriesLineSignatures>(new Map());
  // Freshness is LOCKED to the data/signature version, not recomputed on every
  // render. A spurious re-render (ResizeObserver width tick, parent update) keeps
  // the same memo result, so the begin/duration props handed to a still-animating
  // line stay byte-identical and recharts does not restart it mid-draw. Without
  // this the forecast line lost its stagger delay whenever a re-render landed
  // during the observed draw — the intermittent "starts at the same time" bug.
  const freshLineKeys = useMemo(
    () =>
      getFreshSeriesKeysFromSignatures(
        seriesLineSignatures,
        // eslint-disable-next-line react-hooks/refs -- compare against the previous committed data version
        lastCommittedLineSignaturesRef.current
      ),
    [seriesLineSignatures]
  );
  const currentObservedLineAnimation = useMemo(
    () =>
      getCurrentObservedLineAnimation({
        currentSeriesAnimation,
        freshLineKeys,
        reducedMotion,
        updateAnimationMs: UPDATE_ANIMATION_MS,
      }),
    [currentSeriesAnimation, freshLineKeys, reducedMotion]
  );
  const currentForecastLineAnimation = useMemo(
    () =>
      getCurrentForecastLineAnimation({
        currentSeriesAnimation,
        freshLineKeys,
        reducedMotion,
        updateAnimationMs: UPDATE_ANIMATION_MS,
      }),
    [currentSeriesAnimation, freshLineKeys, reducedMotion]
  );

  useEffect(() => {
    // Only record keys once the lines are actually mounted (the LineChart is
    // gated on chartWidth > 0). Marking them on the initial width=0 render would
    // make the first real draw look "already seen", collapsing the current
    // curve's two-part draw into a single desynced morph.
    if (chartWidth <= 0) {
      return;
    }
    lastCommittedLineSignaturesRef.current = new Map(seriesLineSignatures);
  }, [chartWidth, seriesLineKeysDependency, seriesLineSignatures]);

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

  const renderXAxisTick = ({ payload, x, y }: XAxisTickContentProps) => {
    const dayValue = payload?.value;
    const day =
      typeof dayValue === "number"
        ? dayValue
        : typeof dayValue === "string"
          ? Number(dayValue)
          : Number.NaN;
    const tickLabel = rows.find((row) => row.day === day)?.tickLabel ?? String(dayValue ?? "");

    return (
      <g transform={`translate(${x ?? 0},${y ?? 0})`}>
        <text
          dy={16}
          fill="var(--muted-foreground)"
          fontSize={12}
          fontWeight={getChartTickFontWeight(dayValue, todayBoundaryDay)}
          textAnchor="end"
          transform="rotate(-45)"
        >
          {tickLabel}
        </text>
      </g>
    );
  };

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto">
        <div
          aria-label={chartAriaLabel}
          className="weather-chart-shell min-w-[760px]"
          ref={chartShellRef}
          role="img"
        >
          {chartWidth > 0 ? (
            <LineChart
              accessibilityLayer={false}
              data={rows}
              height={420}
              margin={{ bottom: 56, left: 8, right: 24, top: 16 }}
              width={Math.max(chartWidth, 760)}
            >
              <defs>
                {heatwaves.map((heatwave) => (
                  <pattern
                    height="8"
                    id={getExtremePatternId(heatwave.datasetId, heatwave.start, heatwave.kind, "heat")}
                    key={getExtremePatternId(heatwave.datasetId, heatwave.start, heatwave.kind, "heat")}
                    patternTransform="rotate(45)"
                    patternUnits="userSpaceOnUse"
                    width="8"
                  >
                    <rect fill={getHeatwaveFill(heatwave.kind)} height="8" opacity="0.14" width="8" x="0" y="0" />
                    <line
                      stroke={getHeatwaveFill(heatwave.kind)}
                      strokeOpacity="0.6"
                      strokeWidth="3"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="8"
                    />
                  </pattern>
                ))}
                {coldWaves.map((coldWave) => (
                  <pattern
                    height="8"
                    id={getExtremePatternId(coldWave.datasetId, coldWave.start, coldWave.kind, "cold")}
                    key={getExtremePatternId(coldWave.datasetId, coldWave.start, coldWave.kind, "cold")}
                    patternTransform="rotate(45)"
                    patternUnits="userSpaceOnUse"
                    width="8"
                  >
                    <rect fill={getColdWaveFill(coldWave.kind)} height="8" opacity="0.14" width="8" x="0" y="0" />
                    <line
                      stroke={getColdWaveFill(coldWave.kind)}
                      strokeOpacity="0.6"
                      strokeWidth="3"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="8"
                    />
                  </pattern>
                ))}
              </defs>
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
                axisLine={false}
                dataKey="day"
                height={76}
                interval="equidistantPreserveStart"
                stroke="var(--muted-foreground)"
                tick={renderXAxisTick}
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
                  const visiblePayload = getVisibleTooltipEntries(payload ?? []);
                  const hoveredDay =
                    typeof visiblePayload[0]?.payload?.day === "number"
                      ? visiblePayload[0].payload.day
                      : typeof label === "number"
                        ? label
                        : null;
                  const extremeEntries =
                    hoveredDay === null
                      ? []
                      : [
                          ...(tooltipExtremeEntriesByDay.get(hoveredDay) ?? []),
                          ...(tooltipTropicalNightsByDay.get(hoveredDay) ?? []),
                        ];

                  if (!active || (!visiblePayload.length && !extremeEntries.length)) {
                    return null;
                  }

                  return (
                    <div className="rounded-xl border border-border/60 bg-popover p-3 text-sm text-popover-foreground shadow-2xl shadow-primary/5 dark:shadow-black/30">
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
                      {extremeEntries.length > 0 ? (
                        <div className="mt-2 border-t border-border/60 pt-2">
                          <div className="grid gap-1">
                            {extremeEntries.map((entry) => (
                              <div className="flex items-center gap-2" key={entry.key}>
                                <span
                                  aria-hidden="true"
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
              {heatwaves.map((heatwave) => {
                return getExtremeAreaSegments(heatwave).map((segment) => (
                  <ReferenceArea
                    fill={segment.isForecast ? `url(#${getExtremePatternId(heatwave.datasetId, heatwave.start, heatwave.kind, "heat")})` : getHeatwaveFill(heatwave.kind)}
                    fillOpacity={heatwave.kind === "canicule" ? 0.28 : 0.2}
                    ifOverflow="extendDomain"
                    key={`${heatwave.datasetId}-${heatwave.start}-${segment.x1}-${segment.x2}`}
                    stroke={getHeatwaveFill(heatwave.kind)}
                    strokeDasharray={segment.isForecast ? "5 3" : undefined}
                    strokeOpacity={heatwave.kind === "canicule" ? 0.65 : 0.45}
                    x1={segment.x1}
                    x2={segment.x2}
                  />
                ));
              })}
              {coldWaves.map((coldWave) => {
                return getExtremeAreaSegments(coldWave).map((segment) => (
                  <ReferenceArea
                    fill={segment.isForecast ? `url(#${getExtremePatternId(coldWave.datasetId, coldWave.start, coldWave.kind, "cold")})` : getColdWaveFill(coldWave.kind)}
                    fillOpacity={coldWave.kind === "grand_froid" ? 0.28 : 0.2}
                    ifOverflow="extendDomain"
                    key={`${coldWave.datasetId}-${coldWave.start}-${segment.x1}-${segment.x2}`}
                    stroke={getColdWaveFill(coldWave.kind)}
                    strokeDasharray={segment.isForecast ? "5 3" : undefined}
                    strokeOpacity={coldWave.kind === "grand_froid" ? 0.65 : 0.45}
                    x1={segment.x1}
                    x2={segment.x2}
                  />
                ));
              })}
              {visibleDatasets.map((dataset) =>
                dataset.id === "current" ? (
                  <Fragment key={dataset.id}>
                    <Line
                      animationDuration={currentObservedLineAnimation.animationDuration}
                      animationEasing="linear"
                      connectNulls={false}
                      dataKey="currentObserved"
                      dot={false}
                      isAnimationActive={currentObservedLineAnimation.isAnimationActive}
                      key="currentObserved"
                      name={dataset.label}
                      stroke={colors[dataset.id]}
                      strokeOpacity={1}
                      strokeWidth={3}
                      type="monotone"
                    />
                    <Line
                      animationBegin={currentForecastLineAnimation.animationBegin}
                      animationDuration={currentForecastLineAnimation.animationDuration}
                      animationEasing="linear"
                      connectNulls={false}
                      dataKey="currentForecast"
                      dot={false}
                      isAnimationActive={currentForecastLineAnimation.isAnimationActive}
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
                    animationDuration={getSeriesAnimationDuration(
                      dataset.id,
                      freshLineKeys,
                      reducedMotion,
                      SERIES_ANIMATION_MS,
                      UPDATE_ANIMATION_MS,
                      Math.max(0, dataset.values.length - 1),
                      referenceSegmentCount
                    )}
                    animationEasing="linear"
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
                  isAnimationActive={normalsLineConfig.isAnimationActive}
                  name={t["chart.normalLine"]}
                  stroke="var(--muted-foreground)"
                  strokeDasharray={normalsLineConfig.strokeDasharray}
                  strokeWidth={normalsLineConfig.strokeWidth}
                  type="monotone"
                />
              ) : null}
            </LineChart>
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/30 text-sm text-muted-foreground">
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

// All curves must read at the same on-screen speed. Recharts reveals a line over
// its own path length in `animationDuration`, so equal speed means duration must
// scale with length. We budget by SEGMENT count and normalize every series to the
// longest visible one (referenceSegmentCount): the longest takes `fullMs`, shorter
// curves finish sooner but sweep at the identical segments-per-ms.
export function getUniformDrawDuration(
  segmentCount: number,
  referenceSegmentCount: number,
  fullMs: number
): number {
  if (referenceSegmentCount <= 0) {
    return fullMs;
  }

  return Math.round((fullMs * segmentCount) / referenceSegmentCount);
}

export function getCurrentSeriesAnimation(
  currentDataset: WeatherYearDataset | undefined,
  referenceSegmentCount: number,
  fullMs: number
): SeriesAnimation {
  if (!currentDataset) {
    return {
      observedDuration: 0,
      forecastBegin: 0,
      forecastDuration: 0,
    };
  }

  const observedPointCount = currentDataset.values.filter((value) => !value.isForecast).length;
  const forecastPointCount = currentDataset.values.filter((value) => value.isForecast).length;

  // The observed line spans `observedPointCount - 1` segments. The forecast line
  // includes a bridge point to the last observed day, so it spans
  // `forecastPointCount` segments.
  const observedSegmentCount = Math.max(0, observedPointCount - 1);
  const forecastSegmentCount = forecastPointCount;
  const totalSegmentCount = observedSegmentCount + forecastSegmentCount;

  if (observedSegmentCount === 0) {
    return {
      observedDuration: 0,
      forecastBegin: 0,
      forecastDuration:
        forecastSegmentCount > 0
          ? getUniformDrawDuration(forecastSegmentCount, referenceSegmentCount, fullMs)
          : 0,
    };
  }

  if (forecastSegmentCount === 0) {
    const observedDuration = getUniformDrawDuration(
      observedSegmentCount,
      referenceSegmentCount,
      fullMs
    );

    return {
      observedDuration,
      forecastBegin: observedDuration,
      forecastDuration: 0,
    };
  }

  const totalDuration = getCompressedCurrentTotalDuration(
    observedSegmentCount,
    forecastSegmentCount,
    referenceSegmentCount,
    fullMs
  );
  const observedDuration = Math.round((totalDuration * observedSegmentCount) / totalSegmentCount);
  const forecastDuration = totalDuration - observedDuration;

  return {
    observedDuration,
    forecastBegin: observedDuration,
    forecastDuration,
  };
}

function getCompressedCurrentTotalDuration(
  observedSegmentCount: number,
  forecastSegmentCount: number,
  referenceSegmentCount: number,
  fullMs: number
): number {
  const totalDuration = getUniformDrawDuration(
    observedSegmentCount + forecastSegmentCount,
    referenceSegmentCount,
    fullMs
  );
  const longestSegmentDuration = getUniformDrawDuration(
    Math.max(observedSegmentCount, forecastSegmentCount),
    referenceSegmentCount,
    fullMs
  );

  return Math.round((totalDuration + longestSegmentDuration) / 2);
}

export function getCurrentObservedLineAnimation({
  currentSeriesAnimation,
  freshLineKeys,
  reducedMotion,
  updateAnimationMs,
}: {
  currentSeriesAnimation: SeriesAnimation;
  freshLineKeys: ReadonlySet<string>;
  reducedMotion: boolean;
  updateAnimationMs: number;
}): CurrentObservedLineAnimation {
  if (reducedMotion) {
    return {
      animationDuration: 0,
      isAnimationActive: false,
    };
  }

  if (!freshLineKeys.has("currentObserved")) {
    return {
      animationDuration: updateAnimationMs,
      isAnimationActive: true,
    };
  }

  return {
    animationDuration: currentSeriesAnimation.observedDuration,
    isAnimationActive: currentSeriesAnimation.observedDuration > 0,
  };
}

export function getCurrentForecastLineAnimation({
  currentSeriesAnimation,
  freshLineKeys,
  reducedMotion,
  updateAnimationMs,
}: {
  currentSeriesAnimation: SeriesAnimation;
  freshLineKeys: ReadonlySet<string>;
  reducedMotion: boolean;
  updateAnimationMs: number;
}): CurrentForecastLineAnimation {
  if (reducedMotion) {
    return {
      animationBegin: 0,
      animationDuration: 0,
      isAnimationActive: false,
    };
  }

  if (!freshLineKeys.has("currentForecast")) {
    return {
      animationBegin: 0,
      animationDuration: updateAnimationMs,
      isAnimationActive: true,
    };
  }

  return {
    animationBegin: currentSeriesAnimation.forecastBegin,
    animationDuration: currentSeriesAnimation.forecastDuration,
    isAnimationActive: currentSeriesAnimation.forecastDuration > 0,
  };
}

export function getSeriesLineKeys(datasets: WeatherYearDataset[]): string[] {
  return datasets.flatMap((dataset) =>
    dataset.id === "current" ? ["currentObserved", "currentForecast"] : [dataset.id]
  );
}

export function getSeriesLineSignatures(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode
): SeriesLineSignatures {
  return new Map(
    datasets.flatMap((dataset) => {
      if (dataset.id !== "current") {
        return [
          [
            dataset.id,
            buildSeriesLineSignature(dataset.id, dataset.values, temperatureMode, () => true),
          ] as const,
        ];
      }

      return [
        [
          "currentObserved",
          buildSeriesLineSignature(
            "currentObserved",
            dataset.values,
            temperatureMode,
            (value) => !value.isForecast
          ),
        ] as const,
        [
          "currentForecast",
          buildSeriesLineSignature(
            "currentForecast",
            dataset.values,
            temperatureMode,
            (value, index, values) =>
              value.isForecast ||
              (index === values.findIndex((entry) => entry.isForecast) - 1 && !value.isForecast)
          ),
        ] as const,
      ];
    })
  );
}

export function getSeriesLineKeysDependency(keys: readonly string[]): string {
  return JSON.stringify(keys);
}

export function getFreshSeriesKeys(
  currentKeys: string[],
  previousKeys: Iterable<string>
): Set<string> {
  const previous = new Set(previousKeys);

  return new Set(currentKeys.filter((key) => !previous.has(key)));
}

export function getFreshSeriesKeysFromSignatures(
  currentSignatures: ReadonlyMap<string, string>,
  previousSignatures: ReadonlyMap<string, string>
): Set<string> {
  return new Set(
    [...currentSignatures.entries()]
      .filter(([key, signature]) => previousSignatures.get(key) !== signature)
      .map(([key]) => key)
  );
}

export function getSeriesAnimationDuration(
  seriesId: string,
  freshIds: ReadonlySet<string>,
  reducedMotion: boolean,
  fullMs: number,
  updateMs: number,
  seriesSegmentCount: number,
  referenceSegmentCount: number
): number {
  if (reducedMotion) {
    return 0;
  }

  if (!freshIds.has(seriesId)) {
    return updateMs;
  }

  return getUniformDrawDuration(seriesSegmentCount, referenceSegmentCount, fullMs);
}

export function getNormalsLineConfig(): NormalsLineConfig {
  return {
    // Recharts animates line drawing with a solid stroke first, which makes dashed
    // series briefly appear continuous. Keep normals dashed from the first frame.
    isAnimationActive: false,
    strokeDasharray: NORMALS_LINE_STROKE_DASHARRAY,
    strokeWidth: 2,
  };
}

function buildSeriesLineSignature(
  lineId: string,
  values: WeatherYearDataset["values"],
  temperatureMode: TemperatureMode,
  includeValue: (
    value: WeatherYearDataset["values"][number],
    index: number,
    values: WeatherYearDataset["values"]
  ) => boolean
) {
  const points = values
    .filter((value, index, allValues) => includeValue(value, index, allValues))
    .map((value) => `${value.date}:${value[temperatureMode] ?? "null"}`)
    .join("|");

  return `${lineId}|${points}`;
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

export function getChartTickFontWeight(
  day: number | string | undefined,
  todayBoundaryDay: number | null
) {
  if (todayBoundaryDay === null) {
    return 400;
  }

  return Number(day) === todayBoundaryDay ? 700 : 400;
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

export function sortTooltipEntries(entries: readonly TooltipEntry[]) {
  return [...entries].sort((left, right) => {
    const leftValue = typeof left.value === "number" ? left.value : Number.NEGATIVE_INFINITY;
    const rightValue = typeof right.value === "number" ? right.value : Number.NEGATIVE_INFINITY;

    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }

    return String(right.dataKey ?? right.name).localeCompare(String(left.dataKey ?? left.name));
  });
}

export function getVisibleTooltipEntries(entries: readonly TooltipEntry[]) {
  const numericEntries = entries.filter((entry) => typeof entry.value === "number");
  const currentObservedValuesByDay = new Map<string, number>();

  numericEntries.forEach((entry) => {
    const dayKey = getTooltipEntryDayKey(entry);

    if (
      entry.dataKey === "currentObserved" &&
      dayKey !== null &&
      typeof entry.value === "number"
    ) {
      currentObservedValuesByDay.set(dayKey, entry.value);
    }
  });

  return sortTooltipEntries(
    numericEntries.filter((entry) => {
      const dayKey = getTooltipEntryDayKey(entry);

      return (
        entry.dataKey !== "currentForecast" ||
        dayKey === null ||
        typeof entry.value !== "number" ||
        currentObservedValuesByDay.get(dayKey) !== entry.value
      );
    })
  );
}

function getTooltipEntryDayKey(entry: TooltipEntry) {
  const payload = entry.payload as Record<string, unknown> | undefined;
  const day = payload?.day;

  return typeof day === "number" || typeof day === "string" ? String(day) : null;
}

export function formatExtremeDateRange(start: string, end: string) {
  return start === end
    ? formatDisplayDate(start)
    : `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
}

export function formatExtremeTooltipLabel(
  kind: HeatwavePeriod["kind"] | ColdWavePeriod["kind"],
  detail: string,
  locale: Locale = "fr"
) {
  if (locale === "en") {
    if (kind === "canicule") {
      return `Scorching heat • ${detail}`;
    }

    if (kind === "vague_de_chaleur") {
      return `Heat wave • ${detail}`;
    }

    if (kind === "grand_froid") {
      return `Severe cold • ${detail}`;
    }

    return `Cold wave • ${detail}`;
  }

  if (kind === "canicule") {
    return `Canicule • ${detail}`;
  }

  if (kind === "vague_de_chaleur") {
    return `Vague de chaleur • ${detail}`;
  }

  if (kind === "grand_froid") {
    return `Grand froid • ${detail}`;
  }

  return `Vague de froid • ${detail}`;
}

export function getTooltipExtremeEntries(
  day: number,
  heatwaves: HeatwavePeriod[],
  coldWaves: ColdWavePeriod[],
  locale: Locale = "fr"
): TooltipExtremeEntry[] {
  const heatEntries = heatwaves
    .filter((heatwave) => day >= heatwave.startDay && day <= heatwave.endDay)
    .map((heatwave) => ({
      color: getHeatwaveFill(heatwave.kind),
      key: `heat-${heatwave.datasetId}-${heatwave.start}`,
      label: formatExtremeTooltipLabel(
        heatwave.kind,
        formatExtremeDateRange(heatwave.start, heatwave.end),
        locale
      ),
      startDay: heatwave.startDay,
    }));
  const coldEntries = coldWaves
    .filter((coldWave) => day >= coldWave.startDay && day <= coldWave.endDay)
    .map((coldWave) => ({
      color: getColdWaveFill(coldWave.kind),
      key: `cold-${coldWave.datasetId}-${coldWave.start}`,
      label: formatExtremeTooltipLabel(
        coldWave.kind,
        formatExtremeDateRange(coldWave.start, coldWave.end),
        locale
      ),
      startDay: coldWave.startDay,
    }));

  return [...heatEntries, ...coldEntries]
    .sort((left, right) => left.startDay - right.startDay || left.label.localeCompare(right.label))
    .map(({ color, key, label }) => ({ color, key, label }));
}

export function getTooltipTropicalNightEntries(
  day: number,
  datasets: WeatherYearDataset[],
  colors: Record<string, string>,
  tropicalNightLabel: string
): TooltipExtremeEntry[] {
  return datasets
    .filter((dataset) => {
      const value = dataset.values.find((entry) => entry.day === day);

      return value?.tmin !== null && value?.tmin !== undefined && value.tmin >= 20;
    })
    .map((dataset) => ({
      color: colors[dataset.id],
      key: `tropical-night-${dataset.id}`,
      label: tropicalNightLabel,
    }));
}

export function getHeatwaveFill(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "oklch(0.62 0.24 28)" : "oklch(0.74 0.18 62)";
}

export function getColdWaveFill(kind: ColdWavePeriod["kind"]) {
  return kind === "grand_froid" ? "oklch(0.55 0.22 250)" : "oklch(0.68 0.18 230)";
}

export function getExtremeAreaSegments(period: {
  startDay: number;
  endDay: number;
  includesForecast: boolean;
  forecastStartDay: number | null;
}): ExtremeAreaSegment[] {
  if (!period.includesForecast || period.forecastStartDay === null) {
    return [{ x1: period.startDay, x2: period.endDay, isForecast: false }];
  }

  if (period.forecastStartDay <= period.startDay) {
    return [{ x1: period.startDay, x2: period.endDay, isForecast: true }];
  }

  const displayedForecastStartDay = Math.max(period.startDay, period.forecastStartDay - 1);

  return [
    { x1: period.startDay, x2: displayedForecastStartDay, isForecast: false },
    { x1: displayedForecastStartDay, x2: period.endDay, isForecast: true },
  ];
}

function getExtremePatternId(
  datasetId: string,
  start: string,
  kind: HeatwavePeriod["kind"] | ColdWavePeriod["kind"],
  family: "heat" | "cold"
) {
  return `${family}-${datasetId}-${start}-${kind}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}
