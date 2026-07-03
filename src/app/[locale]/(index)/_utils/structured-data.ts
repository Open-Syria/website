import type { Graph } from "schema-dts"

import type { Locale } from "@/i18n/routing"
import { createJsonLdGraph, getCommonPageJsonLd, toJsonLd } from "@/lib/json-ld"
import { getLocalePath, siteConfig } from "@/lib/site"

function getStructuredData(locale: Locale): Graph {
  const seo = siteConfig.locales[locale]
  const path = getLocalePath(locale)
  const pageUrl = `${siteConfig.url}${path}`

  return createJsonLdGraph(
    getCommonPageJsonLd({
      description: seo.description,
      locale,
      pageId: `${pageUrl}#webpage`,
      pageUrl,
      title: seo.title,
    })
  )
}

export { getStructuredData, toJsonLd }
