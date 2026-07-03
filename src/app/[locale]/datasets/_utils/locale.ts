import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"

import { type Locale, routing } from "@/i18n/routing"

type LocaleParams = Promise<{
  locale: string
}>

type DatasetParams = Promise<{
  locale: string
  slug: string
}>

async function resolvePageLocale(params: LocaleParams) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return locale as Locale
}

async function resolveDatasetParams(params: DatasetParams) {
  const { locale, slug } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return { locale: locale as Locale, slug }
}

export type { DatasetParams, LocaleParams }
export { resolveDatasetParams, resolvePageLocale }
