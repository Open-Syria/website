#!/usr/bin/env bash
set -euo pipefail

runtime_image="${1:-}"

if [ -z "$runtime_image" ]; then
  echo "Usage: $0 <runtime-image>" >&2
  exit 2
fi

cd /srv/opensyria/website

if [ ! -f .env ]; then
  echo "Missing /srv/opensyria/website/.env" >&2
  exit 1
fi

mkdir -p state nginx
ghcr_logged_in=0

cleanup() {
  if [ "$ghcr_logged_in" -eq 1 ]; then
    docker logout ghcr.io >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

set_env_var() {
  key="$1"
  value="$2"
  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { written = 0 }
    $0 ~ "^" key "=" { print key "=" value; written = 1; next }
    { print }
    END { if (!written) print key "=" value }
  ' .env > "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" .env
}

write_upstream() {
  slot="$1"
  printf 'set $%s http://website-%s:3000;\n' opensyria_website_upstream "$slot" > state/nginx-upstream.conf
}

wait_for_service_health() {
  service="$1"
  timeout_seconds="${2:-180}"
  started_at="$(date +%s)"

  while true; do
    container_id="$(docker compose ps -q "$service")"

    if [ -n "$container_id" ]; then
      health="$(docker inspect "$container_id" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}')"
      if [ "$health" = "healthy" ] || [ "$health" = "running" ]; then
        return 0
      fi
    fi

    now="$(date +%s)"
    if [ $((now - started_at)) -ge "$timeout_seconds" ]; then
      echo "Timed out waiting for $service to become healthy." >&2
      docker compose ps "$service" >&2 || true
      docker compose logs --tail=80 "$service" >&2 || true
      return 1
    fi

    sleep 5
  done
}

wait_for_readiness() {
  service="$1"
  timeout_seconds="${2:-180}"
  started_at="$(date +%s)"

  while true; do
    if docker compose exec -T "$service" node -e "require('node:http').get('http://127.0.0.1:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"; then
      return 0
    fi

    now="$(date +%s)"
    if [ $((now - started_at)) -ge "$timeout_seconds" ]; then
      echo "Timed out waiting for $service readiness." >&2
      docker compose logs --tail=120 "$service" >&2 || true
      return 1
    fi

    sleep 5
  done
}

connect_cloudflared() {
  cloudflared_container="${CLOUDFLARED_CONTAINER:-opensyria-datasets-api-cloudflared}"
  frontend_network="${CLOUDFLARED_WEBSITE_NETWORK:-opensyria-website_frontend}"

  if ! docker ps --format '{{.Names}}' | grep -Fxq "$cloudflared_container"; then
    return 0
  fi

  if docker inspect "$cloudflared_container" --format '{{json .NetworkSettings.Networks}}' | grep -Fq "\"$frontend_network\""; then
    return 0
  fi

  docker network connect "$frontend_network" "$cloudflared_container"
}

current_slot="$(cat state/active-slot 2>/dev/null || true)"
case "$current_slot" in
  blue) target_slot="green" ;;
  green) target_slot="blue" ;;
  *) target_slot="blue"; current_slot="" ;;
esac

target_key="$(printf '%s' "$target_slot" | tr '[:lower:]' '[:upper:]')"
target_service="website-$target_slot"
set_env_var "WEBSITE_${target_key}_IMAGE" "$runtime_image"

if [ -n "$current_slot" ]; then
  write_upstream "$current_slot"
else
  write_upstream "$target_slot"
fi

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
  ghcr_logged_in=1
fi

docker compose config --quiet
docker pull "$runtime_image"

if [ -n "$current_slot" ]; then
  docker compose up -d website-proxy
  connect_cloudflared
  wait_for_service_health website-proxy 120
fi

docker compose up -d --no-deps "$target_service"
wait_for_service_health "$target_service" 180
wait_for_readiness "$target_service" 180

write_upstream "$target_slot"
docker compose up -d website-proxy
connect_cloudflared
wait_for_service_health website-proxy 120

if [ -n "$current_slot" ]; then
  docker compose exec -T website-proxy nginx -s reload
fi

printf '%s\n' "$target_slot" > state/active-slot

if [ -n "$current_slot" ] && [ "$current_slot" != "$target_slot" ]; then
  sleep "${DRAIN_SECONDS:-10}"
  docker compose stop "website-$current_slot"
fi

docker compose ps
