"use client";

import { CitySearch } from "@/features/weather/components/controls";
import { ExtremeFilters } from "@/features/weather/components/controls";
import { PeriodPicker } from "@/features/weather/components/controls";
import { SeasonalNormalsToggle } from "@/features/weather/components/controls";
import { TemperatureToggle } from "@/features/weather/components/controls";
import { YearSelector } from "@/features/weather/components/controls";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DatePeriod } from "@/features/weather/logic/dates";
import type { City, ExtremeKind, TemperatureMode } from "@/features/weather/types";

type WeatherDashboardFiltersProps = {
  city: City | null;
  comparisonOffsets: number[];
  period: DatePeriod;
  showNormals: boolean;
  temperatureMode: TemperatureMode;
  hiddenExtremeKinds: ExtremeKind[];
  availableExtremeKinds: Record<ExtremeKind, boolean>;
  onCityChange: (city: City | null) => void;
  onPeriodChange: (period: DatePeriod) => void;
  onToggleOffset: (offsetYears: number) => void;
  onClearOffsets: () => void;
  onTemperatureModeChange: (mode: TemperatureMode) => void;
  onShowNormalsChange: (showNormals: boolean) => void;
  onToggleExtremeKind: (kind: ExtremeKind) => void;
};

export function WeatherDashboardFilters({
  city,
  comparisonOffsets,
  period,
  showNormals,
  temperatureMode,
  hiddenExtremeKinds,
  availableExtremeKinds,
  onCityChange,
  onPeriodChange,
  onToggleOffset,
  onClearOffsets,
  onTemperatureModeChange,
  onShowNormalsChange,
  onToggleExtremeKind,
}: WeatherDashboardFiltersProps) {
  const { t } = useLocale();

  return (
    <section
      aria-label={t["app.filtersAriaLabel"]}
      className="glass-panel grid gap-4 rounded-2xl p-4 lg:grid-cols-[minmax(240px,340px)_minmax(360px,1fr)] lg:items-end xl:grid-cols-[minmax(240px,340px)_minmax(360px,520px)_1fr_auto]"
    >
      <CitySearch key={city?.id ?? "empty"} city={city} onCityChange={onCityChange} />
      <PeriodPicker period={period} onPeriodChange={onPeriodChange} />
      <YearSelector
        onClearOffsets={onClearOffsets}
        onToggleOffset={onToggleOffset}
        period={period}
        selectedOffsets={comparisonOffsets}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:justify-end">
        <TemperatureToggle onChange={onTemperatureModeChange} value={temperatureMode} />
        <SeasonalNormalsToggle checked={showNormals} onCheckedChange={onShowNormalsChange} />
      </div>
      <div className="lg:col-span-full xl:col-span-full">
        <ExtremeFilters
          availableKinds={availableExtremeKinds}
          hiddenKinds={hiddenExtremeKinds}
          onToggleKind={onToggleExtremeKind}
        />
      </div>
    </section>
  );
}
