"use client";

import { averageDatasetTemperature } from "@/lib/weather/calculateClimateNormals";
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
};

export function ClimateSummaryBar({
  temperatureMode,
  datasets,
  normals,
  heatwaves,
}: ClimateSummaryBarProps) {
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

  return (
    <div className="flex flex-wrap gap-2">
      <StatCard label="Moyenne période" value={formatTemp(average)} />
      <StatCard label="Normale 1991–2020" value={formatTemp(normalAverage)} />
      <StatCard
        label="Écart"
        tone={delta === null ? "neutral" : delta >= 0 ? "warm" : "cold"}
        value={delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} °C`}
      />
      <StatCard label="Jours > 30 °C" value={String(hotDays)} />
      <StatCard label="Nuits tropicales" value={String(tropicalNights)} />
      <StatCard label="Vagues de chaleur" value={String(vagueHeatwaves.length)} />
      <StatCard label="Canicules" tone="warm" value={String(canicules.length)} />
    </div>
  );
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
