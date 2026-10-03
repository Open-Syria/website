import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"

import { routing } from "@/i18n/routing"

export type LocaleParams = Promise<{ locale: string }>

export async function resolvePageLocale(params: LocaleParams) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  return locale
}
