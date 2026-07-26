"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type ChartFullscreenViewport = {
  width: number;
  height: number;
};

export type ChartFullscreenController = {
  active: boolean;
  // True when we must fake landscape with a CSS rotation because the native
  // orientation lock is unavailable (typically iOS Safari, which supports
  // neither element fullscreen nor `screen.orientation.lock`).
  needsRotation: boolean;
  viewport: ChartFullscreenViewport;
  toggle: () => void;
};

type OrientationLockScreen = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};

function readViewport(): ChartFullscreenViewport {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

export function useChartFullscreen(
  targetRef: RefObject<HTMLElement | null>,
  { lockLandscape }: { lockLandscape: boolean }
): ChartFullscreenController {
  const [active, setActive] = useState(false);
  const [viewport, setViewport] = useState<ChartFullscreenViewport>(readViewport);
  // Tracks whether the native Fullscreen API drove the current session so the
  // `fullscreenchange` sync below only reacts to sessions it actually started.
  const usedNativeFullscreenRef = useRef(false);

  // Keep viewport dimensions fresh so the chart can be sized to fit the screen.
  useEffect(() => {
    if (!active) {
      return;
    }

    const update = () => setViewport(readViewport());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [active]);

  // The browser chrome (Escape, native exit button) can leave fullscreen on its
  // own; mirror that back into state.
  useEffect(() => {
    const handler = () => {
      if (usedNativeFullscreenRef.current && !document.fullscreenElement) {
        usedNativeFullscreenRef.current = false;
        setActive(false);
      }
    };

    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Escape also closes the CSS-overlay fallback (native fullscreen handles its
  // own Escape via the event above).
  useEffect(() => {
    if (!active) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) {
        setActive(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  const enter = useCallback(async () => {
    setActive(true);
    setViewport(readViewport());

    const element = targetRef.current;

    try {
      if (element?.requestFullscreen) {
        await element.requestFullscreen();
        usedNativeFullscreenRef.current = true;
      }
    } catch {
      usedNativeFullscreenRef.current = false;
    }

    if (lockLandscape) {
      try {
        const orientation = window.screen.orientation as OrientationLockScreen | undefined;
        await orientation?.lock?.("landscape");
      } catch {
        // Orientation lock unsupported — the CSS rotation fallback covers it.
      }
    }
  }, [lockLandscape, targetRef]);

  const exit = useCallback(async () => {
    try {
      const orientation = window.screen.orientation as OrientationLockScreen | undefined;
      orientation?.unlock?.();
    } catch {
      // Ignore: unlock is best-effort.
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore: already out of fullscreen.
    }

    usedNativeFullscreenRef.current = false;
    setActive(false);
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      void exit();
    } else {
      void enter();
    }
  }, [active, enter, exit]);

  const needsRotation = active && lockLandscape && viewport.height > viewport.width;

  return { active, needsRotation, viewport, toggle };
}
