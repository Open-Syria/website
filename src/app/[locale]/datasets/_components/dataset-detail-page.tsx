import { ArrowUpRight, BookOpenText, Download, ListTree } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GithubDark } from "@/components/ui/svgs/githubDark"
import type { Locale } from "@/i18n/routing"
import type { DatasetCatalogItem } from "@/lib/datasets"
import { trustedExternalLinkRel } from "@/lib/links"
import { cn } from "@/lib/utils"
import { getDatasetBreadcrumbs } from "../_utils/breadcrumbs"
import { DatasetBreadcrumbs } from "./dataset-breadcrumbs"
import { DatasetPageHeader } from "./dataset-page-header"

type DatasetDetailPageProps = {
  dataset: DatasetCatalogItem
  locale: Locale
}

export async function DatasetDetailPage({
  dataset,
  locale,
}: DatasetDetailPageProps) {
  const t = await getTranslations("Datasets")
  const numberFormatter = new Intl.NumberFormat(locale)
  const hasScrollableDownloads = dataset.distributions.length > 8
  const breadcrumbs = getDatasetBreadcrumbs(locale, dataset)

  return (
    <>
      <DatasetPageHeader apiDocsHref={dataset.apiDocsUrl} />

      <main
        className="min-h-svh bg-background-light text-foreground"
        id="main-content"
      >
        <section aria-labelledby="dataset-title" className="page-hero-section">
          <div
            className={cn(
              "page-content",
              "grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start"
            )}
          >
            <div>
              <DatasetBreadcrumbs items={breadcrumbs} />
              <h1
                className="max-w-4xl text-balance font-heading font-semibold text-4xl leading-tight sm:text-5xl"
                id="dataset-title"
              >
                {dataset.title[locale]}
              </h1>
              <p className="mt-5 max-w-3xl text-muted-foreground leading-7">
                {dataset.description[locale]}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <a
                  className={buttonVariants({ size: "lg" })}
                  href={dataset.repositoryUrl}
                  rel={trustedExternalLinkRel}
                  target="_blank"
                >
                  <GithubDark className="size-5" />
                  {t("githubRepository")}
                </a>
                <a
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                  href={dataset.apiDocsUrl}
                  rel={trustedExternalLinkRel}
                  target="_blank"
                >
                  <BookOpenText aria-hidden="true" />
                  {t("apiDocs")}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="rtl-icon-mirror"
                  />
                </a>
                <a
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                  href={dataset.distributions[0]?.url}
                  rel={trustedExternalLinkRel}
                  target="_blank"
                >
                  <Download aria-hidden="true" />
                  {t("downloadFiles")}
                </a>
              </div>
            </div>

            <aside className="rounded-md border bg-card p-5 text-card-foreground shadow-sm">
              <h2 className="font-heading font-semibold text-lg">
                {t("summary")}
              </h2>
              <dl className="mt-4 grid gap-4">
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("records")}
                  </dt>
                  <dd className="mt-1 font-semibold text-2xl">
                    {numberFormatter.format(dataset.totalRecords)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("latestRelease")}
                  </dt>
                  <dd className="mt-1 font-semibold">{dataset.releaseTag}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("formats")}
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {dataset.formats.map((format) => (
                      <span
                        className="rounded-md border bg-background px-2 py-1 font-medium text-xs"
                        key={format}
                      >
                        {format}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <div className="page-body-section">
          <div
            className={cn("page-content", "grid gap-5 lg:grid-cols-[1fr_1fr]")}
          >
            <section
              aria-labelledby="dataset-contains"
              className="rounded-md border bg-card p-5 shadow-sm"
            >
              <h2
                className="flex items-center gap-2 font-heading font-semibold text-xl"
                id="dataset-contains"
              >
                <ListTree aria-hidden="true" className="size-5 text-primary" />
                {t("contains")}
              </h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {dataset.recordGroups.map((group) => (
                  <div
                    className="rounded-md border bg-background p-4"
                    key={group.name.en}
                  >
                    <dt className="text-muted-foreground text-sm">
                      {group.name[locale]}
                    </dt>
                    <dd className="mt-1 font-semibold text-2xl">
                      {numberFormatter.format(group.count)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="dataset-api"
              className="rounded-md border bg-card p-5 shadow-sm"
            >
              <h2
                className="font-heading font-semibold text-xl"
                id="dataset-api"
              >
                {t("apiEndpoints")}
              </h2>
              <ul className="mt-5 grid gap-2">
                {dataset.apiRoutes.map((route) => (
                  <li key={route}>
                    <code
                      className="block break-all rounded-md border bg-background px-3 py-2 text-left text-sm"
                      dir="ltr"
                    >
                      {route}
                    </code>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="dataset-downloads"
              className="rounded-md border bg-card p-5 shadow-sm"
            >
              <h2
                className="font-heading font-semibold text-xl"
                id="dataset-downloads"
              >
                {t("downloadFiles")}
              </h2>
              <ScrollArea
                className={cn(
                  "mt-5 rounded-md",
                  hasScrollableDownloads && "h-80 sm:h-96"
                )}
                viewportClassName={cn(hasScrollableDownloads && "pe-3")}
                viewportProps={
                  hasScrollableDownloads
                    ? {
                        "aria-labelledby": "dataset-downloads",
                        role: "region",
                        tabIndex: 0,
                      }
                    : undefined
                }
              >
                <ul className="grid gap-2">
                  {dataset.distributions.map((distribution) => (
                    <li key={`${distribution.name}-${distribution.format}`}>
                      <a
                        className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm transition hover:border-primary/50 hover:text-primary focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        href={distribution.url}
                        rel={trustedExternalLinkRel}
                        target="_blank"
                      >
                        <span className="break-all font-medium">
                          {distribution.name}
                        </span>
                        <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-secondary-foreground text-xs">
                          {distribution.format}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </section>

            <section
              aria-labelledby="dataset-reuse"
              className="flex h-full flex-col rounded-md border bg-card p-5 shadow-sm"
            >
              <h2
                className="font-heading font-semibold text-xl"
                id="dataset-reuse"
              >
                {t("reuseTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground leading-7">
                {t("reuseDescription")}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-8">
                <span className="rounded-md border bg-background px-2.5 py-1 font-medium text-sm">
                  {t("sourceBacked")}
                </span>
                <span className="rounded-md border bg-background px-2.5 py-1 font-medium text-sm">
                  {t("openData")}
                </span>
              </div>
            </section>
          </div>
        </div>

        <section
          aria-labelledby="dataset-keywords"
          className="page-footer-section"
        >
          <div className="page-content">
            <div className="rounded-md border bg-card p-5 shadow-sm">
              <h2
                className="font-heading font-semibold text-xl"
                id="dataset-keywords"
              >
                {t("keywords")}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {dataset.keywords.map((keyword) => (
                  <li
                    className="rounded-md border bg-background px-2.5 py-1 text-muted-foreground text-sm"
                    key={keyword}
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
