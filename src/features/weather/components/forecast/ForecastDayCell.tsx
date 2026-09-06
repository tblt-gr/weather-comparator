import type { ForecastOutlookDay } from "@/features/weather/types";
import type { Locale, Translations } from "@/lib/i18n/types";

import {
  formatCompactTemp,
  formatHumidity,
  formatOutlookDate,
  formatOutlookDayLabel,
  formatPrecipitation,
  formatWind,
} from "./forecastOutlookFormat";
import { UvIndexLine } from "./UvScaleInfo";
import { WeatherConditionIcon } from "./WeatherConditionIcon";

type ForecastDayCellProps = {
  day: ForecastOutlookDay;
  locale: Locale;
  t: Translations;
  today: string;
};

export function ForecastDayCell({ day, locale, t, today }: ForecastDayCellProps) {
  const conditionLabel = t[`weather.${day.condition.kind}`];
  const isToday = day.date === today;
  const dayLabel = formatOutlookDayLabel(day.date, today, locale, t);

  return (
    <li
      className={`flex w-[calc(100%/7)] min-w-[8.5rem] shrink-0 flex-col gap-1.5 border-r border-border/50 px-2 py-1 last:border-r-0 ${
        isToday ? "bg-muted/40" : ""
      }`}
    >
      <div className="min-w-0">
        <p
          className={`truncate text-[11px] font-medium tracking-wide uppercase ${
            isToday ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {dayLabel}
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">{formatOutlookDate(day.date)}</p>
      </div>

      <div className="flex min-w-0 items-center gap-1.5">
        <WeatherConditionIcon kind={day.condition.kind} />
        <p className="truncate text-xs leading-snug text-foreground">{conditionLabel}</p>
      </div>

      <p className="text-base font-semibold tabular-nums tracking-tight">
        <span>{formatCompactTemp(day.tmin)}</span>
        <span className="mx-0.5 font-medium text-muted-foreground">/</span>
        <span>{formatCompactTemp(day.tmax)}</span>
      </p>

      <p className="truncate text-xs tabular-nums text-muted-foreground">
        {formatPrecipitation(day.precipitationSum, day.precipitationProbability, t)}
      </p>
      <p className="truncate text-xs tabular-nums text-muted-foreground">
        {formatWind(day.windSpeedMax, day.windGustsMax, day.windDirection, t)}
      </p>
      <p className="truncate text-xs tabular-nums text-muted-foreground">
        {formatHumidity(day.humidityMean, t)}
      </p>
      <div className="min-w-0 text-xs tabular-nums text-muted-foreground">
        <UvIndexLine t={t} value={day.uvIndex} />
      </div>
    </li>
  );
}
