import {
  agentDiscoveryLinkHeader,
  getHomepageMarkdown,
  getMarkdownTokenEstimate,
} from "@/lib/agent-discovery"

export function GET() {
  const markdown = getHomepageMarkdown()

  return new Response(markdown, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
      Link: agentDiscoveryLinkHeader,
      "x-markdown-tokens": getMarkdownTokenEstimate(markdown),
    },
  })
}
