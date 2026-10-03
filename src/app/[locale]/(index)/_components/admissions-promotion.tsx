import { ArrowRight, GraduationCap } from "lucide-react"
import NextLink from "next/link"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@/components/ui/button"
import { getPathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

export async function AdmissionsPromotion({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "HomeAdmissions" })
  const href = getPathname({ locale, href: "/admissions" })

  return (
    <section
      aria-labelledby="home-admissions-title"
      className="border-y bg-background-light py-14 sm:py-20"
    >
      <div className="page-content grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 font-medium text-primary text-sm">
            <GraduationCap aria-hidden="true" className="size-5" />
            {t("eyebrow")}
          </p>
          <h2
            id="home-admissions-title"
            className="mt-4 text-balance font-heading font-semibold text-3xl leading-relaxed sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground leading-8">
            {t("description")}
          </p>
          <p className="mt-3 text-muted-foreground text-sm leading-7">
            {t("preview")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4">
          <NextLink href={href} className={buttonVariants({ size: "lg" })}>
            {t("action")}
            <ArrowRight
              aria-hidden="true"
              data-icon="inline-end"
              className="rtl-icon-mirror"
            />
          </NextLink>
          <NextLink
            href={`${href}#admissions-guide`}
            className="rounded-sm text-primary text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("guide")}
          </NextLink>
        </div>
      </div>
    </section>
  )
}
