import { Suspense } from "react";

import { WeatherDashboard } from "@/features/weather/components/dashboard";
import { getDefaultComparisonPeriod } from "@/features/weather/logic/dates";

export default function Home() {
  const initialPeriod = getDefaultComparisonPeriod();

  return (
    <Suspense fallback={null}>
      <WeatherDashboard initialPeriod={initialPeriod} />
    </Suspense>
  );
}
