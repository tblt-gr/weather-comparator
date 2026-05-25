"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DatePeriod } from "@/lib/weather/dateRange";
import { normalizeDatePeriod } from "@/lib/weather/periodValidation";

type PeriodPickerProps = {
  period: DatePeriod;
  onPeriodChange: (period: DatePeriod) => void;
};

export function PeriodPicker({ period, onPeriodChange }: PeriodPickerProps) {
  const [localPeriod, setLocalPeriod] = useState(period);
  const [prevPeriod, setPrevPeriod] = useState(period);

  if (prevPeriod.startDate !== period.startDate || prevPeriod.endDate !== period.endDate) {
    setPrevPeriod(period);
    setLocalPeriod(period);
  }

  const hasPendingChange =
    localPeriod.startDate !== period.startDate || localPeriod.endDate !== period.endDate;

  function handleChange(newPeriod: DatePeriod) {
    setLocalPeriod(newPeriod);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Début
        <Input
          aria-label="Sélectionner la date de début"
          onChange={(event) =>
            handleChange(normalizeDatePeriod({ ...localPeriod, startDate: event.target.value }, "startDate"))
          }
          type="date"
          value={localPeriod.startDate}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Fin
        <Input
          aria-label="Sélectionner la date de fin"
          onChange={(event) =>
            handleChange(normalizeDatePeriod({ ...localPeriod, endDate: event.target.value }, "endDate"))
          }
          type="date"
          value={localPeriod.endDate}
        />
      </label>

      {hasPendingChange && (
        <div className="sm:col-span-2">
          <Button
            aria-label="Appliquer la période sélectionnée"
            className="w-full"
            onClick={() => onPeriodChange(localPeriod)}
            size="sm"
            type="button"
          >
            Appliquer
          </Button>
        </div>
      )}
    </div>
  );
}
