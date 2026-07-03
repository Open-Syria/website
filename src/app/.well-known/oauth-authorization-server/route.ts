import { unsupportedDiscoveryResponse } from "@/lib/well-known-responses"

export function GET() {
  return unsupportedDiscoveryResponse({
    detail:
      "OpenSyria public website and dataset API access is read-only and does not require OAuth 2.0 credentials. Authorization server metadata will be published here if protected APIs are introduced.",
    title: "OAuth authorization server metadata is not available",
  })
}

export const HEAD = GET
