import { ArrowUpRight, BookOpenText, Bot, Braces } from "lucide-react"
import { cacheLife } from "next/cache"
import NextLink from "next/link"
import { getTranslations } from "next-intl/server"

import type { Locale } from "@/i18n/routing"
import { trustedExternalLinkRel } from "@/lib/links"
import { siteLinks } from "@/lib/site"

type DeveloperResourcesProps = Readonly<{
  locale: Locale
}>

export async function DeveloperResources({ locale }: DeveloperResourcesProps) {
  "use cache"

  cacheLife("hours")

  const t = await getTranslations({
    locale,
    namespace: "HomeDevelopers",
  })

  const resources = [
    {
      description: t("resources.guide.description"),
      href: locale === "en" ? "/api" : `/${locale}/api`,
      icon: BookOpenText,
      label: t("resources.guide.link"),
      title: t("resources.guide.title"),
    },
    {
      description: t("resources.openApi.description"),
      href: siteLinks.openApi,
      icon: Braces,
      label: t("resources.openApi.link"),
      title: t("resources.openApi.title"),
    },
    {
      description: t("resources.agents.description"),
      href: "/llms.txt",
      icon: Bot,
      label: t("resources.agents.link"),
      title: t("resources.agents.title"),
    },
  ] as const

  return (
    <section
      aria-labelledby="home-developers-title"
      className="border-y bg-background-light py-16 sm:py-20"
    >
      <div className="page-content">
        <div className="max-w-3xl">
          <p className="font-medium text-primary text-sm">{t("eyebrow")}</p>
          <h2
            className="mt-3 text-balance font-heading font-semibold text-3xl leading-tight sm:text-4xl"
            id="home-developers-title"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground leading-7">
            {t("description")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {resources.map((resource) => {
            const Icon = resource.icon
            const isExternal = resource.href.startsWith("https://")

            return (
              <article
                className="flex h-full flex-col rounded-md border bg-card p-5 text-card-foreground shadow-sm"
                key={resource.title}
              >
                <Icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="mt-4 text-balance font-heading font-semibold text-xl leading-tight">
                  {resource.title}
                </h3>
                <p className="mt-3 text-muted-foreground text-sm leading-6">
                  {resource.description}
                </p>
                {isExternal ? (
                  <a
                    className="mt-auto inline-flex items-center gap-1 rounded-sm pt-5 font-medium text-primary text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={resource.href}
                    rel={trustedExternalLinkRel}
                    target="_blank"
                  >
                    {resource.label}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="rtl-icon-mirror size-4"
                    />
                  </a>
                ) : (
                  <NextLink
                    className="mt-auto inline-flex items-center gap-1 rounded-sm pt-5 font-medium text-primary text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={resource.href}
                  >
                    {resource.label}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="rtl-icon-mirror size-4"
                    />
                  </NextLink>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
