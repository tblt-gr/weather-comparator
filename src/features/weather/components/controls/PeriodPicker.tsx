"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DatePeriod } from "@/features/weather/logic/dates";
import {
  type DatePeriodErrors,
  validateDatePeriod,
} from "@/features/weather/logic/dates";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type PeriodPickerProps = {
  period: DatePeriod;
  onPeriodChange: (period: DatePeriod) => void;
};

export function hasPendingPeriodChange(period: DatePeriod, localPeriod: DatePeriod) {
  return localPeriod.startDate !== period.startDate || localPeriod.endDate !== period.endDate;
}

export function PeriodPicker({ period, onPeriodChange }: PeriodPickerProps) {
  const { t } = useLocale();
  const [localPeriod, setLocalPeriod] = useState(period);
  const [errors, setErrors] = useState<DatePeriodErrors>({});

  const hasPendingChange = hasPendingPeriodChange(period, localPeriod);

  function handleRefresh() {
    const validationErrors = validateDatePeriod(localPeriod);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onPeriodChange(localPeriod);
  }

  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <span className="text-sm font-medium">{t["period.start"]}</span>
      <span className="text-sm font-medium">{t["period.end"]}</span>
      <span aria-hidden="true" />

      <div className="min-w-0">
        <Input
          aria-describedby={errors.startDate ? "start-date-error" : undefined}
          aria-invalid={errors.startDate ? true : undefined}
          aria-label={t["period.startAriaLabel"]}
          className="h-11"
          onChange={(event) => {
            setLocalPeriod((prev) => ({ ...prev, startDate: event.target.value }));
            if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }));
          }}
          type="date"
          value={localPeriod.startDate}
        />
        {errors.startDate && (
          <p className="mt-1 text-xs text-destructive" id="start-date-error" role="alert">
            {errors.startDate ? t[errors.startDate] : null}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <Input
          aria-describedby={errors.endDate ? "end-date-error" : undefined}
          aria-invalid={errors.endDate ? true : undefined}
          aria-label={t["period.endAriaLabel"]}
          className="h-11"
          onChange={(event) => {
            setLocalPeriod((prev) => ({ ...prev, endDate: event.target.value }));
            if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
          }}
          type="date"
          value={localPeriod.endDate}
        />
        {errors.endDate && (
          <p className="mt-1 text-xs text-destructive" id="end-date-error" role="alert">
            {errors.endDate ? t[errors.endDate] : null}
          </p>
        )}
      </div>

      <div className="flex items-end">
        <Button
          aria-label={t["period.refreshAriaLabel"]}
          className="h-11"
          disabled={!hasPendingChange}
          onClick={handleRefresh}
          type="button"
        >
          {t["period.refreshButton"]}
        </Button>
      </div>
    </div>
  );
}
