import { setRequestLocale } from "next-intl/server"

import { getDatasetCatalog } from "@/lib/datasets"
import { ApiPage } from "./_components/api-page"
import { type ApiPageParams, resolveApiLocale } from "./_utils/locale"
import { getApiStructuredData, toJsonLd } from "./_utils/structured-data"

export { generateMetadata } from "./_utils/metadata"

type PageProps = Readonly<{
  params: ApiPageParams
}>

export default async function Page({ params }: PageProps) {
  const locale = await resolveApiLocale(params)
  const datasets = await getDatasetCatalog()

  setRequestLocale(locale)

  return (
    <>
      <ApiPage datasets={datasets} locale={locale} />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD follows the official Next.js guide and escapes '<' before injection.
        dangerouslySetInnerHTML={{
          __html: toJsonLd(getApiStructuredData(locale)),
        }}
      />
    </>
  )
}
