import type { TooltipContentProps } from "recharts";

import { getColdWaveFill, getHeatwaveFill } from "./weatherChartLogic";
import { formatDisplayDate } from "@/features/weather/logic/dates";
import type { Locale } from "@/lib/i18n/types";
import type { ColdWavePeriod, HeatwavePeriod, WeatherYearDataset } from "@/features/weather/types";

export type TooltipEntry = NonNullable<TooltipContentProps<number, string>["payload"]>[number];

export type TooltipExtremeEntry = {
  key: string;
  label: string;
  color: string;
};

export function formatTooltipDate(value: string | number, locale: Locale = "fr") {
  const text = String(value);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!parts) {
    return text;
  }

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return fmt.format(new Date(`${text}T00:00:00.000Z`));
}

export function sortTooltipEntries(entries: readonly TooltipEntry[]) {
  return [...entries].sort((left, right) => {
    const leftValue = typeof left.value === "number" ? left.value : Number.NEGATIVE_INFINITY;
    const rightValue = typeof right.value === "number" ? right.value : Number.NEGATIVE_INFINITY;

    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }

    return String(right.dataKey ?? right.name).localeCompare(String(left.dataKey ?? left.name));
  });
}

export function getVisibleTooltipEntries(entries: readonly TooltipEntry[]) {
  const numericEntries = entries.filter((entry) => typeof entry.value === "number");
  const currentForecastValuesByDay = new Map<string, number>();

  numericEntries.forEach((entry) => {
    const dayKey = getTooltipEntryDayKey(entry);

    if (entry.dataKey === "currentForecast" && dayKey !== null && typeof entry.value === "number") {
      currentForecastValuesByDay.set(dayKey, entry.value);
    }
  });

  return sortTooltipEntries(
    numericEntries.filter((entry) => {
      const dayKey = getTooltipEntryDayKey(entry);

      return (
        entry.dataKey !== "currentObserved" ||
        dayKey === null ||
        typeof entry.value !== "number" ||
        currentForecastValuesByDay.get(dayKey) !== entry.value
      );
    })
  );
}

function getTooltipEntryDayKey(entry: TooltipEntry) {
  const payload = entry.payload as Record<string, unknown> | undefined;
  const day = payload?.day;

  return typeof day === "number" || typeof day === "string" ? String(day) : null;
}

export function formatExtremeDateRange(start: string, end: string) {
  return start === end
    ? formatDisplayDate(start)
    : `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
}

export function formatExtremeTooltipLabel(
  kind: HeatwavePeriod["kind"] | ColdWavePeriod["kind"],
  detail: string,
  locale: Locale = "fr"
) {
  if (locale === "en") {
    if (kind === "canicule") {
      return `Scorching heat • ${detail}`;
    }

    if (kind === "vague_de_chaleur") {
      return `Heat wave • ${detail}`;
    }

    if (kind === "grand_froid") {
      return `Severe cold • ${detail}`;
    }

    return `Cold wave • ${detail}`;
  }

  if (kind === "canicule") {
    return `Canicule • ${detail}`;
  }

  if (kind === "vague_de_chaleur") {
    return `Vague de chaleur • ${detail}`;
  }

  if (kind === "grand_froid") {
    return `Grand froid • ${detail}`;
  }

  return `Vague de froid • ${detail}`;
}

export function getTooltipExtremeEntries(
  day: number,
  heatwaves: HeatwavePeriod[],
  coldWaves: ColdWavePeriod[],
  locale: Locale = "fr"
): TooltipExtremeEntry[] {
  const heatEntries = heatwaves
    .filter((heatwave) => day >= heatwave.startDay && day <= heatwave.endDay)
    .map((heatwave) => ({
      color: getHeatwaveFill(heatwave.kind),
      key: `heat-${heatwave.datasetId}-${heatwave.start}`,
      label: formatExtremeTooltipLabel(
        heatwave.kind,
        formatExtremeDateRange(heatwave.start, heatwave.end),
        locale
      ),
      startDay: heatwave.startDay,
    }));
  const coldEntries = coldWaves
    .filter((coldWave) => day >= coldWave.startDay && day <= coldWave.endDay)
    .map((coldWave) => ({
      color: getColdWaveFill(coldWave.kind),
      key: `cold-${coldWave.datasetId}-${coldWave.start}`,
      label: formatExtremeTooltipLabel(
        coldWave.kind,
        formatExtremeDateRange(coldWave.start, coldWave.end),
        locale
      ),
      startDay: coldWave.startDay,
    }));

  return [...heatEntries, ...coldEntries]
    .sort((left, right) => left.startDay - right.startDay || left.label.localeCompare(right.label))
    .map(({ color, key, label }) => ({ color, key, label }));
}

export function getTooltipTropicalNightEntries(
  day: number,
  datasets: WeatherYearDataset[],
  colors: Record<string, string>,
  tropicalNightLabel: string
): TooltipExtremeEntry[] {
  return datasets
    .filter((dataset) => {
      const value = dataset.values.find((entry) => entry.day === day);

      return value?.tmin !== null && value?.tmin !== undefined && value.tmin >= 20;
    })
    .map((dataset) => ({
      color: colors[dataset.id],
      key: `tropical-night-${dataset.id}`,
      label: tropicalNightLabel,
    }));
}
