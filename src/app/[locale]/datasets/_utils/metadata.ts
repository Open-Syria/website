import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { type Locale, routing } from "@/i18n/routing"
import {
  getAbsoluteUrl,
  getDatasetBySlug,
  getDatasetCatalog,
  getDatasetPath,
  getDatasetsPath,
} from "@/lib/datasets"
import { siteConfig, socialPreviewImages } from "@/lib/site"
import {
  type DatasetParams,
  type LocaleParams,
  resolveDatasetParams,
  resolvePageLocale,
} from "./locale"

const catalogSeo: Record<Locale, { description: string; title: string }> = {
  ar: {
    description:
      "تصفح بيانات سورية مفتوحة وواجهات API للمطورين والخرائط والبحث والصحافة والأدوات المدنية، بما في ذلك المدن والمناطق والمحلات والجامعات.",
    title: "مجموعات بيانات سورية للمطورين والخرائط وواجهات API",
  },
  en: {
    description:
      "Browse open Syrian datasets and APIs for developers, maps, research, journalism, and civic tools, including cities, districts, localities, and universities.",
    title: "Syrian Datasets for Developers, Maps, Research and APIs",
  },
}

async function generateDatasetCatalogMetadata({
  params,
}: {
  params: LocaleParams
}): Promise<Metadata> {
  const locale = await resolvePageLocale(params)
  const datasets = await getDatasetCatalog()
  const seo = catalogSeo[locale]
  const pageUrl = getAbsoluteUrl(getDatasetsPath(locale))

  return {
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages((alternateLocale) =>
        getDatasetsPath(alternateLocale)
      ),
    },
    description: seo.description,
    keywords: [
      ...siteConfig.keywords,
      ...datasets.flatMap((dataset) => dataset.keywords),
    ],
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: routing.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => siteConfig.locales[alternateLocale].ogLocale),
      description: seo.description,
      images: [socialPreviewImages.openGraph],
      locale: siteConfig.locales[locale].ogLocale,
      siteName: siteConfig.name,
      title: seo.title,
      type: "website",
      url: pageUrl,
    },
    title: {
      absolute: `${seo.title} | ${siteConfig.name}`,
    },
    twitter: {
      card: "summary_large_image",
      description: seo.description,
      images: [socialPreviewImages.twitter],
      title: seo.title,
    },
  }
}

async function generateDatasetMetadata({
  params,
}: {
  params: DatasetParams
}): Promise<Metadata> {
  const { locale, slug } = await resolveDatasetParams(params)
  const dataset = await getDatasetBySlug(slug)

  if (!dataset) {
    notFound()
  }

  const pageUrl = getAbsoluteUrl(getDatasetPath(locale, dataset.slug))
  const title = dataset.title[locale]
  const description = dataset.description[locale]

  return {
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages((alternateLocale) =>
        getDatasetPath(alternateLocale, dataset.slug)
      ),
    },
    description,
    keywords: [...siteConfig.keywords, ...dataset.keywords],
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: routing.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => siteConfig.locales[alternateLocale].ogLocale),
      description,
      images: [socialPreviewImages.openGraph],
      locale: siteConfig.locales[locale].ogLocale,
      siteName: siteConfig.name,
      title,
      type: "website",
      url: pageUrl,
    },
    title: {
      absolute: `${title} | ${siteConfig.name}`,
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: [socialPreviewImages.twitter],
      title,
    },
  }
}

function getAlternateLanguages(getPath: (locale: Locale) => string) {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [locale, getAbsoluteUrl(getPath(locale))])
    ),
    "x-default": getAbsoluteUrl(getPath(routing.defaultLocale)),
  }
}

export { generateDatasetCatalogMetadata, generateDatasetMetadata }
