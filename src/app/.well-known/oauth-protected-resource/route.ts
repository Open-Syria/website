import { unsupportedDiscoveryResponse } from "@/lib/well-known-responses"

export function GET() {
  return unsupportedDiscoveryResponse({
    detail:
      "OpenSyria does not currently expose protected website or dataset API resources. Public dataset access is read-only and does not require OAuth scopes or bearer tokens.",
    title: "OAuth protected resource metadata is not available",
  })
}

export const HEAD = GET
