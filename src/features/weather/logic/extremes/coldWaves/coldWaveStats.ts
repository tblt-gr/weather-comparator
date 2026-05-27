import type { ColdWavePeriod, WeatherYearDataset } from "@/features/weather/types";

export type ColdWaveStats = {
  freezingDays: number;
  extremeColdNights: number;
  coldWaveCount: number;
  grandFroidCount: number;
};

export function buildColdWaveStats(
  coldWaves: ColdWavePeriod[],
  datasets: WeatherYearDataset[]
): ColdWaveStats {
  const freezingDays = datasets.reduce(
    (total, dataset) =>
      total + dataset.values.filter((value) => value.tmin !== null && value.tmin <= 0).length,
    0
  );

  const extremeColdNights = datasets.reduce(
    (total, dataset) =>
      total + dataset.values.filter((value) => value.tmin !== null && value.tmin <= -5).length,
    0
  );

  const coldWaveCount = coldWaves.filter((coldWave) => coldWave.kind === "vague_de_froid").length;
  const grandFroidCount = coldWaves.filter((coldWave) => coldWave.kind === "grand_froid").length;

  return { freezingDays, extremeColdNights, coldWaveCount, grandFroidCount };
}
