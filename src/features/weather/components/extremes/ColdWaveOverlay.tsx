"use client";

import { useMemo } from "react";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";
import type { ColdWavePeriod } from "@/features/weather/types";

function getSeverityLabel(kind: ColdWavePeriod["kind"], locale: Locale) {
  if (locale === "en") {
    return kind === "grand_froid" ? "Severe cold" : "Cold wave";
  }

  return kind === "grand_froid" ? "Grand froid" : "Vague de froid";
}

function getSeverityColor(kind: ColdWavePeriod["kind"]) {
  return kind === "grand_froid" ? "oklch(0.55 0.22 250)" : "oklch(0.68 0.18 230)";
}

export function formatColdWaveDateRange(
  start: string,
  end: string,
  locale: Locale = "fr"
) {
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const separator = locale === "fr" ? " au " : " to ";
  const formatter = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });

  return `${formatter.format(new Date(start))}${separator}${formatter.format(new Date(end))}`;
}

export function formatColdWaveSummary(coldWave: ColdWavePeriod, locale: Locale = "fr") {
  const label = getSeverityLabel(coldWave.kind, locale);
  const dateRange = formatColdWaveDateRange(coldWave.start, coldWave.end, locale);
  const days = locale === "fr" ? "jours" : "days";
  const avgMin = locale === "fr" ? "Tmin moyenne" : "avg Tmin";

  return `${label} ${dateRange} (${coldWave.duration} ${days}, ${avgMin} ${coldWave.averageMin.toFixed(1)} °C)`;
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
    <div className="rounded-xl border border-blue-300/40 bg-blue-100/60 p-4 text-sm shadow-sm shadow-blue-900/5 dark:border-blue-300/20 dark:bg-blue-400/15 dark:shadow-blue-300/5">
      <p className="font-semibold text-blue-950 dark:text-blue-100">{t["coldwave.sectionTitle"]}</p>
      <div className="mt-3 grid gap-x-6 gap-y-4 text-blue-900 sm:grid-cols-2 lg:grid-cols-3 dark:text-blue-200">
        {groupedColdWaves.map((group) => (
          <div
            className="rounded-xl border border-blue-300/35 bg-blue-50/75 p-3 shadow-sm shadow-blue-900/5 backdrop-blur-sm dark:border-blue-200/15 dark:bg-blue-300/10 dark:shadow-blue-300/5"
            key={group.year}
          >
            <p className="mb-1.5 flex items-center gap-1.5 font-medium text-blue-950 dark:text-blue-100">
              {colors[group.coldWaves[0].datasetId] && (
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[group.coldWaves[0].datasetId] }}
                />
              )}
              {group.year}
            </p>
            <ul className="grid gap-1.5">
              {group.coldWaves.map((coldWave) => (
                <li className="flex gap-2" key={`${coldWave.datasetId}-${coldWave.start}`}>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getSeverityColor(coldWave.kind) }}
                  />
                  <span>{formatColdWaveSummary(coldWave, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
