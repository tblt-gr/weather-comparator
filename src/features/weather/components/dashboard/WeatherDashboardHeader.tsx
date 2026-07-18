"use client";

import { Menu, Thermometer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/features/weather/components/controls";
import { ThemeToggle } from "@/features/weather/components/controls";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { City } from "@/features/weather/types";

type WeatherDashboardHeaderProps = {
  city: City | null;
  filtersOpen: boolean;
  onToggleFilters: () => void;
};

export function WeatherDashboardHeader({ city, filtersOpen, onToggleFilters }: WeatherDashboardHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="glass-panel rise-in overflow-hidden rounded-2xl">
      <div className="glow-strip h-0.5" />
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_18px_-2px] shadow-primary/30 transition-shadow duration-300 hover:shadow-primary/50">
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
        <div className="flex items-center gap-2 justify-between lg:justify-end">
          <Button
            aria-controls="dashboard-filters"
            aria-expanded={filtersOpen}
            aria-label={t["app.filtersToggleAriaLabel"]}
            className="h-11 w-11 lg:hidden"
            onClick={onToggleFilters}
            size="icon"
            type="button"
            variant="outline"
          >
            {filtersOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
