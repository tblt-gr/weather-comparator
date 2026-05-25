"use client";

import { Checkbox } from "@/components/ui/checkbox";

type SeasonalNormalsToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SeasonalNormalsToggle({ checked, onCheckedChange }: SeasonalNormalsToggleProps) {
  return (
    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 text-sm font-medium transition-colors hover:bg-muted">
      <Checkbox
        aria-label="Afficher la normale climatique"
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      Normale climatique
    </label>
  );
}
