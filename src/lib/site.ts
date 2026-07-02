export const siteConfig = {
  name: "OpenSyria",
  url: "https://opensyria.org",
  logo: "https://opensyria.org/web-app-manifest-512x512.png",
  defaultTitle: "OpenSyria | Open Civic Intelligence for Syria",
  defaultDescription:
    "OpenSyria is a public data commons for reliable Syrian datasets, API access, and civic intelligence.",
  keywords: [
    "OpenSyria",
    "Syria data",
    "Syrian datasets",
    "Syria API",
    "open data Syria",
    "civic intelligence",
    "public data commons",
  ],
  locales: {
    ar: {
      description:
        "OpenSyria يجمع بيانات سورية مفتوحة وموثقة للباحثين والمطورين والصحفيين، ويبنيها مع المجتمع عبر مجموعات بيانات واضحة وواجهات API.",
      ogLocale: "ar_SY",
      title: "OpenSyria | بيانات سورية مفتوحة بأيدي مجتمعها",
    },
    en: {
      description:
        "OpenSyria is a public data commons for reliable Syrian datasets, API access, and civic intelligence.",
      ogLocale: "en_US",
      title: "OpenSyria | Open Civic Intelligence for Syria",
    },
  },
} as const

export const siteLinks = {
  apiRepository: "https://github.com/Open-Syria/datasets-api",
  docs: "https://api.opensyria.org/docs",
  githubOrganization: "https://github.com/Open-Syria",
}

export function getLocalePath(locale: keyof typeof siteConfig.locales) {
  return locale === "en" ? "/" : `/${locale}`
}
