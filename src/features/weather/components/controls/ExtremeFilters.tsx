"use client";

import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EXTREME_KIND_COLORS } from "@/features/weather/logic/extremes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Translations } from "@/lib/i18n/types";
import type { ExtremeKind } from "@/features/weather/types";

const EXTREME_KINDS: {
  kind: ExtremeKind;
  labelKey: keyof Translations;
  criteriaKey: keyof Translations;
}[] = [
  { kind: "canicule", labelKey: "heatwave.canicule", criteriaKey: "extremes.criteria.canicule" },
  {
    kind: "vague_de_chaleur",
    labelKey: "heatwave.vagueLabel",
    criteriaKey: "extremes.criteria.vague_de_chaleur",
  },
  {
    kind: "vague_de_froid",
    labelKey: "coldwave.vagueLabel",
    criteriaKey: "extremes.criteria.vague_de_froid",
  },
  {
    kind: "grand_froid",
    labelKey: "coldwave.grandFroid",
    criteriaKey: "extremes.criteria.grand_froid",
  },
];

type ExtremeFiltersProps = {
  hiddenKinds: ExtremeKind[];
  availableKinds: Record<ExtremeKind, boolean>;
  onToggleKind: (kind: ExtremeKind) => void;
};

export function ExtremeFilters({ hiddenKinds, availableKinds, onToggleKind }: ExtremeFiltersProps) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-label={t["extremes.filtersAriaLabel"]}
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-nowrap lg:items-end"
      role="group"
    >
      {EXTREME_KINDS.map(({ kind, labelKey, criteriaKey }) => {
        const isAvailable = availableKinds[kind];
        const isChecked = isAvailable && !hiddenKinds.includes(kind);

        const infoButton = (
          <button
            aria-label={t["extremes.criteriaAriaLabel"]}
            className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            type="button"
          >
            <InfoIcon className="size-4" />
          </button>
        );

        return (
          <div
            key={kind}
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm font-medium transition-colors hover:bg-muted has-disabled:opacity-50 has-disabled:hover:bg-muted/50 lg:w-auto"
          >
            <label className="flex flex-1 cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed lg:whitespace-nowrap">
              <Checkbox
                checked={isChecked}
                disabled={!isAvailable}
                onCheckedChange={() => onToggleKind(kind)}
              />
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: EXTREME_KIND_COLORS[kind] }}
              />
              {t[labelKey]}
            </label>
            {mounted ? (
              <Popover>
                <PopoverTrigger asChild>{infoButton}</PopoverTrigger>
                <PopoverContent align="end" className="w-64">
                  <PopoverTitle>{t[labelKey]}</PopoverTitle>
                  <PopoverDescription>{t[criteriaKey]}</PopoverDescription>
                </PopoverContent>
              </Popover>
            ) : (
              infoButton
            )}
          </div>
        );
      })}
    </div>
  );
}
