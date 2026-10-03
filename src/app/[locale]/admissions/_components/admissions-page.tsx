import { GraduationCap, Info } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Suspense } from "react"

import { SiteHeader } from "@/components/site-header"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Link } from "@/i18n/navigation"
import type { AdmissionsData } from "../_utils/types"
import { AdmissionsAdvisor } from "./admissions-advisor"
import { AdmissionsGuide } from "./admissions-guide"
import { CareerGuide } from "./career-guide"

export async function AdmissionsPage({
  data,
  locale,
  count,
}: {
  data: AdmissionsData
  locale: "ar" | "en"
  count: number
}) {
  const t = await getTranslations({ locale, namespace: "Admissions" })
  return (
    <>
      <SiteHeader>
        <nav
          aria-label={t("guideLink")}
          className="hidden items-center gap-5 text-muted-foreground text-sm lg:flex"
        >
          <a href="#admissions-guide" className="hover:text-primary">
            {t("guideLink")}
          </a>
          <a href="#admissions-faq" className="hover:text-primary">
            {t("faqLink")}
          </a>
        </nav>
      </SiteHeader>
      <main
        id="main-content"
        className="min-h-svh bg-background-light text-foreground"
      >
        <section
          className="page-hero-section"
          aria-labelledby="admissions-title"
        >
          <div className="page-content">
            <Link
              href="/"
              className="inline-flex min-h-8 items-center text-muted-foreground text-sm underline decoration-border underline-offset-4 hover:text-primary"
            >
              {t("home")}
            </Link>
            <p className="mt-5 flex items-center gap-2 font-medium text-primary text-sm">
              <GraduationCap aria-hidden="true" className="size-5" />
              {t("eyebrow")}
            </p>
            <h1
              id="admissions-title"
              className="mt-4 max-w-4xl text-balance font-heading font-semibold text-4xl leading-tight sm:text-5xl"
            >
              {t("title")}
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-muted-foreground leading-8">
              {t("description")}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href="#admissions-guide"
                className="rounded-sm py-1 text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t("guideLink")}
              </a>
              <a
                href="#admissions-faq"
                className="rounded-sm py-1 text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t("faqLink")}
              </a>
            </div>
          </div>
        </section>
        <section className="page-body-section" aria-label={t("form.title")}>
          <div className="page-content flex flex-col gap-8 pb-8">
            <Alert role="note">
              <Info aria-hidden="true" />
              <AlertTitle>{t("previewTitle", { count })}</AlertTitle>
            </Alert>
            <NuqsAdapter>
              <Suspense fallback={<p role="status">{t("form.loading")}</p>}>
                <AdmissionsAdvisor locale={locale} />
              </Suspense>
            </NuqsAdapter>
            <p className="max-w-4xl text-muted-foreground text-sm leading-7">
              {t("disclaimer")}
            </p>
          </div>
        </section>
        <AdmissionsGuide data={data} locale={locale} />
        <CareerGuide locale={locale} />
      </main>
    </>
  )
}
