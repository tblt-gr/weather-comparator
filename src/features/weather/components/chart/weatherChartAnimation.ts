import type { TemperatureMode, WeatherYearDataset } from "@/features/weather/types";

type SeriesAnimation = {
  observedDuration: number;
  forecastBegin: number;
  forecastDuration: number;
};

type CurrentObservedLineAnimation = {
  animationDuration: number;
  isAnimationActive: boolean;
};

type CurrentForecastLineAnimation = {
  animationBegin: number;
  animationDuration: number;
  isAnimationActive: boolean;
};

export type SeriesLineSignatures = Map<string, string>;

type NormalsLineConfig = {
  isAnimationActive: boolean;
  strokeDasharray: string;
  strokeWidth: number;
};

const NORMALS_LINE_STROKE_DASHARRAY = "6 5";

export function getUniformDrawDuration(
  segmentCount: number,
  referenceSegmentCount: number,
  fullMs: number
): number {
  if (referenceSegmentCount <= 0) {
    return fullMs;
  }

  return Math.round((fullMs * segmentCount) / referenceSegmentCount);
}

export function getCurrentSeriesAnimation(
  currentDataset: WeatherYearDataset | undefined,
  referenceSegmentCount: number,
  fullMs: number
): SeriesAnimation {
  if (!currentDataset) {
    return {
      observedDuration: 0,
      forecastBegin: 0,
      forecastDuration: 0,
    };
  }

  const observedPointCount = currentDataset.values.filter((value) => !value.isForecast).length;
  const forecastPointCount = currentDataset.values.filter((value) => value.isForecast).length;

  // The observed line spans `observedPointCount - 1` segments. The forecast line
  // includes a bridge point to the last observed day, so it spans
  // `forecastPointCount` segments.
  const observedSegmentCount = Math.max(0, observedPointCount - 1);
  const forecastSegmentCount = forecastPointCount;
  const totalSegmentCount = observedSegmentCount + forecastSegmentCount;

  if (observedSegmentCount === 0) {
    return {
      observedDuration: 0,
      forecastBegin: 0,
      forecastDuration:
        forecastSegmentCount > 0
          ? getUniformDrawDuration(forecastSegmentCount, referenceSegmentCount, fullMs)
          : 0,
    };
  }

  if (forecastSegmentCount === 0) {
    const observedDuration = getUniformDrawDuration(
      observedSegmentCount,
      referenceSegmentCount,
      fullMs
    );

    return {
      observedDuration,
      forecastBegin: observedDuration,
      forecastDuration: 0,
    };
  }

  const totalDuration = getCompressedCurrentTotalDuration(
    observedSegmentCount,
    forecastSegmentCount,
    referenceSegmentCount,
    fullMs
  );
  const observedDuration = Math.round((totalDuration * observedSegmentCount) / totalSegmentCount);
  const forecastDuration = totalDuration - observedDuration;

  return {
    observedDuration,
    forecastBegin: observedDuration,
    forecastDuration,
  };
}

function getCompressedCurrentTotalDuration(
  observedSegmentCount: number,
  forecastSegmentCount: number,
  referenceSegmentCount: number,
  fullMs: number
): number {
  const totalDuration = getUniformDrawDuration(
    observedSegmentCount + forecastSegmentCount,
    referenceSegmentCount,
    fullMs
  );
  const longestSegmentDuration = getUniformDrawDuration(
    Math.max(observedSegmentCount, forecastSegmentCount),
    referenceSegmentCount,
    fullMs
  );

  return Math.round((totalDuration + longestSegmentDuration) / 2);
}

export function getCurrentObservedLineAnimation({
  currentSeriesAnimation,
  freshLineKeys,
  reducedMotion,
  updateAnimationMs,
}: {
  currentSeriesAnimation: SeriesAnimation;
  freshLineKeys: ReadonlySet<string>;
  reducedMotion: boolean;
  updateAnimationMs: number;
}): CurrentObservedLineAnimation {
  if (reducedMotion) {
    return {
      animationDuration: 0,
      isAnimationActive: false,
    };
  }

  if (!freshLineKeys.has("currentObserved")) {
    return {
      animationDuration: updateAnimationMs,
      isAnimationActive: true,
    };
  }

  return {
    animationDuration: currentSeriesAnimation.observedDuration,
    isAnimationActive: currentSeriesAnimation.observedDuration > 0,
  };
}

export function getCurrentForecastLineAnimation({
  currentSeriesAnimation,
  freshLineKeys,
  reducedMotion,
  updateAnimationMs,
}: {
  currentSeriesAnimation: SeriesAnimation;
  freshLineKeys: ReadonlySet<string>;
  reducedMotion: boolean;
  updateAnimationMs: number;
}): CurrentForecastLineAnimation {
  if (reducedMotion) {
    return {
      animationBegin: 0,
      animationDuration: 0,
      isAnimationActive: false,
    };
  }

  if (!freshLineKeys.has("currentForecast")) {
    return {
      animationBegin: 0,
      animationDuration: updateAnimationMs,
      isAnimationActive: true,
    };
  }

  return {
    animationBegin: currentSeriesAnimation.forecastBegin,
    animationDuration: currentSeriesAnimation.forecastDuration,
    isAnimationActive: currentSeriesAnimation.forecastDuration > 0,
  };
}

export function getSeriesLineKeys(datasets: WeatherYearDataset[]): string[] {
  return datasets.flatMap((dataset) =>
    dataset.id === "current" ? ["currentObserved", "currentForecast"] : [dataset.id]
  );
}

export function getSeriesLineSignatures(
  datasets: WeatherYearDataset[],
  temperatureMode: TemperatureMode
): SeriesLineSignatures {
  return new Map(
    datasets.flatMap((dataset) => {
      if (dataset.id !== "current") {
        return [
          [
            dataset.id,
            buildSeriesLineSignature(dataset.id, dataset.values, temperatureMode, () => true),
          ] as const,
        ];
      }

      return [
        [
          "currentObserved",
          buildSeriesLineSignature(
            "currentObserved",
            dataset.values,
            temperatureMode,
            (value) => !value.isForecast
          ),
        ] as const,
        [
          "currentForecast",
          buildSeriesLineSignature(
            "currentForecast",
            dataset.values,
            temperatureMode,
            (value, index, values) =>
              value.isForecast ||
              (index === values.findIndex((entry) => entry.isForecast) - 1 && !value.isForecast)
          ),
        ] as const,
      ];
    })
  );
}

export function getSeriesLineKeysDependency(keys: readonly string[]): string {
  return JSON.stringify(keys);
}

export function getFreshSeriesKeys(
  currentKeys: string[],
  previousKeys: Iterable<string>
): Set<string> {
  const previous = new Set(previousKeys);

  return new Set(currentKeys.filter((key) => !previous.has(key)));
}

export function getFreshSeriesKeysFromSignatures(
  currentSignatures: ReadonlyMap<string, string>,
  previousSignatures: ReadonlyMap<string, string>
): Set<string> {
  return new Set(
    [...currentSignatures.entries()]
      .filter(([key, signature]) => previousSignatures.get(key) !== signature)
      .map(([key]) => key)
  );
}

export function getSeriesAnimationDuration(
  seriesId: string,
  freshIds: ReadonlySet<string>,
  reducedMotion: boolean,
  fullMs: number,
  updateMs: number,
  seriesSegmentCount: number,
  referenceSegmentCount: number
): number {
  if (reducedMotion) {
    return 0;
  }

  if (!freshIds.has(seriesId)) {
    return updateMs;
  }

  return getUniformDrawDuration(seriesSegmentCount, referenceSegmentCount, fullMs);
}

export function getNormalsLineConfig(): NormalsLineConfig {
  return {
    // Recharts animates line drawing with a solid stroke first, which makes dashed
    // series briefly appear continuous. Keep normals dashed from the first frame.
    isAnimationActive: false,
    strokeDasharray: NORMALS_LINE_STROKE_DASHARRAY,
    strokeWidth: 2,
  };
}

function buildSeriesLineSignature(
  lineId: string,
  values: WeatherYearDataset["values"],
  temperatureMode: TemperatureMode,
  includeValue: (
    value: WeatherYearDataset["values"][number],
    index: number,
    values: WeatherYearDataset["values"]
  ) => boolean
) {
  const points = values
    .filter((value, index, allValues) => includeValue(value, index, allValues))
    .map((value) => `${value.date}:${value[temperatureMode] ?? "null"}`)
    .join("|");

  return `${lineId}|${points}`;
}
