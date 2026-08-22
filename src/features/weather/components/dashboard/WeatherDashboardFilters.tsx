"use client";

import { CitySearch } from "@/features/weather/components/controls";
import { ExtremeFilters } from "@/features/weather/components/controls";
import { ForecastControl } from "@/features/weather/components/controls";
import { PeriodPicker } from "@/features/weather/components/controls";
import { SeasonalNormalsToggle } from "@/features/weather/components/controls";
import { TemperatureToggle } from "@/features/weather/components/controls";
import { YearSelector } from "@/features/weather/components/controls";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DatePeriod } from "@/features/weather/logic/dates";
import type { City, ExtremeKind, ForecastModel, TemperatureMode } from "@/features/weather/types";

type WeatherDashboardFiltersProps = {
  city: City | null;
  comparisonOffsets: number[];
  period: DatePeriod;
  showNormals: boolean;
  showForecast: boolean;
  temperatureMode: TemperatureMode;
  forecastModel: ForecastModel;
  hiddenExtremeKinds: ExtremeKind[];
  availableExtremeKinds: Record<ExtremeKind, boolean>;
  onCityChange: (city: City | null) => void;
  onPeriodChange: (period: DatePeriod) => void;
  onToggleOffset: (offsetYears: number) => void;
  onClearOffsets: () => void;
  onTemperatureModeChange: (mode: TemperatureMode) => void;
  onShowNormalsChange: (showNormals: boolean) => void;
  onShowForecastChange: (showForecast: boolean) => void;
  onForecastModelChange: (model: ForecastModel) => void;
  onToggleExtremeKind: (kind: ExtremeKind) => void;
};

export function WeatherDashboardFilters({
  city,
  comparisonOffsets,
  period,
  showNormals,
  showForecast,
  temperatureMode,
  forecastModel,
  hiddenExtremeKinds,
  availableExtremeKinds,
  onCityChange,
  onPeriodChange,
  onToggleOffset,
  onClearOffsets,
  onTemperatureModeChange,
  onShowNormalsChange,
  onShowForecastChange,
  onForecastModelChange,
  onToggleExtremeKind,
}: WeatherDashboardFiltersProps) {
  const { t } = useLocale();

  return (
    <section
      aria-label={t["app.filtersAriaLabel"]}
      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card px-3 py-3 sm:px-4"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(200px,0.9fr)_minmax(360px,1.5fr)_minmax(180px,0.7fr)_auto] lg:items-end">
        <CitySearch key={city?.id ?? "empty"} city={city} onCityChange={onCityChange} />
        <PeriodPicker period={period} onPeriodChange={onPeriodChange} />
        <YearSelector
          onClearOffsets={onClearOffsets}
          onToggleOffset={onToggleOffset}
          period={period}
          selectedOffsets={comparisonOffsets}
        />
        <div className="flex lg:justify-end">
          <TemperatureToggle onChange={onTemperatureModeChange} value={temperatureMode} />
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border/50 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SeasonalNormalsToggle checked={showNormals} onCheckedChange={onShowNormalsChange} />
        <ForecastControl
          checked={showForecast}
          model={forecastModel}
          onCheckedChange={onShowForecastChange}
          onModelChange={onForecastModelChange}
        />
        <ExtremeFilters
          availableKinds={availableExtremeKinds}
          hiddenKinds={hiddenExtremeKinds}
          onToggleKind={onToggleExtremeKind}
        />
      </div>
    </section>
  );
}
