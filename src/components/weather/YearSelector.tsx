"use client"

import { Checkbox } from "@/components/ui/checkbox"

type YearSelectorProps = {
  referenceYear: number
  selectedYears: number[]
  onToggleYear: (year: number) => void
}

export function YearSelector({
  referenceYear,
  selectedYears,
  onToggleYear,
}: YearSelectorProps) {
  const years = Array.from({ length: 10 }, (_, index) => referenceYear - index)

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Annees comparees</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {years.map((year) => (
          <label
            className="flex h-9 items-center gap-2 rounded-lg border px-3 text-sm"
            key={year}
          >
            <Checkbox
              aria-label={`Afficher ${year}`}
              checked={selectedYears.includes(year)}
              onCheckedChange={() => onToggleYear(year)}
            />
            {year}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
