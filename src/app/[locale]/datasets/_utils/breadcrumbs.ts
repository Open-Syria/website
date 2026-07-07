import type { BreadcrumbList, ListItem } from "schema-dts"

import type { Locale } from "@/i18n/routing"
import {
  type DatasetCatalogItem,
  getAbsoluteUrl,
  getDatasetPath,
  getDatasetsPath,
} from "@/lib/datasets"
import { getLocalePath } from "@/lib/site"

type DatasetBreadcrumbItem = {
  href: string
  label: string
  url: string
}

const breadcrumbLabels: Record<Locale, { datasets: string; home: string }> = {
  ar: {
    datasets: "البيانات",
    home: "الرئيسية",
  },
  en: {
    datasets: "Datasets",
    home: "Home",
  },
}

function getDatasetCatalogBreadcrumbs(
  locale: Locale
): readonly DatasetBreadcrumbItem[] {
  const labels = breadcrumbLabels[locale]

  return [
    {
      href: "/",
      label: labels.home,
      url: getAbsoluteUrl(getLocalePath(locale)),
    },
    {
      href: "/datasets",
      label: labels.datasets,
      url: getAbsoluteUrl(getDatasetsPath(locale)),
    },
  ]
}

function getDatasetBreadcrumbs(
  locale: Locale,
  dataset: DatasetCatalogItem
): readonly DatasetBreadcrumbItem[] {
  return [
    ...getDatasetCatalogBreadcrumbs(locale),
    {
      href: `/datasets/${dataset.slug}`,
      label: dataset.title[locale],
      url: getAbsoluteUrl(getDatasetPath(locale, dataset.slug)),
    },
  ]
}

function getBreadcrumbStructuredData(
  items: readonly DatasetBreadcrumbItem[]
): BreadcrumbList {
  const currentItem = items.at(-1)

  return {
    "@id": `${currentItem?.url ?? getAbsoluteUrl("/")}#breadcrumb`,
    "@type": "BreadcrumbList",
    itemListElement: items.map(
      (item, index): ListItem => ({
        "@type": "ListItem",
        item: {
          "@id": item.url,
          "@type": "WebPage",
          name: item.label,
          url: item.url,
        },
        name: item.label,
        position: index + 1,
      })
    ),
  }
}

export type { DatasetBreadcrumbItem }
export {
  getBreadcrumbStructuredData,
  getDatasetBreadcrumbs,
  getDatasetCatalogBreadcrumbs,
}
