import type { MetadataRoute } from "next"

import { type Locale, routing } from "@/i18n/routing"
import {
  getAbsoluteUrl,
  getDatasetCatalog,
  getDatasetPath,
  getDatasetsPath,
  getLocalizedPath,
} from "@/lib/datasets"

type SitemapRoute = {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  getLastModified?: () => Date
  getPath: (locale: Locale) => string
  priority: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const datasets = await getDatasetCatalog()
  const defaultLastModified = new Date()
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
    ...datasets.map((dataset) => ({
      changeFrequency: "weekly" as const,
      getLastModified: () => getDateOrFallback(dataset.updatedAt),
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
      lastModified: route.getLastModified?.() ?? defaultLastModified,
      priority:
        locale === routing.defaultLocale
          ? route.priority
          : route.priority - 0.05,
      url: getAbsoluteUrl(route.getPath(locale)),
    }))
  })
}

function getDateOrFallback(value: string | null) {
  if (!value) {
    return new Date()
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? new Date() : date
}
