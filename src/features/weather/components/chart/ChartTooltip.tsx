"use client";

import { useEffect, type Dispatch, type ReactNode, type SetStateAction } from "react";

import {
  getTooltipSeriesLayout,
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
        "whitespace-normal rounded-md border border-border/60 bg-popover p-3 text-sm text-popover-foreground",
        variant === "floating" ? "shadow-lg shadow-black/10 dark:shadow-black/30" : "w-full"
      )}
    >
      <p className="mb-2 font-medium">
        {typeof firstLabel === "string"
          ? dateFormatter.format(new Date(`${firstLabel}T00:00:00.000Z`))
          : String(label)}
      </p>
      {visiblePayload.length > 0 ? (
        <TooltipEntryGrid entryCount={visiblePayload.length} variant={variant}>
          {visiblePayload.map((entry) => (
            <div
              className="flex items-center justify-between gap-3"
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
              <span className="shrink-0 font-medium">
                {typeof entry.value === "number" ? `${entry.value.toFixed(1)} °C` : "-"}
              </span>
            </div>
          ))}
        </TooltipEntryGrid>
      ) : null}
      {extremeEntries.length > 0 ? (
        <div className="mt-2 border-t border-border/60 pt-2">
          <TooltipEntryGrid entryCount={extremeEntries.length} variant={variant}>
            {extremeEntries.map((entry) => (
              <div className="flex min-w-0 items-center gap-2" key={entry.key}>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate">{entry.label}</span>
              </div>
            ))}
          </TooltipEntryGrid>
        </div>
      ) : null}
    </div>
  );
}

function TooltipEntryGrid({
  children,
  entryCount,
  variant,
}: {
  children: ReactNode;
  entryCount: number;
  variant: "floating" | "panel";
}) {
  const layout = getTooltipSeriesLayout(entryCount);

  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-1",
        layout.overflowY === "auto" && "max-h-72 overflow-y-auto pr-1"
      )}
      style={{
        gridTemplateColumns:
          variant === "panel"
            ? `repeat(${layout.columnCount}, minmax(0, 1fr))`
            : layout.columnCount === 1
              ? "auto"
              : `repeat(${layout.columnCount}, minmax(11rem, auto))`,
      }}
    >
      {children}
    </div>
  );
}
