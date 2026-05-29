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
    <div className="flex flex-wrap gap-2">
      {series.map((item) => {
        const isHidden = hiddenSeries.includes(item.id);

        return (
          <Button
            aria-pressed={!isHidden}
            className={isHidden ? "cursor-pointer opacity-50" : "cursor-pointer"}
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
