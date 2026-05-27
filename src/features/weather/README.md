# Weather Feature

This folder contains the full weather comparison feature used by the Next.js app.

## Structure

- `api/`: external data access for weather and geocoding providers
- `logic/`: pure business logic and serialization helpers, framework-agnostic when possible
- `components/`: feature-specific UI split by concern (`chart`, `controls`, `dashboard`, `summary`)
- `hooks/`: React hooks that orchestrate queries, URL sync, and browser-side behavior
- `store/`: Zustand UI state only
- `types/`: shared weather domain types

## Boundaries

- `src/app/` should only compose the feature and Next.js route shell
- `src/components/ui/` contains reusable design-system primitives
- `src/lib/` is reserved for truly app-wide utilities such as i18n
- `logic/` must not import feature UI components
- `store/` must not duplicate server data already handled by TanStack Query

## Conventions

- Keep tests next to the file they validate
- Put new weather-specific code inside this feature unless it is reused outside weather
- Prefer adding to `logic/` for business rules and data transforms instead of embedding logic in components
