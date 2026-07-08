import { ArrowUpRight, Mail } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { GithubDark } from "@/components/ui/svgs/githubDark"
import { OpenSyriaHorizontalLogo } from "@/components/ui/svgs/openSyriaHorizontalLogo"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getGithubProjectDirectory } from "@/lib/github"
import { trustedExternalLinkRel } from "@/lib/links"
import { siteLinks } from "@/lib/site"
import { cn } from "@/lib/utils"

type SiteFooterProps = Readonly<{
  locale: Locale
}>

export async function SiteFooter({ locale }: SiteFooterProps) {
  const [t, github] = await Promise.all([
    getTranslations({ locale, namespace: "Footer" }),
    getGithubProjectDirectory(),
  ])
  const contactEmail = github.organization.email ?? siteLinks.contactEmail

  return (
    <footer className="border-t bg-background py-10 text-foreground sm:py-12">
      <div className={cn("page-content", "grid gap-9")}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
          <div>
            <Link
              aria-label="OpenSyria"
              className="inline-flex h-10 items-center text-foreground [--opensyria-logo-foreground:currentColor] [--opensyria-logo-map-gradient-end:currentColor] [--opensyria-logo-map-gradient-highlight-end:var(--accent-foreground)] [--opensyria-logo-map-gradient-highlight-start:var(--primary)] [--opensyria-logo-map-gradient-start:var(--primary)] [--opensyria-logo-primary:var(--primary)]"
              href="/"
            >
              <OpenSyriaHorizontalLogo className="h-9 w-auto max-w-44" />
            </Link>
            <p className="mt-5 max-w-xl text-muted-foreground text-sm leading-6">
              {t("description")}
            </p>
            <p className="mt-4 max-w-xl text-muted-foreground text-sm leading-6">
              {t("principle")}
            </p>
          </div>

          <nav aria-label={t("navigationLabel")}>
            <div className="grid gap-7 sm:grid-cols-2">
              <FooterLinkGroup title={t("platformTitle")}>
                <li>
                  <Link className={footerLinkClassName} href="/">
                    {t("home")}
                  </Link>
                </li>
                <li>
                  <Link className={footerLinkClassName} href="/datasets">
                    {t("datasets")}
                  </Link>
                </li>
                <li>
                  <a
                    className={footerLinkClassName}
                    href={siteLinks.docs}
                    rel={trustedExternalLinkRel}
                    target="_blank"
                  >
                    {t("apiDocs")}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="rtl-icon-mirror size-3.5"
                    />
                  </a>
                </li>
                <li>
                  <a
                    className={footerLinkClassName}
                    href={siteLinks.openApi}
                    rel={trustedExternalLinkRel}
                    target="_blank"
                  >
                    {t("openApi")}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="rtl-icon-mirror size-3.5"
                    />
                  </a>
                </li>
              </FooterLinkGroup>

              <FooterLinkGroup title={t("communityTitle")}>
                <li>
                  <a
                    className={footerLinkClassName}
                    href={github.organization.url}
                    rel={trustedExternalLinkRel}
                    target="_blank"
                  >
                    <GithubDark aria-hidden="true" className="size-4" />
                    {t("github")}
                  </a>
                </li>
                <li>
                  <a
                    className={footerLinkClassName}
                    href={siteLinks.linkedIn}
                    rel={trustedExternalLinkRel}
                    target="_blank"
                  >
                    {t("linkedIn")}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="rtl-icon-mirror size-3.5"
                    />
                  </a>
                </li>
                <li>
                  <a
                    className={footerLinkClassName}
                    href={`mailto:${contactEmail}`}
                  >
                    <Mail aria-hidden="true" className="size-4" />
                    {contactEmail}
                  </a>
                </li>
              </FooterLinkGroup>
            </div>
          </nav>
        </div>

        {github.repositories.length > 0 ? (
          <section
            aria-label={t("repositoriesTitle")}
            className="border-border/70 border-t pt-7"
          >
            <h2 className="font-heading font-semibold text-sm">
              {t("repositoriesTitle")}
            </h2>
            <ul className="mt-4 grid list-none gap-x-9 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {github.repositories.map((repository) => (
                <li key={repository.name} className="min-w-0">
                  <a
                    className="group block rounded-sm text-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={repository.url}
                    rel={trustedExternalLinkRel}
                    target="_blank"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 font-medium">
                      <span className="truncate">{repository.name}</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="rtl-icon-mirror size-3.5 shrink-0 text-muted-foreground transition group-hover:text-primary"
                      />
                    </span>
                    {repository.description ? (
                      <span className="mt-1 line-clamp-2 block max-w-72 text-muted-foreground text-xs leading-5">
                        {repository.description}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-col gap-2 border-border/70 border-t pt-5 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t("copyright")}</p>
          <p>{t("licenseNote")}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup({
  children,
  title,
}: Readonly<{
  children: React.ReactNode
  title: string
}>) {
  return (
    <section aria-label={title}>
      <h2 className="font-heading font-semibold text-sm">{title}</h2>
      <ul className="mt-4 grid list-none gap-3">{children}</ul>
    </section>
  )
}

const footerLinkClassName =
  "inline-flex items-center gap-1.5 rounded-md text-muted-foreground text-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
