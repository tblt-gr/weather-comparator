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
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
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
  const currentMonth = new Date().getMonth() + 1
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i)
  const availableMonths =
    referenceYear === currentYear ? months.slice(0, currentMonth) : months

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Mois
        <Select
          value={String(month)}
          onValueChange={(v) => onMonthChange(Number(v))}
        >
          <SelectTrigger aria-label="Sélectionner un mois" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((label, i) => (
              <SelectItem key={label} value={String(i + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Année
        <Select
          value={String(referenceYear)}
          onValueChange={(v) => onYearChange(Number(v))}
        >
          <SelectTrigger aria-label="Sélectionner une année de référence" className="w-full">
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
