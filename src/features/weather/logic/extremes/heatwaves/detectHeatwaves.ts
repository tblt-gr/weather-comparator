import type { DailyTemperature, HeatwavePeriod, WeatherYearDataset } from "@/features/weather/types";

// Météo-France: "vague de chaleur" only looks at daytime highs (tmax), while
// "canicule" additionally requires the night to stay hot too (tmin) — these
// are two different official indicators (ITN vs IBM), not the same check at
// two severity levels.
//
// Episode boundaries are real hot days (own values cross the threshold). A
// single isolated cooler day *inside* a hot spell is bridged only if the
// centered 3-day average around it still crosses the threshold — this
// smooths a brief dip without stretching the episode past its actual end (a
// trailing average would otherwise keep "hot" alive for a day or two after
// the heat has genuinely broken).
//
// Approximation, not the official Météo-France output: real thresholds are
// per-département (station climatology); here they are fixed national-ish
// values since this app has no per-location climatology reference data.
const ROLLING_WINDOW = 3;

export function detectHeatwaves(
  datasets: WeatherYearDataset[],
  thresholdHeatwaveMax = 30,
  thresholdCaniculeMax = 35,
  thresholdCaniculeMin = 20,
  minimumDuration = 3
): HeatwavePeriod[] {
  const heatwaves: HeatwavePeriod[] = [];

  datasets.forEach((dataset) => {
    const values = dataset.values;
    const rawHot = values.map(
      (value) => typeof value.tmax === "number" && value.tmax >= thresholdHeatwaveMax
    );
    const bridgedHot = bridgeSingleDayDips(rawHot, values, (window) => {
      if (window.some((value) => typeof value.tmax !== "number")) {
        return false;
      }
      const avgTmax = window.reduce((total, value) => total + (value.tmax as number), 0) / ROLLING_WINDOW;
      return avgTmax >= thresholdHeatwaveMax;
    });

    findRuns(bridgedHot, minimumDuration).forEach(([start, end]) => {
      const episode = values.slice(start, end + 1);

      const rawCanicule = episode.map((value) =>
        crossesBothThresholds(value, thresholdCaniculeMax, thresholdCaniculeMin)
      );
      const bridgedCanicule = bridgeSingleDayDips(rawCanicule, episode, (window) => {
        if (window.some((value) => typeof value.tmax !== "number" || typeof value.tmin !== "number")) {
          return false;
        }
        const avgTmax = window.reduce((total, value) => total + (value.tmax as number), 0) / ROLLING_WINDOW;
        const avgTmin = window.reduce((total, value) => total + (value.tmin as number), 0) / ROLLING_WINDOW;
        return avgTmax >= thresholdCaniculeMax && avgTmin >= thresholdCaniculeMin;
      });
      const caniculeRuns = findRuns(bridgedCanicule, minimumDuration);

      // A vague de chaleur episode is split so only the days that genuinely
      // meet the canicule criteria carry the "canicule" label; the surrounding
      // hot days stay "vague de chaleur". Segments partition the episode with
      // no day lost, even when a leftover vague stretch is shorter than the
      // minimum duration (it is still part of the qualified episode).
      segmentEpisode(episode.length, caniculeRuns).forEach(({ start: segStart, end: segEnd, kind }) => {
        heatwaves.push(buildPeriod(dataset, episode.slice(segStart, segEnd + 1), kind));
      });
    });
  });

  return heatwaves;
}

function buildPeriod(
  dataset: WeatherYearDataset,
  days: DailyTemperature[],
  kind: HeatwavePeriod["kind"]
): HeatwavePeriod {
  const firstForecastDay = days.find((value) => value.isForecast === true)?.day ?? null;

  return {
    datasetId: dataset.id,
    datasetLabel: dataset.label,
    kind,
    start: days[0].date,
    end: days[days.length - 1].date,
    startDay: days[0].day,
    endDay: days[days.length - 1].day,
    duration: days.length,
    averageMax: days.reduce((total, value) => total + (value.tmax as number), 0) / days.length,
    includesForecast: firstForecastDay !== null,
    forecastStartDay: firstForecastDay,
  };
}

function segmentEpisode(
  episodeLength: number,
  caniculeRuns: [start: number, end: number][]
): { start: number; end: number; kind: HeatwavePeriod["kind"] }[] {
  const segments: { start: number; end: number; kind: HeatwavePeriod["kind"] }[] = [];
  let cursor = 0;

  caniculeRuns.forEach(([runStart, runEnd]) => {
    if (runStart > cursor) {
      segments.push({ start: cursor, end: runStart - 1, kind: "vague_de_chaleur" });
    }
    segments.push({ start: runStart, end: runEnd, kind: "canicule" });
    cursor = runEnd + 1;
  });

  if (cursor <= episodeLength - 1) {
    segments.push({ start: cursor, end: episodeLength - 1, kind: "vague_de_chaleur" });
  }

  // A single leftover day is not a "vague de chaleur" on its own; drop it so a
  // lone hot day trailing (or leading) a canicule is not surfaced as its own
  // one-day segment. Canicule segments are always at least the minimum duration.
  return segments.filter(
    (segment) => segment.kind !== "vague_de_chaleur" || segment.end > segment.start
  );
}

function crossesBothThresholds(value: DailyTemperature, thresholdMax: number, thresholdMin: number): boolean {
  return (
    typeof value.tmax === "number" &&
    typeof value.tmin === "number" &&
    value.tmax >= thresholdMax &&
    value.tmin >= thresholdMin
  );
}

function bridgeSingleDayDips(
  flags: boolean[],
  values: DailyTemperature[],
  meetsAverage: (window: DailyTemperature[]) => boolean
): boolean[] {
  const merged = flags.slice();
  let changed = true;

  while (changed) {
    changed = false;

    for (let i = 1; i < merged.length - 1; i++) {
      if (merged[i] || !merged[i - 1] || !merged[i + 1]) {
        continue;
      }

      if (meetsAverage([values[i - 1], values[i], values[i + 1]])) {
        merged[i] = true;
        changed = true;
      }
    }
  }

  return merged;
}

function findRuns(flags: boolean[], minimumDuration: number): [start: number, end: number][] {
  const runs: [number, number][] = [];
  let i = 0;

  while (i < flags.length) {
    if (!flags[i]) {
      i++;
      continue;
    }

    const start = i;
    while (i < flags.length && flags[i]) {
      i++;
    }
    const end = i - 1;

    if (end - start + 1 >= minimumDuration) {
      runs.push([start, end]);
    }
  }

  return runs;
}
