import { setRequestLocale } from "next-intl/server"

import { AdmissionsPage } from "./_components/admissions-page"
import { loadAdmissionsData } from "./_utils/load-data"
import { type LocaleParams, resolvePageLocale } from "./_utils/locale"
import { getStructuredData, toJsonLd } from "./_utils/structured-data"

export { generateMetadata } from "./_utils/metadata"

export default async function Page({ params }: { params: LocaleParams }) {
  const locale = await resolvePageLocale(params)
  setRequestLocale(locale)
  const [
    data,
    literary,
    sharia,
    vocational,
    nonSyrianScientific,
    nonSyrianLiterary,
    nonSyrianVocational,
    foreignScientific,
    foreignLiterary,
    foreignVocational,
    additionalCatalogues,
    structuredData,
  ] = await Promise.all([
    loadAdmissionsData(),
    loadAdmissionsData("literary"),
    loadAdmissionsData("sharia"),
    loadAdmissionsData("vocational"),
    loadAdmissionsData("non-syrian-scientific"),
    loadAdmissionsData("non-syrian-literary"),
    loadAdmissionsData("non-syrian-vocational"),
    loadAdmissionsData("foreign-scientific"),
    loadAdmissionsData("foreign-literary"),
    loadAdmissionsData("foreign-vocational"),
    Promise.all([
      loadAdmissionsData("special-scientific"),
      loadAdmissionsData("service-scientific"),
      loadAdmissionsData("service-literary"),
      loadAdmissionsData("service-sharia"),
      loadAdmissionsData("service-vocational"),

      loadAdmissionsData("special-literary"),
      loadAdmissionsData("special-sharia"),
      loadAdmissionsData("special-vocational"),
      loadAdmissionsData("older-scientific"),
      loadAdmissionsData("older-literary"),
      loadAdmissionsData("older-vocational"),
      loadAdmissionsData("older-foreign-scientific"),
      loadAdmissionsData("older-foreign-literary"),
      loadAdmissionsData("older-foreign-vocational"),
    ]),
    getStructuredData(locale),
  ])
  return (
    <>
      <AdmissionsPage
        data={data}
        locale={locale}
        count={
          data.programs.length +
          literary.programs.length +
          sharia.programs.length +
          vocational.programs.length +
          nonSyrianScientific.programs.length +
          nonSyrianLiterary.programs.length +
          nonSyrianVocational.programs.length +
          foreignScientific.programs.length +
          foreignLiterary.programs.length +
          foreignVocational.programs.length +
          additionalCatalogues.reduce(
            (total, catalogue) => total + catalogue.programs.length,
            0
          )
        }
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD follows the official Next.js guide and escapes '<' before injection.
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
    </>
  )
}
