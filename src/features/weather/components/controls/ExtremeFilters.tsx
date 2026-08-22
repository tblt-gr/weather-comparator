"use client";

import { InfoIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

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

const subscribeNever = () => () => {};

type ExtremeFiltersProps = {
  hiddenKinds: ExtremeKind[];
  availableKinds: Record<ExtremeKind, boolean>;
  onToggleKind: (kind: ExtremeKind) => void;
};

export function ExtremeFilters({ hiddenKinds, availableKinds, onToggleKind }: ExtremeFiltersProps) {
  const { t } = useLocale();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  return (
    <div
      aria-label={t["extremes.filtersAriaLabel"]}
      className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center"
      role="group"
    >
      {EXTREME_KINDS.map(({ kind, labelKey, criteriaKey }) => {
        const isAvailable = availableKinds[kind];
        const isChecked = isAvailable && !hiddenKinds.includes(kind);

        const infoButton = (
          <button
            aria-label={t["extremes.criteriaForAriaLabel"].replace("{kind}", t[labelKey])}
            className="-mx-1 flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
            type="button"
          >
            <InfoIcon className="size-4" />
          </button>
        );

        return (
          <div
            key={kind}
            className="weather-touch-row flex h-8 w-full items-center gap-1.5 px-1 text-sm text-muted-foreground transition-colors hover:text-foreground has-disabled:opacity-45 sm:w-auto"
          >
            <label className="flex flex-1 cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed lg:whitespace-nowrap">
              <Checkbox
                checked={isChecked}
                disabled={!isAvailable}
                onCheckedChange={() => onToggleKind(kind)}
              />
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
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
