# Regression Pack Map

This file maps changed areas to targeted regression packs used in CI.

## Pack -> Test Name Prefix

1. Table pack: `REG-TABLE-`
2. Collaboration pack: `REG-COLLAB-`
3. Math pack: `REG-MATH-`

## Pack -> CI Script

1. `REG-TABLE-` -> `pnpm test:regression:table`
2. `REG-COLLAB-` -> `pnpm test:regression:collab`
3. `REG-MATH-` -> `pnpm test:regression:math`

## Pack -> Key Changed Paths (paths-filter)

### Table

- `apps/web/components/tailwind/extensions.ts`
- `apps/web/components/tailwind/selectors/table-selector.tsx`
- `apps/web/components/tailwind/advanced-editor.tsx`
- `apps/web/styles/prosemirror.css`
- `packages/headless/src/extensions/table.ts`
- `packages/headless/src/extensions/table-drag-guard.ts`
- `packages/headless/src/extensions/index.ts`
- `packages/headless/src/components/editor-bubble.tsx`

### Collaboration

- `apps/web/lib/collab/**`
- `apps/web/components/tailwind/advanced-editor.tsx`
- `apps/web/app/page.tsx`
- `apps/web/hooks/use-local-storage.ts`

### Math

- `packages/headless/src/extensions/mathematics.ts`
- `apps/web/components/tailwind/selectors/math-selector.tsx`
- `apps/web/lib/content.ts`

