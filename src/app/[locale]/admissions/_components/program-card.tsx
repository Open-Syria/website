"use client"

import { Bookmark, Check, CircleHelp, ListChecks, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { careerFor } from "../_utils/careers"
import {
  canAnswerCondition,
  collectQuestions,
  questionChannels,
} from "../_utils/confirmation"
import { channelPriority } from "../_utils/results"
import type {
  AdmissionsData,
  Condition,
  Finding,
  ProgramResult,
  Status,
} from "../_utils/types"
import { SourceLinks } from "./source-links"

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("Admissions")
  const Icon = status === "meets_requirements" ? Check : CircleHelp
  return (
    <Badge
      variant={
        status === "meets_requirements"
          ? "default"
          : status === "needs_confirmation"
            ? "secondary"
            : "outline"
      }
    >
      <Icon aria-hidden="true" data-icon="inline-start" />
      {t(`statuses.${status}`)}
    </Badge>
  )
}

function ConditionText({
  condition,
  locale,
}: {
  condition: Condition
  locale: Locale
}) {
  const t = useTranslations("Admissions")
  switch (condition.type) {
    case "certificate_year":
      return t("results.certificateYearsCondition", {
        years: condition.allowed.join(" / "),
      })
    case "no_previous_general_admission":
      return t("results.previousAdmissionCondition")
    case "subject":
      return t("results.subjectCondition", {
        minimum: condition.minPercent,
        subject: t(`subjects.${condition.subject}`),
      })
    case "gender":
      return t("results.genderCondition", {
        gender: t(`form.${condition.value}`),
      })
    case "birth_year":
      return t("results.birthCondition", { year: condition.minimum })
    case "governorate":
      return t("questions.originHint", {
        governorates: condition.allowed
          .map((value) => t(`governorates.${value}`))
          .join(" / "),
      })
    case "manual":
    case "vocational_specialty":
    case "exam":
      return condition.label[locale]
  }
}

function FindingText({
  finding,
  locale,
}: {
  finding: Finding
  locale: Locale
}) {
  const t = useTranslations("Admissions")
  if (finding.type === "scope") return t("results.scopeCondition")
  if (finding.type === "missing_score") return t("results.shariaScoreMissing")
  if (finding.type === "minimum")
    return t("results.minimumFailed", { minimum: finding.required })
  return (
    <>
      {t(
        finding.outcome === "missing"
          ? "results.conditionMissing"
          : "results.conditionFailed"
      )}{" "}
      <ConditionText condition={finding.condition} locale={locale} />
    </>
  )
}

export function ProgramCard({
  result,
  sources,
  locale,
  saved,
  onSave,
  onQuestions,
}: {
  result: ProgramResult
  sources: AdmissionsData["sources"]
  locale: Locale
  saved: boolean
  onSave: () => void
  onQuestions: (result: ProgramResult) => void
}) {
  const t = useTranslations("Admissions")
  const { program } = result
  const career = careerFor(program)
  const name = `${program.name[locale]} — ${program.institution.name[locale]}`
  return (
    <Card
      size="sm"
      data-program-id={program.id}
      tabIndex={-1}
      className="scroll-mt-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardHeader>
        <CardTitle>
          <h4
            className={
              program.name.en === program.name.ar
                ? "font-(family-name:--font-arabic)"
                : undefined
            }
            dir="auto"
            lang={program.name.en === program.name.ar ? "ar" : locale}
          >
            {program.name[locale]}
          </h4>
        </CardTitle>
        <CardDescription>
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span
              dir="auto"
              lang={program.campus.en === program.campus.ar ? "ar" : locale}
              className={
                program.campus.en === program.campus.ar
                  ? "font-(family-name:--font-arabic)"
                  : undefined
              }
            >
              {program.campus[locale]}
            </span>{" "}
            · {t(`fields.${program.field}`)}
          </span>
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant={saved ? "secondary" : "outline"}
            size="icon-lg"
            onClick={onSave}
            aria-pressed={saved}
            aria-label={t(saved ? "results.unsave" : "results.save", {
              program: name,
            })}
          >
            <Bookmark
              aria-hidden="true"
              fill={saved ? "currentColor" : "none"}
            />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary"
          >
            {t(`careers.badges.${career.outlook}`)}
          </Badge>
          <p className="text-muted-foreground text-sm leading-6">
            {career.paths[locale]}
          </p>
        </div>
        <div
          className={cn(
            "grid gap-3",
            result.channels.length > 1 && "sm:grid-cols-2"
          )}
        >
          {result.channels
            .toSorted(
              (a, b) =>
                channelPriority[a.channel.id] - channelPriority[b.channel.id]
            )
            .map((resultChannel) => {
              const findings = resultChannel.findings
              const scopedResult = {
                ...result,
                channels: [resultChannel],
                status: resultChannel.status,
              }
              const questions = collectQuestions(questionChannels(scopedResult))
              const hasQuestions =
                questions.conditions.length > 0 || questions.shariaScore
              const needsAnswers = findings.some(
                (finding) =>
                  finding.type === "missing_score" ||
                  (finding.type === "condition" &&
                    canAnswerCondition(finding.condition))
              )
              return (
                <div
                  key={resultChannel.channel.id}
                  data-channel-id={resultChannel.channel.id}
                  tabIndex={-1}
                  className="flex flex-col gap-3 rounded-md border bg-background p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-semibold">
                      {t(`channels.${resultChannel.channel.id}`)}
                    </span>
                    <StatusBadge status={resultChannel.status} />
                  </div>
                  <dl className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground text-xs">
                      {t("results.minimum")}
                    </dt>
                    <dd className="font-semibold text-lg">
                      {resultChannel.channel.minPercent === null ? (
                        <span className="text-sm">
                          {t("results.allApplicants")}
                        </span>
                      ) : (
                        <bdi dir="ltr">{resultChannel.channel.minPercent}%</bdi>
                      )}
                    </dd>
                  </dl>
                  {resultChannel.channel.scoreBasis ? (
                    <p className="text-muted-foreground text-xs leading-6">
                      {t("results.shariaScoreBasis")}
                    </p>
                  ) : null}
                  {findings.length ? (
                    <ul className="flex list-disc flex-col gap-2 ps-4 text-sm leading-6">
                      {findings.map((finding) => (
                        <li
                          key={
                            finding.type === "condition"
                              ? JSON.stringify(finding.condition)
                              : finding.type
                          }
                        >
                          <FindingText finding={finding} locale={locale} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {hasQuestions ? (
                    <Button
                      type="button"
                      variant={needsAnswers ? "outline" : "ghost"}
                      className="min-h-11 self-start"
                      data-answer-trigger=""
                      aria-haspopup="dialog"
                      onClick={() => onQuestions(scopedResult)}
                    >
                      <ListChecks aria-hidden="true" data-icon="inline-start" />
                      {t(needsAnswers ? "questions.title" : "questions.edit")}
                    </Button>
                  ) : null}
                </div>
              )
            })}
        </div>
        {program.notes.map((note) => (
          <p key={note.en} className="text-muted-foreground text-sm leading-6">
            {note[locale]}
          </p>
        ))}
      </CardContent>
      <CardFooter>
        <SourceLinks references={program.sources} sources={sources} />
      </CardFooter>
    </Card>
  )
}
