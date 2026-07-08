import { connection } from "next/server"
import { setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import type { Locale } from "@/i18n/routing"
import { getDatasetCatalog } from "@/lib/datasets"
import { DatasetCatalogPage } from "./_components/dataset-catalog-page"
import type { LocaleParams } from "./_utils/locale"
import { resolvePageLocale } from "./_utils/locale"
import {
  getDatasetCatalogStructuredData,
  toJsonLd,
} from "./_utils/structured-data"

export { generateDatasetCatalogMetadata as generateMetadata } from "./_utils/metadata"

type PageProps = {
  params: LocaleParams
}

export default async function Page({ params }: PageProps) {
  const locale = await resolvePageLocale(params)
  setRequestLocale(locale)

  return (
    <Suspense fallback={null}>
      <DatasetCatalogRuntime locale={locale} />
    </Suspense>
  )
}

async function DatasetCatalogRuntime({ locale }: { locale: Locale }) {
  await connection()

  const datasets = await getDatasetCatalog()

  return (
    <>
      <DatasetCatalogPage datasets={datasets} locale={locale} />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD follows the official Next.js guide and escapes '<' before injection.
        dangerouslySetInnerHTML={{
          __html: toJsonLd(getDatasetCatalogStructuredData(locale, datasets)),
        }}
      />
    </>
  )
}
