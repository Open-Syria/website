import { locale as rootLocale } from "next/root-params"
import { hasLocale } from "next-intl"
import { type GetRequestConfigParams, getRequestConfig } from "next-intl/server"

import { routing } from "./routing"

export default getRequestConfig(async (params) => {
  const locale = await resolveLocale(params)

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

async function resolveLocale(params: GetRequestConfigParams) {
  if (hasLocale(routing.locales, params.locale)) {
    return params.locale
  }

  const locale = await rootLocale().catch(() => undefined)

  if (hasLocale(routing.locales, locale)) {
    return locale
  }

  const requestedLocale = await params.requestLocale

  if (hasLocale(routing.locales, requestedLocale)) {
    return requestedLocale
  }

  return routing.defaultLocale
}
