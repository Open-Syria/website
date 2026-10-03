import { ArrowUpRight, BookOpen, FileText, HelpCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { FaqAccordion } from "@/components/faq-accordion"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/i18n/routing"
import { trustedExternalLinkRel } from "@/lib/links"
import { faqItems, guideSections, sourceGroups } from "../_utils/content"
import type { AdmissionsData } from "../_utils/types"
import { SourceLinks } from "./source-links"

export async function AdmissionsGuide({
  data,
  locale,
}: {
  data: AdmissionsData
  locale: Locale
}) {
  const t = await getTranslations({ locale, namespace: "Admissions" })
  return (
    <>
      <section
        id="admissions-guide"
        aria-labelledby="admissions-guide-title"
        className="scroll-mt-6 border-t bg-background py-14 sm:py-20"
      >
        <div className="page-content grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2 font-medium text-primary text-sm">
              <BookOpen aria-hidden="true" className="size-4" />
              {t("guide.eyebrow")}
            </p>
            <h2
              id="admissions-guide-title"
              className="mt-4 text-balance font-heading font-semibold text-3xl leading-relaxed"
            >
              {t("guide.title")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-8">
              {t("guide.description")}
            </p>
            <nav
              aria-label={t("guide.title")}
              className="mt-6 flex flex-col items-start gap-2"
            >
              {guideSections.map((section) => (
                <a
                  key={section.id}
                  href={`#guide-${section.id}`}
                  className="rounded-sm py-1 text-muted-foreground text-sm underline decoration-border underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {t(`guide.sections.${section.id}.title`)}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-10">
            {guideSections.map((section) => (
              <section
                id={`guide-${section.id}`}
                key={section.id}
                className="scroll-mt-6"
                aria-labelledby={`guide-title-${section.id}`}
              >
                <h3
                  id={`guide-title-${section.id}`}
                  className="font-heading font-semibold text-xl leading-relaxed"
                >
                  {t(`guide.sections.${section.id}.title`)}
                </h3>
                <p className="mt-3 mb-3 whitespace-pre-line text-muted-foreground leading-8">
                  {t(`guide.sections.${section.id}.body`)}
                </p>
                <SourceLinks
                  references={section.sources}
                  sources={data.sources}
                />
              </section>
            ))}
          </div>
        </div>
      </section>
      <section
        id="admissions-faq"
        aria-labelledby="admissions-faq-title"
        className="scroll-mt-6 border-t bg-background-light py-14 sm:py-20"
      >
        <div className="page-content grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2 font-medium text-primary text-sm">
              <HelpCircle aria-hidden="true" className="size-4" />
              {t("faq.eyebrow")}
            </p>
            <h2
              id="admissions-faq-title"
              className="mt-4 text-balance font-heading font-semibold text-3xl leading-relaxed"
            >
              {t("faq.title")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-8">
              {t("faq.description")}
            </p>
          </div>
          <FaqAccordion
            items={faqItems.map((item) => ({
              id: item.id,
              question: t(`faq.items.${item.id}.question`),
              answer: t(`faq.items.${item.id}.answer`),
              details: (
                <>
                  <SourceLinks
                    references={item.sources}
                    sources={data.sources}
                  />
                  {item.id === "support" ? (
                    <a
                      href={data.supportDirectory.url}
                      target="_blank"
                      rel={trustedExternalLinkRel}
                      className="mt-3 inline-block rounded-sm text-primary text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {t("supportLink")}
                    </a>
                  ) : null}
                </>
              ),
            }))}
          />
        </div>
      </section>
      <section
        id="admissions-sources"
        aria-labelledby="admissions-sources-title"
        className="scroll-mt-6 border-t bg-background py-14"
      >
        <div className="page-content">
          <h2
            id="admissions-sources-title"
            className="font-heading font-semibold text-2xl"
          >
            {t("sourcesTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground leading-7">
            {t("sourcesBody")}
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <a
              href="https://mohe.gov.sy/ar/media-center/details/651"
              target="_blank"
              rel={trustedExternalLinkRel}
              className="text-primary text-sm underline underline-offset-4"
            >
              {t("ministryLink")}
            </a>
            <a
              href={data.supportDirectory.url}
              target="_blank"
              rel={trustedExternalLinkRel}
              className="text-primary text-sm underline underline-offset-4"
            >
              {t("supportLink")}
            </a>
          </div>
          {sourceGroups.map((group) => (
            <section
              key={group.id}
              className="mt-8"
              aria-labelledby={`sources-${group.id}`}
            >
              <h3
                id={`sources-${group.id}`}
                className="mb-4 font-heading font-semibold text-lg"
              >
                {t(`sourceGroups.${group.id}`)}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.sources
                  .filter((source) =>
                    group.announcements.some(
                      (number) => number === source.announcement
                    )
                  )
                  .map((source) => (
                    <Card key={source.announcement} size="sm">
                      <CardHeader>
                        <CardTitle>
                          <h4 className="flex items-center gap-2">
                            <FileText
                              aria-hidden="true"
                              className="size-4 text-primary"
                            />
                            {t("announcement", { number: source.announcement })}
                          </h4>
                        </CardTitle>
                        <CardDescription>
                          {source.title[locale]}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-xs">
                          {t("pdfPages", { count: source.pageCount })}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <a
                          href={source.url}
                          target="_blank"
                          rel={trustedExternalLinkRel}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          {t("readAnnouncement", {
                            number: source.announcement,
                          })}
                          <ArrowUpRight
                            aria-hidden="true"
                            data-icon="inline-end"
                            className="rtl-icon-mirror"
                          />
                        </a>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </section>
          ))}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              <bdi>
                {t("reviewed", {
                  date: data.reviewedAt,
                  version: data.version,
                })}
              </bdi>
            </p>
            <a
              href="https://mofa.education-syria.com/signup"
              target="_blank"
              rel={trustedExternalLinkRel}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t("applicationLink")}
              <ArrowUpRight
                aria-hidden="true"
                data-icon="inline-end"
                className="rtl-icon-mirror"
              />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
