import { createHash } from "node:crypto"

import { agentDiscoveryLinkHeader, agentSkills } from "@/lib/agent-discovery"
import { siteConfig } from "@/lib/site"

export function GET() {
  const body = {
    $schema: "https://agentskills.io/schemas/agent-skills-index-v0.2.json",
    skills: agentSkills.map((skill) => ({
      description: skill.description,
      name: skill.name,
      sha256: createHash("sha256").update(skill.content).digest("hex"),
      type: skill.type,
      url: `${siteConfig.url}${skill.path}`,
    })),
  }

  return Response.json(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      Link: agentDiscoveryLinkHeader,
    },
  })
}
