"use client";

import { useEffect } from "react";

import { reverseGeocode } from "@/lib/api/nominatim";
import { loadPersistedCity, useWeatherStore } from "@/store/weather-store";

export function useGeolocatedCity() {
  const setCity = useWeatherStore((s) => s.setCity);

  useEffect(() => {
    if (loadPersistedCity() !== null) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const controller = new AbortController();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await reverseGeocode(latitude, longitude, controller.signal);

        if (city) {
          setCity(city);
        }
      },
      () => {
        // refus ou erreur → échec silencieux
      }
    );

    return () => {
      controller.abort();
    };
  }, [setCity]);
}
