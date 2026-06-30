# OpenSyria Website Runtime

This directory is copied to `/srv/opensyria/website` on `opensyria-prod`.

- `compose.yaml` runs a local `website-proxy` nginx service and blue/green Next.js website slots.
- `.env` is private on the server and is written by the GitHub production deployment.
- The proxy binds to `127.0.0.1:3100` by default.
- The existing Cloudflare Tunnel can route `opensyria.org` to `http://website-proxy:80`.
- Keep the datasets API route on `http://proxy:80`; that name belongs to the API stack.
- The deploy script connects the existing `opensyria-datasets-api-cloudflared` container to the website Docker network.
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` is passed at image build time and written to the runtime `.env`.

Deployment:

```bash
cd /srv/opensyria/website
bin/deploy-blue-green.sh ghcr.io/open-syria/website:<tag>
```

The deploy script starts the inactive website slot, checks `/health`, reloads
the local proxy to the new slot, and stops the old slot after a short drain.
