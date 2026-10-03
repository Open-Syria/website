import { cacheLife } from "next/cache"
import { getTranslations } from "next-intl/server"
import type { BreadcrumbList, FAQPage, Graph } from "schema-dts"

import type { Locale } from "@/i18n/routing"
import {
  createJsonLdGraph,
  getCommonPageJsonLd,
  schemaReference,
  toJsonLd,
} from "@/lib/json-ld"
import { getLocalePath, siteConfig } from "@/lib/site"
import { faqItems } from "./content"

export async function getStructuredData(locale: Locale): Promise<Graph> {
  "use cache"

  cacheLife("max")
  const t = await getTranslations({ locale, namespace: "Admissions" })
  const pageUrl = `${siteConfig.url}${locale === "ar" ? "/ar/admissions" : "/admissions"}`
  const pageId = `${pageUrl}#webpage`
  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: `${siteConfig.url}${getLocalePath(locale)}`,
      },
      { "@type": "ListItem", position: 2, name: t("title"), item: pageUrl },
    ],
  }
  const faq: FAQPage = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    name: t("faq.title"),
    inLanguage: locale,
    isPartOf: schemaReference(pageId),
    url: `${pageUrl}#admissions-faq`,
    mainEntity: faqItems.map(({ id }) => ({
      "@type": "Question",
      name: t(`faq.items.${id}.question`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.items.${id}.answer`) },
    })),
  }
  return createJsonLdGraph([
    ...getCommonPageJsonLd({
      locale,
      pageId,
      pageUrl,
      title: t("seo.title"),
      description: t("seo.description"),
    }),
    breadcrumb,
    faq,
  ])
}

export { toJsonLd }
