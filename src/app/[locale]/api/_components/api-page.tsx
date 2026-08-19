import {
  ArrowUpRight,
  BookOpenText,
  Braces,
  CheckCircle2,
  Database,
  ShieldCheck,
  Terminal,
} from "lucide-react"
import { getTranslations } from "next-intl/server"

import { SiteHeader } from "@/components/site-header"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import type { DatasetCatalogItem } from "@/lib/datasets"
import { trustedExternalLinkRel } from "@/lib/links"
import { siteLinks } from "@/lib/site"
import { cn } from "@/lib/utils"

type ApiPageProps = Readonly<{
  datasets: readonly DatasetCatalogItem[]
  locale: Locale
}>

const workflowSteps = ["discover", "query", "verify"] as const

export async function ApiPage({ datasets, locale }: ApiPageProps) {
  const t = await getTranslations({ locale, namespace: "Api" })
  const exampleCommand = `curl --request GET \\
  --url ${siteLinks.datasetsApi}/api/v1/datasets \\
  --header 'accept: application/json'`

  return (
    <>
      <SiteHeader>
        <Link
          className={cn(
            buttonVariants({ size: "sm", variant: "ghost" }),
            "hidden sm:inline-flex"
          )}
          href="/datasets"
        >
          <Database aria-hidden="true" />
          {t("browseDatasets")}
        </Link>
      </SiteHeader>

      <main
        className="min-h-svh bg-background-light text-foreground"
        id="main-content"
      >
        <section aria-labelledby="api-title" className="page-hero-section">
          <div
            className={cn(
              "page-content",
              "grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
            )}
          >
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 font-medium text-sm shadow-sm">
                <Braces aria-hidden="true" className="size-4 text-primary" />
                {t("eyebrow")}
              </p>
              <h1
                className="mt-6 max-w-4xl text-balance font-heading font-semibold text-4xl leading-tight sm:text-5xl"
                id="api-title"
              >
                {t("title")}
              </h1>
              <p className="mt-5 max-w-3xl text-muted-foreground leading-7">
                {t("description")}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <a
                  className={buttonVariants({ size: "lg" })}
                  href={siteLinks.docs}
                  rel={trustedExternalLinkRel}
                  target="_blank"
                >
                  <BookOpenText aria-hidden="true" />
                  {t("openDocs")}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="rtl-icon-mirror"
                  />
                </a>
                <a
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                  href={siteLinks.openApi}
                  rel={trustedExternalLinkRel}
                  target="_blank"
                >
                  <Braces aria-hidden="true" />
                  {t("openApiSchema")}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="rtl-icon-mirror"
                  />
                </a>
              </div>
            </div>

            <aside className="rounded-md border bg-card p-5 text-card-foreground shadow-sm">
              <h2 className="font-heading font-semibold text-lg">
                {t("apiSummary")}
              </h2>
              <dl className="mt-4 grid gap-4">
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("baseUrl")}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm" dir="ltr">
                    {siteLinks.datasetsApi}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("access")}
                  </dt>
                  <dd className="mt-1 font-semibold">{t("publicReadOnly")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("responseFormat")}
                  </dt>
                  <dd className="mt-1 font-semibold">JSON · OpenAPI 3.1</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">
                    {t("rateLimit")}
                  </dt>
                  <dd className="mt-1 font-semibold">{t("rateLimitValue")}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section
          aria-labelledby="quickstart-title"
          className="page-body-section"
        >
          <div
            className={cn(
              "page-content",
              "grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"
            )}
          >
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Terminal aria-hidden="true" className="size-5" />
                <p className="font-medium text-sm">{t("quickstartEyebrow")}</p>
              </div>
              <h2
                className="mt-3 text-balance font-heading font-semibold text-3xl"
                id="quickstart-title"
              >
                {t("quickstartTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground leading-7">
                {t("quickstartDescription")}
              </p>
            </div>

            <pre
              className="overflow-x-auto rounded-md border bg-foreground p-5 text-background text-sm shadow-sm"
              dir="ltr"
            >
              <code>{exampleCommand}</code>
            </pre>
          </div>
        </section>

        <section
          aria-labelledby="api-datasets-title"
          className="border-y bg-background py-16"
        >
          <div className="page-content">
            <div className="max-w-3xl">
              <p className="font-medium text-primary text-sm">
                {t("coverageEyebrow")}
              </p>
              <h2
                className="mt-3 text-balance font-heading font-semibold text-3xl"
                id="api-datasets-title"
              >
                {t("coverageTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground leading-7">
                {t("coverageDescription")}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {datasets.map((dataset) => {
                const hiddenEndpointCount = Math.max(
                  dataset.apiRoutes.length - 3,
                  0
                )

                return (
                  <article
                    className="flex h-full flex-col rounded-md border bg-card p-5 shadow-sm"
                    key={dataset.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          {t("recordCount", { count: dataset.totalRecords })}
                        </p>
                        <h3 className="mt-2 text-balance font-heading font-semibold text-xl">
                          <Link
                            className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            href={`/datasets/${dataset.slug}`}
                          >
                            {dataset.title[locale]}
                          </Link>
                        </h3>
                      </div>
                      <Database
                        aria-hidden="true"
                        className="mt-1 size-5 shrink-0 text-primary"
                      />
                    </div>
                    <p className="mt-4 text-muted-foreground text-sm leading-6">
                      {dataset.shortDescription[locale]}
                    </p>
                    <ul className="mt-5 grid gap-2">
                      {dataset.apiRoutes.slice(0, 3).map((route) => (
                        <li key={route}>
                          <code
                            className="block break-all rounded-md border bg-background px-3 py-2 text-left text-xs"
                            dir="ltr"
                          >
                            {route}
                          </code>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                      <span className="text-muted-foreground text-xs">
                        {hiddenEndpointCount > 0
                          ? t("moreEndpoints", { count: hiddenEndpointCount })
                          : t("allEndpointsShown")}
                      </span>
                      <Link
                        className="inline-flex items-center gap-1 rounded-sm font-medium text-primary text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        href={`/datasets/${dataset.slug}`}
                      >
                        {t("datasetDetails")}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="rtl-icon-mirror size-4"
                        />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="workflow-title" className="page-body-section">
          <div className="page-content">
            <div className="max-w-3xl">
              <p className="font-medium text-primary text-sm">
                {t("workflowEyebrow")}
              </p>
              <h2
                className="mt-3 text-balance font-heading font-semibold text-3xl"
                id="workflow-title"
              >
                {t("workflowTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground leading-7">
                {t("workflowDescription")}
              </p>
            </div>

            <ol className="mt-8 grid gap-4 lg:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <li
                  className="rounded-md border bg-card p-5 shadow-sm"
                  key={step}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-muted-foreground text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-5 text-primary"
                    />
                  </div>
                  <h3 className="mt-6 font-heading font-semibold text-xl">
                    {t(`steps.${step}.title`)}
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm leading-6">
                    {t(`steps.${step}.description`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="page-footer-section" aria-labelledby="policy-title">
          <div className="page-content">
            <div className="grid gap-6 rounded-md border bg-card p-6 shadow-sm md:grid-cols-[auto_1fr] md:items-start">
              <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck aria-hidden="true" className="size-6" />
              </div>
              <div>
                <h2
                  className="font-heading font-semibold text-2xl"
                  id="policy-title"
                >
                  {t("policyTitle")}
                </h2>
                <p className="mt-3 max-w-4xl text-muted-foreground leading-7">
                  {t("policyDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
