"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import { EXTREME_KIND_COLORS } from "@/features/weather/logic/extremes";
import { getTranslations } from "@/lib/i18n/getTranslations";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";
import type { HeatwavePeriod } from "@/features/weather/types";

function getSeverityLabel(kind: HeatwavePeriod["kind"], locale: Locale) {
  const t = getTranslations(locale);
  return kind === "canicule" ? t["heatwave.canicule"] : t["heatwave.vagueLabel"];
}

function getSeverityColor(kind: HeatwavePeriod["kind"]) {
  return EXTREME_KIND_COLORS[kind];
}

export function formatHeatwaveDateRange(start: string, end: string, locale: Locale = "fr"): string {
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const separator = getTranslations(locale)["heatwave.dateSeparator"];
  const fmt = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
  return `${fmt.format(new Date(start))}${separator}${fmt.format(new Date(end))}`;
}

export function formatHeatwaveSummary(heatwave: HeatwavePeriod, locale: Locale = "fr"): string {
  const t = getTranslations(locale);
  const label = getSeverityLabel(heatwave.kind, locale);
  const dateRange = formatHeatwaveDateRange(heatwave.start, heatwave.end, locale);
  return `${label} ${dateRange} (${heatwave.duration} ${t["heatwave.days"]}, ${t["heatwave.avgMax"]} ${heatwave.averageMax.toFixed(1)} °C)`;
}

export function getHeatwaveDaysByKind(heatwaves: HeatwavePeriod[]) {
  const totals = new Map<HeatwavePeriod["kind"], number>();

  heatwaves.forEach((heatwave) => {
    totals.set(heatwave.kind, (totals.get(heatwave.kind) ?? 0) + heatwave.duration);
  });

  return Array.from(totals, ([kind, days]) => ({ kind, days }));
}

export function groupHeatwavesByYear(heatwaves: HeatwavePeriod[]) {
  const groups = new Map<string, HeatwavePeriod[]>();

  heatwaves.forEach((heatwave) => {
    const year = heatwave.start.slice(0, 4);
    const current = groups.get(year);

    if (current) {
      current.push(heatwave);
      return;
    }

    groups.set(year, [heatwave]);
  });

  return Array.from(groups, ([year, groupedHeatwaves]) => ({
    year,
    heatwaves: groupedHeatwaves,
  }));
}

type HeatwaveOverlayProps = {
  heatwaves: HeatwavePeriod[];
  colors?: Record<string, string>;
};

export function HeatwaveOverlay({ heatwaves, colors = {} }: HeatwaveOverlayProps) {
  const { locale, t } = useLocale();

  const groupedHeatwaves = useMemo(() => groupHeatwavesByYear(heatwaves), [heatwaves]);

  if (heatwaves.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border/60 pt-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{t["heatwave.sectionTitle"]}</h2>
      <div className="divide-y divide-border/60 border-y border-border/60">
        {groupedHeatwaves.map((group) => (
          <details className="group" key={group.year}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-2.5 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <span className="flex shrink-0 items-center gap-2 font-semibold tabular-nums">
                {colors[group.heatwaves[0].datasetId] ? (
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-4 shrink-0"
                    style={{ backgroundColor: colors[group.heatwaves[0].datasetId] }}
                  />
                ) : null}
                {group.year}
              </span>
              <span className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
                {getHeatwaveDaysByKind(group.heatwaves).map(({ kind, days }, index) => (
                  <span key={kind}>
                    {index > 0 ? " · " : null}
                    {t["extremes.total"]} {getSeverityLabel(kind, locale)}: {days}{" "}
                    {t["heatwave.days"]}
                  </span>
                ))}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <ul className="border-t border-border/40 pl-6 sm:pl-8">
              {group.heatwaves.map((heatwave) => (
                <li
                  className="grid gap-1.5 border-b border-border/40 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={`${heatwave.datasetId}-${heatwave.start}`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getSeverityColor(heatwave.kind) }}
                      />
                      {getSeverityLabel(heatwave.kind, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatHeatwaveDateRange(heatwave.start, heatwave.end, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:justify-end sm:text-right">
                    <span className="text-muted-foreground tabular-nums">
                      {heatwave.duration} {t["heatwave.days"]}
                    </span>
                    <span className="font-medium tabular-nums">
                      {t["heatwave.avgMax"]} {heatwave.averageMax.toFixed(1)} °C
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
