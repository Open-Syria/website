import { cacheLife, cacheTag } from "next/cache"

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

export type DatasetCatalogItem = {
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
  updatedAt: string | null
}

export type DatasetSlug = string

type DatasetDescriptor = {
  description?: LocalizedText
  keywords?: readonly string[]
  recordGroupLabels?: Record<string, LocalizedText>
  recordGroupOrder?: readonly string[]
  repository?: string
  shortDescription?: LocalizedText
  slug: string
  title?: LocalizedText
  totalRecordArtifacts?: readonly string[]
}

type DatasetApiSummary = {
  apiEndpoints?: string[]
  category?: string
  description?: Partial<LocalizedText>
  id?: string
  name?: Partial<LocalizedText>
  repository?: string
  slug?: string
  status?: string
  updatedAt?: string | null
  version?: string | null
}

type DatasetApiResponse = {
  data?: {
    items?: DatasetApiSummary[]
  }
}

type GitHubReleaseAsset = {
  browser_download_url?: string
  name?: string
}

type GitHubRelease = {
  assets?: GitHubReleaseAsset[]
  published_at?: string | null
  tag_name?: string
}

type DatasetReleaseArtifact = {
  format?: string
  mediaType?: string
  name?: string
  path?: string
  recordCount?: number
  sizeBytes?: number
  url?: string
}

type DatasetReleaseManifest = {
  artifacts?: DatasetReleaseArtifact[]
  dataset?: {
    category?: string
    id?: string
    repository?: string
    slug?: string
    title?: Partial<LocalizedText>
  }
  generatedAt?: string
  release?: {
    publishedAt?: string | null
    status?: string
    version?: string
  }
}

type ReleaseData = {
  manifest: DatasetReleaseManifest | null
  manifestUrl: string | null
  release: GitHubRelease | null
}

const GITHUB_API_BASE = "https://api.github.com"
const RELEASE_MANIFEST_FILE = "release-manifest.json"

const datasetDescriptors = [
  {
    description: {
      ar: "مجموعة بيانات مفتوحة وموثقة للجغرافيا الإدارية السورية، متوفرة عبر JSON وCSV وصيغ أخرى وواجهات API موثقة.",
      en: "A source-backed open dataset for Syrian administrative geography, available through JSON, CSV, other export formats, and documented API endpoints.",
    },
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
    recordGroupLabels: {
      districts: { ar: "منطقة", en: "Districts" },
      governorates: { ar: "محافظة", en: "Governorates" },
      localities: {
        ar: "مدينة وبلدة وقرية ومحلة",
        en: "Localities",
      },
      subdistricts: { ar: "ناحية", en: "Subdistricts" },
    },
    recordGroupOrder: [
      "governorates",
      "districts",
      "subdistricts",
      "localities",
    ],
    repository: "data-geography",
    shortDescription: {
      ar: "محافظات ومناطق ونواح ومدن وبلدات وقرى ومحلات سورية.",
      en: "Governorates, districts, subdistricts, cities, towns, villages, and localities in Syria.",
    },
    slug: "geography",
    title: {
      ar: "بيانات المدن والمحافظات والمناطق السورية",
      en: "Syrian Cities, Governorates, Districts and Localities Dataset",
    },
    totalRecordArtifacts: [
      "governorates",
      "districts",
      "subdistricts",
      "localities",
    ],
  },
  {
    description: {
      ar: "مجموعة بيانات مفتوحة للجامعات والمعاهد العليا السورية تتضمن الأسماء العربية والإنجليزية، نوع المؤسسة، الحالة التشغيلية، الموقع العام، المواقع الرسمية، المعرفات الخارجية، الأصول العامة، ولقطات التصنيف المعتمدة.",
      en: "An open dataset for Syrian universities and higher institutes, including English and Arabic names, institution type, operating status, public location fields, official websites, external identifiers, approved public assets, and ranking snapshots.",
    },
    keywords: [
      "Syrian universities dataset",
      "Syria universities",
      "Syrian higher education data",
      "Syria university API",
      "Syrian university rankings",
      "جامعات سوريا",
      "بيانات الجامعات السورية",
    ],
    recordGroupLabels: {
      assets: { ar: "أصل شعار معتمد", en: "Approved logo assets" },
      rankings: { ar: "لقطة تصنيف", en: "Ranking snapshots" },
      universities: {
        ar: "جامعة ومعهد عال",
        en: "University profiles",
      },
    },
    recordGroupOrder: ["universities", "assets", "rankings"],
    repository: "data-universities",
    shortDescription: {
      ar: "جامعات ومعاهد سورية مع أسماء ومواقع ومعرفات وأصول عامة.",
      en: "Syrian universities and higher institutes with names, locations, identifiers, and public assets.",
    },
    slug: "universities",
    title: {
      ar: "بيانات الجامعات والمعاهد السورية",
      en: "Syrian Universities and Higher Education Dataset",
    },
    totalRecordArtifacts: ["universities"],
  },
] as const satisfies readonly DatasetDescriptor[]

const datasetDescriptorBySlug: ReadonlyMap<string, DatasetDescriptor> = new Map(
  datasetDescriptors.map((descriptor) => [descriptor.slug, descriptor])
)

const formatOrder = ["JSON", "NDJSON", "CSV", "SQL", "YAML", "XML"]

const mediaTypeByFormat: Record<string, string> = {
  CSV: "text/csv",
  JSON: "application/json",
  NDJSON: "application/x-ndjson",
  SQL: "application/sql",
  XML: "application/xml",
  YAML: "application/yaml",
}

export async function getDatasetCatalog(): Promise<DatasetCatalogItem[]> {
  "use cache"

  cacheLife("hours")
  cacheTag("dataset-catalog")

  const apiSummaries = await getDatasetApiSummaries()
  const releasedSummaries = apiSummaries.filter(isReleasedDatasetSummary)
  const sources =
    releasedSummaries.length > 0
      ? releasedSummaries
      : datasetDescriptors.map((descriptor) => ({
          repository: descriptor.repository,
          slug: descriptor.slug,
          status: "released",
        }))

  const catalog = await Promise.all(
    sources.map(async (summary) => {
      const descriptor = getDatasetDescriptor(summary)
      const releaseData = await getDatasetReleaseData(summary, descriptor)

      return buildDatasetCatalogItem(summary, descriptor, releaseData)
    })
  )

  return catalog.sort((first, second) =>
    first.title.en.localeCompare(second.title.en)
  )
}

export async function getDatasetBySlug(slug: string) {
  const catalog = await getDatasetCatalog()

  return catalog.find((dataset) => dataset.slug === slug)
}

export async function getDatasetSlugs() {
  const catalog = await getDatasetCatalog()

  return catalog.map((dataset) => dataset.slug)
}

function buildDatasetCatalogItem(
  summary: DatasetApiSummary,
  descriptor: DatasetDescriptor | undefined,
  releaseData: ReleaseData
): DatasetCatalogItem {
  const manifest = releaseData.manifest
  const repositoryName =
    summary.repository ??
    manifest?.dataset?.repository ??
    descriptor?.repository ??
    ""
  const repositoryUrl = getRepositoryUrl(repositoryName)
  const slug =
    summary.slug ??
    manifest?.dataset?.slug ??
    descriptor?.slug ??
    repositoryName
  const apiDescription = getLocalizedText(summary.description)
  const apiTitle = getLocalizedText(summary.name)
  const manifestTitle = getLocalizedText(manifest?.dataset?.title)
  const artifacts = getReleaseArtifacts(manifest)
  const distributions = getDistributions({
    artifacts,
    manifestUrl: releaseData.manifestUrl,
    releaseTag:
      manifest?.release?.version ??
      releaseData.release?.tag_name ??
      summary.version ??
      null,
    repositoryName,
  })
  const recordGroups = getRecordGroups(artifacts, descriptor)

  return {
    apiRoutes: summary.apiEndpoints ?? [],
    category: summary.category ?? manifest?.dataset?.category ?? "dataset",
    description:
      apiDescription ??
      descriptor?.description ??
      getFallbackLocalizedText(titleFromSlug(slug)),
    distributions,
    formats: getFormats(artifacts),
    id: summary.id ?? manifest?.dataset?.id ?? `opensyria-${slug}`,
    keywords: descriptor?.keywords ?? [],
    licenseUrl: `${repositoryUrl}/blob/main/LICENSE.md`,
    openApiUrl: `${getDatasetsApiBase()}/openapi/${slug}.json`,
    recordGroups,
    releaseTag:
      releaseData.release?.tag_name ??
      manifest?.release?.version ??
      summary.version ??
      "Unknown",
    repositoryName,
    repositoryUrl,
    shortDescription:
      apiDescription ??
      descriptor?.shortDescription ??
      getFallbackLocalizedText(titleFromSlug(slug)),
    slug,
    title:
      apiTitle ??
      manifestTitle ??
      descriptor?.title ??
      getFallbackLocalizedText(titleFromSlug(slug)),
    totalRecords: getTotalRecords(artifacts, descriptor),
    updatedAt:
      manifest?.release?.publishedAt ??
      summary.updatedAt ??
      releaseData.release?.published_at ??
      manifest?.generatedAt ??
      null,
  }
}

async function getDatasetReleaseData(
  summary: DatasetApiSummary,
  descriptor: DatasetDescriptor | undefined
): Promise<ReleaseData> {
  const repositoryName =
    summary.repository ??
    descriptor?.repository ??
    summary.slug ??
    descriptor?.slug

  if (!repositoryName) {
    return { manifest: null, manifestUrl: null, release: null }
  }

  const release = await getLatestGitHubRelease(repositoryName)
  const releaseTag = release?.tag_name ?? summary.version ?? null

  if (!releaseTag) {
    return { manifest: null, manifestUrl: null, release }
  }

  const manifestUrl =
    getReleaseAssetUrl(release, RELEASE_MANIFEST_FILE) ??
    getReleaseDownloadUrl(repositoryName, releaseTag, RELEASE_MANIFEST_FILE)
  const manifest = await fetchJson<DatasetReleaseManifest>(manifestUrl, {
    Accept: "application/json",
    "User-Agent": "OpenSyria-Website",
  })

  return { manifest, manifestUrl, release }
}

async function getDatasetApiSummaries(): Promise<DatasetApiSummary[]> {
  const response = await fetchJson<DatasetApiResponse>(
    `${getDatasetsApiBase()}/api/v1/datasets`,
    {
      Accept: "application/json",
      "User-Agent": "OpenSyria-Website",
    }
  )

  return response?.data?.items?.filter(isDatasetApiSummary) ?? []
}

async function getLatestGitHubRelease(repositoryName: string) {
  return fetchJson<GitHubRelease>(
    `${GITHUB_API_BASE}/repos/${getGitHubOrganizationName()}/${encodeURIComponent(repositoryName)}/releases/latest`,
    githubHeaders()
  )
}

async function fetchJson<T>(
  url: string,
  headers: Record<string, string>
): Promise<T | null> {
  try {
    const response = await fetch(url, { headers })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as T
  } catch {
    return null
  }
}

function getDatasetDescriptor(summary: DatasetApiSummary) {
  if (summary.slug) {
    return datasetDescriptorBySlug.get(summary.slug)
  }

  return datasetDescriptors.find(
    (descriptor) => descriptor.repository === summary.repository
  )
}

function getReleaseArtifacts(manifest: DatasetReleaseManifest | null) {
  return (manifest?.artifacts ?? []).filter(isReleaseArtifact)
}

function getDistributions({
  artifacts,
  manifestUrl,
  releaseTag,
  repositoryName,
}: {
  artifacts: DatasetReleaseArtifact[]
  manifestUrl: string | null
  releaseTag: string | null
  repositoryName: string
}) {
  const distributions: DatasetDistribution[] = []

  if (manifestUrl) {
    distributions.push({
      encodingFormat: "application/json",
      format: "JSON",
      name: RELEASE_MANIFEST_FILE,
      url: manifestUrl,
    })
  }

  for (const artifact of artifacts) {
    const format = getFormatLabel(artifact.format)

    if (!format || (artifact.recordCount ?? 0) <= 0) {
      continue
    }

    const name = getArtifactFileName(artifact)
    const fallbackUrl =
      repositoryName && releaseTag
        ? getReleaseDownloadUrl(repositoryName, releaseTag, name)
        : null
    const url = artifact.url ?? fallbackUrl

    if (!url) {
      continue
    }

    distributions.push({
      encodingFormat: artifact.mediaType ?? mediaTypeByFormat[format] ?? format,
      format,
      name,
      url,
    })
  }

  return distributions
}

function getFormats(artifacts: DatasetReleaseArtifact[]) {
  const formats = new Set(
    artifacts
      .filter((artifact) => (artifact.recordCount ?? 0) > 0)
      .map((artifact) => getFormatLabel(artifact.format))
      .filter(isString)
  )

  return Array.from(formats).sort(
    (first, second) =>
      getFormatSortIndex(first) - getFormatSortIndex(second) ||
      first.localeCompare(second)
  )
}

function getRecordGroups(
  artifacts: DatasetReleaseArtifact[],
  descriptor: DatasetDescriptor | undefined
) {
  const jsonArtifactsByName = new Map(
    artifacts
      .filter(
        (artifact) =>
          artifact.name &&
          artifact.format?.toLowerCase() === "json" &&
          (artifact.recordCount ?? 0) > 0
      )
      .map((artifact) => [artifact.name as string, artifact])
  )
  const recordNames =
    descriptor?.recordGroupOrder ??
    Array.from(jsonArtifactsByName.keys()).sort((first, second) =>
      first.localeCompare(second)
    )

  return recordNames.flatMap((name) => {
    const artifact = jsonArtifactsByName.get(name)

    if (!artifact?.recordCount) {
      return []
    }

    return [
      {
        count: artifact.recordCount,
        name:
          descriptor?.recordGroupLabels?.[name] ??
          getFallbackLocalizedText(titleFromSlug(name)),
      },
    ]
  })
}

function getTotalRecords(
  artifacts: DatasetReleaseArtifact[],
  descriptor: DatasetDescriptor | undefined
) {
  const totalRecordArtifacts =
    descriptor?.totalRecordArtifacts ?? descriptor?.recordGroupOrder
  const jsonArtifacts = artifacts.filter(
    (artifact) =>
      artifact.name &&
      artifact.format?.toLowerCase() === "json" &&
      (artifact.recordCount ?? 0) > 0 &&
      (!totalRecordArtifacts ||
        totalRecordArtifacts.includes(artifact.name as string))
  )

  return jsonArtifacts.reduce(
    (total, artifact) => total + (artifact.recordCount ?? 0),
    0
  )
}

function getReleaseAssetUrl(release: GitHubRelease | null, assetName: string) {
  return release?.assets?.find((asset) => asset.name === assetName)
    ?.browser_download_url
}

function getReleaseDownloadUrl(
  repositoryName: string,
  releaseTag: string,
  fileName: string
) {
  return `${getRepositoryUrl(repositoryName)}/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(fileName)}`
}

function getRepositoryUrl(repositoryName: string) {
  return `${siteLinks.githubOrganization}/${repositoryName}`
}

function getArtifactFileName(artifact: DatasetReleaseArtifact) {
  const pathFileName = artifact.path?.split(/[\\/]/).at(-1)

  if (pathFileName) {
    return pathFileName
  }

  return `${artifact.name}.${artifact.format}`
}

function getFormatLabel(format: string | undefined) {
  return format?.trim().toUpperCase()
}

function getFormatSortIndex(format: string) {
  const index = formatOrder.indexOf(format)

  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function getLocalizedText(value: Partial<LocalizedText> | undefined) {
  const en = value?.en
  const ar = value?.ar

  if (!(en || ar)) {
    return null
  }

  return {
    ar: ar ?? en ?? "",
    en: en ?? ar ?? "",
  }
}

function getFallbackLocalizedText(value: string): LocalizedText {
  return {
    ar: value,
    en: value,
  }
}

function titleFromSlug(value: string) {
  return value
    .replace(/^data[-_]/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getDatasetsApiBase() {
  return (
    process.env.NEXT_PUBLIC_DATASETS_API_URL?.replace(/\/+$/, "") ??
    siteLinks.datasetsApi
  )
}

function getGitHubOrganizationName() {
  return (
    siteLinks.githubOrganization.split("/").filter(Boolean).at(-1) ??
    "Open-Syria"
  )
}

function isReleasedDatasetSummary(summary: DatasetApiSummary) {
  return summary.status === "released" && Boolean(summary.repository)
}

function isDatasetApiSummary(value: DatasetApiSummary | undefined) {
  return Boolean(value?.slug && value.repository)
}

function isReleaseArtifact(
  artifact: DatasetReleaseArtifact
): artifact is Required<
  Pick<DatasetReleaseArtifact, "format" | "name" | "recordCount">
> &
  DatasetReleaseArtifact {
  return (
    typeof artifact.name === "string" &&
    typeof artifact.format === "string" &&
    typeof artifact.recordCount === "number"
  )
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "OpenSyria-Website",
    "X-GitHub-Api-Version": "2022-11-28",
  }
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
