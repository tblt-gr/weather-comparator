"use client";

import type { HeatwavePeriod } from "@/types/weather";

function getSeverityLabel(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "Canicule" : "Vague de chaleur";
}

function getSeverityColor(kind: HeatwavePeriod["kind"]) {
  return kind === "canicule" ? "bg-red-500" : "bg-orange-500";
}

type HeatwaveOverlayProps = {
  heatwaves: HeatwavePeriod[];
};

export function HeatwaveOverlay({ heatwaves }: HeatwaveOverlayProps) {
  if (heatwaves.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-orange-300/40 bg-orange-100/45 p-3 text-sm shadow-lg shadow-orange-900/5 backdrop-blur-xl dark:border-orange-300/20 dark:bg-orange-400/10 dark:shadow-orange-300/5">
      <p className="font-medium text-orange-950 dark:text-orange-100">Vagues de chaleur et canicules</p>
      <ul className="mt-2 grid gap-1 text-orange-900 sm:grid-cols-2 lg:grid-cols-3 dark:text-orange-200">
        {heatwaves.map((heatwave) => (
          <li className="flex gap-2" key={`${heatwave.datasetId}-${heatwave.start}`}>
            <span
              aria-hidden="true"
              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${getSeverityColor(heatwave.kind)}`}
            />
            <span>
              <span className="font-medium">{getSeverityLabel(heatwave.kind)}</span>
              {`: ${heatwave.datasetLabel}, jour ${heatwave.startDay} - ${heatwave.endDay} (${heatwave.duration} jours, Tmax moyenne ${heatwave.averageMax.toFixed(1)} degC)`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
