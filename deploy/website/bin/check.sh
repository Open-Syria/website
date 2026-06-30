#!/usr/bin/env bash
set -euo pipefail

cd /srv/opensyria/website

docker compose ps
curl -fsS "http://127.0.0.1:${WEBSITE_PROXY_PORT:-3100}/health"
echo
curl -fsSI "http://127.0.0.1:${WEBSITE_PROXY_PORT:-3100}/" >/dev/null
echo "website root ok"
