import { unsupportedDiscoveryResponse } from "@/lib/well-known-responses"

export function GET() {
  return unsupportedDiscoveryResponse({
    detail:
      "OpenSyria public website and dataset API access is read-only and does not require OpenID Connect authentication. OIDC discovery metadata will be published here if protected APIs are introduced.",
    title: "OpenID Connect discovery metadata is not available",
  })
}

export const HEAD = GET
