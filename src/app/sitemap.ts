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
  getPath: (locale: Locale) => string
  lastModified?: Date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const datasets = await getDatasetCatalog()
  const routes: SitemapRoute[] = [
    {
      getPath: getLocalizedPath,
    },
    {
      getPath: getDatasetsPath,
    },
    {
      getPath: (locale) => getLocalizedPath(locale, "api"),
    },
    ...datasets.map((dataset) => ({
      getPath: (locale: Locale) => getDatasetPath(locale, dataset.slug),
      lastModified: getValidDate(dataset.updatedAt),
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
      ...(route.lastModified ? { lastModified: route.lastModified } : {}),
      url: getAbsoluteUrl(route.getPath(locale)),
    }))
  })
}

function getValidDate(value: string | null) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}
