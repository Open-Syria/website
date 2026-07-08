import { setRequestLocale } from "next-intl/server"
import { LandingHero } from "./_components/landing-hero"
import { type LocalePageProps, resolveLocale } from "./_utils/locale"
import { getStructuredData, toJsonLd } from "./_utils/structured-data"

export { generateMetadata } from "./_utils/metadata"

export default async function Page({ params }: LocalePageProps) {
  const locale = await resolveLocale(params)
  const structuredData = await getStructuredData(locale)

  setRequestLocale(locale)

  return (
    <>
      <LandingHero locale={locale} />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD follows the official Next.js guide and escapes '<' before injection.
        dangerouslySetInnerHTML={{
          __html: toJsonLd(structuredData),
        }}
      />
    </>
  )
}
