"use client";

import { ChevronDown, X } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type DatePeriod, getAvailableComparisonOffsets } from "@/features/weather/logic/dates";
import { MAX_COMPARISON_OFFSETS } from "@/features/weather/logic/workloadLimits";
import { getTranslations } from "@/lib/i18n/getTranslations";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";

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
  const { locale, t } = useLocale();
  const offsets = useMemo(() => getAvailableComparisonOffsets(period), [period]);
  const visibleSelectedOffsets = selectedOffsets.filter((offsetYears) =>
    offsets.includes(offsetYears)
  );
  const count = visibleSelectedOffsets.length;
  const label =
    count === 0
      ? t["year.noSelection"]
      : count === 1
        ? formatComparisonOffsetLabel(period, visibleSelectedOffsets[0], locale)
        : t["year.nSelected"].replace("{count}", String(count));
  const canClear = canClearComparisonOffsets(selectedOffsets);
  const selectionLimitReached = count >= MAX_COMPARISON_OFFSETS;

  return (
    <div className="grid min-w-0 gap-1">
      <span className="text-xs font-medium text-muted-foreground">{t["year.label"]}</span>
      <div className="flex min-w-0 items-center rounded-md border border-input bg-background">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t["year.dropdownAriaLabel"]}
              className="h-9 min-w-0 flex-1 justify-between rounded-md px-2.5"
              type="button"
              variant="ghost"
            >
              <span className="min-w-0 truncate">{label}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-80 w-(--radix-dropdown-menu-trigger-width) p-1"
          >
            <DropdownMenuLabel>
              {t["year.selectionLimit"].replace("{count}", String(MAX_COMPARISON_OFFSETS))}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {offsets.map((offsetYears) => (
              <DropdownMenuCheckboxItem
                checked={selectedOffsets.includes(offsetYears)}
                className="h-10 px-2"
                disabled={selectionLimitReached && !selectedOffsets.includes(offsetYears)}
                key={offsetYears}
                onCheckedChange={() => onToggleOffset(offsetYears)}
                onSelect={keepDropdownMenuOpen}
              >
                {formatComparisonOffsetLabel(period, offsetYears, locale)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          aria-label={t["year.clearAriaLabel"]}
          className="mr-0.5 size-8"
          disableActiveTranslation
          disabled={!canClear}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClearOffsets();
          }}
          size="icon"
          type="button"
          variant="ghost"
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

export function formatComparisonOffsetLabel(
  period: DatePeriod,
  offsetYears: number,
  locale: Locale = "fr"
) {
  const t = getTranslations(locale);
  const startYear = Number(period.startDate.slice(0, 4)) - offsetYears;
  const endYear = Number(period.endDate.slice(0, 4)) - offsetYears;
  const yearLabel = startYear === endYear ? String(startYear) : `${startYear}-${endYear}`;
  const offsetLabel =
    offsetYears === 1
      ? t["year.offsetSingular"]
      : t["year.offsetPlural"].replace("{count}", String(offsetYears));

  return `${offsetLabel} (${yearLabel})`;
}
