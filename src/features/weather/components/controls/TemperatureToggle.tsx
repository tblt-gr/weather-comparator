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
      className="grid h-11 w-full grid-cols-2 overflow-hidden rounded-lg border border-border bg-muted/50 lg:w-auto"
      role="group"
    >
      <Button
        aria-pressed={value === "tmax"}
        className="h-full w-full rounded-none border-0 first:rounded-l-[calc(theme(borderRadius.lg)-1px)]"
        onClick={() => onChange("tmax")}
        size="sm"
        type="button"
        variant={value === "tmax" ? "default" : "ghost"}
      >
        Tmax
      </Button>
      <Button
        aria-pressed={value === "tmin"}
        className="h-full w-full rounded-none border-0 last:rounded-r-[calc(theme(borderRadius.lg)-1px)]"
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
