import type { Metadata } from "next"

const brandAssetVersion = "20260704-brand-wordmark"
const productionSiteUrl = "https://opensyria.org"
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || productionSiteUrl

export const siteConfig = {
  name: "OpenSyria",
  url: siteUrl,
  logo: `${siteUrl}/web-app-manifest-512x512.png?v=${brandAssetVersion}`,
  defaultTitle: "OpenSyria | Open, Source-Backed Data About Syria",
  defaultDescription:
    "OpenSyria is a public data commons for reliable Syrian geography, universities, transport, and telecom data, with downloads, APIs, and cited sources.",
  locales: {
    ar: {
      description:
        "OpenSyria مشروع بيانات عامة ينشر بيانات سورية موثقة للجغرافيا والجامعات والنقل والاتصالات، مع تنزيلات وواجهات API ومصادر مرجعية.",
      ogLocale: "ar_SY",
      title: "OpenSyria | بيانات سورية مفتوحة وموثقة بالمصادر",
    },
    en: {
      description:
        "OpenSyria is a public data commons for reliable Syrian geography, universities, transport, and telecom data, with downloads, APIs, and cited sources.",
      ogLocale: "en_US",
      title: "OpenSyria | Open, Source-Backed Data About Syria",
    },
  },
} as const

export const siteLinks = {
  apiRepository: "https://github.com/Open-Syria/datasets-api",
  contactEmail: "info@opensyria.org",
  datasetsApi: "https://api.opensyria.org",
  docs: "https://api.opensyria.org/docs",
  geographyRepository: "https://github.com/Open-Syria/data-geography",
  githubOrganization: "https://github.com/Open-Syria",
  linkedIn: "https://www.linkedin.com/company/OpenSyria",
  openApi: "https://api.opensyria.org/openapi.json",
  telecomRepository: "https://github.com/Open-Syria/data-telecom",
  transportRepository: "https://github.com/Open-Syria/data-transport",
  universitiesRepository: "https://github.com/Open-Syria/data-universities",
}

export const organizationSameAsLinks = [
  siteLinks.githubOrganization,
  siteLinks.linkedIn,
] as const

export const indexableRobots = {
  follow: true,
  googleBot: {
    follow: true,
    index: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  index: true,
} as const satisfies Metadata["robots"]

export const socialPreviewImages = {
  openGraph: {
    alt: "OpenSyria social preview showing the OpenSyria wordmark and Syria map.",
    height: 630,
    url: `${siteConfig.url}/opengraph-image.png?v=${brandAssetVersion}`,
    width: 1200,
  },
  twitter: {
    alt: "OpenSyria social preview showing the OpenSyria wordmark and Syria map.",
    height: 600,
    url: `${siteConfig.url}/twitter-image.png?v=${brandAssetVersion}`,
    width: 1200,
  },
} as const

export function getLocalePath(locale: keyof typeof siteConfig.locales) {
  return locale === "en" ? "/" : `/${locale}`
}
