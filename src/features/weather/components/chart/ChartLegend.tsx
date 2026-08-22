"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChartLegendProps = {
  series: { id: string; label: string }[];
  hiddenSeries: string[];
  colors: Record<string, string>;
  strokeDasharrays: Record<string, string | undefined>;
  onToggleSeries: (seriesId: string) => void;
};

export function ChartLegend({
  series,
  hiddenSeries,
  colors,
  strokeDasharrays,
  onToggleSeries,
}: ChartLegendProps) {
  return (
    <div className="-mb-1 flex min-w-0 gap-2 overflow-x-auto pb-1 lg:mb-0 lg:flex-wrap lg:overflow-x-visible lg:pb-0">
      {series.map((item) => {
        const isHidden = hiddenSeries.includes(item.id);
        const isPrimary = item.id === "current";

        return (
          <Button
            aria-pressed={!isHidden}
            className={cn(
              "h-7 shrink-0 cursor-pointer rounded-sm px-1.5",
              isPrimary ? "font-semibold text-foreground" : "font-normal text-muted-foreground",
              isHidden && "opacity-40"
            )}
            key={item.id}
            onClick={() => onToggleSeries(item.id)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <svg
              aria-hidden="true"
              className={cn("h-1 w-5 overflow-visible", !isPrimary && "opacity-90")}
              viewBox="0 0 20 4"
            >
              <line
                stroke={colors[item.id]}
                strokeDasharray={strokeDasharrays[item.id]}
                strokeLinecap="round"
                strokeWidth={isPrimary ? 3 : 2}
                x1="0"
                x2="20"
                y1="2"
                y2="2"
              />
            </svg>
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
