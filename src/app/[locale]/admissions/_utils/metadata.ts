import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { indexableRobots, siteConfig, socialPreviewImages } from "@/lib/site"
import { type LocaleParams, resolvePageLocale } from "./locale"

export async function generateMetadata({
  params,
}: {
  params: LocaleParams
}): Promise<Metadata> {
  const locale = await resolvePageLocale(params)
  const t = await getTranslations({ locale, namespace: "Admissions" })
  const path = locale === "ar" ? "/ar/admissions" : "/admissions"
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
      images: [socialPreviewImages.openGraph],
    },
    twitter: {
      card: "summary_large_image",
      title: t("seo.title"),
      description: t("seo.description"),
      images: [socialPreviewImages.twitter],
    },
  }
}
