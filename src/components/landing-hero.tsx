import { ArrowUpRight, BookOpenText, Database, Star } from "lucide-react"
import { cacheLife } from "next/cache"
import Image from "next/image"
import { getLocale, getTranslations } from "next-intl/server"

import { HeroControls } from "@/components/hero-controls"
import { TrackedLink } from "@/components/tracked-link"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { getGithubOverview } from "@/lib/github"
import { siteLinks } from "@/lib/site"

export async function LandingHero() {
  "use cache"

  cacheLife("hours")

  const [t, locale, github] = await Promise.all([
    getTranslations("Hero"),
    getLocale(),
    getGithubOverview(),
  ])

  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: "compact",
  })

  const starsLabel =
    github.stars === null
      ? t("github")
      : t("githubWithStars", {
          count: numberFormatter.format(github.stars),
        })

  return (
    <main className="min-h-svh overflow-hidden bg-background-light text-foreground">
      <section
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-svh items-center overflow-hidden border-b bg-background-light px-4 py-10 sm:px-8 lg:px-12"
      >
        <HeroControls />

        <div
          className="pointer-events-none absolute inset-0 -z-20"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_72%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_72%,transparent)_1px,transparent_1px)] bg-[size:3.25rem_3.25rem] opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_84%,transparent)]" />
          <div className="absolute inset-x-0 top-0 h-52 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background-light)_84%,var(--background)),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(460px,1fr)] lg:items-center">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-start">
            <p className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/85 px-3 py-1.5 font-medium text-foreground text-sm shadow-sm backdrop-blur">
              <Database aria-hidden="true" className="size-4 text-primary" />
              <span>{t("eyebrow")}</span>
            </p>

            <h1
              className="mt-7 text-balance font-heading font-semibold text-5xl text-foreground leading-[0.96] tracking-normal sm:text-6xl lg:text-7xl"
              id="hero-title"
            >
              {t("name")}
            </h1>

            <p className="hero-slogan mt-6 text-base text-muted-foreground leading-7 sm:text-lg">
              {t("slogan")}
            </p>

            <div className="mt-8 flex flex-row items-center justify-center gap-2 sm:gap-3 lg:justify-start">
              <TrackedLink
                className={buttonVariants({ size: "lg" })}
                gtmEvent={{
                  cta_href: siteLinks.docs,
                  cta_id: "docs",
                  cta_label: t("docs"),
                  event: "cta_click",
                }}
                href={siteLinks.docs}
                prefetch={false}
                rel="noreferrer"
                target="_blank"
              >
                <BookOpenText aria-hidden="true" />
                {t("docs")}
                <ArrowUpRight aria-hidden="true" className="rtl-icon-mirror" />
              </TrackedLink>
              <TrackedLink
                className={buttonVariants({ size: "lg", variant: "outline" })}
                gtmEvent={{
                  cta_href: siteLinks.githubOrganization,
                  cta_id: "github_stars",
                  cta_label: starsLabel,
                  event: "cta_click",
                  github_stars: github.stars,
                }}
                href={siteLinks.githubOrganization}
                prefetch={false}
                rel="noreferrer"
                target="_blank"
              >
                <Star aria-hidden="true" />
                <span>{starsLabel}</span>
              </TrackedLink>
            </div>

            {github.contributors.length > 0 ? (
              <aside className="mt-12 w-full max-w-2xl border-border/80 border-t pt-5 lg:text-start">
                <p className="font-medium text-sm">{t("contributors")}</p>
                <ul className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {github.contributors.map((contributor, index) => {
                    const contributionLabel = t("contributionCount", {
                      count: contributor.contributions,
                    })

                    return (
                      <li key={contributor.login}>
                        <Link
                          aria-label={`${contributor.login}, ${contributionLabel}`}
                          className="group relative block size-12 overflow-hidden rounded-md bg-background shadow-sm ring-1 ring-border transition duration-200 hover:-translate-y-0.5 hover:shadow-foreground/5 hover:shadow-lg hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={contributor.url}
                          prefetch={false}
                          rel="noreferrer"
                          target="_blank"
                          title={`${contributor.login} - ${contributionLabel}`}
                        >
                          <Image
                            alt=""
                            className="size-full object-cover"
                            height="48"
                            loading={index < 4 ? "eager" : "lazy"}
                            src={contributor.avatarUrl}
                            unoptimized
                            width="48"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </aside>
            ) : null}
          </div>

          <div className="hero-map-wrap" aria-hidden="true">
            <div className="hero-map">
              <svg
                aria-hidden="true"
                className="hero-map__svg hero-map__fill"
                role="presentation"
                viewBox="0 0 670.92236 590.26318"
              >
                <use href="/sy.svg#geoBoundaries-SYR-ADM1" />
              </svg>
              <svg
                aria-hidden="true"
                className="hero-map__svg hero-map__boundaries"
                role="presentation"
                viewBox="0 0 670.92236 590.26318"
              >
                <use href="/sy.svg#geoBoundaries-SYR-ADM1" />
              </svg>
              <span className="hero-map__scan" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
