"use client";

import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

import { EXTREME_KIND_COLORS } from "@/features/weather/logic/extremes";
import { getTranslations } from "@/lib/i18n/getTranslations";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";
import type { ColdWavePeriod } from "@/features/weather/types";

function getSeverityLabel(kind: ColdWavePeriod["kind"], locale: Locale) {
  const t = getTranslations(locale);
  return kind === "grand_froid" ? t["coldwave.grandFroid"] : t["coldwave.vagueLabel"];
}

function getSeverityColor(kind: ColdWavePeriod["kind"]) {
  return EXTREME_KIND_COLORS[kind];
}

export function formatColdWaveDateRange(start: string, end: string, locale: Locale = "fr") {
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const separator = getTranslations(locale)["coldwave.dateSeparator"];
  const formatter = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });

  return `${formatter.format(new Date(start))}${separator}${formatter.format(new Date(end))}`;
}

export function formatColdWaveSummary(coldWave: ColdWavePeriod, locale: Locale = "fr") {
  const t = getTranslations(locale);
  const label = getSeverityLabel(coldWave.kind, locale);
  const dateRange = formatColdWaveDateRange(coldWave.start, coldWave.end, locale);

  return `${label} ${dateRange} (${coldWave.duration} ${t["coldwave.days"]}, ${t["coldwave.avgMin"]} ${coldWave.averageMin.toFixed(1)} °C)`;
}

export function getColdWaveDaysByKind(coldWaves: ColdWavePeriod[]) {
  const totals = new Map<ColdWavePeriod["kind"], number>();

  coldWaves.forEach((coldWave) => {
    totals.set(coldWave.kind, (totals.get(coldWave.kind) ?? 0) + coldWave.duration);
  });

  return Array.from(totals, ([kind, days]) => ({ kind, days }));
}

export function groupColdWavesByYear(coldWaves: ColdWavePeriod[]) {
  const groups = new Map<string, ColdWavePeriod[]>();

  coldWaves.forEach((coldWave) => {
    const year = coldWave.start.slice(0, 4);
    const current = groups.get(year);

    if (current) {
      current.push(coldWave);
      return;
    }

    groups.set(year, [coldWave]);
  });

  return Array.from(groups, ([year, groupedColdWaves]) => ({
    year,
    coldWaves: groupedColdWaves,
  }));
}

type ColdWaveOverlayProps = {
  coldWaves: ColdWavePeriod[];
  colors?: Record<string, string>;
};

export function ColdWaveOverlay({ coldWaves, colors = {} }: ColdWaveOverlayProps) {
  const { locale, t } = useLocale();
  const groupedColdWaves = useMemo(() => groupColdWavesByYear(coldWaves), [coldWaves]);

  if (coldWaves.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border/60 pt-5">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{t["coldwave.sectionTitle"]}</h2>
      <div className="divide-y divide-border/60 border-y border-border/60">
        {groupedColdWaves.map((group) => (
          <details className="group" key={group.year}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-2.5 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <span className="flex shrink-0 items-center gap-2 font-semibold tabular-nums">
                {colors[group.coldWaves[0].datasetId] ? (
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-4 shrink-0"
                    style={{ backgroundColor: colors[group.coldWaves[0].datasetId] }}
                  />
                ) : null}
                {group.year}
              </span>
              <span className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
                {getColdWaveDaysByKind(group.coldWaves).map(({ kind, days }, index) => (
                  <span key={kind}>
                    {index > 0 ? " · " : null}
                    {t["extremes.total"]} {getSeverityLabel(kind, locale)}: {days}{" "}
                    {t["coldwave.days"]}
                  </span>
                ))}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <ul className="border-t border-border/40 pl-6 sm:pl-8">
              {group.coldWaves.map((coldWave) => (
                <li
                  className="grid gap-1.5 border-b border-border/40 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={`${coldWave.datasetId}-${coldWave.start}`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getSeverityColor(coldWave.kind) }}
                      />
                      {getSeverityLabel(coldWave.kind, locale)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatColdWaveDateRange(coldWave.start, coldWave.end, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:justify-end sm:text-right">
                    <span className="text-muted-foreground tabular-nums">
                      {coldWave.duration} {t["coldwave.days"]}
                    </span>
                    <span className="font-medium tabular-nums">
                      {t["coldwave.avgMin"]} {coldWave.averageMin.toFixed(1)} °C
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
