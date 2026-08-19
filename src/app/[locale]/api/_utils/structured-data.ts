import type { BreadcrumbList, Graph, WebAPI } from "schema-dts"

import type { Locale } from "@/i18n/routing"
import { getLocalizedPath } from "@/lib/datasets"
import {
  createJsonLdGraph,
  getCommonPageJsonLd,
  organizationJsonLdId,
  schemaReference,
  toJsonLd,
} from "@/lib/json-ld"
import { getLocalePath, siteConfig, siteLinks } from "@/lib/site"
import { apiPageSeo } from "./metadata"

const breadcrumbLabels: Record<Locale, { api: string; home: string }> = {
  ar: { api: "واجهة API", home: "الرئيسية" },
  en: { api: "Data API", home: "Home" },
}

function getApiStructuredData(locale: Locale): Graph {
  const seo = apiPageSeo[locale]
  const pageUrl = `${siteConfig.url}${getLocalizedPath(locale, "api")}`
  const homeUrl = `${siteConfig.url}${getLocalePath(locale)}`
  const labels = breadcrumbLabels[locale]
  const breadcrumbs: BreadcrumbList = {
    "@id": `${pageUrl}#breadcrumb`,
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: homeUrl,
        name: labels.home,
        position: 1,
      },
      {
        "@type": "ListItem",
        item: pageUrl,
        name: labels.api,
        position: 2,
      },
    ],
  }
  const api: WebAPI = {
    "@id": `${siteLinks.datasetsApi}/#api`,
    "@type": "WebAPI",
    areaServed: {
      "@type": "Country",
      name: locale === "ar" ? "سوريا" : "Syria",
    },
    category: locale === "ar" ? "واجهة بيانات مفتوحة" : "Open data API",
    description: seo.description,
    documentation: siteLinks.docs,
    name:
      locale === "ar"
        ? "واجهة OpenSyria لمجموعات البيانات"
        : "OpenSyria Datasets API",
    provider: schemaReference(organizationJsonLdId),
    serviceType:
      locale === "ar"
        ? "واجهة عامة لمجموعات البيانات للقراءة فقط"
        : "Public read-only datasets API",
    url: siteLinks.datasetsApi,
  }

  return createJsonLdGraph([
    ...getCommonPageJsonLd({
      description: seo.description,
      locale,
      pageId: `${pageUrl}#webpage`,
      pageUrl,
      title: seo.title,
    }),
    breadcrumbs,
    api,
  ])
}

export { getApiStructuredData, toJsonLd }
