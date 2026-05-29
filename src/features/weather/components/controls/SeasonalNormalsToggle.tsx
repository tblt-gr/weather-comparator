"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type SeasonalNormalsToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SeasonalNormalsToggle({ checked, onCheckedChange }: SeasonalNormalsToggleProps) {
  const { t } = useLocale();

  return (
    <label className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm font-medium transition-colors hover:bg-muted lg:w-auto">
      <Checkbox
        aria-label={t["normals.ariaLabel"]}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      {t["normals.label"]}
    </label>
  );
}
