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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORECAST_MODELS } from "@/features/weather/logic/weatherModels";
import type { ForecastModel } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Translations } from "@/lib/i18n/types";

type ForecastControlProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  model: ForecastModel;
  onModelChange: (model: ForecastModel) => void;
};

const LABEL_KEYS: Record<ForecastModel, keyof Translations> = {
  best_match: "forecastModel.best_match",
  ecmwf_ifs025: "forecastModel.ecmwf_ifs025",
  gfs_seamless: "forecastModel.gfs_seamless",
  icon_seamless: "forecastModel.icon_seamless",
  meteofrance_seamless: "forecastModel.meteofrance_seamless",
};

const HINT_KEYS: Record<ForecastModel, keyof Translations> = {
  best_match: "forecastModel.hint.best_match",
  ecmwf_ifs025: "forecastModel.hint.ecmwf_ifs025",
  gfs_seamless: "forecastModel.hint.gfs_seamless",
  icon_seamless: "forecastModel.hint.icon_seamless",
  meteofrance_seamless: "forecastModel.hint.meteofrance_seamless",
};

const subscribeNever = () => () => {};

export function ForecastControl({
  checked,
  onCheckedChange,
  model,
  onModelChange,
}: ForecastControlProps) {
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
      <label className="flex cursor-pointer items-center gap-2 lg:whitespace-nowrap">
        <Checkbox
          aria-label={t["forecast.ariaLabel"]}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
        {t["forecast.label"]}
      </label>
      {mounted ? (
        <Select
          disabled={!checked}
          onValueChange={(next) => onModelChange(next as ForecastModel)}
          value={model}
        >
          <SelectTrigger aria-label={t["forecastModel.ariaLabel"]} className="flex-1 lg:flex-none" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="best_match">{t["forecastModel.best_match"]}</SelectItem>
            <SelectSeparator />
            {FORECAST_MODELS.filter((option) => option !== "best_match").map((option) => (
              <SelectItem key={option} value={option}>
                {t[LABEL_KEYS[option]]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="flex-1 truncate text-muted-foreground">{t[LABEL_KEYS[model]]}</span>
      )}
      {mounted ? (
        <Popover>
          <PopoverTrigger asChild>{infoButton}</PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <PopoverTitle>{t["forecast.label"]}</PopoverTitle>
            <PopoverDescription>{t["forecast.description"]}</PopoverDescription>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {FORECAST_MODELS.map((option) => (
                <li key={option}>
                  <span className="font-medium text-foreground">{t[LABEL_KEYS[option]]}</span>
                  {" — "}
                  {t[HINT_KEYS[option]]}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : (
        infoButton
      )}
    </div>
  );
}
