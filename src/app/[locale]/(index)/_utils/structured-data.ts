import type { FAQPage, Graph } from "schema-dts"

import type { Locale } from "@/i18n/routing"
import {
  createJsonLdGraph,
  getCommonPageJsonLd,
  schemaReference,
  toJsonLd,
  websiteJsonLdId,
} from "@/lib/json-ld"
import { getLocalePath, siteConfig } from "@/lib/site"
import { getLandingFaqContent } from "./faq"

async function getStructuredData(locale: Locale): Promise<Graph> {
  const seo = siteConfig.locales[locale]
  const path = getLocalePath(locale)
  const pageUrl = `${siteConfig.url}${path}`
  const faqPage = await getLandingFaqStructuredData(locale, pageUrl)

  return createJsonLdGraph([
    ...getCommonPageJsonLd({
      description: seo.description,
      locale,
      pageId: `${pageUrl}#webpage`,
      pageUrl,
      title: seo.title,
    }),
    faqPage,
  ])
}

async function getLandingFaqStructuredData(
  locale: Locale,
  pageUrl: string
): Promise<FAQPage> {
  const faq = await getLandingFaqContent(locale)

  return {
    "@id": `${pageUrl}#faq`,
    "@type": "FAQPage",
    description: faq.description,
    inLanguage: locale,
    isPartOf: schemaReference(websiteJsonLdId),
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
      name: item.question,
    })),
    name: faq.title,
    url: `${pageUrl}#home-faq-title`,
  }
}

export { getStructuredData, toJsonLd }
