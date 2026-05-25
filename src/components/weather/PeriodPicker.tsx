"use client";

import { Input } from "@/components/ui/input";
import type { DatePeriod } from "@/lib/weather/dateRange";
import {
  getMaximumStartDate,
  getMinimumEndDate,
  normalizeDatePeriod,
} from "@/lib/weather/periodValidation";

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
          max={getMaximumStartDate(period.endDate)}
          onChange={(event) =>
            onPeriodChange(normalizeDatePeriod({ ...period, startDate: event.target.value }, "startDate"))
          }
          type="date"
          value={period.startDate}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Fin
        <Input
          aria-label="Sélectionner la date de fin"
          min={getMinimumEndDate(period.startDate)}
          onChange={(event) =>
            onPeriodChange(normalizeDatePeriod({ ...period, endDate: event.target.value }, "endDate"))
          }
          type="date"
          value={period.endDate}
        />
      </label>
    </div>
  );
}
