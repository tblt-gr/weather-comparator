"use client"

import { Checkbox } from "@/components/ui/checkbox"

type SeasonalNormalsToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function SeasonalNormalsToggle({
  checked,
  onCheckedChange,
}: SeasonalNormalsToggleProps) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
      <Checkbox
        aria-label="Afficher la normale climatique"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      Normale climatique
    </label>
  )
}
