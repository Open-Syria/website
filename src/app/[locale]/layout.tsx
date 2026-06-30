import { GoogleTagManager } from "@next/third-parties/google"
import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Noto_Sans_Arabic, Sora } from "next/font/google"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"
import { localeDirections, routing } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  category: "technology",
  creator: siteConfig.name,
  description: siteConfig.defaultDescription,
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  metadataBase: new URL(siteConfig.url),
  publisher: siteConfig.name,
  referrer: "origin-when-cross-origin",
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: siteConfig.defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1,
  themeColor: "#f8f7ef",
  width: "device-width",
}

const inter = Inter({ subsets: ["latin"], variable: "--font-body" })

const sora = Sora({ subsets: ["latin"], variable: "--font-display" })

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-code",
})

const googleTagManagerId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}>

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const direction = localeDirections[locale]

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        inter.variable,
        sora.variable,
        notoSansArabic.variable,
        fontMono.variable,
        "font-sans"
      )}
    >
      {googleTagManagerId ? (
        <GoogleTagManager gtmId={googleTagManagerId} />
      ) : null}
      <body>
        <NextIntlClientProvider>
          <DirectionProvider direction={direction}>
            <ThemeProvider>{children}</ThemeProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
