"use client"

import { Database, Home } from "lucide-react"
import { useTranslations } from "next-intl"

import { SiteControls } from "@/components/site-controls"
import { buttonVariants } from "@/components/ui/button"
import { OpenSyriaHorizontalLogo } from "@/components/ui/svgs/openSyriaHorizontalLogo"
import { Link } from "@/i18n/navigation"
import { narrowPageContainerClassName, pageGutterClassName } from "@/lib/layout"
import { cn } from "@/lib/utils"

export default function NotFoundPage() {
  const t = useTranslations("NotFoundPage")

  return (
    <main
      className={cn(
        "relative flex min-h-svh items-center bg-background-light py-16 text-foreground",
        pageGutterClassName
      )}
      id="main-content"
    >
      <SiteControls className="absolute top-4 left-1/2 z-10 -translate-x-1/2 sm:top-6 lg:top-8 lg:right-10 lg:left-auto lg:translate-x-0" />
      <section
        aria-labelledby="not-found-title"
        className={narrowPageContainerClassName}
      >
        <Link
          aria-label="OpenSyria"
          className="inline-flex h-12 items-center text-foreground [--opensyria-logo-foreground:currentColor] [--opensyria-logo-primary:var(--primary)]"
          href="/"
        >
          <OpenSyriaHorizontalLogo className="h-9 w-auto max-w-44" />
        </Link>
        <div className="mt-8 border-border/80 border-t pt-8">
          <p className="font-medium text-primary text-sm">404</p>
          <h1
            className="mt-4 text-balance font-heading font-semibold text-4xl leading-tight sm:text-5xl"
            id="not-found-title"
          >
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground leading-7">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={buttonVariants({ size: "lg" })} href="/">
              <Home aria-hidden="true" />
              {t("home")}
            </Link>
            <Link
              className={buttonVariants({ size: "lg", variant: "outline" })}
              href="/datasets"
            >
              <Database aria-hidden="true" />
              {t("datasets")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
