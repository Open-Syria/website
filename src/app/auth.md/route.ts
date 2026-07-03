import { agentDiscoveryLinkHeader } from "@/lib/agent-discovery"
import { siteLinks } from "@/lib/site"

export function GET() {
  const body = `# auth.md

## OpenSyria Authentication

OpenSyria public website and dataset API access is read-only and does not require OAuth, OpenID Connect, API keys, or agent registration for public requests.

Agents can access public dataset pages, release artifacts, and read-only API endpoints without registration or credentials.

Use these public resources:

- API documentation: ${siteLinks.docs}
- OpenAPI description: ${siteLinks.openApi}
- Dataset catalog: https://opensyria.org/datasets
- Agent skills index: https://opensyria.org/.well-known/agent-skills/index.json
- API catalog: https://opensyria.org/.well-known/api-catalog

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
