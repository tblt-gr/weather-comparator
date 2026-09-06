"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { OpenMeteoArchiveResponse } from "@/features/weather/api/openMeteo";
import { addForecastDays, buildForecastOutlook } from "@/features/weather/logic/forecastOutlook";
import type { DatePeriod } from "@/features/weather/logic/dates";
import { formatLocalDate } from "@/features/weather/logic/dates";
import type { ForecastHorizonDays } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

import { ForecastDayCell } from "./ForecastDayCell";
import { ForecastHorizonToggle } from "./ForecastHorizonToggle";
import { UvScaleInfo } from "./UvScaleInfo";

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
  const scrollRef = useRef<HTMLOListElement | null>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setFade({
        start: el.scrollLeft > 1,
        end: el.scrollLeft < maxScroll - 1,
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [days.length, showForecast]);

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
          <ForecastHorizonToggle horizonDays={horizonDays} onHorizonChange={setHorizonDays} t={t} />
        ) : null}
      </div>

      <ol
        className="summary-scroll relative flex w-full min-w-0 overflow-x-auto overscroll-x-contain [contain:paint]"
        data-fade-end={fade.end ? "true" : undefined}
        data-fade-start={fade.start ? "true" : undefined}
        ref={scrollRef}
      >
        {days.map((day) => (
          <ForecastDayCell day={day} key={day.date} locale={locale} t={t} today={today} />
        ))}
      </ol>
    </section>
  );
}
