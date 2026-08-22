import { siteConfig } from "@/lib/site"

export const notFoundRecoveryLinks = [
  {
    href: `${siteConfig.url}/`,
    label: "Homepage",
  },
  {
    href: `${siteConfig.url}/datasets`,
    label: "Dataset catalog",
  },
  {
    href: `${siteConfig.url}/api`,
    label: "Developer resources",
  },
  {
    href: `${siteConfig.url}/sitemap.xml`,
    label: "Sitemap",
  },
  {
    href: `${siteConfig.url}/llms.txt`,
    label: "Agent guide",
  },
] as const

export function getNotFoundRecoveryMarkdown() {
  return `# OpenSyria 404 recovery

${notFoundRecoveryLinks
  .map((link) => `- [${link.label}](${link.href})`)
  .join("\n")}`
}
