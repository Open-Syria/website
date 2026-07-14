import { siteConfig, siteLinks } from "@/lib/site"

type DiscoveryLink = Readonly<{
  href: string
  rel: string
  type?: string
}>

export const agentDiscoveryLinks = [
  {
    href: "/.well-known/api-catalog",
    rel: "api-catalog",
    type: "application/linkset+json",
  },
  {
    href: "/.well-known/agent-skills/index.json",
    rel: "index",
    type: "application/json",
  },
  {
    href: "/llms.txt",
    rel: "alternate",
    type: "text/plain",
  },
  {
    href: siteLinks.docs,
    rel: "service-doc",
    type: "text/html",
  },
  {
    href: siteLinks.openApi,
    rel: "service-desc",
    type: "application/json",
  },
  {
    href: `${siteLinks.datasetsApi}/health`,
    rel: "status",
    type: "application/json",
  },
] as const satisfies readonly DiscoveryLink[]

export const agentDiscoveryLinkHeader = agentDiscoveryLinks
  .map(formatDiscoveryLink)
  .join(", ")

export const openSyriaApiSkillPath =
  "/.well-known/agent-skills/opensyria-api/SKILL.md"
export const openSyriaDatasetsSkillPath =
  "/.well-known/agent-skills/opensyria-datasets/SKILL.md"

export const openSyriaApiSkill = `---
name: opensyria-api
description: Discover and use the public OpenSyria read-only datasets API.
---

# OpenSyria API

OpenSyria exposes public, read-only API access for Syrian datasets.

Use these resources:

- API documentation: ${siteLinks.docs}
- OpenAPI description: ${siteLinks.openApi}
- API health: ${siteLinks.datasetsApi}/health
- Dataset catalog: ${siteConfig.url}/datasets

Authentication is not required for public read-only requests.
`

export const openSyriaDatasetsSkill = `---
name: opensyria-datasets
description: Discover OpenSyria dataset pages, repositories, and download formats.
---

# OpenSyria Datasets

OpenSyria publishes source-backed Syrian datasets for developers, maps, research, journalism, civic tools, and public-interest applications.

Start here:

- Dataset catalog: ${siteConfig.url}/datasets
- Geography dataset: ${siteConfig.url}/datasets/geography
- Universities dataset: ${siteConfig.url}/datasets/universities
- Transport dataset: ${siteConfig.url}/datasets/transport
- Telecom dataset: ${siteConfig.url}/datasets/telecom
- GitHub organization: ${siteLinks.githubOrganization}
- API documentation: ${siteLinks.docs}
`

export const agentSkills = [
  {
    content: openSyriaApiSkill,
    description:
      "Discover and use the public OpenSyria read-only datasets API.",
    name: "opensyria-api",
    path: openSyriaApiSkillPath,
    type: "api-discovery",
  },
  {
    content: openSyriaDatasetsSkill,
    description:
      "Discover OpenSyria dataset pages, repositories, and download formats.",
    name: "opensyria-datasets",
    path: openSyriaDatasetsSkillPath,
    type: "dataset-discovery",
  },
] as const

export function getHomepageMarkdown() {
  return `# ${siteConfig.name}

${siteConfig.defaultDescription}

## Agent Discovery

- [API catalog](${siteConfig.url}/.well-known/api-catalog)
- [Agent skills](${siteConfig.url}/.well-known/agent-skills/index.json)
- [API documentation](${siteLinks.docs})
- [OpenAPI description](${siteLinks.openApi})
- [API health](${siteLinks.datasetsApi}/health)

## Datasets

- [Dataset catalog](${siteConfig.url}/datasets)
- [Geography dataset](${siteConfig.url}/datasets/geography)
- [Universities dataset](${siteConfig.url}/datasets/universities)
- [Transport dataset](${siteConfig.url}/datasets/transport)
- [Telecom dataset](${siteConfig.url}/datasets/telecom)

## Repositories

- [OpenSyria GitHub organization](${siteLinks.githubOrganization})
- [Geography data repository](${siteLinks.geographyRepository})
- [Universities data repository](${siteLinks.universitiesRepository})
- [Transport data repository](${siteLinks.transportRepository})
- [Telecom data repository](${siteLinks.telecomRepository})
- [Datasets API repository](${siteLinks.apiRepository})
`
}

export function getMarkdownTokenEstimate(markdown: string) {
  const wordCount = markdown.split(/\s+/).filter(Boolean).length

  return Math.ceil(wordCount * 1.35).toString()
}

function formatDiscoveryLink({ href, rel, type }: DiscoveryLink) {
  const typeAttribute = type ? `; type="${type}"` : ""

  return `<${href}>; rel="${rel}"${typeAttribute}`
}
