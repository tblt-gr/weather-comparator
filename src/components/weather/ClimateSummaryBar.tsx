"use client"

import { averageDatasetTemperature } from "@/lib/weather/calculateClimateNormals"
import type {
  ClimateNormal,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/types/weather"

type ClimateSummaryBarProps = {
  referenceYear: number
  temperatureMode: TemperatureMode
  datasets: WeatherYearDataset[]
  normals?: ClimateNormal[]
  heatwaves: HeatwavePeriod[]
}

export function ClimateSummaryBar({
  referenceYear,
  temperatureMode,
  datasets,
  normals,
  heatwaves,
}: ClimateSummaryBarProps) {
  const referenceDataset = datasets.find(
    (dataset) => dataset.year === referenceYear
  )
  const average = averageDatasetTemperature(referenceDataset, temperatureMode)
  const normalValues =
    normals
      ?.map((normal) => normal.value)
      .filter((value): value is number => typeof value === "number") ?? []
  const normalAverage =
    normalValues.length > 0
      ? normalValues.reduce((total, value) => total + value, 0) /
        normalValues.length
      : null
  const delta =
    average !== null && normalAverage !== null ? average - normalAverage : null
  const hotDays =
    referenceDataset?.values.filter(
      (value) => typeof value.tmax === "number" && value.tmax > 30
    ).length ?? 0
  const tropicalNights =
    referenceDataset?.values.filter(
      (value) => typeof value.tmin === "number" && value.tmin >= 20
    ).length ?? 0

  return (
    <div className="grid gap-2 overflow-x-auto sm:grid-cols-2 xl:grid-cols-5">
      <SummaryItem
        label={`Moyenne ${referenceYear}`}
        value={formatTemperature(average)}
      />
      <SummaryItem
        label="Normale 1991-2020"
        value={formatTemperature(normalAverage)}
      />
      <SummaryItem
        label="Ecart"
        tone={delta === null ? "neutral" : delta >= 0 ? "warm" : "cold"}
        value={delta === null ? "-" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} degC`}
      />
      <SummaryItem label="Jours > 30 degC" value={String(hotDays)} />
      <SummaryItem
        label="Nuits tropicales"
        value={`${tropicalNights} / Canicules ${heatwaves.length}`}
      />
    </div>
  )
}

function SummaryItem({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: string
  tone?: "neutral" | "warm" | "cold"
}) {
  const toneClass =
    tone === "warm"
      ? "text-orange-700"
      : tone === "cold"
        ? "text-sky-700"
        : "text-stone-950"

  return (
    <div className="min-w-44 rounded-lg border bg-stone-50 px-3 py-2">
      <p className="text-xs font-medium text-stone-600">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

function formatTemperature(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)} degC`
}
