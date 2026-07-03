import { getTranslations } from "next-intl/server"

import { SiteControls } from "@/components/site-controls"
import { OpenSyriaHorizontalLogo } from "@/components/ui/svgs/openSyriaHorizontalLogo"
import { Link } from "@/i18n/navigation"
import { DatasetPageNavigation } from "./dataset-page-navigation"

export async function DatasetPageHeader() {
  const t = await getTranslations("Datasets")

  return (
    <header className="border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          aria-label="OpenSyria"
          className="inline-flex h-10 shrink-0 items-center text-foreground [--opensyria-logo-foreground:currentColor] [--opensyria-logo-primary:var(--primary)]"
          href="/"
        >
          <OpenSyriaHorizontalLogo className="h-8 w-auto max-w-36 sm:h-9 sm:max-w-44" />
        </Link>

        <div className="flex items-center gap-2">
          <DatasetPageNavigation
            apiDocsLabel={t("apiDocs")}
            ariaLabel={t("summary")}
            openDataLabel={t("openData")}
          />
          <SiteControls />
        </div>
      </div>
    </header>
  )
}
