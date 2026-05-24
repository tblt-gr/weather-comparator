"use client"

import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FIRST_COMPARISON_YEAR = 2000

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
  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: currentYear - FIRST_COMPARISON_YEAR + 1 },
    (_, i) => currentYear - i
  ).filter((year) => year !== referenceYear)
  const count = selectedYears.length
  const label =
    count === 0
      ? "Aucune année sélectionnée"
      : count === 1
        ? String(selectedYears[0])
        : `${count} années sélectionnées`

  return (
    <div className="grid gap-1">
      <span className="text-sm font-medium">Années comparées</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Sélectionner les années à comparer"
            className="w-full justify-between"
            type="button"
            variant="outline"
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {years.map((year) => {
            const checked = selectedYears.includes(year)
            return (
              <DropdownMenuCheckboxItem
                checked={checked}
                className="justify-between"
                key={year}
                onCheckedChange={() => onToggleYear(year)}
              >
                <span className="flex items-center gap-2">
                  <Check className={checked ? "size-4 opacity-100" : "size-4 opacity-0"} />
                  {year}
                </span>
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
