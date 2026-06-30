import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { LandingHero } from "@/components/landing-hero"
import { type Locale, routing } from "@/i18n/routing"
import { getLocalePath, siteConfig, siteLinks } from "@/lib/site"

type PageProps = Readonly<{
  params: Promise<{
    locale: string
  }>
}>

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const seo = siteConfig.locales[locale]
  const path = getLocalePath(locale)
  const pageUrl = `${siteConfig.url}${path}`
  const alternateLanguages = getAlternateLanguages()

  return {
    alternates: {
      canonical: pageUrl,
      languages: alternateLanguages,
    },
    description: seo.description,
    keywords: [...siteConfig.keywords],
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: routing.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => siteConfig.locales[alternateLocale].ogLocale),
      description: seo.description,
      locale: seo.ogLocale,
      siteName: siteConfig.name,
      title: seo.title,
      type: "website",
      url: pageUrl,
    },
    title: {
      absolute: seo.title,
    },
    twitter: {
      card: "summary_large_image",
      description: seo.description,
      title: seo.title,
    },
  }
}

export default async function Page({ params }: PageProps) {
  const locale = await resolveLocale(params)

  setRequestLocale(locale)

  return (
    <>
      <meta property="og:logo" content={siteConfig.logo} />
      <LandingHero />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD follows the official Next.js guide and escapes '<' before injection.
        dangerouslySetInnerHTML={{
          __html: toJsonLd(getStructuredData(locale)),
        }}
      />
    </>
  )
}

async function resolveLocale(params: PageProps["params"]): Promise<Locale> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return locale
}

function getAlternateLanguages() {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `${siteConfig.url}${getLocalePath(locale)}`,
      ])
    ),
    "x-default": `${siteConfig.url}/`,
  }
}

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
