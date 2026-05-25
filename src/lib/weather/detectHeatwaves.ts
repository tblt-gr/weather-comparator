import type { HeatwavePeriod, WeatherYearDataset } from "@/types/weather";

export function detectHeatwaves(
  datasets: WeatherYearDataset[],
  thresholdHeatwave = 30,
  thresholdCanicule = 33,
  minimumDuration = 3
): HeatwavePeriod[] {
  const heatwaves: HeatwavePeriod[] = [];

  datasets.forEach((dataset) => {
    let sequence: { date: string; day: number; tmax: number; isCanicule: boolean }[] = [];

    dataset.values.forEach((value) => {
      if (
        typeof value.tmax === "number" &&
        value.tmax >= thresholdHeatwave
      ) {
        sequence.push({
          date: value.date,
          day: value.day,
          tmax: value.tmax,
          isCanicule: value.tmax >= thresholdCanicule,
        });
        return;
      }

      pushHeatwave(dataset.id, dataset.label, sequence, minimumDuration, heatwaves);
      sequence = [];
    });

    pushHeatwave(dataset.id, dataset.label, sequence, minimumDuration, heatwaves);
  });

  return heatwaves;
}

function pushHeatwave(
  datasetId: string,
  datasetLabel: string,
  sequence: { date: string; day: number; tmax: number; isCanicule: boolean }[],
  minimumDuration: number,
  heatwaves: HeatwavePeriod[]
) {
  if (sequence.length < minimumDuration) {
    return;
  }

  heatwaves.push({
    datasetId,
    datasetLabel,
    kind: sequence.some((value) => value.isCanicule) ? "canicule" : "vague_de_chaleur",
    start: sequence[0].date,
    end: sequence[sequence.length - 1].date,
    startDay: sequence[0].day,
    endDay: sequence[sequence.length - 1].day,
    duration: sequence.length,
    averageMax: sequence.reduce((total, value) => total + value.tmax, 0) / sequence.length,
  });
}
