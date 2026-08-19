import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"

import { type Locale, routing } from "@/i18n/routing"

type ApiPageParams = Promise<{
  locale: string
}>

async function resolveApiLocale(params: ApiPageParams) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return locale as Locale
}

export type { ApiPageParams }
export { resolveApiLocale }
