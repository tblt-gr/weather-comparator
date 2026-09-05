import { createElement } from "react";

import { getWeatherIconTone, getWeatherPartColor } from "./weatherIconTone";
import type { WeatherConditionKind } from "@/features/weather/types";

type IconNode = [tag: string, attrs: Record<string, string>];

const SUN: IconNode[] = [
  ["circle", { cx: "12", cy: "12", r: "4", key: "sun-core" }],
  ["path", { d: "M12 2v2", key: "sun-n" }],
  ["path", { d: "M12 20v2", key: "sun-s" }],
  ["path", { d: "m4.93 4.93 1.41 1.41", key: "sun-nw" }],
  ["path", { d: "m17.66 17.66 1.41 1.41", key: "sun-se" }],
  ["path", { d: "M2 12h2", key: "sun-w" }],
  ["path", { d: "M20 12h2", key: "sun-e" }],
  ["path", { d: "m6.34 17.66-1.41 1.41", key: "sun-sw" }],
  ["path", { d: "m19.07 4.93-1.41 1.41", key: "sun-ne" }],
];

const CLOUD: IconNode[] = [["path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z", key: "cloud" }]];

const CLOUD_SUN: IconNode[] = [
  ["path", { d: "M12 2v2", key: "cs-n" }],
  ["path", { d: "m4.93 4.93 1.41 1.41", key: "cs-nw" }],
  ["path", { d: "M20 12h2", key: "cs-e" }],
  ["path", { d: "m19.07 4.93-1.41 1.41", key: "cs-ne" }],
  ["path", { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128", key: "cs-arc" }],
  ["path", { d: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z", key: "cs-cloud" }],
];

const CLOUD_BODY: IconNode = [
  "path",
  { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", key: "precip-cloud" },
];

const CLOUD_RAIN: IconNode[] = [
  CLOUD_BODY,
  ["path", { d: "M16 14v6", key: "rain-r" }],
  ["path", { d: "M8 14v6", key: "rain-l" }],
  ["path", { d: "M12 16v6", key: "rain-c" }],
];

const CLOUD_DRIZZLE: IconNode[] = [
  CLOUD_BODY,
  ["path", { d: "M8 19v1", key: "drz-l2" }],
  ["path", { d: "M8 14v1", key: "drz-l1" }],
  ["path", { d: "M16 19v1", key: "drz-r2" }],
  ["path", { d: "M16 14v1", key: "drz-r1" }],
  ["path", { d: "M12 21v1", key: "drz-c2" }],
  ["path", { d: "M12 16v1", key: "drz-c1" }],
];

const CLOUD_SNOW: IconNode[] = [
  CLOUD_BODY,
  ["path", { d: "M8 15h.01", key: "sn-1" }],
  ["path", { d: "M8 19h.01", key: "sn-2" }],
  ["path", { d: "M12 17h.01", key: "sn-3" }],
  ["path", { d: "M12 21h.01", key: "sn-4" }],
  ["path", { d: "M16 15h.01", key: "sn-5" }],
  ["path", { d: "M16 19h.01", key: "sn-6" }],
];

const CLOUD_FOG: IconNode[] = [
  CLOUD_BODY,
  ["path", { d: "M16 17H7", key: "fog-1" }],
  ["path", { d: "M17 21H9", key: "fog-2" }],
];

const CLOUD_BOLT: IconNode[] = [
  ["path", { d: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973", key: "bolt-cloud" }],
  ["path", { d: "m13 12-3 5h4l-3 5", key: "bolt" }],
];

const ICON_NODES: Record<WeatherConditionKind, IconNode[]> = {
  clear: SUN,
  mainly_clear: SUN,
  partly_cloudy: CLOUD_SUN,
  overcast: CLOUD,
  fog: CLOUD_FOG,
  drizzle: CLOUD_DRIZZLE,
  freezing_drizzle: CLOUD_DRIZZLE,
  rain: CLOUD_RAIN,
  freezing_rain: CLOUD_RAIN,
  snow: CLOUD_SNOW,
  snow_grains: CLOUD_SNOW,
  rain_showers: CLOUD_RAIN,
  snow_showers: CLOUD_SNOW,
  thunderstorm: CLOUD_BOLT,
  thunderstorm_hail: CLOUD_BOLT,
  unknown: CLOUD,
};

export function WeatherConditionIcon({ kind }: { kind: WeatherConditionKind }) {
  const tone = getWeatherIconTone(kind);
  const nodes = ICON_NODES[kind];

  return (
    <svg
      aria-hidden="true"
      className="size-6 shrink-0"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {nodes.map(([tag, attrs], index) =>
        createElement(tag, {
          ...attrs,
          key: attrs.key,
          stroke: getWeatherPartColor(tone, index, nodes.length),
        })
      )}
    </svg>
  );
}
