import type {
  Graph,
  IdReference,
  Organization,
  Thing,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts"

import type { Locale } from "@/i18n/routing"
import { organizationSameAsLinks, siteConfig, siteLinks } from "@/lib/site"

export type JsonLd = Graph | WithContext<Thing>

export const organizationJsonLdId = `${siteConfig.url}/#organization`
export const websiteJsonLdId = `${siteConfig.url}/#website`

type WebPageJsonLdInput = Readonly<{
  description: string
  locale: Locale
  pageId: string
  pageUrl: string
  title: string
}>

function schemaReference(id: string): IdReference {
  return { "@id": id }
}

function createJsonLdGraph(nodes: readonly Thing[]): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  }
}

function getOrganizationJsonLd(locale: Locale): Organization {
  return {
    "@id": organizationJsonLdId,
    "@type": "Organization",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "public engagement",
      email: siteLinks.contactEmail,
    },
    description: siteConfig.locales[locale].description,
    email: siteLinks.contactEmail,
    logo: siteConfig.logo,
    name: siteConfig.name,
    sameAs: organizationSameAsLinks,
    url: siteConfig.url,
  }
}

function getWebsiteJsonLd(locale: Locale): WebSite {
  return {
    "@id": websiteJsonLdId,
    "@type": "WebSite",
    description: siteConfig.locales[locale].description,
    inLanguage: locale,
    name: siteConfig.name,
    publisher: schemaReference(organizationJsonLdId),
    url: siteConfig.url,
  }
}

function getWebPageJsonLd({
  description,
  locale,
  pageId,
  pageUrl,
  title,
}: WebPageJsonLdInput): WebPage {
  return {
    "@id": pageId,
    "@type": "WebPage",
    about: schemaReference(organizationJsonLdId),
    description,
    inLanguage: locale,
    isPartOf: schemaReference(websiteJsonLdId),
    name: title,
    url: pageUrl,
  }
}

function getCommonPageJsonLd(input: WebPageJsonLdInput) {
  return [
    getOrganizationJsonLd(input.locale),
    getWebsiteJsonLd(input.locale),
    getWebPageJsonLd(input),
  ] as const
}

function toJsonLd(value: JsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export { createJsonLdGraph, getCommonPageJsonLd, schemaReference, toJsonLd }
