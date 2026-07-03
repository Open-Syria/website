import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"
import { agentDiscoveryLinkHeader } from "./lib/agent-discovery"

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
    return withAgentDiscoveryHeaders(NextResponse.redirect(cleanUrl, 308))
  }

  if (acceptsMarkdown(request) && isMarkdownNegotiablePath(request)) {
    const markdownUrl = request.nextUrl.clone()
    markdownUrl.pathname = "/index.md"
    const response = NextResponse.rewrite(markdownUrl)
    appendHeader(response, "Vary", "Accept")

    return withAgentDiscoveryHeaders(response)
  }

  return withAgentDiscoveryHeaders(intlMiddleware(request))
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

function acceptsMarkdown(request: NextRequest) {
  return (
    request.headers.get("accept")?.toLowerCase().includes("text/markdown") ??
    false
  )
}

function isMarkdownNegotiablePath(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/"

  return pathname === "/" || pathname === "/en" || pathname === "/ar"
}

function withAgentDiscoveryHeaders(response: NextResponse) {
  appendHeader(response, "Link", agentDiscoveryLinkHeader)

  return response
}

function appendHeader(response: NextResponse, name: string, value: string) {
  const currentValue = response.headers.get(name)

  response.headers.set(name, currentValue ? `${currentValue}, ${value}` : value)
}

export const config = {
  matcher: "/((?!api|trpc|health|_next|_vercel|.*\\..*).*)",
}
