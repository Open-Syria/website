# OpenSyria Website

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js 24+](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](package.json)
[![pnpm 11](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)](package.json)

Public website for [OpenSyria](https://opensyria.org), a public data commons for reliable Syrian datasets, API access, and civic intelligence.

The website is intentionally focused: a localized landing page, dataset catalog and detail pages, a developer API guide, FAQ content, SEO metadata, breadcrumb navigation and structured data, social images, contributor attribution, theme and language controls, and links into the public API documentation and GitHub organization.

## Public URLs

| URL | Purpose |
| --- | --- |
| <https://opensyria.org> | Public website |
| <https://opensyria.org/datasets> | Dataset catalog |
| <https://opensyria.org/datasets/geography> | Geography dataset page |
| <https://opensyria.org/datasets/universities> | Universities dataset page |
| <https://opensyria.org/datasets/transport> | Transport dataset page |
| <https://opensyria.org/datasets/telecom> | Telecom dataset page |
| <https://opensyria.org/api> | Syrian data API guide for developers |
| <https://api.opensyria.org/docs> | API documentation |
| <https://github.com/Open-Syria> | GitHub organization |

## Agent Discovery

The site publishes public, read-only discovery metadata for agents:

- `/llms.txt` and `/index.md` describe the project and link to the main public resources.
- `/auth.md` explains that public website and dataset API access does not require registration, OAuth, API keys, or credentials.
- These machine-readable discovery documents use `X-Robots-Tag: noindex, follow`
  so search engines can follow their links without treating them as duplicate
  landing pages.
- `/.well-known/api-catalog` links to the public API documentation, OpenAPI
  description, health endpoint, and the shared geography, universities,
  transport, and telecom discovery list.
- `/.well-known/agent-skills/index.json` lists the available OpenSyria agent skills.
- Discovery and Markdown route responses carry the HTTP `Link` header directly.
  Normal HTML responses expose the same public resources through those stable
  routes without injecting a render-wide response header.
- OAuth/OIDC and MCP well-known routes return explicit `404 application/problem+json` responses until OpenSyria offers protected auth flows or a public MCP server. Both `/.well-known/mcp/server-card.json` and the scanner-compatible plural alias `/.well-known/mcp/server-cards.json` use that unsupported response.

## Stack

- Next.js 16 App Router with Cache Components enabled
- React 19
- next-intl with `localePrefix: "as-needed"`
- shadcn Base UI components
- Tailwind CSS 4
- Biome for formatting and linting
- pnpm 11 with supply-chain protections

## Repository Layout

```text
src/app/[locale]/        Localized app routes and metadata
src/components/          Website UI components
src/components/ui/       shadcn/Base UI primitives
src/i18n/                next-intl routing, navigation, and request config
src/lib/                 Site config and GitHub data helpers
messages/                English and Arabic translations
public/                  Public static assets
scripts/                 Reproducible asset generation scripts
devops/production/       Production app bundle and blue/green lifecycle
docs/                    Contributor and operational documentation
```

## Local Development

Requirements:

- Node.js 24+
- pnpm 11+

Install dependencies:

```bash
corepack enable pnpm
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Application source code lives under `src/`.

## Environment

Copy `.env.example` when local environment values are needed:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Build time | Canonical site URL; production must use the OpenSyria apex |
| `NEXT_PUBLIC_DATASETS_API_URL` | Build time | Dataset API origin used by prerendering and cache refreshes |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Production build | Google tag or Tag Manager ID for analytics-enabled deployments |
| `DEPLOYMENT_VERSION` | Runtime/build time | Non-secret commit SHA exposed by `/health` and used for Next.js deployment skew protection |

The Google tag ID is public by design. Use a real Google tag ID, such as `GT-WPDWW3NR`, or Tag Manager container ID, such as `GTM-ABC1234`.

Production automation requires `https://opensyria.org`,
`https://api.opensyria.org`, and `GT-WPDWW3NR` for the three public build
values. The host-side Infisical `/website` export mirrors those values plus
`NODE_ENV=production` and `NEXT_TELEMETRY_DISABLED=1`; it must not contain
`DEPLOYMENT_VERSION` because the release SHA is injected per slot.

## Internationalization

The site supports English and Arabic.

- English is the default locale and renders at `/`.
- Explicit `/en` URLs permanently redirect to the equivalent canonical,
  unprefixed English URL.
- Arabic renders at `/ar`.
- Locale prefixes use next-intl `as-needed` routing.
- The HTML `dir` attribute and Base UI `DirectionProvider` are both driven from `src/i18n/routing.ts`.

Translations live in `messages/en.json` and `messages/ar.json`.

## Social Previews

Open Graph and Twitter preview metadata explicitly reference the root social images:

- `/opengraph-image.png`
- `/twitter-image.png`

Keep these images aligned with the current OpenSyria logo and visual theme so crawlers do not fall back to contributor avatars or other page images. When replacing the image content, bump the brand asset version in `src/lib/site.ts` so social crawlers request the refreshed URLs.

Regenerate social preview assets after brand changes:

```bash
pnpm images:brand
```

## Analytics

Analytics is loaded through the locale layout with the official Google tag or
Google Tag Manager snippets. `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` accepts either
a Google tag ID such as `GT-...`, `G-...`, `AW-...`, or `DC-...`, or a Tag
Manager container ID such as `GTM-...`.

Tracked CTA events use:

```text
event=cta_click
cta_id=docs
cta_id=github_stars
```

The implementation keeps the landing page server-rendered and uses small client boundaries for tracked links and interactive FAQ controls.

## Checks

Run all CI checks:

```bash
pnpm verify:ci
```

CI intentionally runs only static formatting/lint checks, TypeScript, and the
dependency audit. It does not run tests or a Next.js build.

Run the complete local release check, including a production build:

```bash
pnpm verify
```

Focused commands:

```bash
pnpm check
pnpm typecheck
pnpm build
pnpm run audit:dependencies
```

Apply Biome formatting and safe fixes:

```bash
pnpm check:write
```

## Deployment

Maintainers deploy one prebuilt `linux/amd64` image digest through protected automation. The production host never builds application source. Operational deployment details live in [docs/deployment.md](docs/deployment.md).

## Repository Documents

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Changelog](CHANGELOG.md)
- [Pull Request Workflow](docs/pull-request-workflow.md)
- [Supply Chain Security](docs/supply-chain-security.md)
- [Deployment](docs/deployment.md)
- [Releases](docs/releases.md)

## Contribution Model

The website is public for transparency, auditability, and reuse, but broad implementation work is maintainer-led.

Good public contributions here include documentation corrections, broken links, accessibility fixes, reproducible website bugs, deployment/tooling fixes, and maintainer-requested changes.

Dataset corrections belong in the relevant dataset repository.

## License

Website code is licensed under MIT. See [LICENSE](LICENSE).
