import { agentDiscoveryLinkHeader } from "@/lib/agent-discovery"
import { siteConfig, siteLinks } from "@/lib/site"

type UnsupportedDiscoveryOptions = Readonly<{
  detail: string
  title: string
}>

export function unsupportedDiscoveryResponse({
  detail,
  title,
}: UnsupportedDiscoveryOptions) {
  return Response.json(
    {
      detail,
      links: {
        apiCatalog: `${siteConfig.url}/.well-known/api-catalog`,
        apiDocumentation: siteLinks.docs,
        authInstructions: `${siteConfig.url}/auth.md`,
        openApi: siteLinks.openApi,
      },
      status: 404,
      title,
      type: `${siteConfig.url}/problems/discovery-metadata-not-supported`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/problem+json; charset=utf-8",
        Link: agentDiscoveryLinkHeader,
      },
      status: 404,
    }
  )
}
