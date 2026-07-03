import { agentDiscoveryLinkHeader } from "@/lib/agent-discovery"
import { siteLinks } from "@/lib/site"

export function GET() {
  const body = `# OpenSyria Authentication

OpenSyria public website and dataset API access is read-only and does not require OAuth, OpenID Connect, API keys, or agent registration for public requests.

Use these public resources:

- API documentation: ${siteLinks.docs}
- OpenAPI description: ${siteLinks.openApi}
- Dataset catalog: https://opensyria.org/datasets

For questions about usage, contact info@opensyria.org.
`

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
      Link: agentDiscoveryLinkHeader,
    },
  })
}
