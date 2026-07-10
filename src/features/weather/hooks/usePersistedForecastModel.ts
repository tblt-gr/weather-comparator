"use client";

import { useEffect } from "react";

import { loadPersistedForecastModel, useWeatherStore } from "@/features/weather/store";

export function usePersistedForecastModel() {
  const setForecastModel = useWeatherStore((s) => s.setForecastModel);

  useEffect(() => {
    setForecastModel(loadPersistedForecastModel());
  }, [setForecastModel]);
}
