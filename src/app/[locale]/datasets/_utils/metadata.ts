import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { type Locale, routing } from "@/i18n/routing"
import {
  datasetCatalog,
  getAbsoluteUrl,
  getDatasetBySlug,
  getDatasetPath,
  getDatasetsPath,
} from "@/lib/datasets"
import { siteConfig } from "@/lib/site"
import {
  type DatasetParams,
  type LocaleParams,
  resolveDatasetParams,
  resolvePageLocale,
} from "./locale"

const catalogSeo: Record<Locale, { description: string; title: string }> = {
  ar: {
    description:
      "تصفح بيانات سورية مفتوحة عن المدن والمحافظات والمناطق والنواحي والمحلات والجامعات مع روابط GitHub وتنزيلات JSON وCSV وواجهات API.",
    title: "مجموعات بيانات سورية مفتوحة للمدن والمناطق والجامعات",
  },
  en: {
    description:
      "Browse open Syrian datasets for cities, governorates, districts, subdistricts, localities, universities, GitHub releases, JSON/CSV downloads, and API access.",
    title: "Syrian Datasets for Cities, Districts, Universities and APIs",
  },
}

async function generateDatasetCatalogMetadata({
  params,
}: {
  params: LocaleParams
}): Promise<Metadata> {
  const locale = await resolvePageLocale(params)
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
      ...datasetCatalog.flatMap((dataset) => dataset.keywords),
    ],
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: routing.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => siteConfig.locales[alternateLocale].ogLocale),
      description: seo.description,
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
  const dataset = getDatasetBySlug(slug)

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
