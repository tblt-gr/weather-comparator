import assert from "node:assert/strict";
import test from "node:test";

import { detectHeatwaves } from "./detectHeatwaves";
import type { WeatherYearDataset } from "@/types/weather";

test("classifies a hot spell as a canicule when it crosses the higher threshold", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-1", "2025", [
      [30, 16],
      [31, 17],
      [32, 18],
    ]),
    buildDataset("minus-4", "2022", [
      [33, 15],
      [34, 18],
      [35, 19],
    ]),
  ];

  const heatwaves = detectHeatwaves(datasets);

  assert.deepEqual(
    heatwaves.map((heatwave) => ({
      label: heatwave.datasetLabel,
      kind: heatwave.kind,
    })),
    [
      { label: "2025", kind: "vague_de_chaleur" },
      { label: "2022", kind: "canicule" },
    ]
  );
});

test("does not classify a long heatwave as canicule when only one day crosses the higher threshold", () => {
  const datasets: WeatherYearDataset[] = [
    buildDataset("minus-7", "2019", [
      [30, 16],
      [31, 17],
      [33, 18],
      [31, 18],
      [30, 17],
      [31, 16],
      [30, 15],
    ]),
  ];

  const [heatwave] = detectHeatwaves(datasets);

  assert.equal(heatwave?.kind, "vague_de_chaleur");
});

function buildDataset(
  id: string,
  label: string,
  temperatures: [tmax: number, tmin: number][]
): WeatherYearDataset {
  return {
    id,
    label,
    offsetYears: 0,
    values: temperatures.map(([tmax, tmin], index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      day: index + 1,
      year: 2026,
      tmax,
      tmin,
    })),
  };
}
