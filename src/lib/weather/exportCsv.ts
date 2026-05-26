import Papa from "papaparse";

import type { WeatherYearDataset } from "@/types/weather";

export function exportWeatherCsv(datasets: WeatherYearDataset[]) {
  const rows = datasets.flatMap((dataset) =>
    dataset.values.map((value) => ({
      datasetId: dataset.id,
      datasetLabel: dataset.label,
      offsetYears: dataset.offsetYears,
      date: value.date,
      year: value.year,
      tmax: value.tmax,
      tmin: value.tmin,
    }))
  );

  return Papa.unparse(rows, {
    columns: ["datasetId", "datasetLabel", "offsetYears", "date", "year", "tmax", "tmin"],
    newline: "\n",
  });
}
