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
    (_, index) => FIRST_COMPARISON_YEAR + index
  ).filter((year) => year !== referenceYear)
  const selectedCount = selectedYears.length
  let label = "Aucune annee selectionnee"

  if (selectedCount === 1) {
    label = String(selectedYears[0])
  } else if (selectedCount > 1) {
    label = `${selectedCount} annees selectionnees`
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Annees comparees</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Selectionner les annees a comparer"
            className="w-full justify-between"
            type="button"
            variant="outline"
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
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
                  <Check
                    className={checked ? "size-4 opacity-100" : "size-4 opacity-0"}
                  />
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
