"use client"

import type { HeatwavePeriod } from "@/types/weather"

type HeatwaveOverlayProps = {
  heatwaves: HeatwavePeriod[]
}

export function HeatwaveOverlay({ heatwaves }: HeatwaveOverlayProps) {
  if (heatwaves.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-medium text-orange-950">Canicules detectees</p>
      <ul className="mt-2 grid gap-1 text-orange-900 sm:grid-cols-2 lg:grid-cols-3">
        {heatwaves.map((heatwave) => (
          <li key={`${heatwave.year}-${heatwave.start}`}>
            {heatwave.year}: jour {heatwave.startDay} - {heatwave.endDay} (
            {heatwave.duration} jours, Tmax moyenne{" "}
            {heatwave.averageMax.toFixed(1)} degC)
          </li>
        ))}
      </ul>
    </div>
  )
}
