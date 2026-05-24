"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartLegend } from "@/components/chart/ChartLegend"
import type {
  ClimateNormal,
  HeatwavePeriod,
  TemperatureMode,
  WeatherYearDataset,
} from "@/types/weather"

const palette = [
  "#047857",
  "#2563eb",
  "#c2410c",
  "#7c3aed",
  "#be123c",
  "#0f766e",
  "#a16207",
  "#4338ca",
  "#15803d",
  "#b45309",
]

type WeatherChartProps = {
  datasets: WeatherYearDataset[]
  temperatureMode: TemperatureMode
  hiddenYears: number[]
  referenceYear: number
  normals?: ClimateNormal[]
  heatwaves?: HeatwavePeriod[]
  showNormals: boolean
  onToggleYear: (year: number) => void
}

type ChartRow = {
  day: number
  normal?: number | null
  [year: string]: number | null | undefined
}

export function WeatherChart({
  datasets,
  temperatureMode,
  hiddenYears,
  referenceYear,
  normals,
  heatwaves = [],
  showNormals,
  onToggleYear,
}: WeatherChartProps) {
  const colors = Object.fromEntries(
    datasets.map((dataset, index) => [
      dataset.year,
      palette[index % palette.length],
    ])
  ) as Record<number, string>
  const rows = buildChartRows(datasets, temperatureMode, normals)
  const visibleDatasets = datasets.filter(
    (dataset) => !hiddenYears.includes(dataset.year)
  )

  if (datasets.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-stone-500">
        Aucune donnee disponible pour cette periode.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto">
        <div className="h-[420px] min-w-[760px]">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={rows} margin={{ left: 8, right: 24, top: 16 }}>
              <CartesianGrid stroke="#e7e5e4" strokeDasharray="4 4" />
              <XAxis
                dataKey="day"
                tickLine={false}
                label={{ value: "Jour du mois", dy: 16, position: "insideBottom" }}
              />
              <YAxis
                tickFormatter={(value) => `${value} deg`}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) {
                    return null
                  }

                  return (
                    <div className="rounded-lg border bg-white p-3 text-sm shadow-lg">
                      <p className="mb-2 font-medium">Jour {label}</p>
                      <div className="grid gap-1">
                        {payload.map((entry) => (
                          <div
                            className="flex items-center justify-between gap-6"
                            key={String(entry.dataKey ?? entry.name)}
                          >
                            <span style={{ color: entry.color }}>
                              {entry.name}
                            </span>
                            <span className="font-medium">
                              {typeof entry.value === "number"
                                ? `${entry.value.toFixed(1)} degC`
                                : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }}
              />
              {heatwaves.map((heatwave) => (
                <ReferenceArea
                  fill="#fed7aa"
                  fillOpacity={0.35}
                  ifOverflow="extendDomain"
                  key={`${heatwave.year}-${heatwave.start}`}
                  x1={heatwave.startDay}
                  x2={heatwave.endDay}
                />
              ))}
              {visibleDatasets.map((dataset) => (
                <Line
                  connectNulls={false}
                  dataKey={String(dataset.year)}
                  dot={false}
                  key={dataset.year}
                  name={String(dataset.year)}
                  stroke={colors[dataset.year]}
                  strokeOpacity={dataset.year === referenceYear ? 1 : 0.7}
                  strokeWidth={dataset.year === referenceYear ? 3 : 2}
                  type="monotone"
                />
              ))}
              {showNormals ? (
                <Line
                  connectNulls={false}
                  dataKey="normal"
                  dot={false}
                  name="Normale 1991-2020"
                  stroke="#57534e"
                  strokeDasharray="6 5"
                  strokeWidth={2}
                  type="monotone"
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ChartLegend
        colors={colors}
        hiddenYears={hiddenYears}
        onToggleYear={onToggleYear}
        years={datasets.map((dataset) => dataset.year)}
      />
    </div>
  )
}

function buildChartRows(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode,
  normals?: ClimateNormal[]
) {
  const maxDays = Math.max(0, ...datasets.map((dataset) => dataset.values.length))
  const normalByDay = new Map(normals?.map((normal) => [normal.day, normal.value]))

  return Array.from({ length: maxDays }, (_, index) => {
    const day = index + 1
    const row: ChartRow = {
      day,
      normal: normalByDay.get(day) ?? null,
    }

    datasets.forEach((dataset) => {
      row[String(dataset.year)] =
        dataset.values.find((value) => value.day === day)?.[temperatureMode] ??
        null
    })

    return row
  })
}
