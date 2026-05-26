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

export function hasPendingPeriodChange(period: DatePeriod, localPeriod: DatePeriod) {
  return localPeriod.startDate !== period.startDate || localPeriod.endDate !== period.endDate;
}

export function PeriodPicker({ period, onPeriodChange }: PeriodPickerProps) {
  const [localPeriod, setLocalPeriod] = useState(period);
  const [prevPeriod, setPrevPeriod] = useState(period);

  if (prevPeriod.startDate !== period.startDate || prevPeriod.endDate !== period.endDate) {
    setPrevPeriod(period);
    setLocalPeriod(period);
  }

  const hasPendingChange = hasPendingPeriodChange(period, localPeriod);

  function handleChange(newPeriod: DatePeriod) {
    setLocalPeriod(newPeriod);
  }

  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <span className="text-sm font-medium">Début</span>
      <span className="text-sm font-medium">Fin</span>
      <span aria-hidden="true" />

      <div>
        <Input
          aria-label="Sélectionner la date de début"
          onChange={(event) =>
            handleChange(normalizeDatePeriod({ ...localPeriod, startDate: event.target.value }, "startDate"))
          }
          type="date"
          value={localPeriod.startDate}
        />
      </div>

      <div>
        <Input
          aria-label="Sélectionner la date de fin"
          onChange={(event) =>
            handleChange(normalizeDatePeriod({ ...localPeriod, endDate: event.target.value }, "endDate"))
          }
          type="date"
          value={localPeriod.endDate}
        />
      </div>

      <div className="self-end">
        <Button
          aria-label="Rafraîchir la période sélectionnée"
          disabled={!hasPendingChange}
          onClick={() => onPeriodChange(localPeriod)}
          type="button"
        >
          Rafraîchir la période
        </Button>
      </div>
    </div>
  );
}
