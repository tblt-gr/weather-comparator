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
import { useLocale } from "@/lib/i18n/LocaleProvider";

type ForecastToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const subscribeNever = () => () => {};

export function ForecastToggle({ checked, onCheckedChange }: ForecastToggleProps) {
  const { t } = useLocale();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  const infoButton = (
    <button
      aria-label={t["forecast.infoAriaLabel"]}
      className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      type="button"
    >
      <InfoIcon className="size-4" />
    </button>
  );

  return (
    <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm font-medium transition-colors hover:bg-muted lg:w-auto">
      <label className="flex flex-1 cursor-pointer items-center gap-2 lg:whitespace-nowrap">
        <Checkbox
          aria-label={t["forecast.ariaLabel"]}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
        {t["forecast.label"]}
      </label>
      {mounted ? (
        <Popover>
          <PopoverTrigger asChild>{infoButton}</PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <PopoverTitle>{t["forecast.label"]}</PopoverTitle>
            <PopoverDescription>{t["forecast.description"]}</PopoverDescription>
          </PopoverContent>
        </Popover>
      ) : (
        infoButton
      )}
    </div>
  );
}
