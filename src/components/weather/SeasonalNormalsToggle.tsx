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
    <label className="flex h-9 items-center gap-2 rounded-xl border border-white/40 bg-white/35 px-3 text-sm font-medium shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <Checkbox
        aria-label="Afficher la normale climatique"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      Normale climatique
    </label>
  )
}
