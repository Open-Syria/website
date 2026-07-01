import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"

import { type Locale, routing } from "@/i18n/routing"

type LocaleParams = Promise<{
  locale: string
}>

type LocalePageProps = Readonly<{
  params: LocaleParams
}>

async function resolveLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return locale
}

export type { LocalePageProps }
export { resolveLocale }
