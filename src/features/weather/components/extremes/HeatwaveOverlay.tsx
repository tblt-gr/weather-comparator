"use client";

import { useMemo } from "react";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/types";
import type { HeatwavePeriod } from "@/features/weather/types";

function getSeverityLabel(kind: HeatwavePeriod["kind"], locale: Locale) {
  if (locale === "en") {
    return kind === "canicule" ? "Scorching heat" : "Heat wave";
  }
  return kind === "canicule" ? "Canicule" : "Vague de chaleur";
}

function getSeverityColor(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "oklch(0.62 0.24 28)" : "oklch(0.74 0.18 62)";
}

export function formatHeatwaveDateRange(
  start: string,
  end: string,
  locale: Locale = "fr"
): string {
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const separator = locale === "fr" ? " à " : " to ";
  const fmt = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
  return `${fmt.format(new Date(start))}${separator}${fmt.format(new Date(end))}`;
}

export function formatHeatwaveSummary(heatwave: HeatwavePeriod, locale: Locale = "fr"): string {
  const label = getSeverityLabel(heatwave.kind, locale);
  const dateRange = formatHeatwaveDateRange(heatwave.start, heatwave.end, locale);
  const days = locale === "fr" ? "jours" : "days";
  const avgMax = locale === "fr" ? "Tmax moyenne" : "avg Tmax";
  return `${label} ${dateRange} (${heatwave.duration} ${days}, ${avgMax} ${heatwave.averageMax.toFixed(1)} °C)`;
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
    <div className="rounded-xl border border-orange-300/40 bg-orange-100/60 p-4 text-sm shadow-sm shadow-orange-900/5 dark:border-orange-300/20 dark:bg-orange-400/15 dark:shadow-orange-300/5">
      <p className="font-semibold text-orange-950 dark:text-orange-100">{t["heatwave.sectionTitle"]}</p>
      <div className="mt-3 grid gap-x-6 gap-y-4 text-orange-900 sm:grid-cols-2 lg:grid-cols-3 dark:text-orange-200">
        {groupedHeatwaves.map((group) => (
          <div
            className="rounded-xl border border-orange-300/35 bg-orange-50/75 p-3 shadow-sm shadow-orange-900/5 backdrop-blur-sm dark:border-orange-200/15 dark:bg-orange-300/10 dark:shadow-orange-300/5"
            key={group.year}
          >
            <p className="mb-1.5 flex items-center gap-1.5 font-medium text-orange-950 dark:text-orange-100">
              {colors[group.heatwaves[0].datasetId] && (
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[group.heatwaves[0].datasetId] }}
                />
              )}
              {group.year}
            </p>
            <ul className="grid gap-1.5">
              {group.heatwaves.map((heatwave) => (
                <li className="flex gap-2" key={`${heatwave.datasetId}-${heatwave.start}`}>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getSeverityColor(heatwave.kind) }}
                  />
                  <span>{formatHeatwaveSummary(heatwave, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
