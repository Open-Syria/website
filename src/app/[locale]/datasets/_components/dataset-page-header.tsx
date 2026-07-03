import { getTranslations } from "next-intl/server"

import { SiteHeader } from "@/components/site-header"
import { DatasetPageNavigation } from "./dataset-page-navigation"

export async function DatasetPageHeader() {
  const t = await getTranslations("Datasets")

  return (
    <SiteHeader>
      <DatasetPageNavigation
        apiDocsLabel={t("apiDocs")}
        ariaLabel={t("navigation")}
        openDataLabel={t("openData")}
      />
    </SiteHeader>
  )
}
