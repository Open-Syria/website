import { getTranslations } from "next-intl/server"

import type { Locale } from "@/i18n/routing"

const landingFaqMessageKeys = [
  {
    id: "what-is-opensyria",
    key: "whatIsOpenSyria",
  },
  {
    id: "available-datasets",
    key: "availableDatasets",
  },
  {
    id: "reuse-license",
    key: "reuseLicense",
  },
  {
    id: "api-access",
    key: "apiAccess",
  },
  {
    id: "contribute-corrections",
    key: "contributeCorrections",
  },
  {
    id: "out-of-scope",
    key: "outOfScope",
  },
] as const

export type LandingFaqItem = Readonly<{
  answer: string
  id: string
  question: string
}>

export type LandingFaqContent = Readonly<{
  description: string
  eyebrow: string
  items: LandingFaqItem[]
  title: string
}>

export async function getLandingFaqContent(
  locale: Locale
): Promise<LandingFaqContent> {
  const t = await getTranslations({ locale, namespace: "HomeFaq" })

  return {
    description: t("description"),
    eyebrow: t("eyebrow"),
    items: landingFaqMessageKeys.map((item) => ({
      answer: t(`items.${item.key}.answer`),
      id: item.id,
      question: t(`items.${item.key}.question`),
    })),
    title: t("title"),
  }
}

export async function getLandingFaqItems(
  locale: Locale
): Promise<LandingFaqItem[]> {
  const content = await getLandingFaqContent(locale)

  return content.items
}
