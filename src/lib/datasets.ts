import type { Locale } from "@/i18n/routing"
import { getLocalePath, siteConfig, siteLinks } from "@/lib/site"

type LocalizedText = Record<Locale, string>

type DatasetRecordGroup = {
  count: number
  name: LocalizedText
}

type DatasetDistribution = {
  encodingFormat: string
  format: string
  name: string
  url: string
}

type DatasetCatalogEntry = {
  apiRoutes: readonly string[]
  category: string
  description: LocalizedText
  distributions: readonly DatasetDistribution[]
  formats: readonly string[]
  id: string
  keywords: readonly string[]
  licenseUrl: string
  openApiUrl: string
  recordGroups: readonly DatasetRecordGroup[]
  releaseTag: string
  repositoryName: string
  repositoryUrl: string
  shortDescription: LocalizedText
  slug: string
  title: LocalizedText
  totalRecords: number
}

const releaseDownloadBase =
  "https://github.com/Open-Syria/data-geography/releases/download/v0.1.3"

const universityReleaseDownloadBase =
  "https://github.com/Open-Syria/data-universities/releases/download/v0.2.0"

export const datasetCatalog = [
  {
    apiRoutes: [
      "/api/v1/geography/governorates",
      "/api/v1/geography/governorates/{governorateId}",
      "/api/v1/geography/districts",
      "/api/v1/geography/districts/{districtId}",
      "/api/v1/geography/subdistricts",
      "/api/v1/geography/subdistricts/{subdistrictId}",
      "/api/v1/geography/localities",
      "/api/v1/geography/localities/{localityId}",
    ],
    category: "geography",
    description: {
      ar: "مجموعة بيانات مفتوحة وموثقة للجغرافيا الإدارية السورية: 14 محافظة، 62 منطقة، 272 ناحية، و7,605 مدينة وبلدة وقرية ومحلة. تتوفر عبر JSON وCSV وصيغ أخرى وواجهات API موثقة.",
      en: "A source-backed open dataset for Syrian administrative geography: 14 governorates, 62 districts, 272 subdistricts, and 7,605 cities, towns, villages, and localities. Available through JSON, CSV, other export formats, and documented API endpoints.",
    },
    distributions: [
      {
        encodingFormat: "application/json",
        format: "JSON",
        name: "release-manifest.json",
        url: `${releaseDownloadBase}/release-manifest.json`,
      },
      {
        encodingFormat: "application/json",
        format: "JSON",
        name: "localities.json",
        url: `${releaseDownloadBase}/localities.json`,
      },
      {
        encodingFormat: "text/csv",
        format: "CSV",
        name: "localities.csv",
        url: `${releaseDownloadBase}/localities.csv`,
      },
      {
        encodingFormat: "application/json",
        format: "JSON",
        name: "districts.json",
        url: `${releaseDownloadBase}/districts.json`,
      },
      {
        encodingFormat: "text/csv",
        format: "CSV",
        name: "districts.csv",
        url: `${releaseDownloadBase}/districts.csv`,
      },
    ],
    formats: ["JSON", "NDJSON", "CSV", "SQL", "YAML", "XML"],
    id: "opensyria-geography",
    keywords: [
      "Syrian cities dataset",
      "Syria governorates",
      "Syria districts",
      "Syria subdistricts",
      "Syria localities",
      "Syrian towns and villages",
      "Syrian administrative divisions",
      "Syria places CSV",
      "Syria geography API",
      "بيانات المدن السورية",
      "محافظات سوريا",
      "مناطق سوريا",
      "نواحي سوريا",
    ],
    licenseUrl: `${siteLinks.geographyRepository}/blob/main/LICENSE.md`,
    openApiUrl: `${siteLinks.datasetsApi}/openapi/geography.json`,
    recordGroups: [
      { count: 14, name: { ar: "محافظة", en: "Governorates" } },
      { count: 62, name: { ar: "منطقة", en: "Districts" } },
      { count: 272, name: { ar: "ناحية", en: "Subdistricts" } },
      {
        count: 7605,
        name: { ar: "مدينة وبلدة وقرية ومحلة", en: "Localities" },
      },
    ],
    releaseTag: "v0.1.3",
    repositoryName: "data-geography",
    repositoryUrl: siteLinks.geographyRepository,
    shortDescription: {
      ar: "محافظات ومناطق ونواح ومدن وبلدات وقرى ومحلات سورية.",
      en: "Governorates, districts, subdistricts, cities, towns, villages, and localities in Syria.",
    },
    slug: "geography",
    title: {
      ar: "بيانات المدن والمحافظات والمناطق السورية",
      en: "Syrian Cities, Governorates, Districts and Localities Dataset",
    },
    totalRecords: 7953,
  },
  {
    apiRoutes: ["/api/v1/universities", "/api/v1/universities/{universityId}"],
    category: "education",
    description: {
      ar: "مجموعة بيانات مفتوحة للجامعات والمعاهد العليا السورية تتضمن الأسماء العربية والإنجليزية، نوع المؤسسة، الحالة التشغيلية، الموقع العام، المواقع الرسمية، المعرفات الخارجية، الأصول العامة، ولقطات التصنيف المعتمدة.",
      en: "An open dataset for Syrian universities and higher institutes, including English and Arabic names, institution type, operating status, public location fields, official websites, external identifiers, approved public assets, and ranking snapshots.",
    },
    distributions: [
      {
        encodingFormat: "application/json",
        format: "JSON",
        name: "release-manifest.json",
        url: `${universityReleaseDownloadBase}/release-manifest.json`,
      },
      {
        encodingFormat: "application/json",
        format: "JSON",
        name: "universities.json",
        url: `${universityReleaseDownloadBase}/universities.json`,
      },
      {
        encodingFormat: "text/csv",
        format: "CSV",
        name: "universities.csv",
        url: `${universityReleaseDownloadBase}/universities.csv`,
      },
    ],
    formats: ["JSON", "NDJSON", "CSV", "SQL", "YAML", "XML"],
    id: "opensyria-universities",
    keywords: [
      "Syrian universities dataset",
      "Syria universities",
      "Syrian higher education data",
      "Syria university API",
      "Syrian university rankings",
      "جامعات سوريا",
      "بيانات الجامعات السورية",
    ],
    licenseUrl: `${siteLinks.universitiesRepository}/blob/main/LICENSE.md`,
    openApiUrl: `${siteLinks.datasetsApi}/openapi/universities.json`,
    recordGroups: [
      { count: 57, name: { ar: "جامعة ومعهد عال", en: "University profiles" } },
      { count: 57, name: { ar: "أصل شعار معتمد", en: "Approved logo assets" } },
      { count: 65, name: { ar: "لقطة تصنيف", en: "Ranking snapshots" } },
    ],
    releaseTag: "v0.2.0",
    repositoryName: "data-universities",
    repositoryUrl: siteLinks.universitiesRepository,
    shortDescription: {
      ar: "جامعات ومعاهد سورية مع أسماء ومواقع ومعرفات وأصول عامة.",
      en: "Syrian universities and higher institutes with names, locations, identifiers, and public assets.",
    },
    slug: "universities",
    title: {
      ar: "بيانات الجامعات والمعاهد السورية",
      en: "Syrian Universities and Higher Education Dataset",
    },
    totalRecords: 57,
  },
] as const satisfies readonly DatasetCatalogEntry[]

export type DatasetSlug = (typeof datasetCatalog)[number]["slug"]
export type DatasetCatalogItem = (typeof datasetCatalog)[number]

export const datasetSlugs = datasetCatalog.map((dataset) => dataset.slug)

export function getDatasetBySlug(slug: string) {
  return datasetCatalog.find((dataset) => dataset.slug === slug)
}

export function getLocalizedPath(locale: Locale, pathname = "") {
  const localePath = getLocalePath(locale)
  const normalizedPath = pathname.replace(/^\/+/, "").replace(/\/+$/, "")

  if (!normalizedPath) {
    return localePath
  }

  return localePath === "/"
    ? `/${normalizedPath}`
    : `${localePath}/${normalizedPath}`
}

export function getDatasetsPath(locale: Locale) {
  return getLocalizedPath(locale, "datasets")
}

export function getDatasetPath(locale: Locale, slug: DatasetSlug | string) {
  return getLocalizedPath(locale, `datasets/${slug}`)
}

export function getAbsoluteUrl(path: string) {
  return `${siteConfig.url}${path}`
}
