import type { WeatherYearDataset } from "@/types/weather";

export function exportWeatherCsv(datasets: WeatherYearDataset[]) {
  const rows = [
    "date,year,tmax,tmin",
    ...datasets.flatMap((dataset) =>
      dataset.values.map((value) =>
        [value.date, value.year, value.tmax ?? "", value.tmin ?? ""].join(",")
      )
    ),
  ];

  return rows.join("\n");
}
