const brandAssetVersion = "20260704-brand-wordmark"

export const siteConfig = {
  name: "OpenSyria",
  url: "https://opensyria.org",
  logo: `https://opensyria.org/web-app-manifest-512x512.png?v=${brandAssetVersion}`,
  defaultTitle: "OpenSyria | Syrian Open Data and APIs",
  defaultDescription:
    "OpenSyria publishes source-backed Syrian datasets and APIs for developers, maps, research, journalism, civic tools, and apps built for Syria.",
  keywords: [
    "OpenSyria",
    "Syria data",
    "Syrian datasets",
    "Syria data for developers",
    "Syrian API for developers",
    "Syrian cities dataset",
    "Syria governorates dataset",
    "Syria districts data",
    "Syria subdistricts",
    "Syria localities",
    "Syrian administrative divisions",
    "Syrian universities dataset",
    "Syria app data",
    "Syria CSV data",
    "Syria JSON data",
    "Syria API",
    "open data Syria",
    "civic intelligence",
    "public data commons",
  ],
  locales: {
    ar: {
      description:
        "OpenSyria تنشر مجموعات بيانات سورية موثقة وواجهات API للمطورين والخرائط والبحث والصحافة والأدوات المدنية والتطبيقات المبنية لسوريا.",
      ogLocale: "ar_SY",
      title: "OpenSyria | بيانات سورية مفتوحة وواجهات API",
    },
    en: {
      description:
        "OpenSyria publishes source-backed Syrian datasets and APIs for developers, maps, research, journalism, civic tools, and apps built for Syria.",
      ogLocale: "en_US",
      title: "OpenSyria | Syrian Open Data and APIs",
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
  universitiesRepository: "https://github.com/Open-Syria/data-universities",
}

export const organizationSameAsLinks = [
  siteLinks.githubOrganization,
  siteLinks.linkedIn,
] as const

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
