"use client";

import { Button } from "@/components/ui/button";
import type { ForecastHorizonDays } from "@/features/weather/types";
import type { Translations } from "@/lib/i18n/types";

type ForecastHorizonToggleProps = {
  availableDays: number;
  horizonDays: ForecastHorizonDays;
  onHorizonChange: (horizonDays: ForecastHorizonDays) => void;
  t: Translations;
};

export function ForecastHorizonToggle({
  availableDays,
  horizonDays,
  onHorizonChange,
  t,
}: ForecastHorizonToggleProps) {
  return (
    <div
      aria-label={t["forecast.horizonAriaLabel"]}
      className="weather-touch-control grid h-9 grid-cols-2 overflow-hidden rounded-md bg-muted/70 p-0.5"
      role="group"
    >
      <HorizonButton
        active={horizonDays === 7 && availableDays >= 7}
        disabled={availableDays < 7}
        label={t["forecast.horizon7"]}
        onSelect={() => onHorizonChange(7)}
      />
      <HorizonButton
        active={horizonDays === 15 && availableDays >= 15}
        disabled={availableDays < 15}
        label={t["forecast.horizon15"]}
        onSelect={() => onHorizonChange(15)}
      />
    </div>
  );
}

function HorizonButton({
  active,
  disabled,
  label,
  onSelect,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      className="h-full min-w-14 rounded-sm border-0 px-2.5 disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={onSelect}
      size="sm"
      type="button"
      variant={active ? "default" : "ghost"}
    >
      {label}
    </Button>
  );
}
