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
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(city?.name ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [recentCities, setRecentCities] = useState<City[]>(loadCityHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
        return;
      }

      setIsLoading(true);

      try {
        const cities = await searchCities(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(cities);
          setIsOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
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
  }, [city?.name, query]);

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
        shouldFilter={false}
        className="relative h-9 min-w-0 overflow-visible rounded-md! border border-input bg-background p-0 shadow-none [&_[data-slot=input-group]]:h-full! [&_[data-slot=input-group]]:rounded-md! [&_[data-slot=input-group]]:border-0! [&_[data-slot=input-group]]:bg-transparent!"
      >
        <CommandInput
          aria-label={t["city.searchAriaLabel"]}
          className={query ? "pr-10" : undefined}
          data-city-search-input
          onFocus={() =>
            setIsOpen(
              query.trim().length === 0 ? recentCities.length > 0 : results.length > 0 || isLoading
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          onValueChange={(value) => {
            setQuery(value);

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
            className="absolute top-1/2 right-1 z-10 -translate-y-1/2"
            disableActiveTranslation
            onClick={(event) => {
              event.stopPropagation();
              setQuery("");
              setResults([]);
              setIsLoading(false);
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
              {!isLoading && query.trim().length > 0 ? (
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
        ) : null}
      </Command>
    </div>
  );
}
