"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";


import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type DatePeriod, getAvailableComparisonOffsets } from "@/lib/weather/dateRange";

type YearSelectorProps = {
  period: DatePeriod;
  selectedOffsets: number[];
  onToggleOffset: (offsetYears: number) => void;
  onClearOffsets: () => void;
};

const ITEM_HEIGHT = 32;
const VISIBLE_ITEMS = 8;

export function YearSelector({
  period,
  selectedOffsets,
  onToggleOffset,
  onClearOffsets,
}: YearSelectorProps) {
  const offsets = useMemo(() => getAvailableComparisonOffsets(period), [period]);
  const visibleSelectedOffsets = selectedOffsets.filter((offsetYears) =>
    offsets.includes(offsetYears)
  );
  const count = visibleSelectedOffsets.length;
  const label =
    count === 0
      ? "Aucune période sélectionnée"
      : count === 1
        ? formatComparisonOffsetLabel(period, visibleSelectedOffsets[0])
        : `${count} périodes sélectionnées`;
  const canClear = canClearComparisonOffsets(selectedOffsets);

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: offsets.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 3,
  });

  return (
    <div className="grid gap-1">
      <span className="text-sm font-medium">Périodes comparées</span>
      <div className="flex items-stretch gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Sélectionner les périodes à comparer"
              className="h-8 flex-1 justify-between"
              type="button"
              variant="outline"
            >
              <span className="truncate">{label}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-1">
            <div
              ref={setScrollElement}
              style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px`, overflowY: "auto" }}
            >
              <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const offsetYears = offsets[virtualItem.index];
                  const checked = selectedOffsets.includes(offsetYears);
                  return (
                    <button
                      aria-checked={checked}
                      className="absolute left-0 top-0 flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      key={virtualItem.key}
                      onClick={() => onToggleOffset(offsetYears)}
                      role="menuitemcheckbox"
                      style={{ height: `${ITEM_HEIGHT}px`, transform: `translateY(${virtualItem.start}px)` }}
                      type="button"
                    >
                      <Check className={checked ? "size-4 shrink-0 opacity-100" : "size-4 shrink-0 opacity-0"} />
                      {formatComparisonOffsetLabel(period, offsetYears)}
                    </button>
                  );
                })}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          aria-label="Effacer les périodes comparées"
          className="shrink-0"
          disabled={!canClear}
          onClick={onClearOffsets}
          size="icon"
          type="button"
          variant="outline"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function keepDropdownMenuOpen(event: { preventDefault: () => void }) {
  event.preventDefault();
}

export function canClearComparisonOffsets(selectedOffsets: number[]) {
  return selectedOffsets.length > 0;
}

export function formatComparisonOffsetLabel(period: DatePeriod, offsetYears: number) {
  const startYear = Number(period.startDate.slice(0, 4)) - offsetYears;
  const endYear = Number(period.endDate.slice(0, 4)) - offsetYears;
  const yearLabel = startYear === endYear ? String(startYear) : `${startYear}-${endYear}`;
  const offsetLabel = offsetYears === 1 ? "-1 an" : `-${offsetYears} ans`;

  return `${offsetLabel} (${yearLabel})`;
}
