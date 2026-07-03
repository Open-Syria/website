import type { Locale } from "@/i18n/routing"
import {
  type DatasetCatalogItem,
  datasetCatalog,
  getAbsoluteUrl,
  getDatasetPath,
  getDatasetsPath,
} from "@/lib/datasets"
import { siteConfig, siteLinks } from "@/lib/site"

const organizationId = `${siteConfig.url}/#organization`
const websiteId = `${siteConfig.url}/#website`
const catalogId = `${siteConfig.url}/datasets#catalog`

function getDatasetCatalogStructuredData(locale: Locale) {
  const pageUrl = getAbsoluteUrl(getDatasetsPath(locale))
  const description =
    locale === "ar"
      ? "فهرس OpenSyria لمجموعات البيانات السورية المفتوحة عن الجغرافيا الإدارية والجامعات والتنزيلات وواجهات API."
      : "OpenSyria catalog of open Syrian datasets for administrative geography, universities, downloads, and API access."

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...getCommonGraph({
        description,
        locale,
        pageId: `${pageUrl}#webpage`,
        pageUrl,
        title:
          locale === "ar"
            ? "فهرس مجموعات بيانات OpenSyria"
            : "OpenSyria Dataset Catalog",
      }),
      {
        "@id": catalogId,
        "@type": "DataCatalog",
        dataset: datasetCatalog.map((dataset) => ({
          "@id": getDatasetId(dataset),
        })),
        description,
        inLanguage: locale,
        name:
          locale === "ar"
            ? "فهرس مجموعات بيانات OpenSyria"
            : "OpenSyria Dataset Catalog",
        publisher: {
          "@id": organizationId,
        },
        url: pageUrl,
      },
    ],
  }
}

function getDatasetStructuredData(locale: Locale, dataset: DatasetCatalogItem) {
  const pageUrl = getAbsoluteUrl(getDatasetPath(locale, dataset.slug))
  const datasetId = getDatasetId(dataset)

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...getCommonGraph({
        description: dataset.description[locale],
        locale,
        pageId: `${pageUrl}#webpage`,
        pageUrl,
        title: dataset.title[locale],
      }),
      {
        "@id": catalogId,
        "@type": "DataCatalog",
        name:
          locale === "ar"
            ? "فهرس مجموعات بيانات OpenSyria"
            : "OpenSyria Dataset Catalog",
        publisher: {
          "@id": organizationId,
        },
        url: getAbsoluteUrl(getDatasetsPath(locale)),
      },
      {
        "@id": datasetId,
        "@type": "Dataset",
        creator: {
          "@id": organizationId,
        },
        description: dataset.description[locale],
        distribution: dataset.distributions.map((distribution) => ({
          "@type": "DataDownload",
          contentUrl: distribution.url,
          encodingFormat: distribution.encodingFormat,
          fileFormat: distribution.format,
          name: distribution.name,
        })),
        identifier: dataset.id,
        includedInDataCatalog: {
          "@id": catalogId,
        },
        inLanguage: ["en", "ar"],
        isAccessibleForFree: true,
        keywords: dataset.keywords.join(", "),
        license: dataset.licenseUrl,
        name: dataset.title[locale],
        publisher: {
          "@id": organizationId,
        },
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
      },
    ],
  }
}

function getCommonGraph({
  description,
  locale,
  pageId,
  pageUrl,
  title,
}: {
  description: string
  locale: Locale
  pageId: string
  pageUrl: string
  title: string
}) {
  return [
    {
      "@id": organizationId,
      "@type": "Organization",
      description: siteConfig.locales[locale].description,
      logo: siteConfig.logo,
      name: siteConfig.name,
      sameAs: [
        siteLinks.githubOrganization,
        siteLinks.geographyRepository,
        siteLinks.universitiesRepository,
        siteLinks.apiRepository,
      ],
      url: siteConfig.url,
    },
    {
      "@id": websiteId,
      "@type": "WebSite",
      description: siteConfig.locales[locale].description,
      inLanguage: locale,
      name: siteConfig.name,
      publisher: {
        "@id": organizationId,
      },
      url: siteConfig.url,
    },
    {
      "@id": pageId,
      "@type": "WebPage",
      about: {
        "@id": organizationId,
      },
      description,
      inLanguage: locale,
      isPartOf: {
        "@id": websiteId,
      },
      name: title,
      url: pageUrl,
    },
  ]
}

function getDatasetId(dataset: DatasetCatalogItem) {
  return `${siteConfig.url}/datasets/${dataset.slug}#dataset`
}

function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export { getDatasetCatalogStructuredData, getDatasetStructuredData, toJsonLd }
