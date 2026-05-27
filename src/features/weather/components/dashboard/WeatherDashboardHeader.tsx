"use client";

import { Thermometer } from "lucide-react";

import { LanguageSwitcher } from "@/features/weather/components/controls";
import { ThemeToggle } from "@/features/weather/components/controls";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { City } from "@/features/weather/types";

type WeatherDashboardHeaderProps = {
  city: City | null;
};

export function WeatherDashboardHeader({ city }: WeatherDashboardHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="glass-panel overflow-hidden rounded-2xl">
      <div className="h-[3px] bg-gradient-to-r from-primary/40 via-primary to-primary/20" />
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Thermometer className="size-5" />
          </div>
          <div>
            <h1 className="text-lg leading-tight font-semibold tracking-tight">{t["app.title"]}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground" suppressHydrationWarning>
              {t["app.subtitle"]}
              {city ? (
                <span className="font-medium text-foreground">
                  {" · "}
                  {city.name}, {city.country}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
