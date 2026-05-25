import type { HeatwavePeriod, WeatherYearDataset } from "@/types/weather";

export function detectHeatwaves(
  datasets: WeatherYearDataset[],
  thresholdMax = 33,
  thresholdMin = 18,
  minimumDuration = 3
): HeatwavePeriod[] {
  const heatwaves: HeatwavePeriod[] = [];

  datasets.forEach((dataset) => {
    let sequence: { date: string; day: number; tmax: number }[] = [];

    dataset.values.forEach((value) => {
      if (
        typeof value.tmax === "number" &&
        typeof value.tmin === "number" &&
        value.tmax >= thresholdMax &&
        value.tmin >= thresholdMin
      ) {
        sequence.push({
          date: value.date,
          day: value.day,
          tmax: value.tmax,
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
  sequence: { date: string; day: number; tmax: number }[],
  minimumDuration: number,
  heatwaves: HeatwavePeriod[]
) {
  if (sequence.length < minimumDuration) {
    return;
  }

  heatwaves.push({
    datasetId,
    datasetLabel,
    start: sequence[0].date,
    end: sequence[sequence.length - 1].date,
    startDay: sequence[0].day,
    endDay: sequence[sequence.length - 1].day,
    duration: sequence.length,
    averageMax: sequence.reduce((total, value) => total + value.tmax, 0) / sequence.length,
  });
}
