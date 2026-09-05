"use client";

import { InfoIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { getUvRiskLevel, UV_RISK_BANDS, UV_RISK_COLORS } from "@/features/weather/logic/forecastOutlook";
import type { Translations } from "@/lib/i18n/types";
import { useHydrated } from "@/lib/useHydrated";

import { formatUvLabel, UV_LEVEL_KEYS } from "./forecastOutlookFormat";

export function UvScaleInfo({ t }: { t: Translations }) {
  const mounted = useHydrated();
  const infoButton = (
    <button
      aria-label={t["forecast.uv.scaleAriaLabel"]}
      className="-mx-1 flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
      type="button"
    >
      <InfoIcon className="size-4" />
    </button>
  );

  if (!mounted) {
    return infoButton;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{infoButton}</PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <PopoverTitle>{t["forecast.uv.scaleTitle"]}</PopoverTitle>
        <ul className="mt-2 space-y-1.5">
          {UV_RISK_BANDS.map((band) => (
            <li className="flex items-center gap-2 text-xs text-muted-foreground" key={band.level}>
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
                style={{ backgroundColor: UV_RISK_COLORS[band.level] }}
              />
              <span className="w-10 tabular-nums">{band.range}</span>
              <span>{t[UV_LEVEL_KEYS[band.level]]}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function UvIndexLine({ t, value }: { t: Translations; value: number | null }) {
  const level = getUvRiskLevel(value);
  const label = formatUvLabel(value, t);
  const riskLabel = level === null ? null : t[UV_LEVEL_KEYS[level]];

  return (
    <span className="flex min-w-0 items-center gap-1">
      {level ? (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full ring-1 ring-foreground/20"
          style={{ backgroundColor: UV_RISK_COLORS[level] }}
        />
      ) : null}
      <span className="min-w-0 truncate" title={riskLabel ?? undefined}>
        {label}
      </span>
      {riskLabel ? <span className="sr-only">{riskLabel}</span> : null}
    </span>
  );
}
