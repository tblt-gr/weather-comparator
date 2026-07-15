"use client";

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

export function formatColdWaveDateRange(
  start: string,
  end: string,
  locale: Locale = "fr"
) {
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
    <div className="glass-panel rounded-2xl p-4">
      <h2 className="mb-5 font-semibold text-foreground">{t["coldwave.sectionTitle"]}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groupedColdWaves.map((group) => (
          <div
            className="rounded-xl border border-blue-300/40 bg-blue-100/60 p-4 shadow-sm shadow-blue-900/5 dark:border-blue-300/20 dark:bg-blue-400/15 dark:shadow-blue-300/5"
            key={group.year}
          >
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-blue-950 dark:text-blue-100">
              {colors[group.coldWaves[0].datasetId] && (
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[group.coldWaves[0].datasetId] }}
                />
              )}
              {group.year}
            </p>
            <ul className="grid gap-1.5 text-blue-900 dark:text-blue-200">
              {group.coldWaves.map((coldWave) => (
                <li className="flex gap-2" key={`${coldWave.datasetId}-${coldWave.start}`}>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getSeverityColor(coldWave.kind) }}
                  />
                  <span className="text-sm">{formatColdWaveSummary(coldWave, locale)}</span>
                </li>
              ))}
            </ul>
            <hr className="my-3 border-blue-300/40 dark:border-blue-300/20" />
            <ul className="mb-2 grid gap-1.5 text-sm text-blue-900 dark:text-blue-200">
              {getColdWaveDaysByKind(group.coldWaves).map(({ kind, days }) => (
                <li className="flex items-center gap-1 text-sm" key={kind}>
                  <span
                    aria-hidden="true"
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getSeverityColor(kind) }}
                  />
                  {t["extremes.total"]} {getSeverityLabel(kind, locale)}: {days}{" "}
                  {t["coldwave.days"]}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
