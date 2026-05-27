import type { HeatwavePeriod, WeatherYearDataset } from "@/features/weather/types";

export type HeatwaveStats = {
  hotDays: number;
  tropicalNights: number;
  heatwaveCount: number;
  caniculeCount: number;
};

export function buildHeatwaveStats(
  heatwaves: HeatwavePeriod[],
  datasets: WeatherYearDataset[]
): HeatwaveStats {
  const hotDays = datasets.reduce(
    (total, dataset) =>
      total + dataset.values.filter((value) => value.tmax !== null && value.tmax > 30).length,
    0
  );

  const tropicalNights = datasets.reduce(
    (total, dataset) =>
      total + dataset.values.filter((value) => value.tmin !== null && value.tmin >= 20).length,
    0
  );

  const heatwaveCount = heatwaves.filter((heatwave) => heatwave.kind === "vague_de_chaleur").length;
  const caniculeCount = heatwaves.filter((heatwave) => heatwave.kind === "canicule").length;

  return { hotDays, tropicalNights, heatwaveCount, caniculeCount };
}
