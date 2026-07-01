import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)
const trackingSearchParamNames = new Set([
  "_hsenc",
  "_hsmi",
  "dclid",
  "fbclid",
  "gbraid",
  "gclid",
  "gclsrc",
  "igshid",
  "li_fat_id",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "msclkid",
  "ttclid",
  "twclid",
  "vero_id",
  "wbraid",
  "yclid",
])
const trackingSearchParamPrefixes = ["utm_", "hsa_", "mtm_", "pk_"] as const

export default function proxy(request: NextRequest) {
  const cleanUrl = getCleanTrackingUrl(request)

  if (cleanUrl) {
    return NextResponse.redirect(cleanUrl, 308)
  }

  return intlMiddleware(request)
}

function getCleanTrackingUrl(request: NextRequest) {
  const url = request.nextUrl.clone()
  let hasTrackingParam = false

  for (const param of [...url.searchParams.keys()]) {
    const normalizedParam = param.toLowerCase()

    if (isTrackingSearchParam(normalizedParam)) {
      url.searchParams.delete(param)
      hasTrackingParam = true
    }
  }

  return hasTrackingParam ? url : null
}

function isTrackingSearchParam(param: string) {
  return (
    trackingSearchParamNames.has(param) ||
    trackingSearchParamPrefixes.some((prefix) => param.startsWith(prefix))
  )
}

export const config = {
  matcher: "/((?!api|trpc|health|_next|_vercel|.*\\..*).*)",
}
