import type {
  CreativeWork,
  DataCatalog,
  DataDownload,
  Dataset,
  Graph,
  Organization,
} from "schema-dts"

import type { Locale } from "@/i18n/routing"
import {
  type DatasetCatalogItem,
  getAbsoluteUrl,
  getDatasetPath,
  getDatasetsPath,
} from "@/lib/datasets"
import {
  createJsonLdGraph,
  getCommonPageJsonLd,
  organizationJsonLdId,
  schemaReference,
  toJsonLd,
} from "@/lib/json-ld"
import { siteConfig } from "@/lib/site"
import {
  getBreadcrumbStructuredData,
  getDatasetBreadcrumbs,
  getDatasetCatalogBreadcrumbs,
} from "./breadcrumbs"

const catalogId = `${siteConfig.url}/datasets#catalog`

const catalogStructuredDataText: Record<
  Locale,
  { description: string; title: string }
> = {
  ar: {
    description:
      "فهرس OpenSyria لبيانات المدن والمحافظات والمناطق والمحلات والجامعات السورية، مع ملفات JSON وCSV للخرائط والبحث والصحافة.",
    title: "بيانات سورية للخرائط والبحث والتنزيل",
  },
  en: {
    description:
      "OpenSyria catalog of Syrian cities, governorates, districts, localities, universities, transport, telecom, maps, research data, and JSON/CSV downloads.",
    title: "Syrian Datasets for Maps, Research and Downloads",
  },
}

function getDatasetCatalogStructuredData(
  locale: Locale,
  datasets: readonly DatasetCatalogItem[]
): Graph {
  const pageUrl = getAbsoluteUrl(getDatasetsPath(locale))
  const { description, title } = catalogStructuredDataText[locale]
  const breadcrumbs = getDatasetCatalogBreadcrumbs(locale)
  const datasetNodes = datasets.map((dataset) =>
    getDatasetJsonLd({
      dataset,
      locale,
      pageUrl: getAbsoluteUrl(getDatasetPath(locale, dataset.slug)),
    })
  )
  const catalog: DataCatalog = {
    "@id": catalogId,
    "@type": "DataCatalog",
    dataset: datasetNodes,
    description,
    inLanguage: locale,
    name: title,
    publisher: schemaReference(organizationJsonLdId),
    url: pageUrl,
  }

  return createJsonLdGraph([
    ...getCommonPageJsonLd({
      description,
      locale,
      pageId: `${pageUrl}#webpage`,
      pageUrl,
      title,
    }),
    getBreadcrumbStructuredData(breadcrumbs),
    catalog,
  ])
}

function getDatasetStructuredData(
  locale: Locale,
  dataset: DatasetCatalogItem
): Graph {
  const pageUrl = getAbsoluteUrl(getDatasetPath(locale, dataset.slug))
  const catalog = getDatasetCatalogJsonLd(locale)
  const breadcrumbs = getDatasetBreadcrumbs(locale, dataset)
  const datasetJsonLd = getDatasetJsonLd({ dataset, locale, pageUrl })

  return createJsonLdGraph([
    ...getCommonPageJsonLd({
      description: dataset.description[locale],
      locale,
      pageId: `${pageUrl}#webpage`,
      pageUrl,
      title: dataset.title[locale],
    }),
    getBreadcrumbStructuredData(breadcrumbs),
    catalog,
    datasetJsonLd,
  ])
}

function getDatasetCatalogJsonLd(locale: Locale): DataCatalog {
  const { description, title } = catalogStructuredDataText[locale]

  return {
    "@id": catalogId,
    "@type": "DataCatalog",
    description,
    inLanguage: locale,
    name: title,
    publisher: schemaReference(organizationJsonLdId),
    url: getAbsoluteUrl(getDatasetsPath(locale)),
  }
}

function getDatasetJsonLd({
  dataset,
  locale,
  pageUrl,
}: {
  dataset: DatasetCatalogItem
  locale: Locale
  pageUrl: string
}): Dataset {
  return {
    "@id": getDatasetId(dataset),
    "@type": "Dataset",
    creator: getDatasetCreatorJsonLd(),
    dateModified: dataset.updatedAt ?? undefined,
    description: dataset.description[locale],
    distribution: getDatasetDistributions(dataset),
    identifier: dataset.id,
    includedInDataCatalog: schemaReference(catalogId),
    inLanguage: ["en", "ar"],
    isAccessibleForFree: true,
    keywords: dataset.keywords,
    license: getDatasetLicenseJsonLd(dataset),
    name: dataset.title[locale],
    publisher: schemaReference(organizationJsonLdId),
    sameAs: dataset.repositoryUrl,
    spatialCoverage: {
      "@type": "Place",
      name: locale === "ar" ? "سوريا" : "Syria",
    },
    url: pageUrl,
    variableMeasured: dataset.recordGroups.map((group) => ({
      "@type": "PropertyValue",
      name: group.name[locale],
      value: group.count,
    })),
    version: dataset.releaseTag,
  }
}

function getDatasetCreatorJsonLd(): Organization {
  return {
    "@id": organizationJsonLdId,
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  }
}

function getDatasetLicenseJsonLd(dataset: DatasetCatalogItem): CreativeWork {
  return {
    "@type": "CreativeWork",
    name: `${siteConfig.name} dataset repository license`,
    url: dataset.licenseUrl,
  }
}

function getDatasetDistributions(dataset: DatasetCatalogItem): DataDownload[] {
  return dataset.distributions.map((distribution) => ({
    "@type": "DataDownload",
    contentUrl: distribution.url,
    encodingFormat: distribution.encodingFormat,
    name: distribution.name,
  }))
}

function getDatasetId(dataset: DatasetCatalogItem) {
  return `${siteConfig.url}/datasets/${dataset.slug}#dataset`
}

export { getDatasetCatalogStructuredData, getDatasetStructuredData, toJsonLd }
