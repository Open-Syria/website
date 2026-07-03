"use client"

import { Home, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { narrowPageContainerClassName, pageGutterClassName } from "@/lib/layout"
import { cn } from "@/lib/utils"

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>

export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useTranslations("Error")

  return (
    <main
      className={cn(
        "flex min-h-svh items-center bg-background-light py-16 text-foreground",
        pageGutterClassName
      )}
      id="main-content"
    >
      <section
        aria-labelledby="error-title"
        className={cn(
          narrowPageContainerClassName,
          "border-border/80 border-t pt-8"
        )}
      >
        <p className="font-medium text-primary text-sm">OpenSyria</p>
        <h1
          className="mt-4 text-balance font-heading font-semibold text-4xl leading-tight sm:text-5xl"
          id="error-title"
        >
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-7">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm shadow-foreground/5 shadow-lg transition-all hover:bg-primary/80 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px sm:px-4"
            onClick={reset}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            {t("retry")}
          </button>
          <Link
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border/80 bg-background/85 px-3 font-medium text-foreground text-sm shadow-sm backdrop-blur transition-all hover:bg-secondary/80 hover:text-secondary-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px sm:px-4"
            href="/"
          >
            <Home aria-hidden="true" className="size-4" />
            {t("home")}
          </Link>
        </div>
      </section>
    </main>
  )
}
