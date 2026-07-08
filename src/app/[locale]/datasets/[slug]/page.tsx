import { notFound } from "next/navigation"
import { connection } from "next/server"
import { setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { getDatasetBySlug } from "@/lib/datasets"
import { DatasetDetailPage } from "../_components/dataset-detail-page"
import type { DatasetParams } from "../_utils/locale"
import { resolveDatasetParams } from "../_utils/locale"
import { getDatasetStructuredData, toJsonLd } from "../_utils/structured-data"

export { generateDatasetMetadata as generateMetadata } from "../_utils/metadata"

type PageProps = {
  params: DatasetParams
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await resolveDatasetParams(params)
  setRequestLocale(locale)

  return (
    <Suspense fallback={null}>
      <DatasetDetailRuntime locale={locale} slug={slug} />
    </Suspense>
  )
}

async function DatasetDetailRuntime({
  locale,
  slug,
}: Awaited<ReturnType<typeof resolveDatasetParams>>) {
  await connection()

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
