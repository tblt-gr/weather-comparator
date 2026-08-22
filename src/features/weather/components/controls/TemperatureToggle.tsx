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
      className="grid h-9 w-full grid-cols-2 overflow-hidden rounded-md bg-muted/70 p-0.5 lg:w-auto"
      role="group"
    >
      <Button
        aria-pressed={value === "tmax"}
        className="h-full min-w-16 rounded-sm border-0"
        onClick={() => onChange("tmax")}
        size="sm"
        type="button"
        variant={value === "tmax" ? "default" : "ghost"}
      >
        Tmax
      </Button>
      <Button
        aria-pressed={value === "tmin"}
        className="h-full min-w-16 rounded-sm border-0"
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
