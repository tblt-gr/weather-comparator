# Weather Feature

This folder contains the full weather comparison feature used by the Next.js app.

## Structure

- `api/`: weather, forecast, climate-normal, and geocoding data access
- `logic/`: pure business logic for dates, normalization, forecast merging, extremes, and exports
- `components/`: feature UI split by concern (`chart`, `controls`, `dashboard`, `summary`, `export`, `extremes`)
- `hooks/`: React hooks for data queries, URL synchronization, and browser-side behavior
- `store/`: Zustand state for UI preferences and local persistence only
- `types/`: shared weather domain types

## Boundaries

- `src/app/` should only compose the feature and the Next.js route shell
- `src/components/ui/` contains reusable design-system primitives
- `src/lib/` is reserved for app-wide utilities such as i18n and theme
- `logic/` must stay framework-agnostic when possible and must not import feature UI components
- `store/` must not duplicate server data already handled by TanStack Query

## Conventions

- Keep tests next to the files they validate
- Put weather-specific code in this feature unless it is reused outside weather
- Prefer `logic/` for business rules and transforms instead of embedding them in components
- Prefer `hooks/` for orchestration between UI state, URL state, and TanStack Query
