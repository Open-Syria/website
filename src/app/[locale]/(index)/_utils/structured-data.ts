import type { Locale } from "@/i18n/routing"
import { getLocalePath, siteConfig, siteLinks } from "@/lib/site"

function getStructuredData(locale: Locale) {
  const seo = siteConfig.locales[locale]
  const path = getLocalePath(locale)
  const pageUrl = `${siteConfig.url}${path}`
  const organizationId = `${siteConfig.url}/#organization`
  const websiteId = `${siteConfig.url}/#website`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": organizationId,
        "@type": "Organization",
        description: seo.description,
        logo: siteConfig.logo,
        name: siteConfig.name,
        sameAs: [siteLinks.githubOrganization, siteLinks.apiRepository],
        url: siteConfig.url,
      },
      {
        "@id": websiteId,
        "@type": "WebSite",
        description: seo.description,
        inLanguage: locale,
        name: siteConfig.name,
        publisher: {
          "@id": organizationId,
        },
        url: siteConfig.url,
      },
      {
        "@id": `${pageUrl}#webpage`,
        "@type": "WebPage",
        about: {
          "@id": organizationId,
        },
        description: seo.description,
        inLanguage: locale,
        isPartOf: {
          "@id": websiteId,
        },
        name: seo.title,
        url: pageUrl,
      },
    ],
  }
}

function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export { getStructuredData, toJsonLd }
