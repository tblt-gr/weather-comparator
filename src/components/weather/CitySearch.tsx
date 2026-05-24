"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchCities } from "@/lib/api/openMeteo"
import type { City } from "@/types/weather"

type CitySearchProps = {
  city: City | null
  onCityChange: (city: City) => void
}

export function CitySearch({ city, onCityChange }: CitySearchProps) {
  const [query, setQuery] = useState(city?.name ?? "")
  const [results, setResults] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      if (query.trim().length < 2 || query === city?.name) {
        setResults([])
        return
      }

      setIsLoading(true)

      try {
        const cities = await searchCities(query)

        if (!controller.signal.aborted) {
          setResults(cities)
          setIsOpen(true)
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [city?.name, query])

  return (
    <div className="relative grid gap-1 text-sm font-medium">
      <span>Ville</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
        <Input
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-label="Rechercher une ville"
          className="pl-8"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(results.length > 0)}
          placeholder="Paris, Lyon..."
          value={query}
        />
      </div>
      {isOpen ? (
        <div className="absolute top-full z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-white p-1 shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-stone-500">Recherche...</div>
          ) : null}
          {!isLoading && results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-stone-500">
              Aucune ville trouvee.
            </div>
          ) : null}
          {results.map((result) => (
            <Button
              className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left"
              key={result.id}
              onClick={() => {
                onCityChange(result)
                setQuery(result.name)
                setIsOpen(false)
              }}
              type="button"
              variant="ghost"
            >
              <span>
                {result.name}, {result.country}
                {result.admin1 ? (
                  <span className="text-stone-500"> - {result.admin1}</span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
