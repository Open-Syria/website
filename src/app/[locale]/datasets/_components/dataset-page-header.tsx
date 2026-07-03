import { getTranslations } from "next-intl/server"

import { SiteHeader } from "@/components/site-header"
import { siteLinks } from "@/lib/site"
import { DatasetPageNavigation } from "./dataset-page-navigation"

type DatasetPageHeaderProps = {
  apiDocsHref?: string
}

export async function DatasetPageHeader({
  apiDocsHref = siteLinks.docs,
}: DatasetPageHeaderProps = {}) {
  const t = await getTranslations("Datasets")

  return (
    <SiteHeader>
      <DatasetPageNavigation
        apiDocsHref={apiDocsHref}
        apiDocsLabel={t("apiDocs")}
        ariaLabel={t("navigation")}
        openDataLabel={t("openData")}
      />
    </SiteHeader>
  )
}
