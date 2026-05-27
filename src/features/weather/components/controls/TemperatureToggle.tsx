"use client";

import { Button } from "@/components/ui/button";
import type { TemperatureMode } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type TemperatureToggleProps = {
  value: TemperatureMode;
  onChange: (value: TemperatureMode) => void;
};

export function TemperatureToggle({ value, onChange }: TemperatureToggleProps) {
  const { t } = useLocale();

  return (
    <div
      aria-label={t["temp.groupAriaLabel"]}
      className="grid h-8 grid-cols-2 rounded-lg border border-border bg-muted/50"
      role="group"
    >
      <Button
        aria-pressed={value === "tmax"}
        className="h-8 rounded-r-none"
        onClick={() => onChange("tmax")}
        size="sm"
        type="button"
        variant={value === "tmax" ? "default" : "ghost"}
      >
        Tmax
      </Button>
      <Button
        aria-pressed={value === "tmin"}
        className="h-8 rounded-l-none"
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
