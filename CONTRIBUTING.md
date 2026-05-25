# Contributing

## Branches

- Always branch from `dev`, never from `main`
- Naming: `feat/short-description` or `fix/short-description`

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add weather forecast
fix: handle empty weather response
perf: cache city search results
ci: add lint step
chore: update dependencies
test: add weather service specs
docs: update README
```

All commit messages in English.

## Pull Requests

- Target branch: `dev` (never `main`)
- Title follows conventional commit format
- Link the related issue in the PR description

### Merging

PRs are merged with **squash merge** only:

```bash
gh pr merge <number> --squash --delete-branch
```

## Code style

- TypeScript strict mode is enabled; avoid `any` and prefer explicit domain types from
  `src/types` or the local module.
- Prettier is the source of truth: semicolons, double quotes, trailing commas where valid in
  ES5, 2-space indentation, LF line endings, and print width 100.
- Tailwind classes are formatted by `prettier-plugin-tailwindcss`; do not manually reorder them
  after formatting.
- React components are function components. Component files use PascalCase
  (`WeatherDashboard.tsx`, `CitySearch.tsx`) and export named components.
- Hooks use the `useXxx.ts` naming pattern (`useWeatherData.ts`, `useClimateNormals.ts`).
- Shared UI primitives in `src/components/ui` follow the shadcn-style lowercase file naming
  (`button.tsx`, `dropdown-menu.tsx`).
- Non-component domain modules use camelCase or established local names
  (`dateRange.ts`, `openMeteo.ts`, `weather-store.ts`). Match the surrounding folder convention
  instead of introducing a new one.
- Use the `@/` path alias for imports from `src`.
- Classes and React components: PascalCase. Functions, variables, hooks, stores, and props:
  camelCase.
- Tests live next to the code they cover with `.test.ts` or `.test.tsx`.
- Keep comments rare and focused on non-obvious reasoning, not on what the code already says.

## Accessibility

All frontend components must:

- Use semantic HTML (`<button>`, `<dialog>`, `<nav>`, etc.) — no clickable `<div>`
- Include ARIA attributes (`aria-label`, `aria-modal`, `aria-labelledby`) on interactive elements and modals
- Support keyboard navigation (Escape closes modals, Tab moves focus)
- Trap focus inside open modals and restore it on close
- Maintain a minimum contrast ratio of 4.5:1 for text

## Issues

When writing GitHub issues:

- Describe the expected behavior and acceptance criteria
- Do not list specific files — the codebase evolves and file lists go stale fast
- Write in English
