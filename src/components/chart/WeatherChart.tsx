"use client"

import { useEffect, useRef, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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
  const chartShellRef = useRef<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState(0)
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

  useEffect(() => {
    const element = chartShellRef.current

    if (!element) {
      return
    }

    const updateWidth = () => {
      setChartWidth(element.clientWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  if (datasets.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
        Aucune donnee disponible pour cette periode.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]" ref={chartShellRef}>
          {chartWidth > 0 ? (
            <LineChart
              data={rows}
              height={420}
              margin={{ left: 8, right: 24, top: 16 }}
              width={Math.max(chartWidth, 760)}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeOpacity={0.72}
              />
              <XAxis
                axisLine={false}
                dataKey="day"
                stroke="var(--muted-foreground)"
                tickLine={false}
                label={{ value: "Jour du mois", dy: 16, position: "insideBottom" }}
              />
              <YAxis
                axisLine={false}
                stroke="var(--muted-foreground)"
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
                    <div className="rounded-xl border border-white/40 bg-popover/90 p-3 text-sm text-popover-foreground shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl dark:border-white/10 dark:shadow-black/30">
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
                  fill="oklch(0.76 0.16 52)"
                  fillOpacity={0.18}
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
                  stroke="var(--muted-foreground)"
                  strokeDasharray="6 5"
                  strokeWidth={2}
                  type="monotone"
                />
              ) : null}
            </LineChart>
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/25 text-sm text-muted-foreground backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              Chargement du graphique...
            </div>
          )}
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
