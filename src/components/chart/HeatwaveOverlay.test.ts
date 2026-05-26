import assert from "node:assert/strict";
import test from "node:test";

import {
  formatHeatwaveDateRange,
  formatHeatwaveSummary,
  groupHeatwavesByYear,
} from "@/components/chart/HeatwaveOverlay";
import type { HeatwavePeriod } from "@/types/weather";

test("formats a heatwave period as a readable french date range", () => {
  assert.equal(formatHeatwaveDateRange("2026-05-05", "2026-05-08", "fr"), "05 mai à 08 mai");
  assert.equal(formatHeatwaveDateRange("2026-05-30", "2026-06-02", "fr"), "30 mai à 02 juin");
});

test("formats a heatwave period as a readable english date range", () => {
  assert.equal(formatHeatwaveDateRange("2026-05-05", "2026-05-08", "en"), "05 May to 08 May");
});

test("groups heatwaves by dataset year while preserving event order", () => {
  const heatwaves: HeatwavePeriod[] = [
    buildHeatwave({
      datasetId: "year-2025",
      datasetLabel: "2025-05-01 - 2025-05-31",
      kind: "vague_de_chaleur",
      start: "2025-05-05",
      end: "2025-05-08",
    }),
    buildHeatwave({
      datasetId: "year-2024",
      datasetLabel: "2024-08-01 - 2024-08-31",
      kind: "canicule",
      start: "2024-08-10",
      end: "2024-08-14",
    }),
    buildHeatwave({
      datasetId: "year-2025",
      datasetLabel: "2025-08-01 - 2025-08-31",
      kind: "canicule",
      start: "2025-08-12",
      end: "2025-08-16",
    }),
  ];

  assert.deepEqual(groupHeatwavesByYear(heatwaves), [
    {
      year: "2025",
      heatwaves: [heatwaves[0], heatwaves[2]],
    },
    {
      year: "2024",
      heatwaves: [heatwaves[1]],
    },
  ]);
});

test("keeps duration and average temperature details in the french summary", () => {
  assert.equal(
    formatHeatwaveSummary(
      buildHeatwave({
        datasetId: "year-2025",
        datasetLabel: "2025",
        kind: "canicule",
        start: "2025-05-05",
        end: "2025-05-08",
      }),
      "fr"
    ),
    "Canicule 05 mai à 08 mai (4 jours, Tmax moyenne 32.5 °C)"
  );
});

test("keeps duration and average temperature details in the english summary", () => {
  assert.equal(
    formatHeatwaveSummary(
      buildHeatwave({
        datasetId: "year-2025",
        datasetLabel: "2025",
        kind: "canicule",
        start: "2025-05-05",
        end: "2025-05-08",
      }),
      "en"
    ),
    "Scorching heat 05 May to 08 May (4 days, avg Tmax 32.5 °C)"
  );
});

function buildHeatwave(
  overrides: Pick<HeatwavePeriod, "datasetId" | "datasetLabel" | "kind" | "start" | "end">
): HeatwavePeriod {
  return {
    datasetId: overrides.datasetId,
    datasetLabel: overrides.datasetLabel,
    kind: overrides.kind,
    start: overrides.start,
    end: overrides.end,
    startDay: 1,
    endDay: 4,
    duration: 4,
    averageMax: 32.5,
  };
}
