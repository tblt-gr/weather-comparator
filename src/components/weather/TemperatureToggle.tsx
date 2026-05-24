"use client"

import { Button } from "@/components/ui/button"
import type { TemperatureMode } from "@/types/weather"

type TemperatureToggleProps = {
  value: TemperatureMode
  onChange: (value: TemperatureMode) => void
}

export function TemperatureToggle({ value, onChange }: TemperatureToggleProps) {
  return (
    <div
      aria-label="Type de temperature"
      className="grid grid-cols-2 gap-1 rounded-xl border border-white/40 bg-white/45 p-1 shadow-lg shadow-cyan-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-cyan-400/10"
      role="group"
    >
      <Button
        aria-pressed={value === "tmax"}
        onClick={() => onChange("tmax")}
        size="sm"
        type="button"
        variant={value === "tmax" ? "default" : "ghost"}
      >
        Tmax
      </Button>
      <Button
        aria-pressed={value === "tmin"}
        onClick={() => onChange("tmin")}
        size="sm"
        type="button"
        variant={value === "tmin" ? "default" : "ghost"}
      >
        Tmin
      </Button>
    </div>
  )
}
