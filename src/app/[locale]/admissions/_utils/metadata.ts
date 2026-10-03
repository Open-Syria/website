import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { indexableRobots, siteConfig } from "@/lib/site"
import arabicOpenGraph from "../_assets/social/admissions-og-ar.png"
import englishOpenGraph from "../_assets/social/admissions-og-en.png"
import arabicTwitter from "../_assets/social/admissions-twitter-ar.png"
import englishTwitter from "../_assets/social/admissions-twitter-en.png"
import { type LocaleParams, resolvePageLocale } from "./locale"

const socialImages = {
  ar: { openGraph: arabicOpenGraph, twitter: arabicTwitter },
  en: { openGraph: englishOpenGraph, twitter: englishTwitter },
} as const

export async function generateMetadata({
  params,
}: {
  params: LocaleParams
}): Promise<Metadata> {
  const locale = await resolvePageLocale(params)
  const t = await getTranslations({ locale, namespace: "Admissions" })
  const path = locale === "ar" ? "/ar/admissions" : "/admissions"
  const images = socialImages[locale]
  const imageAlt = t("social.alt")
  return {
    title: t("seo.title"),
    description: t("seo.description"),
    category: "education",
    alternates: {
      canonical: `${siteConfig.url}${path}`,
      languages: {
        ar: `${siteConfig.url}/ar/admissions`,
        en: `${siteConfig.url}/admissions`,
        "x-default": `${siteConfig.url}/admissions`,
      },
    },
    robots: indexableRobots,
    openGraph: {
      title: t("seo.title"),
      description: t("seo.description"),
      url: `${siteConfig.url}${path}`,
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locales[locale].ogLocale,
      alternateLocale: [
        siteConfig.locales[locale === "ar" ? "en" : "ar"].ogLocale,
      ],
      images: [
        {
          url: new URL(images.openGraph.src, siteConfig.url).toString(),
          width: images.openGraph.width,
          height: images.openGraph.height,
          type: "image/png",
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("seo.title"),
      description: t("seo.description"),
      images: [
        {
          url: new URL(images.twitter.src, siteConfig.url).toString(),
          width: images.twitter.width,
          height: images.twitter.height,
          alt: imageAlt,
        },
      ],
    },
  }
}
