"use client"

import { Button } from "@/components/ui/button"

type ChartLegendProps = {
  years: number[]
  hiddenYears: number[]
  colors: Record<number, string>
  onToggleYear: (year: number) => void
}

export function ChartLegend({
  years,
  hiddenYears,
  colors,
  onToggleYear,
}: ChartLegendProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {years.map((year) => {
        const isHidden = hiddenYears.includes(year)

        return (
          <Button
            aria-pressed={!isHidden}
            className={isHidden ? "opacity-50" : undefined}
            key={year}
            onClick={() => onToggleYear(year)}
            size="sm"
            type="button"
            variant="outline"
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-full shadow-sm"
              style={{ backgroundColor: colors[year] }}
            />
            {year}
          </Button>
        )
      })}
    </div>
  )
}
