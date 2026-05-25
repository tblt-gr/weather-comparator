# CLAUDE.md

## Project

Next.js 16 SPA, App Router. Package manager: `pnpm`.

Main route: `src/app/page.tsx` renders `WeatherDashboard`.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Dev: `localhost:3000`.

Targeted tests:

```bash
node --import tsx --test src/lib/weather/dateRange.test.ts
node --import tsx --test src/lib/weather/*.test.ts
```

Pre-PR:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Workflow

For non-trivial changes:

1. Inspect relevant files.
2. Propose a short plan.
3. Make the smallest safe change.
4. Run relevant validation.
5. Summarize changed files and results.

Do not change package manager, introduce `any`, add deps without checking existing alternatives, move files unless required, bypass failing checks, or modify generated files.

## Architecture

### Store

`src/store/weather-store.ts`

Zustand stores UI state only:

- selected city
- date period
- comparison year offsets
- temperature mode
- hidden series
- climate normals toggle

City persistence uses `loadPersistedCity` and `persistCity`.

Do not duplicate server data in Zustand.

### Data fetching

Use TanStack Query hooks for all server data.

- `useWeatherData`: one query per offset, `0` = reference year, `N` = N years back, returns `WeatherYearDataset[]`
- `useClimateNormals`: fetches 1991–2020 in parallel, aggregates with `calculateClimateNormals`

Query keys must include city, period, and comparison offsets when relevant.

### API

API calls stay in `src/lib/api/`.

`src/lib/api/openMeteo.ts` exports:

- `searchCities`
- `fetchHistoricalWeather`

Uses Open-Meteo Geocoding and Historical Archive APIs. No API key.

### Weather logic

Business logic stays in `src/lib/weather/`.

- `dateRange.ts`: date arithmetic, `getComparableDateRangeByOffset`, returns `null` before 1940 or in future
- `normalizeWeatherData.ts`: maps API response to `WeatherYearDataset`
- `detectHeatwaves.ts`: detects `vague_de_chaleur` and `canicule`
- `calculateClimateNormals.ts`: averages `tmax` / `tmin` per day across 1991–2020
- `periodValidation.ts`: validates `DatePeriod`
- `exportCsv.ts`: PapaParse CSV export

No business logic in components.

## Components

- Weather UI: `src/components/weather/`
- Charts: `src/components/chart/WeatherChart`, `src/components/chart/HeatwaveOverlay`
- UI primitives: `src/components/ui/`
- shadcn primitives use lowercase filenames

Rules:

- PascalCase files for app components
- named exports
- function components only
- hooks named `useXxx.ts`
- non-components use camelCase or folder convention
- keep components focused and composable
- use existing shadcn primitives when possible

## Types

Main types: `src/types/weather.ts`.

Use shared types from `src/types/`.

Key types:

- `City`
- `WeatherYearDataset`
- `DailyTemperature`
- `HeatwavePeriod`

`HeatwavePeriod.kind` is `vague_de_chaleur` or `canicule`.

## Code conventions

TypeScript strict mode.

Rules:

- no `any`
- use `@/` alias for `src/`
- double quotes
- semicolons
- trailing commas ES5
- print width 100
- do not manually reorder Tailwind classes

Run formatting/linting with:

```bash
pnpm lint
```

## Tests

Test files use `.test.ts` or `.test.tsx` and live next to the file under test.

Runner:

```bash
node --import tsx --test
```

## Git

Branch from `dev`, never `main`.

Branch names:

- `feat/...`
- `fix/...`

PRs target `dev`. Squash only.

Use Conventional Commits in English:

- `feat:`
- `fix:`
- `perf:`
- `ci:`
- `chore:`
- `test:`
- `docs:`

## Accessibility

Interactive components need semantic HTML, keyboard navigation, correct focus handling, Escape to close modals, focus trap in modals, ARIA when needed, and at least 4.5:1 contrast.
