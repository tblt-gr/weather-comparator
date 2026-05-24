"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const months = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
]

type MonthPickerProps = {
  month: number
  referenceYear: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

export function MonthPicker({
  month,
  referenceYear,
  onMonthChange,
  onYearChange,
}: MonthPickerProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 12 }, (_, index) => currentYear - index)

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Mois
        <Select
          value={String(month)}
          onValueChange={(value) => onMonthChange(Number(value))}
        >
          <SelectTrigger aria-label="Selectionner un mois" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Annee
        <Select
          value={String(referenceYear)}
          onValueChange={(value) => onYearChange(Number(value))}
        >
          <SelectTrigger
            aria-label="Selectionner une annee de reference"
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  )
}
