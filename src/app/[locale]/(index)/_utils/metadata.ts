import type { Metadata } from "next"

import { routing } from "@/i18n/routing"
import { getLocalePath, siteConfig, socialPreviewImages } from "@/lib/site"
import { type LocalePageProps, resolveLocale } from "./locale"

async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const seo = siteConfig.locales[locale]
  const path = getLocalePath(locale)
  const pageUrl = `${siteConfig.url}${path}`

  return {
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages(),
    },
    description: seo.description,
    keywords: [...siteConfig.keywords],
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: routing.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => siteConfig.locales[alternateLocale].ogLocale),
      description: seo.description,
      images: [socialPreviewImages.openGraph],
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
      images: [socialPreviewImages.twitter],
      title: seo.title,
    },
  }
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

export { generateMetadata }
