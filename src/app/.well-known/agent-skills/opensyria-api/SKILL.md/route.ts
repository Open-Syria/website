import {
  agentDiscoveryLinkHeader,
  openSyriaApiSkill,
} from "@/lib/agent-discovery"

export function GET() {
  return new Response(openSyriaApiSkill, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
      Link: agentDiscoveryLinkHeader,
    },
  })
}
