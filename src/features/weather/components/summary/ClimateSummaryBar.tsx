"use client";

import { useEffect, useRef, useState } from "react";

import { averageDatasetTemperature } from "@/features/weather/logic/calculateClimateNormals";
import { buildColdWaveStats, buildHeatwaveStats } from "@/features/weather/logic/extremes";
import type {
  ClimateNormal,
  ColdWavePeriod,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Translations } from "@/lib/i18n/types";

type ClimateSummaryBarProps = {
  temperatureMode: TemperatureMode;
  datasets: WeatherYearDataset[];
  normals?: ClimateNormal[];
  coldWaves: ColdWavePeriod[];
  heatwaves: HeatwavePeriod[];
  showNormals: boolean;
};

export function ClimateSummaryBar({
  temperatureMode,
  datasets,
  normals,
  coldWaves,
  heatwaves,
  showNormals,
}: ClimateSummaryBarProps) {
  const { t } = useLocale();
  const stats = buildClimateSummaryStats({
    temperatureMode,
    datasets,
    normals,
    coldWaves,
    heatwaves,
    showNormals,
    t,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setFade({
        start: el.scrollLeft > 1,
        end: el.scrollLeft < maxScroll - 1,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [stats.length]);

  return (
    <div
      ref={scrollRef}
      className="summary-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 -mb-1 lg:mb-0 lg:flex-initial lg:flex-wrap lg:overflow-x-visible lg:pb-0"
      data-fade-end={fade.end ? "true" : undefined}
      data-fade-start={fade.start ? "true" : undefined}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} tone={stat.tone} value={stat.value} />
      ))}
    </div>
  );
}

type ClimateSummaryStat = {
  label: string;
  value: string;
  tone?: "neutral" | "warm" | "cold";
};

type BuildClimateSummaryStatsParams = {
  temperatureMode: TemperatureMode;
  datasets: WeatherYearDataset[];
  normals?: ClimateNormal[];
  coldWaves: ColdWavePeriod[];
  heatwaves: HeatwavePeriod[];
  showNormals: boolean;
  t: Translations;
};

export function buildClimateSummaryStats({
  temperatureMode,
  datasets,
  normals,
  coldWaves,
  heatwaves,
  showNormals,
  t,
}: BuildClimateSummaryStatsParams): ClimateSummaryStat[] {
  const referenceDataset = datasets.find((d) => d.offsetYears === 0);
  const average = averageDatasetTemperature(referenceDataset, temperatureMode);
  const normalValues =
    normals?.map((n) => n.value).filter((v): v is number => typeof v === "number") ?? [];
  const normalAverage =
    normalValues.length > 0
      ? normalValues.reduce((total, v) => total + v, 0) / normalValues.length
      : null;
  const delta = average !== null && normalAverage !== null ? average - normalAverage : null;
  const heatwaveStats = buildHeatwaveStats(heatwaves, datasets);
  const coldWaveStats = buildColdWaveStats(coldWaves, datasets);

  return [
    { label: t["stats.periodAverage"], value: formatTemp(average) },
    ...(showNormals
      ? [
          { label: t["stats.normal"], value: formatTemp(normalAverage) },
          {
            label: t["stats.deviation"],
            tone: delta === null ? "neutral" : delta >= 0 ? "warm" : "cold",
            value: delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} °C`,
          } satisfies ClimateSummaryStat,
        ]
      : []),
    { label: t["stats.hotDays"], value: String(heatwaveStats.hotDays) },
    ...(heatwaveStats.tropicalNights > 0
      ? [{ label: t["stats.tropicalNights"], value: String(heatwaveStats.tropicalNights) }]
      : []),
    ...buildOptionalHeatwaveStats(heatwaveStats, t),
    ...buildOptionalColdStats(coldWaveStats, t),
  ];
}

function buildOptionalHeatwaveStats(
  heatwaveStats: ReturnType<typeof buildHeatwaveStats>,
  t: Translations
) {
  const stats: ClimateSummaryStat[] = [];

  if (heatwaveStats.heatwaveCount > 0) {
    stats.push({
      label: t["stats.heatwaves"],
      value: String(heatwaveStats.heatwaveCount),
    });
  }

  if (heatwaveStats.caniculeCount > 0) {
    stats.push({
      label: t["stats.canicules"],
      tone: "warm",
      value: String(heatwaveStats.caniculeCount),
    });
  }

  return stats;
}

function buildOptionalColdStats(coldWaveStats: ReturnType<typeof buildColdWaveStats>, t: Translations) {
  const stats: ClimateSummaryStat[] = [];

  if (coldWaveStats.freezingDays > 0) {
    stats.push({
      label: t["stats.freezingDays"],
      tone: "cold",
      value: String(coldWaveStats.freezingDays),
    });
  }

  if (coldWaveStats.extremeColdNights > 0) {
    stats.push({
      label: t["stats.extremeColdNights"],
      tone: "cold",
      value: String(coldWaveStats.extremeColdNights),
    });
  }

  if (coldWaveStats.coldWaveCount > 0) {
    stats.push({
      label: t["stats.coldWaves"],
      tone: "cold",
      value: String(coldWaveStats.coldWaveCount),
    });
  }

  if (coldWaveStats.grandFroidCount > 0) {
    stats.push({
      label: t["stats.grandFroid"],
      tone: "cold",
      value: String(coldWaveStats.grandFroidCount),
    });
  }

  return stats;
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warm" | "cold";
}) {
  const valueClass =
    tone === "warm"
      ? "text-orange-600 dark:text-orange-400"
      : tone === "cold"
        ? "text-sky-600 dark:text-sky-400"
        : "text-foreground";

  return (
    <div className="glass-card w-28 shrink-0 rounded-xl px-3 py-2 sm:w-36 lg:w-auto lg:min-w-36">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function formatTemp(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)} °C`;
}
