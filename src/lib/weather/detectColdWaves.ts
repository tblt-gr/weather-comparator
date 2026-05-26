import type { ColdWavePeriod, WeatherYearDataset } from "@/types/weather";

export function detectColdWaves(
  datasets: WeatherYearDataset[],
  thresholdColdWaveTmin = -5,
  thresholdColdWaveTmax = 0,
  thresholdGrandFroidTmin = -10,
  thresholdGrandFroidTmax = -5,
  minimumDuration = 3
): ColdWavePeriod[] {
  const coldWaves: ColdWavePeriod[] = [];

  datasets.forEach((dataset) => {
    let sequence: { date: string; day: number; tmin: number; tmax: number; isGrandFroid: boolean }[] = [];

    dataset.values.forEach((value) => {
      if (
        typeof value.tmin === "number" &&
        typeof value.tmax === "number" &&
        value.tmin <= thresholdColdWaveTmin &&
        value.tmax <= thresholdColdWaveTmax
      ) {
        sequence.push({
          date: value.date,
          day: value.day,
          tmin: value.tmin,
          tmax: value.tmax,
          isGrandFroid: value.tmin <= thresholdGrandFroidTmin || value.tmax <= thresholdGrandFroidTmax,
        });
        return;
      }

      pushColdWave(dataset.id, dataset.label, sequence, minimumDuration, coldWaves);
      sequence = [];
    });

    pushColdWave(dataset.id, dataset.label, sequence, minimumDuration, coldWaves);
  });

  return coldWaves;
}

function pushColdWave(
  datasetId: string,
  datasetLabel: string,
  sequence: { date: string; day: number; tmin: number; tmax: number; isGrandFroid: boolean }[],
  minimumDuration: number,
  coldWaves: ColdWavePeriod[]
) {
  if (sequence.length < minimumDuration) {
    return;
  }

  coldWaves.push({
    datasetId,
    datasetLabel,
    kind: hasConsecutiveGrandFroidDays(sequence, minimumDuration) ? "grand_froid" : "vague_de_froid",
    start: sequence[0].date,
    end: sequence[sequence.length - 1].date,
    startDay: sequence[0].day,
    endDay: sequence[sequence.length - 1].day,
    duration: sequence.length,
    averageMin: sequence.reduce((total, value) => total + value.tmin, 0) / sequence.length,
  });
}

function hasConsecutiveGrandFroidDays(
  sequence: { isGrandFroid: boolean }[],
  minimumDuration: number
) {
  let consecutiveDays = 0;

  for (const value of sequence) {
    consecutiveDays = value.isGrandFroid ? consecutiveDays + 1 : 0;

    if (consecutiveDays >= minimumDuration) {
      return true;
    }
  }

  return false;
}
