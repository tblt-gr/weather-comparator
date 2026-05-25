"use client"

import { Input } from "@/components/ui/input"
import type { DatePeriod } from "@/lib/weather/dateRange"

type PeriodPickerProps = {
  period: DatePeriod
  referenceYear: number
  onPeriodChange: (period: DatePeriod) => void
  onYearChange: (year: number) => void
}

export function PeriodPicker({
  period,
  referenceYear,
  onPeriodChange,
  onYearChange,
}: PeriodPickerProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i)

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_112px]">
      <label className="grid gap-1 text-sm font-medium">
        Début
        <Input
          aria-label="Sélectionner la date de début"
          onChange={(event) =>
            onPeriodChange({ ...period, startDate: event.target.value })
          }
          type="date"
          value={period.startDate}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Fin
        <Input
          aria-label="Sélectionner la date de fin"
          onChange={(event) =>
            onPeriodChange({ ...period, endDate: event.target.value })
          }
          type="date"
          value={period.endDate}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Année
        <select
          aria-label="Sélectionner une année de référence"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          onChange={(event) => onYearChange(Number(event.target.value))}
          value={referenceYear}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
