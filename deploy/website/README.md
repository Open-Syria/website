# OpenSyria Website Runtime

This directory is copied to `/srv/opensyria/website` on `opensyria-prod` by the production deployment workflow.

It contains the Docker Compose runtime, nginx proxy config, blue/green deployment script, and health check script for the public website.

## Services

| Service | Purpose | Default host bind |
| --- | --- | --- |
| `website-proxy` | Local nginx proxy for the active website slot | `127.0.0.1:3100 -> 80` |
| `website-blue` | Blue Next.js standalone runtime slot | `127.0.0.1:3101 -> 3000` |
| `website-green` | Green Next.js standalone runtime slot | `127.0.0.1:3102 -> 3000` |

The datasets API uses `proxy`, `api-blue`, and `api-green` in a separate Compose project. The website proxy is named `website-proxy` to avoid collisions when Cloudflare Tunnel joins both Docker networks.

## Cloudflare Tunnel

The existing Cloudflare Tunnel container can be reused.

Expected hostname routing:

```text
opensyria.org      -> http://website-proxy:80
api.opensyria.org  -> http://proxy:80
```

The deployment script connects the existing `opensyria-datasets-api-cloudflared` container to the website Docker network after the website proxy is created.

## Environment

`.env` is private on the server and is written by GitHub Actions before deployment.

Expected values:

```text
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0
PORT=3000
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-...
WEBSITE_PROXY_PORT=3100
WEBSITE_BLUE_HOST_PORT=3101
WEBSITE_GREEN_HOST_PORT=3102
```

`WEBSITE_PROXY_PORT`, `WEBSITE_BLUE_HOST_PORT`, and `WEBSITE_GREEN_HOST_PORT` have defaults. Do not set them unless the server port layout changes.

## Deployment

Manual deployment:

```bash
cd /srv/opensyria/website
bin/deploy-blue-green.sh ghcr.io/open-syria/website:<tag>
```

The script:

1. Updates the inactive slot image in `.env`.
2. Pulls the requested GHCR image.
3. Starts the inactive slot.
4. Waits for Docker health and `/health` readiness.
5. Updates `state/nginx-upstream.conf`.
6. Starts or reloads `website-proxy`.
7. Records the active slot in `state/active-slot`.
8. Stops the old slot after the drain period.

## Health Check

Run:

```bash
cd /srv/opensyria/website
bin/check.sh
```

The check script verifies:

- `docker compose ps`
- `GET /health` through the local website proxy
- `HEAD /` through the local website proxy

## Useful Commands

Show services:

```bash
docker compose ps
```

Show recent logs:

```bash
docker compose logs --tail=120 website-proxy
docker compose logs --tail=120 website-blue
docker compose logs --tail=120 website-green
```

Restart the proxy:

```bash
docker compose up -d website-proxy
```

Check the active slot:

```bash
cat state/active-slot
cat state/nginx-upstream.conf
```

## Notes

- Do not edit `.env` for normal production changes. Update GitHub production environment variables instead.
- Do not store Cloudflare, Tailscale, SSH, or GHCR credentials in this directory.
- `state/` is runtime state and should stay on the server.
