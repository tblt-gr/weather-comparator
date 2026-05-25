"use client";

import { Input } from "@/components/ui/input";
import type { DatePeriod } from "@/lib/weather/dateRange";

type PeriodPickerProps = {
  period: DatePeriod;
  onPeriodChange: (period: DatePeriod) => void;
};

export function PeriodPicker({ period, onPeriodChange }: PeriodPickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Début
        <Input
          aria-label="Sélectionner la date de début"
          onChange={(event) => onPeriodChange({ ...period, startDate: event.target.value })}
          type="date"
          value={period.startDate}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Fin
        <Input
          aria-label="Sélectionner la date de fin"
          onChange={(event) => onPeriodChange({ ...period, endDate: event.target.value })}
          type="date"
          value={period.endDate}
        />
      </label>
    </div>
  );
}
