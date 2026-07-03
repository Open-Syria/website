export const siteConfig = {
  name: "OpenSyria",
  url: "https://opensyria.org",
  logo: "https://opensyria.org/web-app-manifest-512x512.png",
  defaultTitle: "OpenSyria | Syrian Cities, Districts and Open Data",
  defaultDescription:
    "OpenSyria publishes source-backed Syrian datasets for cities, governorates, districts, subdistricts, localities, universities and API access.",
  keywords: [
    "OpenSyria",
    "Syria data",
    "Syrian datasets",
    "Syrian cities dataset",
    "Syria governorates dataset",
    "Syria districts data",
    "Syria subdistricts",
    "Syria localities",
    "Syrian administrative divisions",
    "Syrian universities dataset",
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
        "OpenSyria ينشر بيانات سورية مفتوحة وموثقة عن المدن والمحافظات والمناطق والنواحي والبلدات والجامعات مع تنزيلات وواجهات API.",
      ogLocale: "ar_SY",
      title: "OpenSyria | بيانات المدن والمناطق السورية المفتوحة",
    },
    en: {
      description:
        "OpenSyria publishes source-backed Syrian datasets for cities, governorates, districts, subdistricts, localities, universities and API access.",
      ogLocale: "en_US",
      title: "OpenSyria | Syrian Cities, Districts and Open Data",
    },
  },
} as const

export const siteLinks = {
  apiRepository: "https://github.com/Open-Syria/datasets-api",
  datasetsApi: "https://api.opensyria.org",
  docs: "https://api.opensyria.org/docs",
  geographyRepository: "https://github.com/Open-Syria/data-geography",
  githubOrganization: "https://github.com/Open-Syria",
  universitiesRepository: "https://github.com/Open-Syria/data-universities",
}

export function getLocalePath(locale: keyof typeof siteConfig.locales) {
  return locale === "en" ? "/" : `/${locale}`
}
