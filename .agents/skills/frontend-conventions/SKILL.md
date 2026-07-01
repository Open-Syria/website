---
name: frontend-conventions
description: Follow the Open Syria website's domain-driven Next.js frontend conventions. Use when adding, moving, or refactoring App Router pages, layouts, metadata, page-local components, page-local utilities, localized pages under src/app/[locale], route groups such as (index), code splitting, or imports that decide whether code belongs in a route folder, _components, _utils, src/components, or src/lib.
---

# Frontend Conventions

Use this skill first for frontend structure work in the Open Syria website. Pair it with `next-best-practices` for App Router APIs, `seo` for metadata and structured data, `frontend-design` for visual direction, `tailwind-css-patterns` for styling, and `shadcn` for shared UI primitives only when the task genuinely touches those areas.

## Route Ownership

- Treat each page route as a domain boundary.
- Keep route code under `src/app`, with localized public pages under `src/app/[locale]`.
- Use route groups, such as `src/app/[locale]/(index)`, to name page domains without changing the URL.
- Every meaningful page folder should own its private `_components` and `_utils` folders when it has page-specific UI or logic.
- Keep `page.tsx` thin. It should parse route inputs, export metadata, and compose page-owned components.
- For nested pages, colocate code at the lowest shared owner. Code used by only one page stays in that page folder.

## Local vs Global

- Put page-specific components in the nearest route-owned `_components` folder.
- Put page-specific helpers, constants, schemas, metadata, search-param parsing, and small data builders in the nearest route-owned `_utils` folder.
- Put reusable components used across unrelated domains in `src/components`.
- Put shared primitive UI in `src/components/ui`; do not place page-specific wrappers there.
- Put reusable utilities, config, formatters, locale helpers, and infrastructure in `src/lib`.
- Do not import from another route's private `_components` or `_utils`. Promote genuinely shared code upward first.
- Start local, then promote only after real reuse exists.

## Page Files

- Prefer names like `_components/home-page.tsx`, `_components/hero-section.tsx`, `_utils/metadata.ts`, `_utils/helpers.ts`, and `_utils/navigation.ts`.
- Use `_utils/metadata.ts` for page-specific `metadata` or `generateMetadata`, then re-export it from `page.tsx`:

```ts
export { generateMetadata } from "./_utils/metadata";
```

or:

```ts
export { metadata } from "./_utils/metadata";
```

- Use `_utils/helpers.ts` for helpers that belong only to this page/domain.
- Keep server-only helpers out of client components.
- Keep user-facing copy localized through `next-intl`; do not hard-code repeated translated copy in reusable components.

## Code Splitting

- Let route folders be the primary code-splitting boundary.
- Keep `"use client"` at the smallest leaf component that needs browser state, effects, event handlers, or client hooks.
- Do not make `page.tsx` a client component unless the entire route must be client-rendered.
- Use dynamic imports for heavy or rarely used browser-only UI, such as maps, charts, editors, media-heavy widgets, or complex modals.
- Keep shared components lightweight and avoid importing page-only data, copy, or assets into global modules.

## Refactor Checklist

1. Inspect the nearest similar page before creating new structure.
2. Create or reuse the page folder's `_components` and `_utils`.
3. Move page-only UI and helpers out of `page.tsx`.
4. Keep route-local imports relative.
5. Promote only truly shared code to `src/components` or `src/lib`.
6. Run `pnpm typecheck` or `pnpm verify` when the change touches routing, metadata, or shared component boundaries.
