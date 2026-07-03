import { ArrowUpRight, Database, FileDown } from "lucide-react"
import { cacheLife } from "next/cache"
import NextLink from "next/link"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@/components/ui/button"
import { getPathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getDatasetCatalog } from "@/lib/datasets"
import { pageContainerClassName, pageGutterClassName } from "@/lib/layout"
import { cn } from "@/lib/utils"

type DatasetHighlightsProps = Readonly<{
  locale: Locale
}>

export async function DatasetHighlights({ locale }: DatasetHighlightsProps) {
  "use cache"

  cacheLife("hours")

  const t = await getTranslations({ locale, namespace: "HomeDatasets" })
  const datasets = await getDatasetCatalog()
  const numberFormatter = new Intl.NumberFormat(locale)

  return (
    <section
      aria-labelledby="home-datasets-title"
      className={cn("bg-background py-16", pageGutterClassName)}
    >
      <div
        className={cn(
          pageContainerClassName,
          "grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start"
        )}
      >
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-border bg-background-light px-3 py-1.5 font-medium text-sm">
            <Database aria-hidden="true" className="size-4 text-primary" />
            {t("eyebrow")}
          </p>
          <h2
            className="mt-5 max-w-2xl text-balance font-heading font-semibold text-3xl leading-tight sm:text-4xl"
            id="home-datasets-title"
          >
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-7">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {datasets.map((dataset) => (
            <article
              className="flex h-full flex-col rounded-md border bg-card p-5 text-card-foreground shadow-sm"
              key={dataset.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    {dataset.repositoryName}
                  </p>
                  <h3 className="mt-2 text-balance font-heading font-semibold text-xl leading-tight">
                    {dataset.title[locale]}
                  </h3>
                </div>
                <FileDown
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-primary"
                />
              </div>

              <p className="mt-4 text-muted-foreground text-sm leading-6">
                {dataset.shortDescription[locale]}
              </p>

              <div className="mt-auto pt-7">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t("records")}</dt>
                    <dd className="mt-1 font-semibold">
                      {numberFormatter.format(dataset.totalRecords)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("release")}</dt>
                    <dd className="mt-1 font-semibold">{dataset.releaseTag}</dd>
                  </div>
                </dl>

                <NextLink
                  className={buttonVariants({
                    className: "mt-5 w-full",
                    size: "lg",
                    variant: "outline",
                  })}
                  href={getPathname({
                    href: `/datasets/${dataset.slug}`,
                    locale,
                  })}
                >
                  {t("openDataset")}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="rtl-icon-mirror"
                  />
                </NextLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
