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
import { type DatePeriod, getAvailableComparisonOffsets } from "@/features/weather/logic/dates";
import { getTranslations } from "@/lib/i18n/getTranslations";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";

type YearSelectorProps = {
  period: DatePeriod;
  selectedOffsets: number[];
  onToggleOffset: (offsetYears: number) => void;
  onClearOffsets: () => void;
};

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 8;

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

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  // TanStack Virtual is currently flagged as incompatible with React Compiler memoization.
  // The hook usage is intentional here and local to this non-memoized dropdown.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: offsets.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 3,
  });

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
            className="w-(--radix-dropdown-menu-trigger-width) p-1"
          >
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
                      className="absolute top-0 left-0 flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      key={virtualItem.key}
                      onClick={() => onToggleOffset(offsetYears)}
                      role="menuitemcheckbox"
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      type="button"
                    >
                      <Check
                        className={
                          checked ? "size-4 shrink-0 opacity-100" : "size-4 shrink-0 opacity-0"
                        }
                      />
                      {formatComparisonOffsetLabel(period, offsetYears, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
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
