"use client";

import { averageDatasetTemperature } from "@/lib/weather/calculateClimateNormals";
import type { ClimateNormal, TemperatureMode, WeatherYearDataset } from "@/types/weather";

type ClimateSummaryBarProps = {
  temperatureMode: TemperatureMode;
  datasets: WeatherYearDataset[];
  normals?: ClimateNormal[];
  showNormals: boolean;
};

export function ClimateSummaryBar({
  temperatureMode,
  datasets,
  normals,
  showNormals,
}: ClimateSummaryBarProps) {
  const stats = buildClimateSummaryStats({
    temperatureMode,
    datasets,
    normals,
    showNormals,
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
  showNormals: boolean;
};

export function buildClimateSummaryStats({
  temperatureMode,
  datasets,
  normals,
  showNormals,
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

  return [
    { label: "Moyenne période", value: formatTemp(average) },
    ...(showNormals
      ? [
          { label: "Normale 1991–2020", value: formatTemp(normalAverage) },
          {
            label: "Écart",
            tone: delta === null ? "neutral" : delta >= 0 ? "warm" : "cold",
            value: delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} °C`,
          } satisfies ClimateSummaryStat,
        ]
      : []),
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
