import { Suspense } from "react";

import { WeatherDashboard } from "@/components/weather/WeatherDashboard";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <WeatherDashboard />
    </Suspense>
  );
}
