import {
  agentDiscoveryLinkHeader,
  getHomepageMarkdown,
} from "@/lib/agent-discovery"

export function GET() {
  return new Response(getHomepageMarkdown(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
      Link: agentDiscoveryLinkHeader,
    },
  })
}
