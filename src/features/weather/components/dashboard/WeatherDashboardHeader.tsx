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

export function WeatherDashboardHeader({
  city,
  filtersOpen,
  onToggleFilters,
}: WeatherDashboardHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="flex items-center justify-between border-b border-border/60 pb-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Thermometer className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline gap-2.5">
            <h1 className="shrink-0 text-base leading-tight font-semibold tracking-tight">
              {t["app.title"]}
            </h1>
            {city ? (
              <span
                className="hidden truncate text-sm text-muted-foreground sm:inline"
                suppressHydrationWarning
              >
                {city.name}, {city.country}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
            {t["app.subtitle"]}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          aria-controls="dashboard-filters"
          aria-expanded={filtersOpen}
          aria-label={t["app.filtersToggleAriaLabel"]}
          className="size-8 lg:hidden"
          onClick={onToggleFilters}
          size="icon"
          type="button"
          variant="ghost"
        >
          {filtersOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
