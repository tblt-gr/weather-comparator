"use client";

import { CitySearch } from "@/features/weather/components/controls";
import { PeriodPicker } from "@/features/weather/components/controls";
import { SeasonalNormalsToggle } from "@/features/weather/components/controls";
import { TemperatureToggle } from "@/features/weather/components/controls";
import { YearSelector } from "@/features/weather/components/controls";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DatePeriod } from "@/features/weather/logic/dates";
import type { City, TemperatureMode } from "@/features/weather/types";

type WeatherDashboardFiltersProps = {
  city: City | null;
  comparisonOffsets: number[];
  period: DatePeriod;
  showNormals: boolean;
  temperatureMode: TemperatureMode;
  onCityChange: (city: City | null) => void;
  onPeriodChange: (period: DatePeriod) => void;
  onToggleOffset: (offsetYears: number) => void;
  onClearOffsets: () => void;
  onTemperatureModeChange: (mode: TemperatureMode) => void;
  onShowNormalsChange: (showNormals: boolean) => void;
};

export function WeatherDashboardFilters({
  city,
  comparisonOffsets,
  period,
  showNormals,
  temperatureMode,
  onCityChange,
  onPeriodChange,
  onToggleOffset,
  onClearOffsets,
  onTemperatureModeChange,
  onShowNormalsChange,
}: WeatherDashboardFiltersProps) {
  const { t } = useLocale();

  return (
    <section
      aria-label={t["app.filtersAriaLabel"]}
      className="glass-panel grid gap-4 rounded-2xl p-4 lg:items-end lg:grid-cols-[minmax(240px,340px)_minmax(360px,520px)_1fr_auto]"
    >
      <CitySearch key={city?.id ?? "empty"} city={city} onCityChange={onCityChange} />
      <PeriodPicker period={period} onPeriodChange={onPeriodChange} />
      <YearSelector
        onClearOffsets={onClearOffsets}
        onToggleOffset={onToggleOffset}
        period={period}
        selectedOffsets={comparisonOffsets}
      />
      <div className="flex flex-wrap items-end justify-end gap-3">
        <TemperatureToggle onChange={onTemperatureModeChange} value={temperatureMode} />
        <SeasonalNormalsToggle checked={showNormals} onCheckedChange={onShowNormalsChange} />
      </div>
    </section>
  );
}
