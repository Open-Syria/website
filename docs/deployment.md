# Deployment

The website is deployed as a standalone Next.js Docker image to `opensyria-prod`.

Production is intentionally separate from the datasets API while reusing the same server and Cloudflare Tunnel.

## Topology

```text
Cloudflare Tunnel
  opensyria.org      -> http://website-proxy:80
  api.opensyria.org  -> http://proxy:80

opensyria-prod
  /srv/opensyria/website
    website-proxy -> active website slot
    website-blue
    website-green

  /srv/opensyria/datasets-api
    proxy -> active API slot
```

The website proxy has a distinct Docker service name, `website-proxy`, so it does not collide with the datasets API `proxy` service on the Cloudflare Tunnel network.

The nginx proxy uses a larger response-header buffer than the image default so
agent discovery `Link` headers can coexist with Next.js preload `Link` headers
without causing `upstream sent too big header` 502 responses.

## Workflow

Production deployment is handled by `.github/workflows/deploy-production.yml`.

The workflow runs on pushes to `main` and can also be started manually with `workflow_dispatch`.

Before deployment jobs run, the workflow resolves a deploy policy for the pushed
commit. Pushes whose commit message contains `[skip ci]` or `[ci skip]` skip the
deployment workflow. Pushes associated with pull requests opened by
`dependabot[bot]` also skip deployment, while normal CI can still run. Manual
`workflow_dispatch` runs remain deployable.

The `build` and `deploy` jobs both use the GitHub `production` environment.
This is required because `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` is a production
environment variable and must be available while building the Docker image.

The deployment flow:

1. Install dependencies with the pinned pnpm version.
2. Run `pnpm verify`.
3. Build the Docker `runtime` target for `linux/arm64`.
4. Push `sha-<short-sha>` and `main` image tags to GHCR.
5. Join the tailnet with `tailscale/github-action`.
6. Copy `deploy/website` to `/srv/opensyria/website`.
7. Write `/srv/opensyria/website/.env`.
8. Pull the SHA-pinned image on the server.
9. Start the inactive blue/green slot.
10. Check `/health`.
11. Reload `website-proxy` to the new slot.
12. Stop the old slot after a short drain.

Dataset catalog and dataset detail pages use the application-level dataset
cache and can be prerendered into the Docker image. After a dataset release,
either deploy the website or wait for the configured cache lifetime when short
catalog staleness is acceptable.

## GitHub Production Environment

Use the GitHub `production` environment for deployment secrets and variables.

Required environment variables:

```text
DEPLOY_HOST=<tailscale host or IP>
DEPLOY_USER=opensyria
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=<real Google tag ID, such as GT-WPDWW3NR>
```

`NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` can be either a Google tag ID such as
`GT-WPDWW3NR`, `G-...`, or `AW-...`, or a Tag Manager container ID such as
`GTM-ABC1234`. Do not paste placeholder examples such as `GTM-...` or
`GTM-XXXXXXX`.

Required environment secrets:

```text
TS_OAUTH_CLIENT_ID
TS_AUDIENCE
DEPLOY_SSH_PRIVATE_KEY
DEPLOY_SSH_KNOWN_HOSTS
```

Optional environment variables:

```text
WEBSITE_PROXY_PORT=3100
WEBSITE_BLUE_HOST_PORT=3101
WEBSITE_GREEN_HOST_PORT=3102
```

The default ports are selected to avoid the datasets API production ports:

```text
datasets-api proxy  -> 3000
datasets-api blue   -> 3001
datasets-api green  -> 3002
website proxy       -> 3100
website blue        -> 3101
website green       -> 3102
```

Do not set the optional port variables unless the server topology changes.

## SSH Deploy Key

The website may reuse the existing OpenSyria GitHub Actions deploy key when the same server user and trust boundary are acceptable.

Copy the private key into `DEPLOY_SSH_PRIVATE_KEY`.

Copy the Tailscale host known-hosts entry into `DEPLOY_SSH_KNOWN_HOSTS`.

If a shared key is ever rotated or revoked, update every repository that uses it. A website-specific key can be created later if separate revocation is preferred.

## Cloudflare

The existing Cloudflare Tunnel should route hostnames by service name:

```text
opensyria.org      -> http://website-proxy:80
api.opensyria.org  -> http://proxy:80
```

The deploy script connects the existing `opensyria-datasets-api-cloudflared` container to the website Docker network after `website-proxy` is created.

Use one canonical redirect rule for host and scheme:

```text
(http.host in {"opensyria.org" "www.opensyria.org"} and (not ssl or http.host eq "www.opensyria.org"))
```

Redirect target:

```text
concat("https://opensyria.org", http.request.uri.path)
```

Use status code `301` and preserve the query string. This avoids chains such as `http://www.opensyria.org` -> `https://www.opensyria.org` -> `https://opensyria.org`.

## Local Docker Checks

Validate the compose file with a temporary env file:

```bash
cp .env.example deploy/website/.env
docker compose -f deploy/website/compose.yaml config --quiet
rm deploy/website/.env
```

Build the runtime image:

```bash
docker build --target runtime -t opensyria/website .
```

Run locally:

```bash
docker run --rm -p 3000:3000 --env-file .env.local opensyria/website
```

## Server Commands

Manual deployment from the server:

```bash
cd /srv/opensyria/website
bin/deploy-blue-green.sh ghcr.io/open-syria/website:<tag>
```

Check current services:

```bash
cd /srv/opensyria/website
docker compose ps
bin/check.sh
```

Check logs:

```bash
cd /srv/opensyria/website
docker compose logs --tail=120 website-proxy
docker compose logs --tail=120 website-blue
docker compose logs --tail=120 website-green
```

## Health Checks

The website exposes:

```text
GET /health
```

The blue/green script checks the inactive slot directly before switching the proxy.

The workflow also runs `bin/check.sh` after deployment. That script checks the local proxy health endpoint and a HEAD request to `/`.

## Runtime Environment

The workflow writes `/srv/opensyria/website/.env` before deployment. Do not hand-edit it for normal production changes; update GitHub production environment variables instead.

Generated runtime values include:

```text
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0
PORT=3000
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=<real production Google tag or Tag Manager ID>
WEBSITE_PROXY_PORT=3100
WEBSITE_BLUE_HOST_PORT=3101
WEBSITE_GREEN_HOST_PORT=3102
```

## Notes

- Keep the Docker image standalone; `next.config.ts` uses `output: "standalone"`.
- Keep production routing on the root domain, not `www`.
- Keep `api.opensyria.org` on the datasets API service.
- Do not commit local `.env` files, SSH keys, Cloudflare tokens, or Tailscale credentials.
- Production analytics should be configured in Google Tag Manager, not by adding ad hoc scripts to the app.
