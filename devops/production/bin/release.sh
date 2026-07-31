#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
ROOT_DIR="/opt/syr/apps/opensyria/production/website"
SERVER_SERVICES_ROOT="/opt/syr/services/staging"
DOCKER_WRAPPER="/opt/syr/services/staging/bin/docker"
INFISICAL_LOGIN_HELPER="/opt/syr/services/staging/bin/infisical-login"
COMPOSE_FILE="${ROOT_DIR}/compose.yaml"
CURRENT_BUNDLE_LINK="${ROOT_DIR}/current-bundle"
BUNDLES_DIR="${ROOT_DIR}/bundles"
COMPOSE_ENV_FILE="${ROOT_DIR}/.compose.env"
RUNTIME_ENV_FILE="${ROOT_DIR}/.runtime.env"
RUNTIME_ENV_VALIDATOR="${ROOT_DIR}/bin/validate-runtime-env.py"
INFISICAL_CONFIG_FILE="${ROOT_DIR}/.infisical.env"
STATE_DIR="${ROOT_DIR}/.state"
ACTIVE_COLOR_FILE="${STATE_DIR}/active-color"
ACTIVE_VERSION_FILE="${STATE_DIR}/active-version"
PENDING_FILE="${STATE_DIR}/pending.env"
PREVIOUS_UPSTREAM_FILE="${STATE_DIR}/previous-upstream.conf"
DEPLOY_LOCK_FILE="${ROOT_DIR}/.deploy.lock"
NGINX_DEPLOY_LOCK_FILE="/opt/syr/services/staging/.nginx-deploy.lock"
NGINX_ACTIVE_INCLUDE="/opt/syr/services/staging/infrastructure/nginx/conf.d/includes/opensyria-production-website-active.conf"
NGINX_CONTAINER="infra-nginx"
PUBLIC_HOST="opensyria.org"
EDGE_NETWORK="syr-staging-edge"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-180}"
DRAIN_SECONDS="${DRAIN_SECONDS:-30}"
DOCKER_CONFIG_DIR=""
RUNTIME_ENV_TEMP_FILE=""
PREPARE_CLEANUP_SERVICE=""
PHASE=""
CURRENT_COLOR=""
TARGET_COLOR=""
HAS_ROLLBACK=""
DEPLOYMENT_VERSION=""
PREVIOUS_VERSION=""

readonly SCRIPT_ROOT ROOT_DIR SERVER_SERVICES_ROOT DOCKER_WRAPPER
readonly INFISICAL_LOGIN_HELPER COMPOSE_FILE CURRENT_BUNDLE_LINK BUNDLES_DIR
readonly COMPOSE_ENV_FILE RUNTIME_ENV_FILE RUNTIME_ENV_VALIDATOR
readonly INFISICAL_CONFIG_FILE STATE_DIR ACTIVE_COLOR_FILE
readonly ACTIVE_VERSION_FILE PENDING_FILE PREVIOUS_UPSTREAM_FILE DEPLOY_LOCK_FILE
readonly NGINX_DEPLOY_LOCK_FILE NGINX_ACTIVE_INCLUDE NGINX_CONTAINER PUBLIC_HOST
readonly EDGE_NETWORK

umask 077

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

require_real_directory() {
  local directory="$1"
  local resolved

  [[ -d "${directory}" && ! -L "${directory}" ]] \
    || fail "${directory} must be a real directory"
  resolved="$(cd -- "${directory}" && pwd -P)"
  [[ "${resolved}" == "${directory}" ]] \
    || fail "${directory} must not traverse symbolic links"
}

ensure_private_directory() {
  local directory="$1"
  local mode="$2"

  if [[ -e "${directory}" || -L "${directory}" ]]; then
    require_real_directory "${directory}"
  else
    install -d -m "${mode}" "${directory}"
  fi
  chmod "${mode}" "${directory}"
  [[ "$(stat -c '%a' "${directory}")" == "${mode}" ]] \
    || fail "${directory} must have mode 0${mode}"
}

require_regular_file() {
  local file="$1"

  [[ -f "${file}" && ! -L "${file}" ]] \
    || fail "${file} must be a regular, non-symbolic-link file"
}

require_executable_regular_file() {
  local file="$1"

  [[ -f "${file}" && -x "${file}" && ! -L "${file}" ]] \
    || fail "${file} must be an executable, non-symbolic-link file"
}

require_private_regular_file() {
  local file="$1"

  require_regular_file "${file}"
  [[ "$(stat -c '%a' "${file}")" == "600" ]] \
    || fail "${file} must have mode 0600"
}

require_safe_private_target() {
  local file="$1"

  if [[ -e "${file}" || -L "${file}" ]]; then
    require_private_regular_file "${file}"
  fi
}

require_safe_regular_target() {
  local file="$1"

  if [[ -e "${file}" || -L "${file}" ]]; then
    require_regular_file "${file}"
  fi
}

require_expected_symlink() {
  local link="$1"
  local expected_target="$2"

  [[ -L "${link}" ]] || fail "${link} must be a symbolic link"
  [[ "$(readlink -- "${link}")" == "${expected_target}" ]] \
    || fail "${link} must point to ${expected_target}"
  [[ -e "${link}" ]] || fail "${link} must not be a dangling symbolic link"
}

validate_release_bundle_links() {
  require_real_directory "${BUNDLES_DIR}"

  local bundle_target bundle_root
  [[ -L "${CURRENT_BUNDLE_LINK}" ]] \
    || fail "${CURRENT_BUNDLE_LINK} must be a symbolic link"
  bundle_target="$(readlink -- "${CURRENT_BUNDLE_LINK}")"
  [[ "${bundle_target}" =~ ^bundles/[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] \
    || fail "${CURRENT_BUNDLE_LINK} does not identify an immutable deployment bundle"
  require_expected_symlink "${CURRENT_BUNDLE_LINK}" "${bundle_target}"
  bundle_root="${ROOT_DIR}/${bundle_target}"
  require_real_directory "${bundle_root}"
  require_real_directory "${bundle_root}/bin"

  require_expected_symlink "${ROOT_DIR}/bin" current-bundle/bin
  require_expected_symlink "${COMPOSE_FILE}" current-bundle/compose.yaml
  require_regular_file "${bundle_root}/compose.yaml"
  require_executable_regular_file "${bundle_root}/bin/release.sh"
  require_executable_regular_file "${bundle_root}/bin/validate-runtime-env.py"
}

require_color() {
  [[ "$1" == "blue" || "$1" == "green" ]] \
    || fail "Invalid deployment color: $1"
}

other_color() {
  if [[ "$1" == "blue" ]]; then
    printf 'green\n'
  else
    printf 'blue\n'
  fi
}

service_for_color() {
  require_color "$1"
  printf 'website-%s\n' "$1"
}

docker_cmd() {
  "${DOCKER_WRAPPER}" "$@"
}

read_single_env_value() {
  local file="$1"
  local key="$2"
  local count

  count="$(grep -c "^${key}=" "${file}" || true)"
  [[ "${count}" == "1" ]] \
    || fail "${file} must contain exactly one ${key} entry"
  sed -n "s/^${key}=//p" "${file}"
}

validate_saved_slot_values() {
  local image="$1"
  local version="$2"

  [[ "${image}" =~ ^ghcr\.io/open-syria/website@sha256:[0-9a-f]{64}$ ]] \
    || fail "Saved slot image is not the immutable OpenSyria website image"
  [[ "${version}" =~ ^[0-9a-f]{40}$ ]] \
    || fail "Saved slot version is not a full commit SHA"
}

validate_compose_env() {
  require_private_regular_file "${COMPOSE_ENV_FILE}"

  local unexpected deployment_version blue_image blue_version
  local green_image green_version
  unexpected="$(
    grep -Ev \
      '^(DEPLOYMENT_VERSION|WEBSITE_BLUE_IMAGE|WEBSITE_BLUE_VERSION|WEBSITE_GREEN_IMAGE|WEBSITE_GREEN_VERSION)=' \
      "${COMPOSE_ENV_FILE}" || true
  )"
  [[ -z "${unexpected}" ]] \
    || fail "${COMPOSE_ENV_FILE} contains unexpected or malformed entries"

  deployment_version="$(read_single_env_value "${COMPOSE_ENV_FILE}" DEPLOYMENT_VERSION)"
  blue_image="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_BLUE_IMAGE)"
  blue_version="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_BLUE_VERSION)"
  green_image="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_GREEN_IMAGE)"
  green_version="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_GREEN_VERSION)"

  [[ "${deployment_version}" =~ ^[0-9a-f]{40}$ ]] \
    || fail "Saved deployment version is not a full commit SHA"
  validate_saved_slot_values "${blue_image}" "${blue_version}"
  validate_saved_slot_values "${green_image}" "${green_version}"
}

validate_runtime_env() {
  require_command python3
  require_regular_file "${RUNTIME_ENV_VALIDATOR}"
  require_private_regular_file "${RUNTIME_ENV_FILE}"
  python3 "${RUNTIME_ENV_VALIDATOR}" "${RUNTIME_ENV_FILE}"
}

compose() {
  validate_compose_env
  validate_runtime_env
  docker_cmd compose \
    --project-directory "${ROOT_DIR}" \
    --env-file "${COMPOSE_ENV_FILE}" \
    -f "${COMPOSE_FILE}" \
    "$@"
}

write_atomic_value() {
  local file="$1"
  local mode="$2"
  local value="$3"
  local temporary

  require_safe_private_target "${file}"
  temporary="$(mktemp "${file}.XXXXXX")"
  printf '%s\n' "${value}" > "${temporary}"
  chmod "${mode}" "${temporary}"
  mv -f -- "${temporary}" "${file}"
}

upstream_color_from_file() {
  local file="$1"
  local color expected

  color="$({
    # The nginx variable below is literal text.
    # shellcheck disable=SC2016
    sed -n \
      's/^set \$opensyria_website_upstream "opensyria-production-website-\(blue\|green\):3000";$/\1/p' \
      "${file}"
  })"
  require_color "${color}"
  expected="set \$opensyria_website_upstream \"opensyria-production-website-${color}:3000\";"
  cmp -s <(printf '%s\n' "${expected}") "${file}" \
    || fail "${file} does not match the production website upstream contract"
  printf '%s\n' "${color}"
}

current_upstream_color() {
  require_regular_file "${NGINX_ACTIVE_INCLUDE}"
  upstream_color_from_file "${NGINX_ACTIVE_INCLUDE}"
}

previous_upstream_color() {
  require_private_regular_file "${PREVIOUS_UPSTREAM_FILE}"
  upstream_color_from_file "${PREVIOUS_UPSTREAM_FILE}"
}

write_nginx_upstream() {
  local color="$1"
  local temporary

  require_color "${color}"
  require_safe_regular_target "${NGINX_ACTIVE_INCLUDE}"
  temporary="$(mktemp "${NGINX_ACTIVE_INCLUDE}.XXXXXX")"
  # The nginx variable below is literal text.
  # shellcheck disable=SC2016
  printf 'set $opensyria_website_upstream "opensyria-production-website-%s:3000";\n' \
    "${color}" > "${temporary}"
  chmod 644 "${temporary}"
  mv -f -- "${temporary}" "${NGINX_ACTIVE_INCLUDE}"
}

restore_previous_upstream() {
  previous_upstream_color >/dev/null
  require_safe_regular_target "${NGINX_ACTIVE_INCLUDE}"

  local temporary
  temporary="$(mktemp "${NGINX_ACTIVE_INCLUDE}.XXXXXX")"
  cp -- "${PREVIOUS_UPSTREAM_FILE}" "${temporary}"
  chmod 644 "${temporary}"
  mv -f -- "${temporary}" "${NGINX_ACTIVE_INCLUDE}"
}

reload_nginx() {
  if ! docker_cmd ps --format '{{.Names}}' | grep -Fxq "${NGINX_CONTAINER}"; then
    echo "${NGINX_CONTAINER} is not running" >&2
    return 1
  fi
  docker_cmd exec "${NGINX_CONTAINER}" nginx -t \
    && docker_cmd exec "${NGINX_CONTAINER}" nginx -s reload
}

service_container_id() {
  compose ps -q "$(service_for_color "$1")"
}

service_is_healthy() {
  local color="$1"
  local container_id health

  container_id="$(service_container_id "${color}")"
  [[ -n "${container_id}" ]] || return 1
  health="$(
    docker_cmd inspect "${container_id}" \
      --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}'
  )"
  [[ "${health}" == "healthy" ]]
}

wait_for_service_health() {
  local color="$1"
  local service started_at now

  service="$(service_for_color "${color}")"
  started_at="$(date +%s)"
  while ! service_is_healthy "${color}"; do
    now="$(date +%s)"
    if ((now - started_at >= HEALTH_TIMEOUT_SECONDS)); then
      compose ps "${service}" >&2 || true
      compose logs --tail=120 "${service}" >&2 || true
      fail "Timed out waiting for ${service} to become healthy"
    fi
    sleep 3
  done
}

verify_direct_version() {
  local color="$1"
  local expected_version="$2"
  local service

  service="$(service_for_color "${color}")"
  compose exec -T "${service}" node -e '
    const http = require("node:http");
    const expected = process.argv[1];
    const request = http.get("http://127.0.0.1:3000/health", (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try {
          const payload = JSON.parse(body);
          process.exit(response.statusCode === 200 && payload.version === expected ? 0 : 1);
        } catch {
          process.exit(1);
        }
      });
    });
    request.on("error", () => process.exit(1));
    request.setTimeout(5000, () => request.destroy());
  ' "${expected_version}"
}

verify_private_route() {
  local expected_version="$1"
  local body

  body="$(
    docker_cmd exec "${NGINX_CONTAINER}" \
      wget -qO- \
      --header="Host: ${PUBLIC_HOST}" \
      http://127.0.0.1/health
  )"
  if ! grep -Fq "\"version\":\"${expected_version}\"" <<< "${body}"; then
    echo "Private ${PUBLIC_HOST} health response did not report ${expected_version}" >&2
    return 1
  fi

  docker_cmd exec "${NGINX_CONTAINER}" \
    wget -q --spider \
    --header="Host: ${PUBLIC_HOST}" \
    http://127.0.0.1/
}

verify_previous_private_route() {
  [[ "${HAS_ROLLBACK}" == "true" ]] || return 1
  [[ "${PREVIOUS_VERSION}" =~ ^[0-9a-f]{40}$ ]] || return 1
  verify_private_route "${PREVIOUS_VERSION}"
}

restore_previous_route() {
  if (restore_previous_upstream) \
    && reload_nginx \
    && verify_previous_private_route; then
    return 0
  fi

  echo "Previous website route could not be verified; restoring the healthy candidate." >&2
  if (write_nginx_upstream "${TARGET_COLOR}") \
    && reload_nginx \
    && verify_private_route "${DEPLOYMENT_VERSION}"; then
    echo "Restored and verified the candidate website route." >&2
  else
    echo "Candidate remains running, but automatic route recovery could not be verified." >&2
  fi
  return 1
}

sync_runtime_env_from_infisical() {
  require_command infisical
  require_command python3
  require_private_regular_file "${INFISICAL_CONFIG_FILE}"
  require_regular_file "${RUNTIME_ENV_VALIDATOR}"
  require_executable_regular_file "${INFISICAL_LOGIN_HELPER}"

  local INFISICAL_API_URL=""
  local INFISICAL_CLIENT_ID=""
  local INFISICAL_CLIENT_SECRET=""
  local INFISICAL_PROJECT_ID=""
  local INFISICAL_ENV_SLUG=""
  local INFISICAL_SECRET_PATH=""
  local line key value
  local seen_api_url="false"
  local seen_client_id="false"
  local seen_client_secret="false"
  local seen_project_id="false"
  local seen_env_slug="false"
  local seen_secret_path="false"

  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\r'}"
    [[ "${line}" =~ ^[[:space:]]*$ || "${line}" =~ ^[[:space:]]*# ]] \
      && continue
    [[ "${line}" =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]] \
      || fail "Invalid line in ${INFISICAL_CONFIG_FILE}"
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    case "${key}" in
      INFISICAL_API_URL)
        [[ "${seen_api_url}" == "false" ]] || fail "Duplicate ${key}"
        seen_api_url="true"
        INFISICAL_API_URL="${value}"
        ;;
      INFISICAL_CLIENT_ID)
        [[ "${seen_client_id}" == "false" ]] || fail "Duplicate ${key}"
        seen_client_id="true"
        INFISICAL_CLIENT_ID="${value}"
        ;;
      INFISICAL_CLIENT_SECRET)
        [[ "${seen_client_secret}" == "false" ]] || fail "Duplicate ${key}"
        seen_client_secret="true"
        INFISICAL_CLIENT_SECRET="${value}"
        ;;
      INFISICAL_PROJECT_ID)
        [[ "${seen_project_id}" == "false" ]] || fail "Duplicate ${key}"
        seen_project_id="true"
        INFISICAL_PROJECT_ID="${value}"
        ;;
      INFISICAL_ENV_SLUG)
        [[ "${seen_env_slug}" == "false" ]] || fail "Duplicate ${key}"
        seen_env_slug="true"
        INFISICAL_ENV_SLUG="${value}"
        ;;
      INFISICAL_SECRET_PATH)
        [[ "${seen_secret_path}" == "false" ]] || fail "Duplicate ${key}"
        seen_secret_path="true"
        INFISICAL_SECRET_PATH="${value}"
        ;;
      *)
        fail "Unexpected key ${key} in ${INFISICAL_CONFIG_FILE}"
        ;;
    esac
  done < "${INFISICAL_CONFIG_FILE}"

  : "${INFISICAL_CLIENT_ID:?INFISICAL_CLIENT_ID is required}"
  : "${INFISICAL_CLIENT_SECRET:?INFISICAL_CLIENT_SECRET is required}"
  [[ "${INFISICAL_CLIENT_ID}" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] \
    || fail "INFISICAL_CLIENT_ID must be a UUID"
  [[ "${INFISICAL_CLIENT_SECRET}" =~ ^[^[:space:]]+$ ]] \
    || fail "INFISICAL_CLIENT_SECRET must be a single non-empty value"
  [[ "${INFISICAL_API_URL}" == "http://127.0.0.1:14001" ]] \
    || fail "INFISICAL_API_URL must use the protected raw loopback endpoint"
  [[ "${INFISICAL_PROJECT_ID}" == "5922e0e7-9672-4195-a61f-90db3eb60ce5" ]] \
    || fail "INFISICAL_PROJECT_ID must be the immutable OpenSyria production project ID"
  [[ "${INFISICAL_ENV_SLUG}" == "production" ]] \
    || fail "INFISICAL_ENV_SLUG must be production"
  [[ "${INFISICAL_SECRET_PATH}" == "/website" ]] \
    || fail "INFISICAL_SECRET_PATH must be /website"

  local infisical_token
  infisical_token="$(
    INFISICAL_API_URL="${INFISICAL_API_URL}" \
    INFISICAL_LOGIN_CLIENT_ID="${INFISICAL_CLIENT_ID}" \
    INFISICAL_LOGIN_CLIENT_SECRET="${INFISICAL_CLIENT_SECRET}" \
      "${INFISICAL_LOGIN_HELPER}"
  )"
  [[ -n "${infisical_token}" ]] \
    || fail "Infisical Universal Auth returned an empty token"

  require_safe_private_target "${RUNTIME_ENV_FILE}"
  RUNTIME_ENV_TEMP_FILE="$(mktemp "${ROOT_DIR}/.runtime.env.export.XXXXXX")"
  INFISICAL_API_URL="${INFISICAL_API_URL}" \
    INFISICAL_TOKEN="${infisical_token}" \
      infisical export \
        --projectId="${INFISICAL_PROJECT_ID}" \
        --env="${INFISICAL_ENV_SLUG}" \
        --path="${INFISICAL_SECRET_PATH}" \
        --format=dotenv \
        --output-file="${RUNTIME_ENV_TEMP_FILE}" \
        --silent
  unset infisical_token INFISICAL_CLIENT_SECRET
  [[ -s "${RUNTIME_ENV_TEMP_FILE}" ]] \
    || fail "Infisical export produced an empty runtime environment"
  require_private_regular_file "${RUNTIME_ENV_TEMP_FILE}"
  python3 "${RUNTIME_ENV_VALIDATOR}" \
    "${RUNTIME_ENV_TEMP_FILE}" \
    "${RUNTIME_ENV_FILE}"
  require_private_regular_file "${RUNTIME_ENV_FILE}"
  rm -f -- "${RUNTIME_ENV_TEMP_FILE}"
  RUNTIME_ENV_TEMP_FILE=""
}

write_compose_env() {
  local target_color="$1"
  local image="$2"
  local version="$3"
  local blue_image green_image blue_version green_version temporary

  if [[ -e "${COMPOSE_ENV_FILE}" || -L "${COMPOSE_ENV_FILE}" ]]; then
    validate_compose_env
    blue_image="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_BLUE_IMAGE)"
    green_image="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_GREEN_IMAGE)"
    blue_version="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_BLUE_VERSION)"
    green_version="$(read_single_env_value "${COMPOSE_ENV_FILE}" WEBSITE_GREEN_VERSION)"
  else
    blue_image="${image}"
    green_image="${image}"
    blue_version="${version}"
    green_version="${version}"
  fi

  if [[ "${target_color}" == "blue" ]]; then
    blue_image="${image}"
    blue_version="${version}"
  else
    green_image="${image}"
    green_version="${version}"
  fi

  validate_saved_slot_values "${blue_image}" "${blue_version}"
  validate_saved_slot_values "${green_image}" "${green_version}"
  require_safe_private_target "${COMPOSE_ENV_FILE}"
  temporary="$(mktemp "${COMPOSE_ENV_FILE}.XXXXXX")"
  {
    printf 'DEPLOYMENT_VERSION=%s\n' "${version}"
    printf 'WEBSITE_BLUE_IMAGE=%s\n' "${blue_image}"
    printf 'WEBSITE_BLUE_VERSION=%s\n' "${blue_version}"
    printf 'WEBSITE_GREEN_IMAGE=%s\n' "${green_image}"
    printf 'WEBSITE_GREEN_VERSION=%s\n' "${green_version}"
  } > "${temporary}"
  chmod 600 "${temporary}"
  mv -f -- "${temporary}" "${COMPOSE_ENV_FILE}"
}

write_pending_state() {
  local phase="$1"
  local temporary

  [[ "${phase}" == "prepared" || "${phase}" == "switching" || "${phase}" == "switched" ]] \
    || fail "Invalid pending phase: ${phase}"
  require_safe_private_target "${PENDING_FILE}"
  temporary="$(mktemp "${PENDING_FILE}.XXXXXX")"
  {
    printf 'PHASE=%s\n' "${phase}"
    printf 'CURRENT_COLOR=%s\n' "${CURRENT_COLOR}"
    printf 'TARGET_COLOR=%s\n' "${TARGET_COLOR}"
    printf 'HAS_ROLLBACK=%s\n' "${HAS_ROLLBACK}"
    printf 'DEPLOYMENT_VERSION=%s\n' "${DEPLOYMENT_VERSION}"
    printf 'PREVIOUS_VERSION=%s\n' "${PREVIOUS_VERSION}"
  } > "${temporary}"
  chmod 600 "${temporary}"
  mv -f -- "${temporary}" "${PENDING_FILE}"
}

load_pending_state() {
  require_private_regular_file "${PENDING_FILE}"

  local unexpected backup_color compose_deployment_version
  local target_saved_version previous_saved_version
  unexpected="$(
    grep -Ev \
      '^(PHASE|CURRENT_COLOR|TARGET_COLOR|HAS_ROLLBACK|DEPLOYMENT_VERSION|PREVIOUS_VERSION)=' \
      "${PENDING_FILE}" || true
  )"
  [[ -z "${unexpected}" ]] \
    || fail "${PENDING_FILE} contains unexpected or malformed entries"

  PHASE="$(read_single_env_value "${PENDING_FILE}" PHASE)"
  CURRENT_COLOR="$(read_single_env_value "${PENDING_FILE}" CURRENT_COLOR)"
  TARGET_COLOR="$(read_single_env_value "${PENDING_FILE}" TARGET_COLOR)"
  HAS_ROLLBACK="$(read_single_env_value "${PENDING_FILE}" HAS_ROLLBACK)"
  DEPLOYMENT_VERSION="$(read_single_env_value "${PENDING_FILE}" DEPLOYMENT_VERSION)"
  PREVIOUS_VERSION="$(read_single_env_value "${PENDING_FILE}" PREVIOUS_VERSION)"

  [[ "${PHASE}" == "prepared" || "${PHASE}" == "switching" || "${PHASE}" == "switched" ]] \
    || fail "Invalid pending phase: ${PHASE}"
  require_color "${TARGET_COLOR}"
  [[ "${HAS_ROLLBACK}" == "true" || "${HAS_ROLLBACK}" == "false" ]] \
    || fail "Invalid rollback state"
  [[ "${DEPLOYMENT_VERSION}" =~ ^[0-9a-f]{40}$ ]] \
    || fail "Invalid pending deployment version"

  if [[ "${HAS_ROLLBACK}" == "true" ]]; then
    require_color "${CURRENT_COLOR}"
    [[ "${CURRENT_COLOR}" != "${TARGET_COLOR}" ]] \
      || fail "Rollback and candidate colors must differ"
    [[ "${PREVIOUS_VERSION}" =~ ^[0-9a-f]{40}$ ]] \
      || fail "Invalid previous deployment version"
  else
    [[ -z "${CURRENT_COLOR}" && -z "${PREVIOUS_VERSION}" ]] \
      || fail "Unverified rollback state must not name a previous deployment"
  fi

  backup_color="$(previous_upstream_color)"
  [[ "${backup_color}" != "${TARGET_COLOR}" ]] \
    || fail "The saved nginx route points at the candidate color"
  if [[ "${HAS_ROLLBACK}" == "true" ]]; then
    [[ "${backup_color}" == "${CURRENT_COLOR}" ]] \
      || fail "The saved nginx route does not match the verified rollback color"
  fi

  validate_compose_env
  validate_runtime_env
  compose_deployment_version="$(read_single_env_value "${COMPOSE_ENV_FILE}" DEPLOYMENT_VERSION)"
  target_saved_version="$(
    read_single_env_value \
      "${COMPOSE_ENV_FILE}" \
      "WEBSITE_${TARGET_COLOR^^}_VERSION"
  )"
  [[ "${compose_deployment_version}" == "${DEPLOYMENT_VERSION}" \
    && "${target_saved_version}" == "${DEPLOYMENT_VERSION}" ]] \
    || fail "Pending deployment version does not match the saved candidate slot"
  if [[ "${HAS_ROLLBACK}" == "true" ]]; then
    previous_saved_version="$(
      read_single_env_value \
        "${COMPOSE_ENV_FILE}" \
        "WEBSITE_${CURRENT_COLOR^^}_VERSION"
    )"
    [[ "${previous_saved_version}" == "${PREVIOUS_VERSION}" ]] \
      || fail "Pending rollback version does not match the saved previous slot"
  fi
}

clear_pending_state() {
  rm -f -- "${PENDING_FILE}" "${PREVIOUS_UPSTREAM_FILE}"
}

record_active_state() {
  local color="$1"
  local version="$2"

  require_color "${color}"
  [[ "${version}" =~ ^[0-9a-f]{40}$ ]] \
    || fail "Active deployment version must be a full commit SHA"
  write_atomic_value "${ACTIVE_COLOR_FILE}" 600 "${color}"
  write_atomic_value "${ACTIVE_VERSION_FILE}" 600 "${version}"
}

login_registry() {
  local username="$1"
  local token="$2"

  DOCKER_CONFIG_DIR="$(mktemp -d "${ROOT_DIR}/.docker-config.XXXXXX")"
  chmod 700 "${DOCKER_CONFIG_DIR}"
  export DOCKER_CONFIG="${DOCKER_CONFIG_DIR}"
  printf '%s' "${token}" \
    | docker_cmd login ghcr.io --username "${username}" --password-stdin
}

prepare_release() {
  [[ "$#" == "3" ]] \
    || fail "Usage: $0 prepare <image@sha256:digest> <git-sha> <registry-username>"

  local image="$1"
  local version="$2"
  local registry_username="$3"
  local registry_token routed_color routed_version target_service

  [[ "${image}" =~ ^ghcr\.io/open-syria/website@sha256:[0-9a-f]{64}$ ]] \
    || fail "The deployment image must be the immutable OpenSyria website digest"
  [[ "${version}" =~ ^[0-9a-f]{40}$ ]] \
    || fail "The deployment version must be a full 40-character commit SHA"
  [[ "${registry_username}" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]] \
    || fail "Registry username is invalid"
  [[ ! -e "${PENDING_FILE}" && ! -L "${PENDING_FILE}" ]] \
    || fail "A pending rollout already exists; finalize or roll it back first"
  [[ ! -e "${PREVIOUS_UPSTREAM_FILE}" && ! -L "${PREVIOUS_UPSTREAM_FILE}" ]] \
    || fail "A stale or unsafe nginx backup exists without pending rollout state"

  docker_cmd network inspect "${EDGE_NETWORK}" >/dev/null \
    || fail "External Docker network ${EDGE_NETWORK} is missing"
  sync_runtime_env_from_infisical
  routed_color="$(current_upstream_color)"

  CURRENT_COLOR=""
  HAS_ROLLBACK="false"
  PREVIOUS_VERSION=""
  TARGET_COLOR="$(other_color "${routed_color}")"

  if [[ -e "${COMPOSE_ENV_FILE}" || -L "${COMPOSE_ENV_FILE}" ]]; then
    validate_compose_env
    routed_version="$(
      read_single_env_value \
        "${COMPOSE_ENV_FILE}" \
        "WEBSITE_${routed_color^^}_VERSION"
    )"
    if service_is_healthy "${routed_color}" \
      && verify_direct_version "${routed_color}" "${routed_version}" \
      && verify_private_route "${routed_version}"; then
      CURRENT_COLOR="${routed_color}"
      HAS_ROLLBACK="true"
      PREVIOUS_VERSION="${routed_version}"
    fi
  fi

  DEPLOYMENT_VERSION="${version}"
  install -m 600 -- "${NGINX_ACTIVE_INCLUDE}" "${PREVIOUS_UPSTREAM_FILE}"
  previous_upstream_color >/dev/null
  write_compose_env "${TARGET_COLOR}" "${image}" "${version}"
  compose config --quiet

  if ! IFS= read -r registry_token && [[ -z "${registry_token}" ]]; then
    fail "Registry token must be supplied on standard input"
  fi
  [[ -n "${registry_token}" ]] || fail "Registry token is empty"
  login_registry "${registry_username}" "${registry_token}"
  registry_token=""
  docker_cmd pull "${image}"
  docker_cmd logout ghcr.io >/dev/null 2>&1 || true

  target_service="$(service_for_color "${TARGET_COLOR}")"
  PREPARE_CLEANUP_SERVICE="${target_service}"
  compose up -d --no-deps --force-recreate "${target_service}"
  wait_for_service_health "${TARGET_COLOR}"
  if ! verify_direct_version "${TARGET_COLOR}" "${version}"; then
    compose logs --tail=120 "${target_service}" >&2 || true
    fail "${target_service} did not report deployment version ${version}"
  fi

  write_pending_state prepared
  PREPARE_CLEANUP_SERVICE=""
  echo "Prepared ${TARGET_COLOR} deployment ${version}; shared nginx still routes ${routed_color}."
}

switch_release() {
  load_pending_state
  [[ "${PHASE}" == "prepared" ]] || fail "Pending rollout is already switched"

  wait_for_service_health "${TARGET_COLOR}"
  verify_direct_version "${TARGET_COLOR}" "${DEPLOYMENT_VERSION}"
  cmp -s "${NGINX_ACTIVE_INCLUDE}" "${PREVIOUS_UPSTREAM_FILE}" \
    || fail "Shared nginx upstream changed after prepare; refusing to overwrite it"

  write_pending_state switching
  write_nginx_upstream "${TARGET_COLOR}"
  write_pending_state switched
  if ! reload_nginx || ! verify_private_route "${DEPLOYMENT_VERSION}"; then
    echo "Website cutover verification failed." >&2
    if [[ "${HAS_ROLLBACK}" == "true" ]] && restore_previous_route; then
      write_pending_state prepared
      echo "Restored and verified the previous production website route." >&2
    else
      echo "Could not restore a verified prior route; leaving the candidate running." >&2
    fi
    return 1
  fi

  echo "Switched private ${PUBLIC_HOST} routing to ${TARGET_COLOR}; ${CURRENT_COLOR:-no prior color} remains available."
}

finalize_release() {
  load_pending_state
  [[ "${PHASE}" == "switched" ]] || fail "The pending rollout has not been switched"
  [[ "$(current_upstream_color)" == "${TARGET_COLOR}" ]] \
    || fail "Shared nginx is no longer routed to ${TARGET_COLOR}"

  wait_for_service_health "${TARGET_COLOR}"
  verify_direct_version "${TARGET_COLOR}" "${DEPLOYMENT_VERSION}"
  verify_private_route "${DEPLOYMENT_VERSION}"
  sleep "${DRAIN_SECONDS}"
  [[ "$(current_upstream_color)" == "${TARGET_COLOR}" ]] \
    || fail "Shared nginx changed during the drain period"
  wait_for_service_health "${TARGET_COLOR}"
  verify_direct_version "${TARGET_COLOR}" "${DEPLOYMENT_VERSION}"
  verify_private_route "${DEPLOYMENT_VERSION}"

  if [[ "${HAS_ROLLBACK}" == "true" && "${CURRENT_COLOR}" != "${TARGET_COLOR}" ]]; then
    compose stop "$(service_for_color "${CURRENT_COLOR}")"
  fi
  record_active_state "${TARGET_COLOR}" "${DEPLOYMENT_VERSION}"
  clear_pending_state
  echo "Finalized production website deployment ${DEPLOYMENT_VERSION} on ${TARGET_COLOR}."
}

rollback_release() {
  load_pending_state

  local routed_color target_service current_service
  routed_color="$(current_upstream_color)"
  target_service="$(service_for_color "${TARGET_COLOR}")"

  if [[ "${PHASE}" == "prepared" || ("${PHASE}" == "switching" && "${routed_color}" != "${TARGET_COLOR}") ]]; then
    if [[ "${routed_color}" == "${TARGET_COLOR}" ]]; then
      fail "Shared nginx now routes the candidate; refusing to stop it without a verified restore"
    fi
    cmp -s "${NGINX_ACTIVE_INCLUDE}" "${PREVIOUS_UPSTREAM_FILE}" \
      || fail "Shared nginx changed during the prepared rollout; leaving the candidate running"
    [[ "${HAS_ROLLBACK}" == "true" ]] \
      || fail "No verified prior website color exists; leaving the healthy candidate running"

    current_service="$(service_for_color "${CURRENT_COLOR}")"
    wait_for_service_health "${CURRENT_COLOR}"
    verify_direct_version "${CURRENT_COLOR}" "${PREVIOUS_VERSION}"
    [[ "${PREVIOUS_VERSION}" != "${DEPLOYMENT_VERSION}" ]] \
      || fail "The two colors report the same version; leaving the candidate running because the live route cannot be distinguished"
    verify_previous_private_route \
      || fail "The previous website route is not healthy; leaving the candidate running"
    compose stop "${target_service}" >/dev/null 2>&1 || true
    clear_pending_state
    echo "Cancelled prepared ${TARGET_COLOR} rollout; shared nginx was never changed."
    return 0
  fi

  if [[ "${HAS_ROLLBACK}" != "true" || -z "${CURRENT_COLOR}" ]]; then
    fail "No previously healthy production color exists; leaving ${TARGET_COLOR} routed for manual recovery"
  fi

  current_service="$(service_for_color "${CURRENT_COLOR}")"
  compose up -d --no-deps "${current_service}"
  wait_for_service_health "${CURRENT_COLOR}"
  verify_direct_version "${CURRENT_COLOR}" "${PREVIOUS_VERSION}"

  if [[ "${routed_color}" == "${TARGET_COLOR}" ]]; then
    restore_previous_route \
      || fail "Could not restore the previous website route; the candidate was kept running"
  elif cmp -s "${NGINX_ACTIVE_INCLUDE}" "${PREVIOUS_UPSTREAM_FILE}"; then
    restore_previous_route \
      || fail "Could not verify the previous website route; the candidate was kept running"
  else
    fail "Shared nginx drifted away from both rollout routes; refusing automatic rollback"
  fi

  [[ "$(current_upstream_color)" == "${CURRENT_COLOR}" ]] \
    || fail "Previous website route is no longer selected; the candidate was kept running"
  verify_previous_private_route \
    || fail "Previous website route is no longer healthy; the candidate was kept running"
  compose stop "${target_service}" >/dev/null 2>&1 || true
  record_active_state "${CURRENT_COLOR}" "${PREVIOUS_VERSION}"
  clear_pending_state
  echo "Rolled production website routing back to ${CURRENT_COLOR}."
}

show_status() {
  echo "Shared nginx color: $(current_upstream_color)"

  local recorded_color recorded_version
  if [[ -e "${ACTIVE_COLOR_FILE}" || -L "${ACTIVE_COLOR_FILE}" ]]; then
    require_private_regular_file "${ACTIVE_COLOR_FILE}"
    recorded_color="$(<"${ACTIVE_COLOR_FILE}")"
    require_color "${recorded_color}"
    echo "Recorded active color: ${recorded_color}"
  else
    echo "Recorded active color: none"
  fi
  if [[ -e "${ACTIVE_VERSION_FILE}" || -L "${ACTIVE_VERSION_FILE}" ]]; then
    require_private_regular_file "${ACTIVE_VERSION_FILE}"
    recorded_version="$(<"${ACTIVE_VERSION_FILE}")"
    [[ "${recorded_version}" =~ ^[0-9a-f]{40}$ ]] \
      || fail "Recorded active version is invalid"
    echo "Recorded active version: ${recorded_version}"
  else
    echo "Recorded active version: none"
  fi
  if [[ -e "${PENDING_FILE}" || -L "${PENDING_FILE}" ]]; then
    load_pending_state
    echo "Pending rollout: yes (${PHASE}, ${TARGET_COLOR})"
  else
    echo "Pending rollout: no"
  fi

  if [[ -e "${COMPOSE_ENV_FILE}" || -L "${COMPOSE_ENV_FILE}" \
    || -e "${RUNTIME_ENV_FILE}" || -L "${RUNTIME_ENV_FILE}" ]]; then
    compose ps
  fi
}

cleanup() {
  local exit_status="$?"
  trap - EXIT

  if [[ -n "${PREPARE_CLEANUP_SERVICE}" \
    && ! -e "${PENDING_FILE}" && ! -L "${PENDING_FILE}" ]]; then
    local cleanup_color
    cleanup_color="${PREPARE_CLEANUP_SERVICE#website-}"
    if (
      local routed_color
      [[ "${HAS_ROLLBACK}" == "true" \
        && -n "${CURRENT_COLOR}" \
        && -f "${PREVIOUS_UPSTREAM_FILE}" \
        && ! -L "${PREVIOUS_UPSTREAM_FILE}" \
        && "$(stat -c '%a' "${PREVIOUS_UPSTREAM_FILE}" 2>/dev/null || true)" == "600" ]] \
        && routed_color="$(current_upstream_color 2>/dev/null)" \
        && [[ "${routed_color}" == "${CURRENT_COLOR}" \
          && "${routed_color}" != "${cleanup_color}" ]] \
        && cmp -s "${NGINX_ACTIVE_INCLUDE}" "${PREVIOUS_UPSTREAM_FILE}" \
        && service_is_healthy "${CURRENT_COLOR}" \
        && verify_direct_version "${CURRENT_COLOR}" "${PREVIOUS_VERSION}" \
        && [[ "${PREVIOUS_VERSION}" != "${DEPLOYMENT_VERSION}" ]] \
        && verify_previous_private_route \
        && compose stop "${PREPARE_CLEANUP_SERVICE}" >/dev/null 2>&1
    ); then
      :
    else
      echo "Leaving ${PREPARE_CLEANUP_SERVICE} running because no verified prior route is available." >&2
    fi
  fi

  case "${RUNTIME_ENV_TEMP_FILE}" in
    "${ROOT_DIR}"/.runtime.env.export.*)
      rm -f -- "${RUNTIME_ENV_TEMP_FILE}"
      ;;
  esac
  case "${DOCKER_CONFIG_DIR}" in
    "${ROOT_DIR}"/.docker-config.*)
      if [[ -d "${DOCKER_CONFIG_DIR}" && ! -L "${DOCKER_CONFIG_DIR}" ]]; then
        rm -rf -- "${DOCKER_CONFIG_DIR}"
      fi
      ;;
  esac

  exit "${exit_status}"
}

main() {
  [[ "${SCRIPT_ROOT}" == "${ROOT_DIR}" ]] \
    || fail "Release script must run from ${ROOT_DIR}"
  require_real_directory "${ROOT_DIR}"
  require_real_directory "${SERVER_SERVICES_ROOT}"
  require_real_directory "${SERVER_SERVICES_ROOT}/bin"
  require_real_directory "$(dirname -- "${NGINX_ACTIVE_INCLUDE}")"
  require_executable_regular_file "${DOCKER_WRAPPER}"
  require_command flock
  require_command stat
  [[ "${HEALTH_TIMEOUT_SECONDS}" =~ ^[1-9][0-9]{0,3}$ ]] \
    || fail "HEALTH_TIMEOUT_SECONDS must be between 1 and 9999"
  [[ "${DRAIN_SECONDS}" =~ ^[0-9]{1,4}$ ]] \
    || fail "DRAIN_SECONDS must be between 0 and 9999"

  ensure_private_directory "${STATE_DIR}" 700
  if [[ -e "${DEPLOY_LOCK_FILE}" || -L "${DEPLOY_LOCK_FILE}" ]]; then
    [[ -f "${DEPLOY_LOCK_FILE}" && ! -L "${DEPLOY_LOCK_FILE}" ]] \
      || fail "Deployment lock must be a regular, non-symbolic-link file"
  fi
  exec 9>"${DEPLOY_LOCK_FILE}"
  chmod 600 "${DEPLOY_LOCK_FILE}"
  require_private_regular_file "${DEPLOY_LOCK_FILE}"
  flock -n 9 || fail "Another website deployment holds ${DEPLOY_LOCK_FILE}"

  if [[ -e "${NGINX_DEPLOY_LOCK_FILE}" || -L "${NGINX_DEPLOY_LOCK_FILE}" ]]; then
    [[ -f "${NGINX_DEPLOY_LOCK_FILE}" && ! -L "${NGINX_DEPLOY_LOCK_FILE}" ]] \
      || fail "Shared nginx deployment lock must be a regular, non-symbolic-link file"
  fi
  exec 8>"${NGINX_DEPLOY_LOCK_FILE}"
  chmod 600 "${NGINX_DEPLOY_LOCK_FILE}"
  require_private_regular_file "${NGINX_DEPLOY_LOCK_FILE}"
  flock -n 8 \
    || fail "Another deployment holds the shared nginx lock ${NGINX_DEPLOY_LOCK_FILE}"

  validate_release_bundle_links
  require_regular_file "${RUNTIME_ENV_VALIDATOR}"

  case "${1:-}" in
    prepare)
      shift
      prepare_release "$@"
      ;;
    switch)
      [[ "$#" == "1" ]] || fail "Usage: $0 switch"
      switch_release
      ;;
    finalize)
      [[ "$#" == "1" ]] || fail "Usage: $0 finalize"
      finalize_release
      ;;
    rollback)
      [[ "$#" == "1" ]] || fail "Usage: $0 rollback"
      rollback_release
      ;;
    status)
      [[ "$#" == "1" ]] || fail "Usage: $0 status"
      show_status
      ;;
    *)
      fail "Usage: $0 {prepare <image@sha256:digest> <git-sha> <registry-username>|switch|finalize|rollback|status}"
      ;;
  esac
}

trap cleanup EXIT
main "$@"
