import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { routing } from "@/i18n/routing"
import { getDatasetBySlug, getDatasetSlugs } from "@/lib/datasets"
import { DatasetDetailPage } from "../_components/dataset-detail-page"
import type { DatasetParams } from "../_utils/locale"
import { resolveDatasetParams } from "../_utils/locale"
import { getDatasetStructuredData, toJsonLd } from "../_utils/structured-data"

export { generateDatasetMetadata as generateMetadata } from "../_utils/metadata"

type PageProps = {
  params: DatasetParams
}

export async function generateStaticParams() {
  const datasetSlugs = await getDatasetSlugs()

  return routing.locales.flatMap((locale) =>
    datasetSlugs.map((slug) => ({ locale, slug }))
  )
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await resolveDatasetParams(params)
  setRequestLocale(locale)

  const dataset = await getDatasetBySlug(slug)

  if (!dataset) {
    notFound()
  }

  return (
    <>
      <DatasetDetailPage dataset={dataset} locale={locale} />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD follows the official Next.js guide and escapes '<' before injection.
        dangerouslySetInnerHTML={{
          __html: toJsonLd(getDatasetStructuredData(locale, dataset)),
        }}
      />
    </>
  )
}
