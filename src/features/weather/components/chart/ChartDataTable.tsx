"use client";

import { formatAccessibleTemperature, getChartRowValue, type ChartRow } from "./weatherChartLogic";
import type { TemperatureMode, WeatherYearDataset } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type ChartDataTableProps = {
  captionId: string;
  datasets: WeatherYearDataset[];
  rows: ChartRow[];
  showNormals: boolean;
  temperatureMode: TemperatureMode;
};

export function ChartDataTable({
  captionId,
  datasets,
  rows,
  showNormals,
  temperatureMode,
}: ChartDataTableProps) {
  const { t } = useLocale();

  return (
    <details className="group rounded-md border border-border/60 bg-muted/10 open:bg-muted/20">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground marker:text-muted-foreground hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none">
        {t["chart.dataTableToggle"]}
      </summary>
      <div className="max-h-80 overflow-auto border-t border-border/60">
        <table className="w-full min-w-max border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only" id={captionId}>
            {t["chart.dataTableCaption"].replace(
              "{mode}",
              temperatureMode === "tmax" ? "Tmax" : "Tmin"
            )}
          </caption>
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              <th className="border-b border-border/60 px-3 py-2 font-medium" scope="col">
                {t["chart.dataTableDate"]}
              </th>
              {datasets.map((dataset) => (
                <th
                  className="border-b border-border/60 px-3 py-2 font-medium"
                  key={dataset.id}
                  scope="col"
                >
                  {dataset.label}
                </th>
              ))}
              {showNormals ? (
                <th className="border-b border-border/60 px-3 py-2 font-medium" scope="col">
                  {t["chart.normalLine"]}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-border/40 last:border-b-0" key={row.day}>
                <th className="px-3 py-2 font-normal text-muted-foreground" scope="row">
                  {row.tickLabel}
                </th>
                {datasets.map((dataset) => (
                  <td className="px-3 py-2" key={dataset.id}>
                    {formatAccessibleTemperature(getChartRowValue(row, dataset.id))}
                  </td>
                ))}
                {showNormals ? (
                  <td className="px-3 py-2">{formatAccessibleTemperature(row.normal)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
