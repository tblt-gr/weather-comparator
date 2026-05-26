"use client";

import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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

export function YearSelector({
  period,
  selectedOffsets,
  onToggleOffset,
  onClearOffsets,
}: YearSelectorProps) {
  const offsets = getAvailableComparisonOffsets(period);
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

  return (
    <div className="grid gap-1">
      <span className="text-sm font-medium">Périodes comparées</span>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Sélectionner les périodes à comparer"
              className="w-full justify-between"
              type="button"
              variant="outline"
            >
              <span className="truncate">{label}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
            {offsets.map((offsetYears) => {
              const checked = selectedOffsets.includes(offsetYears);
              return (
                <DropdownMenuCheckboxItem
                  checked={checked}
                  className="justify-between"
                  key={offsetYears}
                  onCheckedChange={() => onToggleOffset(offsetYears)}
                  onSelect={keepDropdownMenuOpen}
                >
                  <span className="flex items-center gap-2">
                    <Check className={checked ? "size-4 opacity-100" : "size-4 opacity-0"} />
                    {formatComparisonOffsetLabel(period, offsetYears)}
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        {count > 0 ? (
          <Button
            aria-label="Effacer les périodes comparées"
            onClick={onClearOffsets}
            size="icon"
            type="button"
            variant="outline"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function keepDropdownMenuOpen(event: { preventDefault: () => void }) {
  event.preventDefault();
}

export function formatComparisonOffsetLabel(period: DatePeriod, offsetYears: number) {
  const startYear = Number(period.startDate.slice(0, 4)) - offsetYears;
  const endYear = Number(period.endDate.slice(0, 4)) - offsetYears;
  const yearLabel = startYear === endYear ? String(startYear) : `${startYear}-${endYear}`;
  const offsetLabel = offsetYears === 1 ? "-1 an" : `-${offsetYears} ans`;

  return `${offsetLabel} (${yearLabel})`;
}
