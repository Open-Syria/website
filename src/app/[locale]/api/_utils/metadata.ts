import type { Metadata } from "next"

import { type Locale, routing } from "@/i18n/routing"
import { getLocalizedPath } from "@/lib/datasets"
import { indexableRobots, siteConfig, socialPreviewImages } from "@/lib/site"
import { type ApiPageParams, resolveApiLocale } from "./locale"

const apiPageSeo: Record<Locale, { description: string; title: string }> = {
  ar: {
    description:
      "استخدم واجهة OpenSyria العامة لبيانات الجغرافيا والجامعات والنقل والاتصالات السورية، مع مسارات JSON وتوثيق OpenAPI وأمثلة جاهزة.",
    title: "موارد OpenSyria للمطورين وواجهة البيانات السورية",
  },
  en: {
    description:
      "Use the public OpenSyria Syrian data API for geography, universities, transport, and telecom, with JSON endpoints, OpenAPI docs, and examples.",
    title: "OpenSyria Developer Resources & Syrian Data API",
  },
}

async function generateMetadata({
  params,
}: {
  params: ApiPageParams
}): Promise<Metadata> {
  const locale = await resolveApiLocale(params)
  const seo = apiPageSeo[locale]
  const pageUrl = `${siteConfig.url}${getLocalizedPath(locale, "api")}`

  return {
    alternates: {
      canonical: pageUrl,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((alternateLocale) => [
            alternateLocale,
            `${siteConfig.url}${getLocalizedPath(alternateLocale, "api")}`,
          ])
        ),
        "x-default": `${siteConfig.url}/api`,
      },
    },
    description: seo.description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: routing.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => siteConfig.locales[alternateLocale].ogLocale),
      description: seo.description,
      images: [socialPreviewImages.openGraph],
      locale: siteConfig.locales[locale].ogLocale,
      siteName: siteConfig.name,
      title: seo.title,
      type: "website",
      url: pageUrl,
    },
    robots: indexableRobots,
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

export { apiPageSeo, generateMetadata }
