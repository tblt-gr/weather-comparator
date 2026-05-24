# Weather Compare

A modern weather visualization app built with Next.js to compare historical temperatures across multiple years.

The application allows users to explore daily weather trends for any city using interactive charts and climate indicators.

## Features

- City search with autocomplete
- Multi-year comparison (current year + previous years)
- Display:
  - maximum temperatures
  - minimum temperatures
- Interactive multi-line charts
- 30-year climate normals
- Heatwave detection
- Climate summary:
  - monthly averages
  - anomaly vs seasonal normals
  - days above 30°C
  - tropical nights
- PNG chart export
- CSV data export
- Responsive mobile & desktop UI

## Tech Stack

### Frontend
- Next.js 15
- React
- TypeScript
- TailwindCSS
- shadcn/ui

### Data & State
- TanStack Query
- Zustand

### Charts
- Recharts

### Weather APIs
- Open-Meteo Historical API
- Open-Meteo Climate API
- Open-Meteo Geocoding API

## Example Use Case

Compare June maximum temperatures between:
- 2025
- 2024
- 2023
- 2022

Visualize:
- heatwaves,
- climate anomalies,
- seasonal deviations,
- long-term trends.

## Roadmap

- Precipitation support
- Humidity / heat index
- Frost / cold wave detection
- Advanced climate analytics
- PDF export
- Shareable charts
- PWA / offline support

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Weather Data Sources

- https://open-meteo.com/
- https://open-meteo.com/en/docs/historical-weather-api
- https://open-meteo.com/en/docs/climate-api

## License

MIT
