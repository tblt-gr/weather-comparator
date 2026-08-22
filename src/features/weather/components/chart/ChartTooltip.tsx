"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

import {
  getVisibleTooltipEntries,
  type TooltipEntry,
  type TooltipExtremeEntry,
} from "./weatherChartTooltip";
import { cn } from "@/lib/utils";

export type ActiveTooltip = {
  label: string | number | undefined;
  payload: readonly TooltipEntry[];
};

export function MobileTooltipReporter({
  active,
  label,
  onChange,
  payload,
}: {
  active: boolean;
  label: string | number | undefined;
  onChange: Dispatch<SetStateAction<ActiveTooltip | null>>;
  payload: readonly TooltipEntry[];
}) {
  useEffect(() => {
    if (!active || payload.length === 0) {
      return;
    }

    // recharts hands a fresh payload array on every render; key the pinned
    // readout off the day label so the functional update bails out when nothing
    // changed and React never loops on setState.
    onChange((prev) => (prev?.label === label ? prev : { label, payload }));
  }, [active, label, onChange, payload]);

  return null;
}

export function ChartTooltipCard({
  dateFormatter,
  extremeEntriesByDay,
  label,
  payload,
  tropicalNightsByDay,
  variant,
}: {
  dateFormatter: Intl.DateTimeFormat;
  extremeEntriesByDay: Map<number, TooltipExtremeEntry[]>;
  label: string | number | undefined;
  payload: readonly TooltipEntry[];
  tropicalNightsByDay: Map<number, TooltipExtremeEntry[]>;
  variant: "floating" | "panel";
}) {
  const visiblePayload = getVisibleTooltipEntries(payload);
  const firstLabel = visiblePayload[0]?.payload?.label;
  const hoveredDay =
    typeof visiblePayload[0]?.payload?.day === "number"
      ? visiblePayload[0].payload.day
      : typeof label === "number"
        ? label
        : null;
  const extremeEntries =
    hoveredDay === null
      ? []
      : [
          ...(extremeEntriesByDay.get(hoveredDay) ?? []),
          ...(tropicalNightsByDay.get(hoveredDay) ?? []),
        ];

  if (!visiblePayload.length && !extremeEntries.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-popover p-3 text-sm text-popover-foreground",
        variant === "floating" ? "shadow-lg shadow-black/10 dark:shadow-black/30" : "w-full"
      )}
    >
      <p className="mb-2 font-medium">
        {typeof firstLabel === "string"
          ? dateFormatter.format(new Date(`${firstLabel}T00:00:00.000Z`))
          : String(label)}
      </p>
      <div className="grid gap-1">
        {visiblePayload.map((entry) => (
          <div
            className="flex items-center justify-between gap-6"
            key={String(entry.dataKey ?? entry.name)}
          >
            <span className="flex min-w-0 items-center gap-2 text-foreground">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="font-medium">
              {typeof entry.value === "number" ? `${entry.value.toFixed(1)} °C` : "-"}
            </span>
          </div>
        ))}
      </div>
      {extremeEntries.length > 0 ? (
        <div className="mt-2 border-t border-border/60 pt-2">
          <div className="grid gap-1">
            {extremeEntries.map((entry) => (
              <div className="flex items-center gap-2" key={entry.key}>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
