import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const arabicLocalePrefix = "/ar"
const englishLocalePrefix = "/en"
const internalLocaleRewriteHeader = "x-opensyria-locale-rewrite"
const directPublicPathPrefixes = ["/-/", "/.well-known/"] as const
const directPublicPaths = new Set([
  "/apple-icon.png",
  "/auth.md",
  "/health",
  "/icon0.svg",
  "/icon1.png",
  "/index.md",
  "/llms.txt",
  "/manifest.json",
  "/opengraph-image.png",
  "/robots.txt",
  "/sitemap.xml",
  "/sy.svg",
  "/twitter-image.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
])
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
  if (request.headers.get(internalLocaleRewriteHeader) === "en") {
    return NextResponse.next()
  }

  if (isDirectPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const canonicalEnglishUrl = getCanonicalEnglishUrl(request)

  if (canonicalEnglishUrl) {
    return NextResponse.redirect(canonicalEnglishUrl, 308)
  }

  const cleanUrl = getCleanTrackingUrl(request)

  if (cleanUrl) {
    return NextResponse.redirect(cleanUrl, 308)
  }

  if (acceptsMarkdown(request) && isMarkdownNegotiablePath(request)) {
    const markdownUrl = request.nextUrl.clone()
    markdownUrl.pathname = "/index.md"
    const response = NextResponse.rewrite(markdownUrl)
    appendHeader(response, "Vary", "Accept")

    return response
  }

  if (isArabicPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const englishUrl = request.nextUrl.clone()
  englishUrl.pathname =
    request.nextUrl.pathname === "/"
      ? englishLocalePrefix
      : `${englishLocalePrefix}${request.nextUrl.pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(internalLocaleRewriteHeader, "en")

  return NextResponse.rewrite(englishUrl, {
    request: {
      headers: requestHeaders,
    },
  })
}

function getCanonicalEnglishUrl(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname !== englishLocalePrefix &&
    !pathname.startsWith(`${englishLocalePrefix}/`)
  ) {
    return null
  }

  const url = request.nextUrl.clone()
  url.pathname = pathname.slice(englishLocalePrefix.length) || "/"
  removeTrackingSearchParams(url)

  return url
}

function getCleanTrackingUrl(request: NextRequest) {
  const url = request.nextUrl.clone()

  return removeTrackingSearchParams(url) ? url : null
}

function removeTrackingSearchParams(url: { searchParams: URLSearchParams }) {
  let hasTrackingParam = false

  for (const param of [...url.searchParams.keys()]) {
    const normalizedParam = param.toLowerCase()

    if (isTrackingSearchParam(normalizedParam)) {
      url.searchParams.delete(param)
      hasTrackingParam = true
    }
  }

  return hasTrackingParam
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

function isArabicPath(pathname: string) {
  return (
    pathname === arabicLocalePrefix ||
    pathname.startsWith(`${arabicLocalePrefix}/`)
  )
}

function isDirectPublicPath(pathname: string) {
  return (
    directPublicPaths.has(pathname) ||
    directPublicPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  )
}

function appendHeader(response: NextResponse, name: string, value: string) {
  const currentValue = response.headers.get(name)

  response.headers.set(name, currentValue ? `${currentValue}, ${value}` : value)
}

export const config = {
  matcher: "/((?!trpc|_next|_vercel).*)",
}
