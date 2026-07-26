"use client";

import { Button } from "@/components/ui/button";

type ChartLegendProps = {
  series: { id: string; label: string }[];
  hiddenSeries: string[];
  colors: Record<string, string>;
  onToggleSeries: (seriesId: string) => void;
};

export function ChartLegend({ series, hiddenSeries, colors, onToggleSeries }: ChartLegendProps) {
  return (
    <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 -mb-1 lg:mb-0 lg:flex-wrap lg:overflow-x-visible lg:pb-0">
      {series.map((item) => {
        const isHidden = hiddenSeries.includes(item.id);

        return (
          <Button
            aria-pressed={!isHidden}
            className={isHidden ? "shrink-0 cursor-pointer opacity-50" : "shrink-0 cursor-pointer"}
            key={item.id}
            onClick={() => onToggleSeries(item.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-full shadow-sm"
              style={{ backgroundColor: colors[item.id] }}
            />
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
