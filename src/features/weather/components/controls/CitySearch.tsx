"use client";

import { useEffect, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchCities } from "@/features/weather/api";
import type { City } from "@/features/weather/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type CitySearchProps = {
  city: City | null;
  onCityChange: (city: City) => void;
};

export function CitySearch({ city, onCityChange }: CitySearchProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(city?.name ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      if (query.trim().length < 2 || query === city?.name) {
        setResults([]);
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
    <div className="relative grid gap-1 text-sm font-medium" ref={containerRef}>
      <span>Ville</span>
      <Command
        shouldFilter={false}
        className="relative h-8 overflow-visible rounded-lg! border border-input bg-transparent p-0 shadow-none"
      >
        <CommandInput
          aria-label={t["city.searchAriaLabel"]}
          onFocus={() => setIsOpen(results.length > 0 || isLoading)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          onValueChange={setQuery}
          placeholder={t["city.placeholder"]}
          value={query}
        />
        {isOpen ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border/60 bg-popover shadow-md">
            <CommandList>
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">{t["city.searching"]}</div>
              ) : null}
              {!isLoading ? <CommandEmpty>Aucune ville trouvée.</CommandEmpty> : null}
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => {
                    onCityChange(result);
                    setQuery(result.name);
                    setResults([]);
                    setIsOpen(false);
                  }}
                  value={`${result.id}-${result.name}`}
                >
                  <span>
                    {result.name}, {result.country}
                    {result.admin1 ? (
                      <span className="text-muted-foreground"> - {result.admin1}</span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </div>
        ) : null}
      </Command>
    </div>
  );
}
