"use client";

import type { HeatwavePeriod, WeatherYearDataset } from "@/types/weather";

function getSeverityLabel(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "Canicule" : "Vague de chaleur";
}

function getSeverityColor(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "bg-red-500" : "bg-orange-500";
}

const frenchDayMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

export function formatHeatwaveDateRange(start: string, end: string) {
  return `${frenchDayMonthFormatter.format(new Date(start))} au ${frenchDayMonthFormatter.format(new Date(end))}`;
}

export function formatHeatwaveSummary(heatwave: HeatwavePeriod) {
  return `${getSeverityLabel(heatwave.kind)} ${formatHeatwaveDateRange(heatwave.start, heatwave.end)} (${heatwave.duration} jours, Tmax moyenne ${heatwave.averageMax.toFixed(1)} degC)`;
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

export function buildHeatwaveStats(heatwaves: HeatwavePeriod[], datasets: WeatherYearDataset[]) {
  const referenceDataset = datasets.find((d) => d.offsetYears === 0);
  const hotDays = referenceDataset?.values.filter((v) => typeof v.tmax === "number" && v.tmax > 30).length ?? 0;
  const tropicalNights = referenceDataset?.values.filter((v) => typeof v.tmin === "number" && v.tmin >= 20).length ?? 0;
  const heatwaveCount = heatwaves.filter((h) => h.kind === "vague_de_chaleur").length;
  const canicula = heatwaves.filter((h) => h.kind === "canicule").length;
  return { hotDays, tropicalNights, heatwaveCount, canicula };
}

type HeatwaveOverlayProps = {
  heatwaves: HeatwavePeriod[];
  datasets: WeatherYearDataset[];
  colors?: Record<string, string>;
};

export function HeatwaveOverlay({ heatwaves, datasets, colors = {} }: HeatwaveOverlayProps) {
  if (heatwaves.length === 0) {
    return null;
  }

  const groupedHeatwaves = groupHeatwavesByYear(heatwaves);
  const stats = buildHeatwaveStats(heatwaves, datasets);

  return (
    <div className="rounded-xl border border-orange-300/40 bg-orange-100/45 p-3 text-sm shadow-lg shadow-orange-900/5 backdrop-blur-xl dark:border-orange-300/20 dark:bg-orange-400/10 dark:shadow-orange-300/5">
      <p className="font-medium text-orange-950 dark:text-orange-100">Vagues de chaleur et canicules</p>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-orange-800 dark:text-orange-300">
        <span>Jours &gt; 30 °C : <strong>{stats.hotDays}</strong></span>
        <span>Nuits tropicales : <strong>{stats.tropicalNights}</strong></span>
        <span>Vagues de chaleur : <strong>{stats.heatwaveCount}</strong></span>
        <span>Canicules : <strong>{stats.canicula}</strong></span>
      </div>
      <div className="mt-2 grid gap-3 text-orange-900 sm:grid-cols-2 lg:grid-cols-3 dark:text-orange-200">
        {groupedHeatwaves.map((group) => (
          <section
            className="rounded-lg border border-orange-300/35 bg-white/35 p-3 dark:border-orange-200/15 dark:bg-black/10"
            key={group.year}
          >
            <p className="flex items-center gap-1.5 font-semibold text-orange-950 dark:text-orange-100">
              {colors[group.heatwaves[0].datasetId] && (
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[group.heatwaves[0].datasetId] }}
                />
              )}
              {group.year}
            </p>
            <ul className="mt-2 grid gap-1.5">
              {group.heatwaves.map((heatwave) => (
                <li className="flex gap-2" key={`${heatwave.datasetId}-${heatwave.start}`}>
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${getSeverityColor(heatwave.kind)}`}
                  />
                  <span>{formatHeatwaveSummary(heatwave)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
