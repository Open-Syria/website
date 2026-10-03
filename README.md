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
| <https://opensyria.org/api> | OpenSyria developer resources and Syrian data API guide |
| <https://opensyria.org/admissions> | English university admissions advisor |
| <https://opensyria.org/ar/admissions> | Arabic university admissions advisor |
| <https://opensyria.org/llms.txt> | Plain-text project and agent discovery guide |
| <https://opensyria.org/index.md> | Markdown project and developer-resource index |
| <https://opensyria.org/auth.md> | Authentication and public-access policy |
| <https://opensyria.org/.well-known/api-catalog> | Machine-readable API catalog |
| <https://opensyria.org/.well-known/agent-skills/index.json> | OpenSyria agent skills index |
| <https://api.opensyria.org/docs> | API documentation |
| <https://api.opensyria.org/openapi.json> | OpenAPI 3.1 description |
| <https://github.com/Open-Syria> | GitHub organization |

## Agent Discovery

The site publishes public, read-only discovery metadata for agents:

- The server-rendered homepage includes a visible OpenSyria developer-resources
  section linking to the guide, OpenAPI description, and agent discovery files.
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
- Unknown paths keep a real `404` status. Browsers receive semantic HTML with
  helpful recovery links; clients sending `Accept: text/markdown` receive the
  recovery index as a literal Markdown response pointing to the homepage,
  datasets, developer guide, sitemap, and `llms.txt`.
- `robots.txt` explicitly allows ChatGPT-User, GPTBot, ClaudeBot,
  Google-Extended, DeepSeekBot, PerplexityBot, and ora-agent, followed by the
  same allow policy for all other crawlers. The Cloudflare zone policy must
  remain aligned with this published policy; WAF or bot controls can otherwise
  override `robots.txt` before requests reach Next.js.

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
docs/                    Contributor and reusable hosting documentation
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

For a production preview, stop all preview servers using this checkout before
running `pnpm build`, then start the new build with `pnpm start`. Keep one preview
URL per checkout. Rebuilding while an older server is running can leave cached
pages pointing to removed JavaScript files and keep the admissions form on its
loading message. Recover by stopping those servers, rebuilding, restarting and
reloading the page. `pnpm test:agent-readiness` checks the JavaScript assets used
by both admissions locales as well as the discovery routes.

## Admissions Advisor

`/admissions` and `/ar/admissions` provide an English/Arabic admissions advisor
using the site's shadcn components. Enter an admission percentage or comparison
total, add optional eligibility details, and compare programs grouped by
institution. Results distinguish checked requirements, missing information, and
unmet requirements for each general, parallel, Arab/foreign public, or private track. Filters and a
saved shortlist help compare choices. A saved-choices button with a count sits above the results, outside the filters. Result groups start closed and keep their headings visible while their contents scroll. On mobile, filters open in a scrollable dialog with a fixed action footer. Applicable admission tracks open one shared eligibility dialog, with only the relevant questions and one field per answer. Answers update immediately with Undo; the list stays still during editing and restores the reading position after regrouping. Official approvals remain pending. A guide and FAQ below the tool link
to the relevant Ministry PDF pages.

The catalogues contain **10,494 choices across twenty-four certificate/applicant catalogues**.
For Syrian/equivalent applicants with 2026 certificates: 1,169 Syrian scientific,
396 Syrian literary, 373 Syrian Sharia, 827 Syrian vocational, 1,007 non-Syrian scientific,
348 non-Syrian literary and 777 non-Syrian vocational. Arab/foreign applicants
have 1,007 scientific, 348 literary and 777 vocational choices for Syrian or
equivalent non-Syrian certificates from 2025 or 2026. Shared private choices
appear in each applicable route; these are not
counts of distinct degrees. Arab/foreign public admission has a separate track;
both certificate origins disregard subject marks, while Syrian academic totals
retain the 2400/2200 denominators. Syrian citizens, including dual nationals, use the
Syrian/equivalent category. Non-Syrian vocational applicants select their exact
official equivalent qualification and use the registered percentage for parallel
and private admission. Arab/foreign vocational admission uses its own public
track and private choices, with exact qualification matching. Syrian Sharia
admission includes 242 public and 131 private choices; 19 dedicated faculty choices
use a separate official percentage after adding religious-subject marks.
Sharia/Arabic institutes require direct registration. Older scientific, literary
and vocational certificates support private-only admission: 2025 and earlier for
Syrian/equivalent applicants, and 2024 and earlier for Arab/foreign applicants.
Each category reuses 389 scientific, 131 literary and 536 vocational private choices
for both certificate origins. The form accepts the actual year and official
percentage, preserving qualification and entrance-test rules. Older Sharia
private admission remains outside the calculator. Faculty-family and disability quotas
add 623 scientific, 225 literary and 183 Sharia choices for Syrian/equivalent
applicants with Syrian 2026 certificates. Each quota uses its own thresholds;
personnel-directorate or medical-committee eligibility remains pending.
Four defence/security catalogues add 31 choices: 23 scientific, four literary,
two Syrian Sharia and two maritime vocational qualifications. Both certificate
origins are supported where specified; programme-specific years, gender,
security birth-year and exact vocational qualifications are checked using the
official percentage. Military defence accepts academic certificates from 2024–2026;
HIAST and security use 2025–2026, and naval vocational admission uses 2026.
Official examinations, fitness, nationality and service conditions remain pending.
A separate faculty-family catalogue adds 291 choices for Syrian 2026 vocational
certificates: 46 engineering faculty entries at 60%, 60 other college entries at
50%, and 185 institute entries without a separate overall minimum. Exact
qualifications and assessments remain required, and family eligibility and vacant
scientific-quota places require official confirmation. Source-linked guidance
explains direct language registration separately for Syrian/equivalent and
Arab/foreign applicants, direct Sharia/Arabic institute registration, and the
vocational routes requiring a separate Education or Energy Ministry announcement.
These procedures appear in the guide and FAQ, outside scored calculator results.
Paginated results include positive career
guidance with sources and limitations. Both languages are indexable and in the
sitemap. Keep the permanent footer link; remove the seasonal homepage section
after the 2026–2027 admissions period. Application minimums are not acceptance predictions.

The route owns its versioned source data in
`src/app/[locale]/admissions/_data/2026-2027/`, split by certificate branch. Reproducible imports
and source rows live in `scripts/admissions`. Data is validated at build time
and only the selected branch loads as a separate versioned asset on calculation. No admissions
database or Redis service is needed.
Favourites persist in local storage; submitted answers stay in this tab's session
storage until cleared or the tab closes. nuqs preserves filters, ordering,
pagination and optional eligibility answers in the URL. Main certificate scores
stay in the tab. Answer changes, Undo and reset stay synchronized with the URL.
The fixed dataset uses `use cache` with `cacheLife("max")`, and both languages
are prerendered. Localized titles, descriptions, canonical/language links,
social previews, and breadcrumb/FAQ structured data accompany the guide.
The advisor does not submit an application.
Existing site analytics still applies.

See [admissions data and release notes](docs/admissions-advisor.md) for scope,
source provenance, verification, career methodology and supported scope.

All 309 pages of the 12 pinned Ministry PDFs have completed one visual review,
including the final 24 instruction, examination and directory pages. The source
audit records findings and limitations; the guide now has 34 source-linked FAQs
per language. This does not claim independent validation or a live check for
later Ministry changes.

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

Google tag and Tag Manager IDs are public build inputs. Configure your own
analytics ID when analytics is enabled. Use your own site and API origins for
self-hosted builds, and supply the release identifier for deployment skew
protection.

## Internationalization

The site supports English and Arabic.

- English is the default locale and renders at `/`.
- Explicit `/en` URLs permanently redirect to the equivalent canonical,
  unprefixed English URL.
- Arabic renders at `/ar`.
- Locale prefixes use next-intl `as-needed` routing.
- The HTML `dir` attribute and Base UI `DirectionProvider` are both driven from `src/i18n/routing.ts`.

Translations live in `messages/en.json` and `messages/ar.json`.

Arabic pages use IBM Plex Sans Arabic at weights 400, 500, 600, and 700.
English uses Inter for body text and Sora for headings. Locale-specific font
variables feed both Tailwind's `font-sans` and `font-heading` utilities, so
headings and form controls keep the correct script's font.

## Search Indexing

The sitemap lists only clean English and Arabic page URLs. Each page has a
self-referencing canonical, matching language alternatives, localized title and
description, and structured data. Admissions filters, searches, saved-only
views and pagination are application state, not separate search landing pages.

- Clean page URLs remain indexable.
- Tracking parameters such as `utm_*` and `gclid` redirect permanently to the
  cleaned URL; functional filters survive that redirect.
- Other page query variants return `X-Robots-Tag: noindex, follow` and retain
  their clean canonical. This is set on each response, leaving cached clean
  pages indexable. Next.js's internal `_rsc` transport parameter is exempt.
- `robots.txt` permits crawling so search engines can read the indexing header
  and canonical. Static assets and versioned social-image URLs stay accessible.

See [Google's noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
After deployment, submit `/sitemap.xml` in Google Search Console and inspect both
clean admissions URLs plus a filtered URL. Existing search listings update when
Google recrawls; a local build cannot change the live index.

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

The implementation keeps the landing page server-rendered and uses small client boundaries for tracked links and interactive FAQ controls. Homepage and admissions FAQs share `src/components/faq-accordion.tsx` for consistent appearance and behavior in both languages: only the first question opens initially, and all answers are included in the initial HTML. Base UI's `hiddenUntilFound` keeps collapsed answers mounted and searchable through find-in-page in supported browsers.

## Checks

Run all CI checks:

```bash
pnpm verify:ci
```

CI runs formatting/lint checks, TypeScript, admissions validation, a production build, the agent
readiness endpoint suite, and the dependency audit.

Run the complete local release check, including a production build:

```bash
pnpm verify
```

Focused commands:

```bash
pnpm check
pnpm typecheck
pnpm run test:admissions
pnpm build
pnpm run test:agent-readiness
pnpm run audit:dependencies
```

`test:agent-readiness` starts the built standalone server and verifies crawler
reachability, raw server-rendered homepage content and heading structure,
localized developer resources, real and recoverable 404s, `robots.txt`, the
discovery files, unsupported MCP/OAuth responses, sitemap, website health, and
the public API documentation, OpenAPI, and health endpoints. SEO checks walk
every sitemap URL and verify canonicals, language alternatives, titles,
descriptions, structured data, social images, redirects and query indexing
without contaminating clean-page responses. To check an already deployed
website instead, set `AGENT_READINESS_BASE_URL`, for example:

```bash
AGENT_READINESS_BASE_URL=https://opensyria.org pnpm run test:agent-readiness
```

Apply Biome formatting and safe fixes:

```bash
pnpm check:write
```

## Deployment

Reusable build and hosting instructions live in [docs/deployment.md](docs/deployment.md).
Operations for the hosted service are documented privately outside public repositories.

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
- [Admissions Advisor](docs/admissions-advisor.md)

## Contribution Model

The website is public for transparency, auditability, and reuse, but broad implementation work is maintainer-led.

Good public contributions here include documentation corrections, broken links, accessibility fixes, reproducible website bugs, deployment/tooling fixes, and maintainer-requested changes.

Dataset corrections belong in the relevant dataset repository.

## License

Website code is licensed under MIT. See [LICENSE](LICENSE).
