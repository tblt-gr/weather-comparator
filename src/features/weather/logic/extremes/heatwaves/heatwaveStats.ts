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

  // detectHeatwaves splits a single hot spell into vague de chaleur and
  // canicule segments, so the summary counts group contiguous segments back
  // into spells: a spell that reaches canicule anywhere counts as one
  // canicule, otherwise as one vague de chaleur. This keeps the summary
  // stable regardless of how the spell is segmented for display.
  let heatwaveCount = 0;
  let caniculeCount = 0;

  groupContiguousSpells(heatwaves).forEach((spell) => {
    if (spell.some((segment) => segment.kind === "canicule")) {
      caniculeCount += 1;
    } else {
      heatwaveCount += 1;
    }
  });

  return { hotDays, tropicalNights, heatwaveCount, caniculeCount };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function groupContiguousSpells(heatwaves: HeatwavePeriod[]): HeatwavePeriod[][] {
  const spells: HeatwavePeriod[][] = [];

  heatwaves.forEach((segment) => {
    const current = spells[spells.length - 1];
    const previous = current?.[current.length - 1];

    if (
      previous &&
      previous.datasetId === segment.datasetId &&
      isNextDay(previous.end, segment.start)
    ) {
      current.push(segment);
      return;
    }

    spells.push([segment]);
  });

  return spells;
}

function isNextDay(previousEnd: string, nextStart: string): boolean {
  return new Date(nextStart).getTime() - new Date(previousEnd).getTime() === MS_PER_DAY;
}
