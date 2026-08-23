"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchCities } from "@/features/weather/api";
import {
  addCityToHistory,
  loadCityHistory,
  removeCityFromHistory,
} from "@/features/weather/logic/cityHistory";
import type { City } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type CitySearchProps = {
  city: City | null;
  onCityChange: (city: City | null) => void;
};

export function CitySearch({ city, onCityChange }: CitySearchProps) {
  const { locale, t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(city?.name ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [recentCities, setRecentCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searchAttempt, setSearchAttempt] = useState(0);

  useEffect(() => {
    if (city) {
      addCityToHistory(city);
    }
  }, [city]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (query.trim().length < 2 || query === city?.name) {
        setResults([]);
        setIsLoading(false);
        setSearchFailed(false);
        return;
      }

      setIsLoading(true);
      setSearchFailed(false);

      try {
        const cities = await searchCities(query, { locale, signal: controller.signal });
        if (!controller.signal.aborted) {
          setResults(cities);
          setIsOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearchFailed(true);
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [city?.name, locale, query, searchAttempt]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="relative grid min-w-0 gap-1 text-sm font-medium" ref={containerRef}>
      <span className="text-xs font-medium text-muted-foreground">{t["city.label"]}</span>
      <Command
        label={t["city.searchAriaLabel"]}
        shouldFilter={false}
        className="city-search-control weather-touch-control relative h-9 min-w-0 flex-row overflow-visible rounded-md! border border-input bg-transparent p-0 shadow-none dark:bg-input/30 [&_[data-slot=command-input-wrapper]]:min-w-0 [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=input-group]]:h-full! [&_[data-slot=input-group]]:rounded-md! [&_[data-slot=input-group]]:border-0! [&_[data-slot=input-group]]:bg-transparent!"
      >
        <CommandInput
          data-city-search-input
          onFocus={() => {
            if (query.trim().length === 0) {
              const nextRecentCities = loadCityHistory();
              setRecentCities(nextRecentCities);
              setIsOpen(nextRecentCities.length > 0);
              return;
            }

            setIsOpen(results.length > 0 || isLoading || searchFailed);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          onValueChange={(value) => {
            setQuery(value);
            setSearchFailed(false);

            if (value.trim().length === 0) {
              setIsOpen(recentCities.length > 0);
            }
          }}
          placeholder={t["city.placeholder"]}
          value={query}
        />
        {query ? (
          <Button
            aria-label={t["city.clearAriaLabel"]}
            className="city-search-clear z-10"
            disableActiveTranslation
            onClick={(event) => {
              event.stopPropagation();
              setQuery("");
              setResults([]);
              setIsLoading(false);
              setSearchFailed(false);
              setIsOpen(false);
              onCityChange(null);
              window.requestAnimationFrame(() => {
                document.querySelector<HTMLInputElement>("[data-city-search-input]")?.focus();
              });
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        ) : null}
        {isOpen ? (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-border/60 bg-popover shadow-lg shadow-black/10">
            <CommandList>
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">{t["city.searching"]}</div>
              ) : null}
              {!isLoading && searchFailed ? (
                <div className="grid gap-2 px-3 py-3" role="alert">
                  <p className="text-sm text-destructive">{t["city.searchError"]}</p>
                  <Button
                    className="w-fit"
                    onClick={() => {
                      setSearchFailed(false);
                      setIsLoading(true);
                      setSearchAttempt((attempt) => attempt + 1);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t["city.retry"]}
                  </Button>
                </div>
              ) : null}
              {!isLoading && !searchFailed && query.trim().length > 0 ? (
                <CommandEmpty>{t["city.noResults"]}</CommandEmpty>
              ) : null}
              <CommandGroup heading={query.trim().length === 0 ? t["city.recent"] : undefined}>
                {(query.trim().length === 0 ? recentCities : results).map((result) => (
                  <CommandItem
                    className="justify-between [&>svg:last-child]:hidden"
                    key={result.id}
                    onSelect={() => {
                      setRecentCities(addCityToHistory(result));
                      onCityChange(result);
                      setQuery(result.name);
                      setResults([]);
                      setIsOpen(false);
                    }}
                    value={`${result.id}-${result.name}`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {result.name}, {result.country}
                      {result.admin1 ? (
                        <span className="text-muted-foreground"> - {result.admin1}</span>
                      ) : null}
                    </span>
                    {query.trim().length === 0 ? (
                      <Button
                        aria-label={t["city.removeRecentAriaLabel"].replace("{city}", result.name)}
                        className="ml-auto"
                        disableActiveTranslation
                        onClick={(event) => {
                          event.stopPropagation();
                          const nextRecentCities = removeCityFromHistory(result.id);
                          setRecentCities(nextRecentCities);
                          setIsOpen(nextRecentCities.length > 0);
                        }}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-4" />
                      </Button>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        ) : (
          <CommandList aria-hidden className="hidden" />
        )}
      </Command>
    </div>
  );
}
