"use client";

import { averageDatasetTemperature } from "@/lib/weather/calculateClimateNormals";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Translations } from "@/lib/i18n/types";
import type {
  ClimateNormal,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/types/weather";

type ClimateSummaryBarProps = {
  temperatureMode: TemperatureMode;
  datasets: WeatherYearDataset[];
  normals?: ClimateNormal[];
  heatwaves: HeatwavePeriod[];
  showNormals: boolean;
};

export function ClimateSummaryBar({
  temperatureMode,
  datasets,
  normals,
  heatwaves,
  showNormals,
}: ClimateSummaryBarProps) {
  const { t } = useLocale();
  const stats = buildClimateSummaryStats({
    temperatureMode,
    datasets,
    normals,
    heatwaves,
    showNormals,
    t,
  });

  return (
    <div className="flex flex-wrap gap-2">
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
  heatwaves: HeatwavePeriod[];
  showNormals: boolean;
  t: Translations;
};

export function buildClimateSummaryStats({
  temperatureMode,
  datasets,
  normals,
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
  const hotDays =
    referenceDataset?.values.filter((v) => typeof v.tmax === "number" && v.tmax > 30).length ?? 0;
  const tropicalNights =
    referenceDataset?.values.filter((v) => typeof v.tmin === "number" && v.tmin >= 20).length ?? 0;
  const vagueHeatwaves = heatwaves.filter((heatwave) => heatwave.kind === "vague_de_chaleur");
  const canicules = heatwaves.filter((heatwave) => heatwave.kind === "canicule");

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
    { label: t["stats.hotDays"], value: String(hotDays) },
    { label: t["stats.tropicalNights"], value: String(tropicalNights) },
    { label: t["stats.heatwaves"], value: String(vagueHeatwaves.length) },
    { label: t["stats.canicules"], tone: "warm", value: String(canicules.length) },
  ];
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
    <div className="glass-card min-w-36 rounded-xl px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function formatTemp(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)} °C`;
}
