# Deployment

This guide covers building and running the OpenSyria website in an environment
that you control. Operations for the hosted service are documented privately.

## Runtime Requirements

- Node.js 24+ and pnpm 11+ for a source build, or Docker for a container build.
- An API origin that serves the dataset catalog and released dataset metadata.
- Your own site URL and optional analytics configuration.

## Build Configuration

Copy `.env.example` to `.env.local` for local development. Configure these
values for your own deployment:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL of your website |
| `NEXT_PUBLIC_DATASETS_API_URL` | API origin used for dataset metadata |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Optional Google tag or Tag Manager ID |
| `DEPLOYMENT_VERSION` | Release identifier for health checks and deployment skew protection |

The public URL and analytics values are build-time inputs. Rebuild the image
when they change. Never put credentials in `NEXT_PUBLIC_*` variables.

## Source Build

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
pnpm build
pnpm start
```

## Docker

Build the standalone runtime image with your own public configuration:

```bash
docker build --target runtime \
  --build-arg NEXT_PUBLIC_SITE_URL=https://website.example.org \
  --build-arg NEXT_PUBLIC_DATASETS_API_URL=https://api.example.org \
  -t opensyria/website .
```

Run it locally:

```bash
docker run --rm -p 127.0.0.1:3000:3000 opensyria/website
```

Open `http://localhost:3000`. Set up HTTPS and routing appropriate to your
hosting environment before exposing a deployment publicly.

## Verification

`GET /health` reports application health and the non-secret release identifier.
Check the homepage, localized routes, dataset pages, and discovery metadata
after a rollout. The public discovery checks can target your own deployment:

```bash
AGENT_READINESS_BASE_URL=https://website.example.org pnpm run test:agent-readiness
```

Dataset pages cache API metadata and may be prerendered into the image. After a
dataset release, rebuild the website or allow the configured cache lifetime to
expire when a short delay is acceptable.

SEO verification covers clean sitemap URLs and parameterized page responses.
Keep query variants separate in any upstream HTML cache: filtered pages carry
`X-Robots-Tag: noindex, follow`, while clean pages must remain indexable. Preserve
this response header through the hosting layer. After deployment, verify both
admissions languages and the sitemap, then submit the sitemap and inspect the
clean/filtered URLs in Google Search Console. See the README's search-indexing
policy for tracking redirects and the internal `_rsc` exception.

## Hosted Service Operations

Hosted service deployment tooling and operator procedures are maintained
privately. Use the source and Docker instructions above for your own hosting
environment. See [releases.md](releases.md) for repository release metadata and
image identifiers.

## Documentation Policy

Public documentation covers application behavior, public endpoints, local
setup, and reusable hosting requirements. Keep host inventories, private
addresses, account identifiers, access rules, credential arrangements,
relationships with unrelated projects, and recovery records in private operator
documentation outside public repositories.
