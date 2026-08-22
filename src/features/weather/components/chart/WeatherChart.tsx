"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  type XAxisTickContentProps,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend } from "./ChartLegend";
import { ChartDataTable } from "./ChartDataTable";
import { ChartTooltipCard, MobileTooltipReporter, type ActiveTooltip } from "./ChartTooltip";
import {
  getCurrentForecastLineAnimation,
  getCurrentObservedLineAnimation,
  getCurrentSeriesAnimation,
  getFreshSeriesKeysFromSignatures,
  getNormalsLineConfig,
  getSeriesAnimationDuration,
  getSeriesLineKeys,
  getSeriesLineKeysDependency,
  getSeriesLineSignatures,
  type SeriesLineSignatures,
} from "./weatherChartAnimation";
import {
  buildChartRows,
  getChartTickFontWeight,
  getColdWaveFill,
  getDisplayedForecastBoundaryDay,
  getExtremeAreaSegments,
  getExtremeBridgeDay,
  getForecastBoundaryDay,
  getHeatwaveFill,
  getMonthBoundaryDays,
  getTodayBoundaryDay,
} from "./weatherChartLogic";
import {
  getTooltipExtremeEntries,
  getTooltipTropicalNightEntries,
  type TooltipEntry,
} from "./weatherChartTooltip";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useChartFullscreen } from "@/lib/useChartFullscreen";
import { useIsMobile } from "@/lib/useIsMobile";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";
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
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
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

const SERIES_ANIMATION_MS = 1500;
const UPDATE_ANIMATION_MS = 400;
const CHART_HEIGHT = 480;
const CHART_MIN_WIDTH = 760;

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
  const dataTableCaptionId = useId();
  const chartViewportRef = useRef<HTMLDivElement | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(0);
  const isMobile = useIsMobile();
  const {
    active: isFullscreen,
    needsRotation,
    toggle: toggleFullscreen,
  } = useChartFullscreen(fullscreenContainerRef, { lockLandscape: isMobile });
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const [scrollFade, setScrollFade] = useState({ start: false, end: false });

  // In fullscreen the chart fills the measured viewport slot (the flex-1 area
  // left after the tooltip readout), so it stays aligned to the screen height
  // and shrinks instead of overlapping when the mobile readout grows tall.
  const chartRenderWidth = isFullscreen ? chartWidth : Math.max(chartWidth, CHART_MIN_WIDTH);
  const chartRenderHeight = isFullscreen ? chartHeight : CHART_HEIGHT;
  const canRenderChart = chartWidth > 0 && (!isFullscreen || chartHeight > 0);

  // The floating tooltip only reads well on the pointer; on touch it jitters and
  // hides behind the finger, so mobile gets a fixed readout below the chart.
  useEffect(() => {
    if (!isMobile) {
      setActiveTooltip(null);
    }
  }, [isMobile]);
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
    () => t["chart.ariaDescription"].replace("{series}", datasets.map((d) => d.label).join(", ")),
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
          getTooltipTropicalNightEntries(
            row.day,
            visibleDatasets,
            colors,
            t["chart.tropicalNight"]
          ),
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
        // compare against the previous committed data version
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

  // Mirrors the summary bar's edge-fade: mask the scrolled chart's left/right
  // edges on mobile so the horizontal overflow reads as scrollable.
  useEffect(() => {
    const element = chartViewportRef.current;

    if (!element) {
      return;
    }

    const update = () => {
      const maxScroll = element.scrollWidth - element.clientWidth;
      setScrollFade({
        start: element.scrollLeft > 1,
        end: element.scrollLeft < maxScroll - 1,
      });
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [rows.length, isFullscreen]);

  useEffect(() => {
    const element = chartViewportRef.current;
    let frameId = 0;

    if (!element) {
      return;
    }

    const updateSize = () => {
      setChartWidth(element.clientWidth);
      setChartHeight(element.clientHeight);
    };

    const scheduleSizeUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateSize();
      });
    };

    updateSize();

    const observer = new ResizeObserver(scheduleSizeUpdate);
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Toggling fullscreen adds/removes the shell's inline width. Re-measure
  // synchronously here so the LineChart never renders a frame at the stale
  // (fullscreen-sized) width before the async ResizeObserver catches up — that
  // frame is the overflow flash seen when exiting fullscreen.
  useLayoutEffect(() => {
    const element = chartViewportRef.current;

    if (element) {
      setChartWidth(element.clientWidth);
      setChartHeight(element.clientHeight);
    }
  }, [isFullscreen]);

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
    <div className="grid min-w-0 gap-4">
      <div
        className={cn(
          // `min-w-0` lets this grid item shrink below the chart's min-content
          // width so the inner `overflow-x-auto` owns the horizontal scroll
          // instead of forcing the whole panel wider than the viewport.
          "relative min-w-0",
          isFullscreen && !needsRotation && "chart-fullscreen flex flex-col",
          needsRotation && "chart-fullscreen-rotate flex flex-col"
        )}
        ref={fullscreenContainerRef}
      >
        <div
          className={cn(
            isFullscreen ? "min-h-0 flex-1 overflow-hidden" : "summary-scroll overflow-x-auto"
          )}
          data-fade-end={!isFullscreen && scrollFade.end ? "true" : undefined}
          data-fade-start={!isFullscreen && scrollFade.start ? "true" : undefined}
          ref={chartViewportRef}
        >
          <div
            aria-describedby={dataTableCaptionId}
            aria-label={chartAriaLabel}
            className={cn("weather-chart-shell", !isFullscreen && "min-w-[760px]")}
            ref={chartShellRef}
            role="group"
            style={isFullscreen ? { width: chartRenderWidth } : undefined}
          >
            {canRenderChart ? (
              <LineChart
                accessibilityLayer
                data={rows}
                height={chartRenderHeight}
                margin={{ bottom: isMobile ? 16 : 56, left: 8, right: 24, top: 16 }}
                width={chartRenderWidth}
              >
                <CartesianGrid stroke="var(--border)" strokeOpacity={0.42} vertical={false} />
                {monthBoundaryDays.map((day) => (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    key={day}
                    stroke="var(--border)"
                    strokeOpacity={0.5}
                    strokeWidth={1}
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
                  label={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                    position: "insideTopLeft",
                    value: "0°C",
                  }}
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
                  content={({ active, label, payload }) =>
                    // On mobile the floating card is suppressed (it jitters and
                    // hides behind the finger); the fixed readout below the chart
                    // takes over while recharts still draws the cursor line. The
                    // recharts@3 chart event state no longer carries the active
                    // payload, so we lift it from the tooltip render prop instead.
                    isMobile ? (
                      <MobileTooltipReporter
                        active={active ?? false}
                        label={label}
                        onChange={setActiveTooltip}
                        payload={(payload ?? []) as readonly TooltipEntry[]}
                      />
                    ) : !active ? null : (
                      <ChartTooltipCard
                        dateFormatter={tooltipDateFormatter}
                        extremeEntriesByDay={tooltipExtremeEntriesByDay}
                        label={label}
                        payload={payload ?? []}
                        tropicalNightsByDay={tooltipTropicalNightsByDay}
                        variant="floating"
                      />
                    )
                  }
                />
                {heatwaves.map((heatwave) => {
                  const bridgeToDay = getExtremeBridgeDay(heatwave, heatwaves);
                  return getExtremeAreaSegments(heatwave, bridgeToDay).map((segment) => (
                    <ReferenceArea
                      fill={getHeatwaveFill(heatwave.kind)}
                      fillOpacity={heatwave.kind === "canicule" ? 0.11 : 0.07}
                      ifOverflow="extendDomain"
                      key={`${heatwave.datasetId}-${heatwave.start}-${segment.x1}-${segment.x2}`}
                      stroke={getHeatwaveFill(heatwave.kind)}
                      strokeDasharray={segment.isForecast ? "2 4" : undefined}
                      strokeOpacity={heatwave.kind === "canicule" ? 0.32 : 0.2}
                      x1={segment.x1}
                      x2={segment.x2}
                    />
                  ));
                })}
                {coldWaves.map((coldWave) => {
                  const bridgeToDay = getExtremeBridgeDay(coldWave, coldWaves);
                  return getExtremeAreaSegments(coldWave, bridgeToDay).map((segment) => (
                    <ReferenceArea
                      fill={getColdWaveFill(coldWave.kind)}
                      fillOpacity={coldWave.kind === "grand_froid" ? 0.09 : 0.06}
                      ifOverflow="extendDomain"
                      key={`${coldWave.datasetId}-${coldWave.start}-${segment.x1}-${segment.x2}`}
                      stroke={getColdWaveFill(coldWave.kind)}
                      strokeDasharray={segment.isForecast ? "2 4" : undefined}
                      strokeOpacity={coldWave.kind === "grand_froid" ? 0.28 : 0.18}
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
                        strokeWidth={2.75}
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
                        strokeWidth={2.75}
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
                      strokeOpacity={0.82}
                      strokeWidth={1.75}
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
              <div className="flex h-[480px] items-center justify-center rounded-md border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
                {t["state.chartLoading"]}
              </div>
            )}
          </div>
        </div>

        {isMobile && !isFullscreen ? (
          <div className="flex items-center pt-2">
            {activeTooltip ? (
              <ChartTooltipCard
                dateFormatter={tooltipDateFormatter}
                extremeEntriesByDay={tooltipExtremeEntriesByDay}
                label={activeTooltip.label}
                payload={activeTooltip.payload}
                tropicalNightsByDay={tooltipTropicalNightsByDay}
                variant="panel"
              />
            ) : (
              <p className="w-full text-center text-xs text-muted-foreground">
                {t["chart.tooltipHint"]}
              </p>
            )}
          </div>
        ) : null}

        {isMobile && isFullscreen && activeTooltip ? (
          <div className="absolute right-3 bottom-3 z-20 max-w-[min(20rem,calc(100%-1.5rem))]">
            <div className="relative">
              <ChartTooltipCard
                dateFormatter={tooltipDateFormatter}
                extremeEntriesByDay={tooltipExtremeEntriesByDay}
                label={activeTooltip.label}
                payload={activeTooltip.payload}
                tropicalNightsByDay={tooltipTropicalNightsByDay}
                variant="floating"
              />
              <Button
                aria-label={t["dialog.close"]}
                className="absolute -top-2 -right-2 size-6 rounded-full bg-background shadow-md"
                onClick={() => setActiveTooltip(null)}
                size="icon"
                type="button"
                variant="outline"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
        ) : null}

        <Button
          aria-label={isFullscreen ? t["chart.exitFullscreen"] : t["chart.enterFullscreen"]}
          className={cn(
            "absolute top-3 z-10 size-8 shrink-0 rounded-md bg-background/80 shadow-sm backdrop-blur",
            isMobile && !isFullscreen ? "right-0" : "right-3"
          )}
          onClick={toggleFullscreen}
          size="icon"
          type="button"
          variant="outline"
        >
          {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Button>
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

      <ChartDataTable
        captionId={dataTableCaptionId}
        datasets={visibleDatasets}
        rows={rows}
        showNormals={showNormals}
        temperatureMode={temperatureMode}
      />
    </div>
  );
}
