"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getDefaultComparisonPeriod } from "@/features/weather/logic/dates";
import { parseWeatherUrlState, serializeWeatherUrlState } from "@/features/weather/logic/urlState";
import { useWeatherStore } from "@/features/weather/store";

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

function isMobileViewport() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

type WeatherUrlStoreSlice = {
  city: ReturnType<typeof useWeatherStore.getState>["city"];
  comparisonOffsets: ReturnType<typeof useWeatherStore.getState>["comparisonOffsets"];
  period: ReturnType<typeof useWeatherStore.getState>["period"];
  showNormals: ReturnType<typeof useWeatherStore.getState>["showNormals"];
  showForecast: ReturnType<typeof useWeatherStore.getState>["showForecast"];
  temperatureMode: ReturnType<typeof useWeatherStore.getState>["temperatureMode"];
};

export function buildWeatherUrlSearch(state: WeatherUrlStoreSlice) {
  return serializeWeatherUrlState(state).toString();
}

export function shouldReplaceWeatherUrl(currentSearch: string, nextSearch: string) {
  return currentSearch !== nextSearch;
}

function buildWeatherShareUrl(pathname: string, search: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const nextUrl = search ? `${pathname}?${search}` : pathname;
  return new URL(nextUrl, window.location.origin).toString();
}

export function useWeatherUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const city = useWeatherStore((state) => state.city);
  const comparisonOffsets = useWeatherStore((state) => state.comparisonOffsets);
  const period = useWeatherStore((state) => state.period);
  const showNormals = useWeatherStore((state) => state.showNormals);
  const showForecast = useWeatherStore((state) => state.showForecast);
  const temperatureMode = useWeatherStore((state) => state.temperatureMode);
  const hydrateFromUrl = useWeatherStore((state) => state.hydrateFromUrl);
  const hasHydratedRef = useRef(false);
  const currentSearch = searchParams.toString();
  const nextSearch = useMemo(
    () =>
      buildWeatherUrlSearch({
        city,
        comparisonOffsets,
        period,
        showNormals,
        showForecast,
        temperatureMode,
      }),
    [city, comparisonOffsets, period, showNormals, showForecast, temperatureMode]
  );

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }

    const urlParams = new URLSearchParams(currentSearch);
    const nextState = parseWeatherUrlState(urlParams, period);

    if (Object.keys(nextState).length > 0) {
      hydrateFromUrl(nextState);
    }

    const hasUrlPeriod = Boolean(urlParams.get("start") && urlParams.get("end"));

    if (!hasUrlPeriod && isMobileViewport()) {
      useWeatherStore.getState().setPeriod(getDefaultComparisonPeriod(new Date(), { compact: true }));
    }

    hasHydratedRef.current = true;
  }, [currentSearch, hydrateFromUrl, period]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    const latest = useWeatherStore.getState();
    const freshNextSearch = buildWeatherUrlSearch({
      city: latest.city,
      comparisonOffsets: latest.comparisonOffsets,
      period: latest.period,
      showNormals: latest.showNormals,
      showForecast: latest.showForecast,
      temperatureMode: latest.temperatureMode,
    });

    if (!shouldReplaceWeatherUrl(currentSearch, freshNextSearch)) {
      return;
    }

    const nextUrl = freshNextSearch ? `${pathname}?${freshNextSearch}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [currentSearch, nextSearch, pathname, router]);

  return city === null ? null : buildWeatherShareUrl(pathname, nextSearch);
}
