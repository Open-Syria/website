import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { careerSources } from "../_utils/careers"

export async function CareerGuide({ locale }: { locale: "ar" | "en" }) {
  const t = await getTranslations({ locale, namespace: "Admissions.careers" })
  return (
    <section
      id="career-guidance"
      className="page-body-section scroll-mt-8"
      aria-labelledby="career-guidance-title"
    >
      <div className="page-content">
        <h2
          id="career-guidance-title"
          className="font-heading font-semibold text-2xl"
        >
          {t("title")}
        </h2>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-8">
          {t("body")}
        </p>
        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          {(["promising", "diverse", "specialist"] as const).map((id) => (
            <div key={id} className="flex flex-col items-start gap-3">
              <dt>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary"
                >
                  {t(`badges.${id}`)}
                </Badge>
              </dt>
              <dd className="text-muted-foreground text-sm leading-7">
                {t(`definitions.${id}`)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 max-w-3xl text-muted-foreground text-sm leading-7">
          {t("limits")}
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {careerSources.map((source) => (
            <li key={source.id}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-2 text-primary underline underline-offset-4"
              >
                {t(`sources.${source.id}`)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
