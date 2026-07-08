const brandAssetVersion = "20260704-brand-wordmark"

export const siteConfig = {
  name: "OpenSyria",
  url: "https://opensyria.org",
  logo: `https://opensyria.org/web-app-manifest-512x512.png?v=${brandAssetVersion}`,
  defaultTitle: "OpenSyria | Syrian Datasets, Maps and Research Data",
  defaultDescription:
    "OpenSyria publishes source-backed Syrian datasets for cities, governorates, universities, transport, maps, research, journalism, civic tools, and Syria-focused apps.",
  keywords: [
    "OpenSyria",
    "Syria data",
    "Syrian datasets",
    "Syria data for developers",
    "Syrian cities dataset",
    "Syrian cities data",
    "Syrian cities CSV",
    "Syria governorates dataset",
    "Syria districts data",
    "Syria subdistricts",
    "Syria localities",
    "Syrian administrative divisions",
    "Syrian universities dataset",
    "Syrian universities data",
    "Syrian university rankings",
    "Syrian higher education data",
    "Syrian transport dataset",
    "Syria transport data",
    "Syria airports dataset",
    "Syria border crossings data",
    "Syria ports data",
    "Syria maps data",
    "Syria app data",
    "Syria CSV data",
    "Syria JSON data",
    "open data Syria",
    "civic intelligence",
    "public data commons",
    "بيانات سوريا",
    "بيانات سورية",
    "بيانات المدن السورية",
    "بيانات المحافظات السورية",
    "بيانات الجامعات السورية",
    "تصنيفات الجامعات السورية",
  ],
  locales: {
    ar: {
      description:
        "OpenSyria تنشر بيانات سورية موثقة للمدن والمحافظات والمناطق والجامعات، مع تنزيلات JSON وCSV ومراجع للخرائط والبحث والصحافة.",
      ogLocale: "ar_SY",
      title: "OpenSyria | بيانات سورية للمدن والجامعات والخرائط",
    },
    en: {
      description:
        "OpenSyria publishes source-backed Syrian datasets for cities, governorates, universities, transport, maps, research, journalism, civic tools, and Syria-focused apps.",
      ogLocale: "en_US",
      title: "OpenSyria | Syrian Datasets, Maps and Research Data",
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
  transportRepository: "https://github.com/Open-Syria/data-transport",
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
