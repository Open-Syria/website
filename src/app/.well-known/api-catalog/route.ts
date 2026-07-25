import {
  agentDiscoveryLinkHeader,
  datasetDiscoveryItems,
} from "@/lib/agent-discovery"
import { siteConfig, siteLinks } from "@/lib/site"

export function GET() {
  const body = {
    linkset: [
      {
        anchor: siteLinks.datasetsApi,
        "service-desc": [
          {
            href: siteLinks.openApi,
            type: "application/json",
          },
        ],
        "service-doc": [
          {
            href: siteLinks.docs,
            type: "text/html",
          },
        ],
        status: [
          {
            href: `${siteLinks.datasetsApi}/health`,
            type: "application/json",
          },
        ],
      },
      {
        anchor: `${siteConfig.url}/datasets`,
        item: datasetDiscoveryItems,
      },
    ],
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/linkset+json; charset=utf-8",
      Link: agentDiscoveryLinkHeader,
    },
  })
}
