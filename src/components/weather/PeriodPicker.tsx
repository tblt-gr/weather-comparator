"use client";

import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import type { DatePeriod } from "@/lib/weather/dateRange";
import { normalizeDatePeriod } from "@/lib/weather/periodValidation";

const DEBOUNCE_MS = 800;

type PeriodPickerProps = {
  period: DatePeriod;
  onPeriodChange: (period: DatePeriod) => void;
};

export function PeriodPicker({ period, onPeriodChange }: PeriodPickerProps) {
  const [localPeriod, setLocalPeriod] = useState(period);
  const [prevPeriod, setPrevPeriod] = useState(period);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prevPeriod.startDate !== period.startDate || prevPeriod.endDate !== period.endDate) {
    setPrevPeriod(period);
    setLocalPeriod(period);
  }

  function handleChange(newPeriod: DatePeriod) {
    setLocalPeriod(newPeriod);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onPeriodChange(newPeriod), DEBOUNCE_MS);
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
    </div>
  );
}
