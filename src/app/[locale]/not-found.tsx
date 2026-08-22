"use client"

import { Braces, Database, Home } from "lucide-react"
import { useTranslations } from "next-intl"

import { SiteControls } from "@/components/site-controls"
import { buttonVariants } from "@/components/ui/button"
import { OpenSyriaHorizontalLogo } from "@/components/ui/svgs/openSyriaHorizontalLogo"
import { Link } from "@/i18n/navigation"
import { getNotFoundRecoveryMarkdown } from "@/lib/not-found-recovery"

export default function NotFoundPage() {
  const t = useTranslations("NotFoundPage")

  return (
    <main
      className="relative flex min-h-svh items-center bg-background-light py-16 text-foreground"
      id="main-content"
    >
      <div className="absolute inset-x-0 top-4 z-10 sm:top-6 lg:top-8">
        <div className="page-content flex justify-center lg:justify-end">
          <SiteControls />
        </div>
      </div>
      <section aria-labelledby="not-found-title" className="page-content">
        <div className="w-full max-w-2xl">
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
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href="/api"
              >
                <Braces aria-hidden="true" />
                {t("developers")}
              </Link>
            </div>

            <aside
              aria-labelledby="agent-recovery-title"
              className="mt-8 rounded-md border bg-background p-4 shadow-sm"
            >
              <h2
                className="font-heading font-semibold text-lg"
                id="agent-recovery-title"
              >
                {t("recoveryTitle")}
              </h2>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                {t("recoveryDescription")}
              </p>
              <pre
                className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-foreground p-4 text-background text-xs leading-5"
                data-agent-recovery="markdown"
                dir="ltr"
              >
                <code>{getNotFoundRecoveryMarkdown()}</code>
              </pre>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
