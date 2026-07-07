import { ArrowUpRight, Database, Download } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@/components/ui/button"
import { GithubDark } from "@/components/ui/svgs/githubDark"
import { GithubLight } from "@/components/ui/svgs/githubLight"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import type { DatasetCatalogItem } from "@/lib/datasets"
import { trustedExternalLinkRel } from "@/lib/links"
import { cn } from "@/lib/utils"
import { getDatasetCatalogBreadcrumbs } from "../_utils/breadcrumbs"
import { DatasetBreadcrumbs } from "./dataset-breadcrumbs"
import { DatasetPageHeader } from "./dataset-page-header"

type DatasetCatalogPageProps = {
  datasets: readonly DatasetCatalogItem[]
  locale: Locale
}

export async function DatasetCatalogPage({
  datasets,
  locale,
}: DatasetCatalogPageProps) {
  const t = await getTranslations("Datasets")
  const numberFormatter = new Intl.NumberFormat(locale)
  const breadcrumbs = getDatasetCatalogBreadcrumbs(locale)

  return (
    <>
      <DatasetPageHeader />

      <main
        className="min-h-svh bg-background-light text-foreground"
        id="main-content"
      >
        <section
          aria-labelledby="dataset-catalog-title"
          className="page-hero-section"
        >
          <div className="page-content">
            <DatasetBreadcrumbs items={breadcrumbs} />
            <h1
              className="max-w-4xl text-balance font-heading font-semibold text-4xl leading-tight sm:text-5xl"
              id="dataset-catalog-title"
            >
              {t("catalogTitle")}
            </h1>
            <p className="mt-5 max-w-3xl text-muted-foreground leading-7">
              {t("catalogDescription")}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="dataset-catalog-list"
          className="page-body-section"
        >
          <div className={cn("page-content", "grid gap-5 md:grid-cols-2")}>
            <h2 className="sr-only" id="dataset-catalog-list">
              {t("catalogList")}
            </h2>
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
                    <h3 className="mt-2 text-balance font-heading font-semibold text-2xl leading-tight">
                      {dataset.title[locale]}
                    </h3>
                  </div>
                  <Database
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-primary"
                  />
                </div>

                <p className="mt-4 text-muted-foreground leading-7">
                  {dataset.shortDescription[locale]}
                </p>

                <div className="mt-auto pt-8">
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-md border bg-background p-3">
                      <dt className="text-muted-foreground">{t("records")}</dt>
                      <dd className="mt-1 font-semibold text-lg">
                        {numberFormatter.format(dataset.totalRecords)}
                      </dd>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <dt className="text-muted-foreground">
                        {t("latestRelease")}
                      </dt>
                      <dd className="mt-1 font-semibold text-lg">
                        {dataset.releaseTag}
                      </dd>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <dt className="text-muted-foreground">{t("formats")}</dt>
                      <dd className="mt-1 font-semibold text-lg">
                        {dataset.formats.length}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      className={buttonVariants({ size: "lg" })}
                      href={`/datasets/${dataset.slug}`}
                    >
                      {t("openDataset")}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="rtl-icon-mirror"
                      />
                    </Link>
                    <a
                      className={buttonVariants({
                        size: "lg",
                        variant: "outline",
                      })}
                      href={dataset.repositoryUrl}
                      rel={trustedExternalLinkRel}
                      target="_blank"
                    >
                      <GithubLight className="size-5 dark:hidden" />
                      <GithubDark className="hidden size-5 dark:block" />
                      {t("githubRepository")}
                    </a>
                    <a
                      className={buttonVariants({
                        size: "lg",
                        variant: "outline",
                      })}
                      href={dataset.distributions[0]?.url}
                      rel={trustedExternalLinkRel}
                      target="_blank"
                    >
                      <Download aria-hidden="true" />
                      {t("downloadFiles")}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
