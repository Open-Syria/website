# Agent Notes

This repository uses current Next.js APIs that may differ from older training data.

Before changing framework behavior, routing, metadata, caching, or deployment code, prefer the checked-in patterns in this repository and read the relevant local Next.js docs in `node_modules/next/dist/docs/` when available.

Keep source code under `src`. Keep localization wired through `next-intl`. Keep direction handling in both `<html dir>` and the Base UI `DirectionProvider`.

The App Router structure is domain-driven: each page or domain owns its route folder, page-local components live in that folder's `_components`, and page-local utilities live in that folder's `_utils`. Shared components belong in `src/components`; shared utilities belong in `src/lib`. Metadata helpers such as `metadata.ts` or `generateMetadata` can live in route-local `_utils` and be re-exported from `page.tsx` or `layout.tsx`.

Before handing off changes, run the smallest relevant command and prefer `pnpm verify` for route, metadata, styling, or production-build changes:

- `pnpm check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm verify`

Do not commit local `.env` files, SSH keys, Cloudflare tokens, Tailscale credentials, generated local artifacts, or private infrastructure details.

## Local Skills

Read the matching `SKILL.md` before using a local skill.

- `accessibility`: use for accessibility audits, WCAG work, keyboard navigation, focus management, semantic HTML, ARIA, color contrast, or screen reader support.
- `composition-patterns`: use when refactoring React component APIs, reducing boolean prop sprawl, designing compound components, render props, context providers, or reusable component architecture.
- `frontend-conventions`: use before adding, moving, or refactoring App Router pages, route groups, localized pages under `src/app/[locale]`, page-local `_components`, page-local `_utils`, metadata helpers, code-splitting boundaries, or imports that decide whether code is route-local or shared.
- `frontend-design`: use when building, styling, or improving visible UI so pages and components feel production-grade, domain-appropriate, responsive, and polished.
- `next-best-practices`: use when touching Next.js file conventions, Server/Client Component boundaries, data fetching, async APIs, metadata, route handlers, images, fonts, bundling, errors, or runtime choices.
- `next-cache-components`: use when working with Next.js 16 Cache Components, PPR, `use cache`, cache lifetimes, cache tags, `updateTag`, or related caching behavior.
- `next-upgrade`: use when upgrading Next.js versions, applying official migration guidance, or running/updating Next codemods.
- `nodejs-backend-patterns`: use when adding or changing backend-like Node behavior such as route handlers, service integrations, middleware patterns, API clients, auth/security, or database-backed logic.
- `nodejs-best-practices`: use when making general Node.js runtime, async, package, security, or architecture decisions.
- `react-best-practices`: use when writing, reviewing, or refactoring React/Next components, improving rendering performance, data fetching boundaries, bundle size, memoization, or hydration behavior.
- `seo`: use when changing metadata, structured data, canonical URLs, sitemap behavior, robots behavior, Open Graph/Twitter cards, or search visibility.
- `shadcn`: use when adding, updating, styling, debugging, or composing shadcn/ui components or when working with `components.json`.
- `tailwind-css-patterns`: use when styling components with Tailwind utilities, responsive layout, grid/flex patterns, spacing, typography, colors, or design-system utility choices.
- `tailwind-v4-shadcn`: use when working with Tailwind CSS v4 plus shadcn/ui, theme tokens, CSS variables, dark mode, or Tailwind v4 migration/debugging issues.
- `typescript-advanced-types`: use when introducing or simplifying generics, conditional types, mapped types, template literal types, reusable type utilities, or compile-time type constraints.
