"use client"

import { Download, FileDown } from "lucide-react"
import type { RefObject } from "react"
import { toPng } from "html-to-image"

import { Button } from "@/components/ui/button"
import { exportWeatherCsv } from "@/lib/weather/exportCsv"
import type { WeatherYearDataset } from "@/types/weather"

type ExportButtonsProps = {
  datasets: WeatherYearDataset[]
  chartRef: RefObject<HTMLDivElement | null>
}

export function ExportButtons({ datasets, chartRef }: ExportButtonsProps) {
  const hasData = datasets.length > 0

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={!hasData}
        onClick={() => downloadCsv(datasets)}
        type="button"
        variant="outline"
      >
        <FileDown />
        CSV
      </Button>
      <Button
        disabled={!hasData}
        onClick={() => downloadPng(chartRef)}
        type="button"
        variant="outline"
      >
        <Download />
        PNG
      </Button>
    </div>
  )
}

function downloadCsv(datasets: WeatherYearDataset[]) {
  const csv = exportWeatherCsv(datasets)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, "weather-compare.csv")
  URL.revokeObjectURL(url)
}

async function downloadPng(chartRef: RefObject<HTMLDivElement | null>) {
  if (!chartRef.current) {
    return
  }

  const url = await toPng(chartRef.current, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
  })
  triggerDownload(url, "weather-compare.png")
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
}
