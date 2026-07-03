import type { MetadataRoute } from "next"

import { type Locale, routing } from "@/i18n/routing"
import {
  datasetCatalog,
  getAbsoluteUrl,
  getDatasetPath,
  getDatasetsPath,
  getLocalizedPath,
} from "@/lib/datasets"

const lastModified = new Date("2026-07-03")

type SitemapRoute = {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  getPath: (locale: Locale) => string
  priority: number
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: SitemapRoute[] = [
    {
      changeFrequency: "weekly",
      getPath: getLocalizedPath,
      priority: 1,
    },
    {
      changeFrequency: "weekly",
      getPath: getDatasetsPath,
      priority: 0.95,
    },
    ...datasetCatalog.map((dataset) => ({
      changeFrequency: "weekly" as const,
      getPath: (locale: Locale) => getDatasetPath(locale, dataset.slug),
      priority: 0.9,
    })),
  ]

  return routes.flatMap((route) => {
    const languages = {
      ...Object.fromEntries(
        routing.locales.map((locale) => [
          locale,
          getAbsoluteUrl(route.getPath(locale)),
        ])
      ),
      "x-default": getAbsoluteUrl(route.getPath(routing.defaultLocale)),
    }

    return routing.locales.map((locale) => ({
      alternates: {
        languages,
      },
      changeFrequency: route.changeFrequency,
      lastModified,
      priority:
        locale === routing.defaultLocale
          ? route.priority
          : route.priority - 0.05,
      url: getAbsoluteUrl(route.getPath(locale)),
    }))
  })
}
