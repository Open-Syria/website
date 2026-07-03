"use client"

import { Languages, Moon, Sun } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { Link, usePathname } from "@/i18n/navigation"
import { type Locale, routing } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const localeLabels: Record<Locale, string> = {
  ar: "عربي",
  en: "EN",
}

type SiteControlsProps = {
  className?: string
}

function SiteControls({ className }: SiteControlsProps) {
  const t = useTranslations("Controls")
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const otherLocale = routing.locales.find((item) => item !== locale) ?? "ar"
  const languageLabel = t("switchLanguage", {
    locale: localeLabels[otherLocale],
  })

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link
        aria-label={languageLabel}
        className={cn(buttonVariants({ size: "icon", variant: "outline" }))}
        href={pathname}
        locale={otherLocale}
        title={languageLabel}
      >
        <Languages aria-hidden="true" />
        <span className="sr-only">{languageLabel}</span>
      </Link>
      <ThemeToggle />
    </div>
  )
}

function ThemeToggle() {
  const t = useTranslations("Controls")
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = mounted && resolvedTheme === "dark"
  const label = isDark ? t("switchThemeLight") : t("switchThemeDark")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <button
      aria-label={label}
      className={cn(buttonVariants({ size: "icon", variant: "outline" }))}
      onClick={() => {
        setTheme(isDark ? "light" : "dark")
      }}
      title={label}
      type="button"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span className="sr-only">{label}</span>
    </button>
  )
}

export { SiteControls }
