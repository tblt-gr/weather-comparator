"use client";

import { useMemo, useState } from "react";
import { InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
import {
  addForecastDays,
  buildForecastOutlook,
  formatWindCardinal,
  getUvRiskLevel,
  UV_RISK_BANDS,
  UV_RISK_COLORS,
} from "@/features/weather/logic/forecastOutlook";
import type { DatePeriod } from "@/features/weather/logic/dates";
import { formatLocalDate } from "@/features/weather/logic/dates";
import type {
  ForecastHorizonDays,
  ForecastOutlookDay,
  UvRiskLevel,
} from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale, Translations } from "@/lib/i18n/types";
import { useHydrated } from "@/lib/useHydrated";

import { WeatherConditionIcon } from "./WeatherConditionIcon";

type ForecastOutlookProps = {
  period: DatePeriod;
  response?: OpenMeteoArchiveResponse;
  showForecast: boolean;
};

export function ForecastOutlook({ period, response, showForecast }: ForecastOutlookProps) {
  const { locale, t } = useLocale();
  const [horizonDays, setHorizonDays] = useState<ForecastHorizonDays>(7);
  const today = formatLocalDate(new Date());

  const days15 = useMemo(
    () => buildForecastOutlook({ response, period, today, horizonDays: 15 }),
    [period, response, today]
  );
  const days7 = days15.filter((day) => day.date <= addForecastDays(today, 6));
  const days = horizonDays === 15 ? days15 : days7;
  const showHorizonToggle = days15.length > days7.length;

  if (!showForecast || days.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t["forecast.outlookAriaLabel"]}
      className="max-w-full min-w-0 rounded-lg border border-border/60 bg-card px-3 py-4 sm:px-5 sm:py-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <h2 className="text-sm font-semibold tracking-tight">{t["forecast.outlookTitle"]}</h2>
          <UvScaleInfo t={t} />
        </div>
        {showHorizonToggle ? (
          <div
            aria-label={t["forecast.horizonAriaLabel"]}
            className="weather-touch-control grid h-9 grid-cols-2 overflow-hidden rounded-md bg-muted/70 p-0.5"
            role="group"
          >
            <HorizonButton
              active={horizonDays === 7}
              label={t["forecast.horizon7"]}
              onSelect={() => setHorizonDays(7)}
            />
            <HorizonButton
              active={horizonDays === 15}
              label={t["forecast.horizon15"]}
              onSelect={() => setHorizonDays(15)}
            />
          </div>
        ) : null}
      </div>

      <ol className="summary-scroll grid min-w-0 grid-flow-col overflow-x-auto [grid-auto-columns:calc(100%/7)]">
        {days.map((day) => (
          <ForecastDayCell day={day} key={day.date} locale={locale} t={t} today={today} />
        ))}
      </ol>
    </section>
  );
}

function HorizonButton({
  active,
  label,
  onSelect,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      className="h-full min-w-14 rounded-sm border-0 px-2.5"
      onClick={onSelect}
      size="sm"
      type="button"
      variant={active ? "default" : "ghost"}
    >
      {label}
    </Button>
  );
}

function ForecastDayCell({
  day,
  locale,
  t,
  today,
}: {
  day: ForecastOutlookDay;
  locale: Locale;
  t: Translations;
  today: string;
}) {
  const conditionLabel = t[`weather.${day.condition.kind}`];
  const isToday = day.date === today;
  const dayLabel = formatOutlookDayLabel(day.date, today, locale, t);

  return (
    <li
      className={`flex min-w-0 flex-col gap-1.5 border-r border-border/50 px-2 py-1 last:border-r-0 ${
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

function formatOutlookDayLabel(date: string, today: string, locale: Locale, t: Translations) {
  if (date === today) {
    return t["forecast.today"];
  }

  if (date === addForecastDays(today, 1)) {
    return t["forecast.tomorrow"];
  }

  return WEEKDAY_FORMATTERS[locale].format(new Date(`${date}T12:00:00.000Z`));
}

function formatOutlookDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

function formatCompactTemp(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}°`;
}

function formatPrecipitation(
  sum: number | null,
  probability: number | null,
  t: Translations
) {
  const amount = sum === null ? "—" : `${trimNumber(sum)} mm`;

  if (probability === null) {
    return amount;
  }

  return `${amount} · ${t["forecast.precipChance"].replace("{percent}", String(Math.round(probability)))}`;
}

function formatWind(
  speed: number | null,
  gusts: number | null,
  direction: number | null,
  t: Translations
) {
  if (speed === null) {
    return t["forecast.wind"];
  }

  const cardinal = formatWindCardinal(direction);
  const gustLabel = gusts === null ? "" : ` (${Math.round(gusts)})`;

  return `${cardinal ? `${cardinal} ` : ""}${Math.round(speed)}${gustLabel} km/h`;
}

function formatHumidity(value: number | null, t: Translations) {
  if (value === null) {
    return t["forecast.humidity"];
  }

  return `${t["forecast.humidity"]} ${Math.round(value)} %`;
}

const WEEKDAY_FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  fr: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "short" }),
  en: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short" }),
};

const UV_LEVEL_KEYS: Record<UvRiskLevel, keyof Translations> = {
  low: "forecast.uv.low",
  moderate: "forecast.uv.moderate",
  high: "forecast.uv.high",
  very_high: "forecast.uv.veryHigh",
  extreme: "forecast.uv.extreme",
};

function UvScaleInfo({ t }: { t: Translations }) {
  const mounted = useHydrated();
  const infoButton = (
    <button
      aria-label={t["forecast.uv.scaleAriaLabel"]}
      className="-mx-1 flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
      type="button"
    >
      <InfoIcon className="size-4" />
    </button>
  );

  if (!mounted) {
    return infoButton;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{infoButton}</PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <PopoverTitle>{t["forecast.uv.scaleTitle"]}</PopoverTitle>
        <ul className="mt-2 space-y-1.5">
          {UV_RISK_BANDS.map((band) => (
            <li className="flex items-center gap-2 text-xs text-muted-foreground" key={band.level}>
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
                style={{ backgroundColor: UV_RISK_COLORS[band.level] }}
              />
              <span className="w-10 tabular-nums">{band.range}</span>
              <span>{t[UV_LEVEL_KEYS[band.level]]}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function UvIndexLine({ t, value }: { t: Translations; value: number | null }) {
  const level = getUvRiskLevel(value);
  const label = value === null ? t["forecast.uv"] : `${t["forecast.uv"]} ${trimNumber(value)}`;
  const riskLabel = level === null ? null : t[UV_LEVEL_KEYS[level]];

  return (
    <span className="flex min-w-0 items-center gap-1">
      {level ? (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full ring-1 ring-foreground/20"
          style={{ backgroundColor: UV_RISK_COLORS[level] }}
        />
      ) : null}
      <span className="min-w-0 truncate" title={riskLabel ?? undefined}>
        {label}
      </span>
      {riskLabel ? <span className="sr-only">{riskLabel}</span> : null}
    </span>
  );
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
