import { ArrowUpRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { trustedExternalLinkRel } from "@/lib/links"
import type { AdmissionsData, SourceReference } from "../_utils/types"

export function SourceLinks({
  references,
  sources,
}: {
  references: SourceReference[]
  sources: AdmissionsData["sources"]
}) {
  const t = useTranslations("Admissions")
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {references.map((reference) => {
        const source = sources.find(
          (item) => item.announcement === reference.announcement
        )
        if (!source) return null
        return (
          <a
            key={`${reference.announcement}-${reference.page}`}
            href={`${source.url}#page=${reference.page}`}
            target="_blank"
            rel={trustedExternalLinkRel}
            className="inline-flex min-h-8 items-center gap-1 rounded-sm text-primary text-xs underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("source", {
              number: reference.announcement,
              page: reference.page,
            })}
            <ArrowUpRight
              aria-hidden="true"
              className="rtl-icon-mirror size-3 shrink-0"
            />
          </a>
        )
      })}
    </div>
  )
}
