# OpenSyria Production Website Bundle

This app-only bundle is copied to:

```text
/opt/syr/apps/opensyria/production/website
```

It owns two standalone Next.js slots. Shared `infra-nginx` and Cloudflare
infrastructure are intentionally outside this repository.

## Platform Contract

| Item | Value |
| --- | --- |
| External edge network | `syr-staging-edge` |
| Shared Docker wrapper | `/opt/syr/services/staging/bin/docker` |
| Shared Infisical login helper | `/opt/syr/services/staging/bin/infisical-login` |
| Blue alias | `opensyria-production-website-blue` |
| Green alias | `opensyria-production-website-green` |
| Shared nginx container | `infra-nginx` |
| Public Host header | `opensyria.org` |
| Active include | `/opt/syr/services/staging/infrastructure/nginx/conf.d/includes/opensyria-production-website-active.conf` |

The active include is shared platform state. `bin/release.sh` backs it up and
replaces it atomically; do not copy an app-owned nginx configuration here.
The `staging` segment in shared service paths and the edge network name are
legacy platform identifiers; this application, its aliases, and its secrets
remain production-only.

## Private Files

These files are ignored and must remain mode `0600`:

- `.infisical.env`: host-side universal-auth configuration.
- `.runtime.env`: application environment exported from Infisical.
- `.compose.env`: image digests and per-slot deployment versions.
- `.state/*`: active and pending rollout state.

Create `.infisical.env` from the example and configure OpenSyria project ID
`5922e0e7-9672-4195-a61f-90db3eb60ce5`, the `production` environment, and the
`/website` path before the first rollout.

## Lifecycle

Automation invokes four explicit phases:

```bash
printf '%s' "$GHCR_TOKEN" | bin/release.sh prepare \
  ghcr.io/open-syria/website@sha256:<digest> \
  <full-commit-sha> \
  <registry-user>

bin/release.sh switch
bin/release.sh finalize
bin/release.sh rollback
```

`prepare` exports Infisical secrets, pulls the digest, starts the target slot,
and verifies its exact version without changing routing.

The shared platform `infisical-login` helper obtains a short-lived Universal
Auth token for that export. Neither the token nor CLI login state is persisted.
The host identity file is parsed with an exact key allowlist and is never
executed as shell code.

Every Docker operation uses the shared wrapper because the deployment user has
no direct Docker socket access. The wrapper also preserves the temporary
`DOCKER_CONFIG` across privileged pulls without persisting registry credentials.

`switch` changes the shared nginx include, validates/reloads nginx, and checks
`/health` plus `/` through `infra-nginx` with `Host: opensyria.org`. The private
check retries briefly while a graceful nginx reload drains old workers. Shared
nginx changes wait on the cross-application lock instead of failing when another
OpenSyria rollout is finishing. The previous slot is retained.

`finalize` rechecks the private route, drains existing requests, stops the
previous slot, and records the new active state.

`rollback` restores the backed-up nginx include and previous slot. If no prior
healthy slot exists on the first deployment, the target is deliberately left
running for manual recovery rather than taking the only candidate offline.

Inspect without changing state:

```bash
bin/release.sh status
```

See `docs/deployment.md` for GitHub configuration and Cloudflare cutover.
