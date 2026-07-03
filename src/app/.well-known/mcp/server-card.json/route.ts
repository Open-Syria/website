import { unsupportedDiscoveryResponse } from "@/lib/well-known-responses"

export function GET() {
  return unsupportedDiscoveryResponse({
    detail:
      "OpenSyria does not currently operate a public MCP server. Dataset discovery is available through the agent skills index, API catalog, OpenAPI description, and public dataset pages.",
    title: "MCP server card is not available",
  })
}

export const HEAD = GET
