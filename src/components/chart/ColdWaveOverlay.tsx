"use client";

import type { ColdWavePeriod, WeatherYearDataset } from "@/types/weather";

function getSeverityLabel(kind: ColdWavePeriod["kind"]) {
  return kind === "grand_froid" ? "Grand froid" : "Vague de froid";
}

function getSeverityColor(kind: ColdWavePeriod["kind"]) {
  return kind === "grand_froid" ? "bg-blue-700" : "bg-blue-500";
}

const frenchDayMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

export function formatColdWaveDateRange(start: string, end: string) {
  return `${frenchDayMonthFormatter.format(new Date(start))} au ${frenchDayMonthFormatter.format(new Date(end))}`;
}

export function formatColdWaveSummary(coldWave: ColdWavePeriod) {
  return `${getSeverityLabel(coldWave.kind)} ${formatColdWaveDateRange(coldWave.start, coldWave.end)} (${coldWave.duration} jours, Tmin moyenne ${coldWave.averageMin.toFixed(1)} degC)`;
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

export type ColdWaveStats = {
  freezingDays: number;
  extremeColdNights: number;
  coldWaveCount: number;
  grandFroidCount: number;
};

export function buildColdWaveStats(
  coldWaves: ColdWavePeriod[],
  datasets: WeatherYearDataset[],
): ColdWaveStats {
  const referenceDataset = datasets.find((d) => d.offsetYears === 0);

  const freezingDays = referenceDataset
    ? referenceDataset.values.filter((v) => v.tmin !== null && v.tmin <= 0).length
    : 0;

  const extremeColdNights = referenceDataset
    ? referenceDataset.values.filter((v) => v.tmin !== null && v.tmin <= -5).length
    : 0;

  const coldWaveCount = coldWaves.filter((cw) => cw.kind === "vague_de_froid").length;
  const grandFroidCount = coldWaves.filter((cw) => cw.kind === "grand_froid").length;

  return { freezingDays, extremeColdNights, coldWaveCount, grandFroidCount };
}

type ColdWaveOverlayProps = {
  coldWaves: ColdWavePeriod[];
  datasets: WeatherYearDataset[];
  colors?: Record<string, string>;
};

export function ColdWaveOverlay({ coldWaves, datasets, colors = {} }: ColdWaveOverlayProps) {
  if (coldWaves.length === 0) {
    return null;
  }

  const stats = buildColdWaveStats(coldWaves, datasets);
  const groupedColdWaves = groupColdWavesByYear(coldWaves);

  return (
    <div className="rounded-xl border border-blue-300/40 bg-blue-100/45 p-3 text-sm shadow-lg shadow-blue-900/5 backdrop-blur-xl dark:border-blue-300/20 dark:bg-blue-400/10 dark:shadow-blue-300/5">
      <p className="font-medium text-blue-950 dark:text-blue-100">Vagues de froid et grand froid</p>
      <div className="mt-2 flex flex-wrap gap-4 text-blue-900 dark:text-blue-200">
        <span>
          <span className="font-semibold">{stats.freezingDays}</span> jour{stats.freezingDays !== 1 ? "s" : ""} de gel
        </span>
        <span>
          <span className="font-semibold">{stats.extremeColdNights}</span> nuit{stats.extremeColdNights !== 1 ? "s" : ""} de grand froid
        </span>
        <span>
          <span className="font-semibold">{stats.coldWaveCount}</span> vague{stats.coldWaveCount !== 1 ? "s" : ""} de froid
        </span>
        <span>
          <span className="font-semibold">{stats.grandFroidCount}</span> grand{stats.grandFroidCount !== 1 ? "s" : ""} froid
        </span>
      </div>
      <div className="mt-2 grid gap-3 text-blue-900 sm:grid-cols-2 lg:grid-cols-3 dark:text-blue-200">
        {groupedColdWaves.map((group) => (
          <section
            className="rounded-lg border border-blue-300/35 bg-white/35 p-3 dark:border-blue-200/15 dark:bg-black/10"
            key={group.year}
          >
            <p className="flex items-center gap-1.5 font-semibold text-blue-950 dark:text-blue-100">
              {colors[group.coldWaves[0].datasetId] && (
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[group.coldWaves[0].datasetId] }}
                />
              )}
              {group.year}
            </p>
            <ul className="mt-2 grid gap-1.5">
              {group.coldWaves.map((coldWave) => (
                <li className="flex gap-2" key={`${coldWave.datasetId}-${coldWave.start}`}>
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${getSeverityColor(coldWave.kind)}`}
                  />
                  <span>{formatColdWaveSummary(coldWave)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
