"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { TemperatureMode } from "@/types/weather";

type TemperatureToggleProps = {
  value: TemperatureMode;
  onChange: (value: TemperatureMode) => void;
};

export function TemperatureToggle({ value, onChange }: TemperatureToggleProps) {
  const { t } = useLocale();

  return (
    <div
      aria-label={t["temp.groupAriaLabel"]}
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1"
      role="group"
    >
      <Button
        aria-pressed={value === "tmax"}
        onClick={() => onChange("tmax")}
        size="sm"
        type="button"
        variant={value === "tmax" ? "default" : "ghost"}
      >
        Tmax
      </Button>
      <Button
        aria-pressed={value === "tmin"}
        onClick={() => onChange("tmin")}
        size="sm"
        type="button"
        variant={value === "tmin" ? "default" : "ghost"}
      >
        Tmin
      </Button>
    </div>
  );
}
