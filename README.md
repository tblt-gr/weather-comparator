<h2 align="center"><b>Weather Compare</b></h2>
<h4 align="center">Historical weather comparison dashboard - city search, multi-year charts, climate normals, and exports.</h4>

<p align="center">
<a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16"></a>
<a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111111" alt="React 19"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5"></a>
<a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"></a>
<a href="https://open-meteo.com/"><img src="https://img.shields.io/badge/Open--Meteo-API-2563EB?logoColor=white" alt="Open-Meteo API"></a>
</p>

<hr>
<p align="center">
<a href="#features">Features</a> &bull;
<a href="#stack">Stack</a> &bull;
<a href="#quick-start">Quick Start</a> &bull;
<a href="#configuration">Configuration</a> &bull;
<a href="#project-structure">Project Structure</a>
</p>
<hr>

One-page weather analytics app for comparing daily temperatures across years. Search for a city, choose a month and reference year, overlay previous years, inspect heatwave periods, compare values against 1991-2020 climate normals, then export the chart or source data.

## Features

- **City search** - autocomplete powered by the Open-Meteo Geocoding API
- **Multi-year comparison** - reference year plus selectable historical years
- **Temperature modes** - switch between daily maximum and minimum temperatures
- **Interactive chart** - Recharts line chart with year visibility toggles
- **Climate normals** - optional 1991-2020 seasonal baseline overlay
- **Heatwave detection** - automatic highlight of hot periods in visible datasets
- **Climate summary** - monthly averages, anomalies, hot days, and tropical nights
- **Exports** - PNG chart export and CSV data export
- **Persistent city** - selected city stored locally for the next visit
- **Responsive UI** - desktop and mobile layout with light/dark theme support

## Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 16 (App Router)                         |
| Language   | TypeScript 5                                    |
| UI         | React 19, Tailwind CSS 4, shadcn/ui, Radix UI   |
| Charts     | Recharts 3                                      |
| Data       | TanStack Query 5, Open-Meteo APIs               |
| State      | Zustand 5, localStorage persistence             |
| Export     | html-to-image, PapaParse                        |
| Tooling    | pnpm, ESLint 9, Prettier 3                      |

## Quick Start

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:3000`.

## Configuration

No API key is required. Weather Compare uses public Open-Meteo endpoints:

| API | Purpose |
| --- | ------- |
| `https://geocoding-api.open-meteo.com/v1/search` | City autocomplete |
| `https://archive-api.open-meteo.com/v1/archive` | Historical daily temperatures |
| Historical archive data for 1991-2020 | Computed seasonal normals |

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and theme tokens
│   ├── layout.tsx           # Root app layout
│   └── page.tsx             # Dashboard entry point
├── components/
│   ├── chart/               # Weather chart, legend, heatwave overlay
│   ├── ui/                  # shadcn/ui primitives
│   └── weather/             # Dashboard filters, toggles, summary, exports
├── hooks/
│   ├── useClimateNormals.ts # Climate baseline query
│   └── useWeatherData.ts    # Historical weather query
├── lib/
│   ├── api/openMeteo.ts     # Open-Meteo clients and date helpers
│   ├── utils.ts             # Shared UI utilities
│   └── weather/             # Normalization, heatwaves, CSV export
├── store/
│   └── weather-store.ts     # Dashboard state and city persistence
└── types/
    └── weather.ts           # Weather and city types
```

## Scripts

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Start the development server   |
| `pnpm build`        | Build for production           |
| `pnpm start`        | Serve the production build     |
| `pnpm lint`         | Run ESLint                     |
| `pnpm typecheck`    | Type-check with TypeScript     |

## Data Sources

- [Open-Meteo](https://open-meteo.com/)
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)

## License

MIT
