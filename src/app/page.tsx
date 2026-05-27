import { Suspense } from "react";

import { WeatherDashboard } from "@/features/weather/components/dashboard";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <WeatherDashboard />
    </Suspense>
  );
}
