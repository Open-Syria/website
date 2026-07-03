import { ArrowUpRight, Mail } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { GithubDark } from "@/components/ui/svgs/githubDark"
import { OpenSyriaHorizontalLogo } from "@/components/ui/svgs/openSyriaHorizontalLogo"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getGithubProjectDirectory } from "@/lib/github"
import { pageContainerClassName, pageGutterClassName } from "@/lib/layout"
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
    <footer
      className={cn(
        "border-t bg-background py-10 text-foreground sm:py-12",
        pageGutterClassName
      )}
    >
      <div className={cn(pageContainerClassName, "grid gap-9")}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
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
            <div className="grid gap-7 sm:grid-cols-3">
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

              {github.repositories.length > 0 ? (
                <FooterLinkGroup title={t("repositoriesTitle")}>
                  {github.repositories.map((repository) => (
                    <li key={repository.name}>
                      <a
                        className="group block rounded-md text-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        href={repository.url}
                        rel={trustedExternalLinkRel}
                        target="_blank"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          {repository.name}
                          <ArrowUpRight
                            aria-hidden="true"
                            className="rtl-icon-mirror size-3.5 text-muted-foreground transition group-hover:text-primary"
                          />
                        </span>
                        {repository.description ? (
                          <span className="mt-1 block text-muted-foreground text-xs leading-5">
                            {repository.description}
                          </span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </FooterLinkGroup>
              ) : null}

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
