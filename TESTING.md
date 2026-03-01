# Testing Guide

## Local Commands

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:coverage:gate`
- `pnpm test:regression`

## Regression Packs

- Table: `pnpm test:regression:table`
- Collaboration: `pnpm test:regression:collab`
- Math: `pnpm test:regression:math`

Regression packs run conditionally in CI based on changed files.

## E2E Smoke

- Install browser runtime: `pnpm test:e2e:install`
- Run smoke tests: `pnpm test:e2e`
- Config: `playwright.config.ts`
- Specs: `e2e/smoke.spec.ts`

If your environment blocks npm registry/network access, Playwright installation and execution can fail locally. CI runs E2E on `main` pushes or PRs labeled `e2e-required`.

## CI Gates

Primary workflow: `.github/workflows/test.yaml`

1. `typecheck`
2. `lint`
3. `test` (unit/integration)
4. `test:coverage:gate` (thresholds: line/function/statement 55, branch 45)
5. `build`
6. conditional regression packs
7. conditional E2E smoke (`main` push or `e2e-required` label)
