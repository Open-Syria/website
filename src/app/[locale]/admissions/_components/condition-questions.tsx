"use client"

import { useTranslations } from "next-intl"
import { useEffect, useId, useState } from "react"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Locale } from "@/i18n/routing"
import {
  type ConfirmationAnswer,
  collectQuestions,
  conditionQuestionKey,
} from "../_utils/confirmation"
import { displayPercentage, normaliseDigits, parseScore } from "../_utils/score"
import type { Channel, StudentInput } from "../_utils/types"
import { AdmissionsSelect } from "./admissions-select"

export function ConditionQuestions({
  channels,
  student,
  locale,
  onAnswer,
}: {
  channels: Channel[]
  student: StudentInput
  locale: Locale
  onAnswer: (answer: ConfirmationAnswer) => void
}) {
  const t = useTranslations("Admissions")
  const id = useId()
  const { conditions, shariaScore } = collectQuestions(channels)
  if (!conditions.length && !shariaScore) return null
  return (
    <FieldGroup className="gap-5">
      {shariaScore ? (
        <NumberAnswer
          label={t("questions.shariaScore")}
          value={
            student.shariaFacultyScore
              ? String(displayPercentage(student.shariaFacultyScore))
              : ""
          }
          onAnswer={(value) => onAnswer({ type: "sharia_score", value })}
        />
      ) : null}
      {conditions.map((condition) => {
        const key = conditionQuestionKey(condition)
        switch (condition.type) {
          case "subject": {
            const score = student.subjects[condition.subject]
            return (
              <NumberAnswer
                key={key}
                label={t("questions.subject", {
                  subject: t(`subjects.${condition.subject}`),
                })}
                value={score ? String(displayPercentage(score)) : ""}
                onAnswer={(value) =>
                  onAnswer({
                    type: "subject",
                    subject: condition.subject,
                    value,
                  })
                }
              />
            )
          }
          case "birth_year":
            return (
              <NumberAnswer
                key={key}
                kind="year"
                label={t("questions.birthYear")}
                value={student.birthYear?.toString() ?? ""}
                onAnswer={(value) => onAnswer({ type: "birth_year", value })}
              />
            )
          case "gender":
            return (
              <ChoiceAnswer
                key={key}
                label={t("form.gender")}
                value={student.gender ?? ""}
                options={[
                  { value: "female", label: t("form.female") },
                  { value: "male", label: t("form.male") },
                ]}
                onAnswer={(value) =>
                  onAnswer({
                    type: "gender",
                    value:
                      value === "female" || value === "male"
                        ? value
                        : "unknown",
                  })
                }
              />
            )
          case "no_previous_general_admission":
            return (
              <ChoiceAnswer
                key={key}
                label={t("form.previousAdmission")}
                value={
                  student.previousGeneralAdmission === null
                    ? ""
                    : student.previousGeneralAdmission
                      ? "yes"
                      : "no"
                }
                options={[
                  { value: "yes", label: t("questions.yes") },
                  { value: "no", label: t("questions.no") },
                ]}
                onAnswer={(value) =>
                  onAnswer({
                    type: "previous_admission",
                    value:
                      value === "yes" || value === "no" ? value : "unknown",
                  })
                }
              />
            )
          case "exam":
            return (
              <ChoiceAnswer
                key={key}
                label={t("questions.exam")}
                hint={condition.label[locale]}
                value={
                  student.exams[condition.id] === undefined
                    ? "unknown"
                    : student.exams[condition.id]
                      ? "yes"
                      : "no"
                }
                options={[
                  { value: "yes", label: t("questions.yes") },
                  { value: "no", label: t("questions.examNo") },
                  { value: "unknown", label: t("questions.notYet") },
                ]}
                onAnswer={(value) =>
                  onAnswer({
                    type: "exam",
                    id: condition.id,
                    value:
                      value === "yes"
                        ? true
                        : value === "no"
                          ? false
                          : undefined,
                  })
                }
              />
            )
          case "governorate":
            return (
              <Field key={key} className="gap-2">
                <FieldLabel htmlFor={`${id}-origin`}>
                  {t("questions.governorate")}
                </FieldLabel>
                <AdmissionsSelect
                  id={`${id}-origin`}
                  value={student.eligibilityGovernorate ?? ""}
                  placeholder={t("form.unknown")}
                  onValueChange={(value) =>
                    onAnswer({ type: "governorate", value })
                  }
                  items={[
                    { value: "", label: t("form.unknown") },
                    ...[
                      "damascus",
                      "rif-dimashq",
                      "aleppo",
                      "homs",
                      "hama",
                      "latakia",
                      "tartous",
                      "idlib",
                      "daraa",
                      "sweida",
                      "quneitra",
                      "deir-ez-zor",
                      "raqqa",
                      "hasakah",
                    ].map((value) => ({
                      value,
                      label: t(`governorates.${value}`),
                    })),
                  ]}
                />
              </Field>
            )
          default:
            return null
        }
      })}
    </FieldGroup>
  )
}

function ChoiceAnswer({
  label,
  hint,
  value,
  options,
  onAnswer,
}: {
  label: string
  hint?: string
  value: string
  options: { value: string; label: string }[]
  onAnswer: (value: string) => void
}) {
  const id = useId()
  return (
    <Field className="gap-2 [&>[data-slot=toggle-group]]:w-fit">
      <div id={id} className="font-medium text-sm leading-6">
        {label}
      </div>
      {hint ? (
        <div
          id={`${id}-hint`}
          className="text-muted-foreground text-xs leading-6"
        >
          {hint}
        </div>
      ) : null}
      <ToggleGroup
        variant="outline"
        spacing={0}
        value={options.some((option) => option.value === value) ? [value] : []}
        aria-labelledby={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onValueChange={(next) => onAnswer(next[0] ?? "")}
        className="max-w-full flex-wrap data-[spacing=0]:data-[variant=outline]:shadow-none"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="min-h-11 min-w-14 px-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}

function NumberAnswer({
  label,
  value,
  kind = "percentage",
  onAnswer,
}: {
  label: string
  value: string
  kind?: "percentage" | "year"
  onAnswer: (value: string) => void
}) {
  const t = useTranslations("Admissions")
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState(false)
  useEffect(() => {
    setDraft(value)
    setError(false)
  }, [value])
  function apply() {
    const text = normaliseDigits(draft).trim()
    const valid =
      !text ||
      (kind === "year"
        ? /^\d{4}$/.test(text) && Number(text) >= 1900 && Number(text) <= 2026
        : !!parseScore(text, "percentage"))
    setError(!valid)
    if (valid && text !== value) onAnswer(text)
  }
  return (
    <Field className="gap-2" data-invalid={error || undefined}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input
          id={id}
          value={draft}
          dir="ltr"
          inputMode={kind === "year" ? "numeric" : "decimal"}
          placeholder={kind === "year" ? "2008" : "75"}
          maxLength={16}
          className="h-11 w-24 shrink-0"
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onBlur={apply}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(false)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              apply()
            }
          }}
        />
      </div>
      {error ? (
        <FieldError id={`${id}-error`}>
          {kind === "year"
            ? t("form.birthError")
            : t("form.scoreError", { max: 100 })}
        </FieldError>
      ) : null}
    </Field>
  )
}
