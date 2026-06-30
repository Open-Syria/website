import type { MetadataRoute } from "next"

import { routing } from "@/i18n/routing"
import { getLocalePath, siteConfig } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      `${siteConfig.url}${getLocalePath(locale)}`,
    ])
  )

  return routing.locales.map((locale) => ({
    alternates: {
      languages: {
        ...languages,
        "x-default": `${siteConfig.url}/`,
      },
    },
    changeFrequency: "weekly",
    lastModified: new Date(),
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    url: `${siteConfig.url}${getLocalePath(locale)}`,
  }))
}
