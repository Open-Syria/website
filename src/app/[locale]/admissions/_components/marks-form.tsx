"use client"

import dynamic from "next/dynamic"
import { applyImportedMarks } from "../_utils/imported-marks"

const ResultsLookup = dynamic(() =>
  import("./results-lookup").then((module) => module.ResultsLookup)
)

import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  Compass,
  ShieldCheck,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  certificateBranch,
  certificateOrigin,
  comparisonTotal,
  isOlderPrivate,
  isServiceRoute,
  parseCertificateYear,
  supportsAdmissionRoute,
  supportsServiceAdmission,
  supportsSpecialQuotas,
  vocationalOptions,
} from "../_utils/certificates"
import {
  additionalSubjects,
  type FormErrors,
  type FormValues,
  parseStudentForm,
} from "../_utils/form"
import { displayPercentage, parseScore } from "../_utils/score"
import type { StudentInput } from "../_utils/types"
import { AdmissionsSelect } from "./admissions-select"

export function MarksForm({
  value,
  onChange,
  onSubmit,
  loading = false,
  loadError,
}: {
  value: FormValues
  onChange: (value: FormValues) => void
  onSubmit: (student: StudentInput) => void
  loading?: boolean
  loadError?: string
}) {
  const t = useTranslations("Admissions")
  const locale = useLocale() === "ar" ? "ar" : "en"
  const branch = certificateBranch(value.certificate)
  const foreignApplicant = value.applicantCategory === "arab_and_foreign"
  const unsupportedSharia = branch === "sharia" && foreignApplicant
  const familyAvailable = supportsSpecialQuotas(
    value.certificate,
    value.applicantCategory,
    parseCertificateYear(value.certificateYear),
    "faculty_family"
  )
  const disabilityAvailable = supportsSpecialQuotas(
    value.certificate,
    value.applicantCategory,
    parseCertificateYear(value.certificateYear),
    "disability"
  )
  const service = isServiceRoute(value.admissionRoute)
  const defenceAvailable = supportsServiceAdmission(
    value.certificate,
    value.applicantCategory,
    parseCertificateYear(value.certificateYear),
    "defence"
  )
  const securityAvailable = supportsServiceAdmission(
    value.certificate,
    value.applicantCategory,
    parseCertificateYear(value.certificateYear),
    "security"
  )
  const olderPrivate =
    !service &&
    branch !== "sharia" &&
    isOlderPrivate(
      parseCertificateYear(value.certificateYear),
      value.applicantCategory
    )
  const needsSubjects =
    !olderPrivate &&
    !service &&
    !foreignApplicant &&
    certificateOrigin(value.certificate) === "syrian"
  const nonSyrian = certificateOrigin(value.certificate) === "non_syrian"
  const maximum =
    olderPrivate || service
      ? null
      : comparisonTotal(branch, certificateOrigin(value.certificate))
  const subjects = additionalSubjects.filter(
    (subject) =>
      branch === "scientific" ||
      (!["physics", "chemistry", "biology"].includes(subject) &&
        !(branch === "sharia" && subject === "religion"))
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [expanded, setExpanded] = useState<string[]>([])
  const [subjectExpanded, setSubjectExpanded] = useState<string[]>([])
  const score = parseScore(value.score, value.mode, maximum ?? 0)
  const update = <Key extends keyof FormValues>(
    key: Key,
    next: FormValues[Key]
  ) => {
    const updated = { ...value, [key]: next }
    // Replacing a year briefly leaves an empty or partial value. Keep the
    // selected route until a complete year can determine its availability.
    if (
      key === "certificateYear" &&
      parseCertificateYear(updated.certificateYear) === null
    ) {
      onChange(updated)
      return
    }
    if (
      !supportsAdmissionRoute(
        updated.certificate,
        updated.applicantCategory,
        parseCertificateYear(updated.certificateYear),
        updated.admissionRoute
      )
    )
      updated.admissionRoute = "standard"
    const nextService = isServiceRoute(updated.admissionRoute)
    const nextOlderPrivate =
      !nextService &&
      branch !== "sharia" &&
      isOlderPrivate(
        parseCertificateYear(updated.certificateYear),
        updated.applicantCategory
      )
    if (
      olderPrivate !== nextOlderPrivate ||
      (nextService && value.mode === "total")
    ) {
      updated.mode = "percentage"
      updated.score = ""
    }
    onChange(updated)
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = parseStudentForm(value)
    setErrors(parsed.errors)
    if (!parsed.input) {
      if (
        parsed.errors.math ||
        parsed.errors.birthYear ||
        additionalSubjects.some((subject) => parsed.errors[subject])
      )
        setExpanded(["details"])
      if (additionalSubjects.some((subject) => parsed.errors[subject]))
        setSubjectExpanded(["subjects"])
      requestAnimationFrame(() =>
        document
          .getElementById(`admissions-${Object.keys(parsed.errors)[0]}`)
          ?.focus()
      )
      return
    }
    onSubmit(parsed.input)
  }
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
      <form onSubmit={submit} noValidate autoComplete="off" aria-busy={loading}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("form.title")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!errors.certificate}>
                <FieldLabel htmlFor="admissions-certificate">
                  {t("form.certificate")}
                </FieldLabel>
                <AdmissionsSelect
                  id="admissions-certificate"
                  value={value.certificate}
                  onValueChange={(next) => {
                    onChange({
                      ...value,
                      certificate: next,
                      admissionRoute: "standard",
                      mode: "percentage",
                      score: "",
                      shariaFacultyScore: "",
                      math: "",
                      subjectMarks: {},
                      architecture: "unknown",
                    })
                    setErrors({})
                  }}
                  placeholder={t("form.certificatePlaceholder")}
                  items={[
                    { value: "supported", label: t("form.supported") },
                    { value: "literary", label: t("form.literary") },
                    { value: "sharia", label: t("form.sharia") },
                    { value: "vocational", label: t("form.vocational") },
                    {
                      value: "non-syrian-scientific",
                      label: t("form.nonSyrianScientific"),
                    },
                    {
                      value: "non-syrian-literary",
                      label: t("form.nonSyrianLiterary"),
                    },
                    {
                      value: "non-syrian-vocational",
                      label: t("form.nonSyrianVocational"),
                    },
                    { value: "other", label: t("form.otherCertificate") },
                  ]}
                  aria-invalid={!!errors.certificate}
                  aria-describedby={
                    value.certificate === "other"
                      ? "admissions-certificate-help"
                      : nonSyrian
                        ? "admissions-equivalence-help"
                        : undefined
                  }
                />
                {value.certificate === "other" ? (
                  <Alert id="admissions-certificate-help">
                    <AlertDescription>{t("form.unsupported")}</AlertDescription>
                  </Alert>
                ) : null}
                {nonSyrian ? (
                  <FieldDescription id="admissions-equivalence-help">
                    {t("form.equivalenceHint")}
                  </FieldDescription>
                ) : null}
              </Field>
              {branch === "vocational" ? (
                <Field data-invalid={!!errors.vocationalSpecialty}>
                  <FieldLabel htmlFor="admissions-vocationalSpecialty">
                    {t("form.vocationalSpecialty")}
                  </FieldLabel>
                  <AdmissionsSelect
                    id="admissions-vocationalSpecialty"
                    value={value.vocationalSpecialty || null}
                    onValueChange={(next) =>
                      update("vocationalSpecialty", next)
                    }
                    placeholder={t("form.vocationalPlaceholder")}
                    items={vocationalOptions.map((option) => ({
                      value: option.id,
                      label: option.name[locale],
                    }))}
                    aria-invalid={!!errors.vocationalSpecialty}
                    aria-describedby={
                      errors.vocationalSpecialty
                        ? "vocational-error"
                        : "vocational-hint"
                    }
                  />
                  <FieldDescription
                    id="vocational-hint"
                    className="whitespace-pre-line"
                  >
                    {t(
                      nonSyrian
                        ? "form.nonSyrianVocationalHint"
                        : "form.vocationalHint"
                    )}
                  </FieldDescription>
                  {errors.vocationalSpecialty ? (
                    <FieldError id="vocational-error">
                      {t("form.vocationalError")}
                    </FieldError>
                  ) : null}
                </Field>
              ) : null}
              <Field data-invalid={!!errors.applicantCategory}>
                <FieldLabel htmlFor="admissions-applicantCategory">
                  {t("form.applicantCategory")}
                </FieldLabel>
                <AdmissionsSelect
                  id="admissions-applicantCategory"
                  value={value.applicantCategory || null}
                  onValueChange={(next) => update("applicantCategory", next)}
                  placeholder={t("form.applicantPlaceholder")}
                  items={[
                    {
                      value: "syrian_or_equivalent",
                      label: t("form.syrianApplicant"),
                    },
                    {
                      value: "arab_and_foreign",
                      label: t("form.foreignApplicant"),
                    },
                    { value: "other", label: t("form.otherApplicant") },
                  ]}
                  aria-invalid={!!errors.applicantCategory}
                  aria-describedby={`applicant-hint${errors.applicantCategory ? " applicant-error" : ""}`}
                />
                <FieldDescription id="applicant-hint">
                  {t("form.applicantHint")}
                </FieldDescription>
                {errors.applicantCategory ? (
                  <FieldError id="applicant-error">
                    {t(
                      unsupportedSharia
                        ? "form.shariaScopeHint"
                        : "form.applicantError"
                    )}
                  </FieldError>
                ) : null}
                {value.applicantCategory === "other" || unsupportedSharia ? (
                  <Alert>
                    <AlertDescription>
                      {t(
                        unsupportedSharia
                          ? "form.shariaScopeHint"
                          : "form.unsupportedApplicant"
                      )}{" "}
                      <a
                        href="#admissions-sources"
                        className="underline underline-offset-4"
                      >
                        {t("officialLink")}
                      </a>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </Field>
              <Field data-invalid={!!errors.certificateYear}>
                <FieldLabel htmlFor="admissions-certificateYear">
                  {t("form.certificateYear")}
                </FieldLabel>
                <Input
                  id="admissions-certificateYear"
                  value={value.certificateYear}
                  onChange={(event) =>
                    update("certificateYear", event.target.value)
                  }
                  placeholder="2026"
                  inputMode="numeric"
                  dir="ltr"
                  className="h-11"
                  required
                  aria-invalid={!!errors.certificateYear}
                  aria-describedby={`certificate-year-hint${errors.certificateYear ? " certificate-year-error" : ""}`}
                />
                <FieldDescription
                  id="certificate-year-hint"
                  className="whitespace-pre-line"
                >
                  {t(
                    branch === "sharia"
                      ? "form.shariaYearHint"
                      : foreignApplicant
                        ? "form.foreignYearHint"
                        : "form.yearHint"
                  )}
                </FieldDescription>
                {errors.certificateYear ? (
                  <FieldError id="certificate-year-error">
                    {t(
                      branch === "sharia"
                        ? "form.shariaYearError"
                        : "form.yearError"
                    )}
                  </FieldError>
                ) : null}
              </Field>
              {familyAvailable ||
              disabilityAvailable ||
              defenceAvailable ||
              securityAvailable ? (
                <Field data-invalid={!!errors.admissionRoute}>
                  <FieldLabel htmlFor="admissions-admissionRoute">
                    {t("form.admissionRoute")}
                  </FieldLabel>
                  <AdmissionsSelect
                    id="admissions-admissionRoute"
                    value={value.admissionRoute}
                    onValueChange={(next) => update("admissionRoute", next)}
                    placeholder={t("form.admissionRoute")}
                    items={[
                      { value: "standard", label: t("form.standardRoute") },
                      ...(familyAvailable
                        ? [
                            {
                              value: "faculty_family" as const,
                              label: t("channels.faculty_family"),
                            },
                          ]
                        : []),
                      ...(disabilityAvailable
                        ? [
                            {
                              value: "disability" as const,
                              label: t("channels.disability"),
                            },
                          ]
                        : []),
                      ...(defenceAvailable
                        ? [
                            {
                              value: "defence" as const,
                              label: t("channels.defence"),
                            },
                          ]
                        : []),
                      ...(securityAvailable
                        ? [
                            {
                              value: "security" as const,
                              label: t("channels.security"),
                            },
                          ]
                        : []),
                    ]}
                    aria-describedby="admissions-quota-hint"
                    aria-invalid={!!errors.admissionRoute}
                  />
                  <FieldDescription
                    id="admissions-quota-hint"
                    className="whitespace-pre-line"
                  >
                    {t(
                      value.admissionRoute === "defence"
                        ? "form.defenceHint"
                        : value.admissionRoute === "security"
                          ? "form.securityHint"
                          : value.admissionRoute === "faculty_family"
                            ? branch === "vocational"
                              ? "form.vocationalFacultyFamilyHint"
                              : "form.facultyFamilyHint"
                            : value.admissionRoute === "disability"
                              ? "form.disabilityHint"
                              : "form.admissionRouteHint"
                    )}
                  </FieldDescription>
                  {errors.admissionRoute ? (
                    <FieldError>{t("form.admissionRouteError")}</FieldError>
                  ) : null}
                </Field>
              ) : null}
              {!nonSyrian &&
              !service &&
              !olderPrivate &&
              value.certificateYear === "2026" &&
              (branch === "scientific" || branch === "literary") ? (
                <ResultsLookup
                  key={`${branch}:${value.certificateYear}`}
                  branch={branch}
                  onImport={(marks) => {
                    onChange(applyImportedMarks(value, marks))
                    setErrors({})
                  }}
                />
              ) : null}
              {olderPrivate ? (
                <Alert>
                  <AlertDescription>
                    {t("form.olderPrivateHint")}
                  </AlertDescription>
                </Alert>
              ) : null}
              {foreignApplicant && branch !== "sharia" && !olderPrivate ? (
                <Alert>
                  <AlertDescription className="whitespace-pre-line">
                    {t(
                      branch === "vocational"
                        ? "form.foreignVocationalHint"
                        : "form.foreignHint"
                    )}
                  </AlertDescription>
                </Alert>
              ) : null}
              {maximum ? (
                <FieldSet>
                  <FieldLegend id="score-mode-label" variant="label">
                    {t("form.inputMode")}
                  </FieldLegend>
                  <ToggleGroup
                    aria-labelledby="score-mode-label"
                    value={[value.mode]}
                    onValueChange={(values) => {
                      const mode = values[0]
                      if (mode === "percentage" || mode === "total") {
                        onChange({ ...value, mode, score: "" })
                        setErrors({})
                      }
                    }}
                    variant="outline"
                    spacing={0}
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value="percentage"
                      className="min-h-11 flex-1"
                    >
                      {t("form.percentage")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="total" className="min-h-11 flex-1">
                      {t("form.total", { maximum })}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FieldSet>
              ) : null}
              <Field data-invalid={!!errors.score}>
                <FieldLabel htmlFor="admissions-score">
                  {t(
                    value.mode === "total"
                      ? "form.totalLabel"
                      : "form.scoreLabel",
                    { maximum: maximum ?? 100 }
                  )}
                </FieldLabel>
                <Input
                  id="admissions-score"
                  dir="ltr"
                  inputMode="decimal"
                  value={value.score}
                  onChange={(event) => update("score", event.target.value)}
                  placeholder={value.mode === "total" ? "1428" : "75"}
                  className="h-14"
                  aria-invalid={!!errors.score}
                  aria-describedby={`score-hint${errors.score ? " score-error" : ""}`}
                  required
                />
                <FieldDescription
                  id="score-hint"
                  className="whitespace-pre-line"
                >
                  {t(
                    service
                      ? "form.serviceScoreHint"
                      : olderPrivate
                        ? "form.olderPrivateScoreHint"
                        : branch === "sharia"
                          ? value.admissionRoute === "standard"
                            ? "form.shariaScoreHint"
                            : "form.shariaQuotaScoreHint"
                          : foreignApplicant && branch === "vocational"
                            ? "form.foreignVocationalScoreHint"
                            : value.mode === "total"
                              ? "form.totalHint"
                              : nonSyrian
                                ? branch === "vocational"
                                  ? "form.nonSyrianVocationalScoreHint"
                                  : foreignApplicant
                                    ? "form.foreignNonSyrianScoreHint"
                                    : "form.nonSyrianScoreHint"
                                : branch === "vocational"
                                  ? "form.vocationalScoreHint"
                                  : "form.percentageHint"
                  )}
                </FieldDescription>
                {value.mode === "total" && score ? (
                  <p className="text-primary text-sm" aria-live="polite">
                    {t("form.calculated", {
                      percent: displayPercentage(score),
                    })}
                  </p>
                ) : null}
                {errors.score ? (
                  <FieldError id="score-error">
                    {t("form.scoreError", {
                      max: value.mode === "total" ? (maximum ?? 100) : 100,
                    })}
                  </FieldError>
                ) : null}
              </Field>
              {branch === "sharia" && value.admissionRoute === "standard" ? (
                <Field data-invalid={!!errors.shariaFacultyScore}>
                  <FieldLabel htmlFor="admissions-shariaFacultyScore">
                    {t("form.shariaFacultyScore")}
                  </FieldLabel>
                  <Input
                    id="admissions-shariaFacultyScore"
                    dir="ltr"
                    inputMode="decimal"
                    value={value.shariaFacultyScore}
                    onChange={(event) =>
                      update("shariaFacultyScore", event.target.value)
                    }
                    placeholder="55"
                    className="h-11"
                    aria-invalid={!!errors.shariaFacultyScore}
                    aria-describedby={`sharia-score-hint${errors.shariaFacultyScore ? " sharia-score-error" : ""}`}
                  />
                  <FieldDescription id="sharia-score-hint">
                    {t("form.shariaFacultyScoreHint")}
                  </FieldDescription>
                  {errors.shariaFacultyScore ? (
                    <FieldError id="sharia-score-error">
                      {t("form.scoreError", { max: 100 })}
                    </FieldError>
                  ) : null}
                </Field>
              ) : null}
            </FieldGroup>
            <Accordion value={expanded} onValueChange={setExpanded}>
              <AccordionItem value="details">
                <AccordionTrigger>{t("form.more")}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-5 text-muted-foreground leading-6">
                    {t("form.moreHint")}
                  </p>
                  <FieldGroup>
                    {branch === "scientific" && needsSubjects ? (
                      <Field data-invalid={!!errors.math}>
                        <FieldLabel htmlFor="admissions-math">
                          {t("form.math")}
                        </FieldLabel>
                        <Input
                          id="admissions-math"
                          placeholder={t("form.mathPlaceholder")}
                          dir="ltr"
                          inputMode="decimal"
                          value={value.math}
                          onChange={(event) =>
                            update("math", event.target.value)
                          }
                          className="h-11"
                          aria-invalid={!!errors.math}
                          aria-describedby={`math-hint${errors.math ? " math-error" : ""}`}
                        />
                        <FieldDescription id="math-hint">
                          {t("form.mathHint")}
                        </FieldDescription>
                        {errors.math ? (
                          <FieldError id="math-error">
                            {t("form.scoreError", { max: 100 })}
                          </FieldError>
                        ) : null}
                      </Field>
                    ) : null}
                    {branch !== "vocational" && needsSubjects ? (
                      <Accordion
                        value={subjectExpanded}
                        onValueChange={setSubjectExpanded}
                      >
                        <AccordionItem value="subjects">
                          <AccordionTrigger>
                            {t("form.subjectMarks")}
                          </AccordionTrigger>
                          <AccordionContent className="px-1">
                            <p className="mb-4 text-muted-foreground text-sm leading-6">
                              {t("form.subjectMarksHint")}
                            </p>
                            <FieldGroup className="grid gap-4 sm:grid-cols-2">
                              {subjects.map((subject) => (
                                <Field
                                  key={subject}
                                  data-invalid={!!errors[subject]}
                                >
                                  <FieldLabel htmlFor={`admissions-${subject}`}>
                                    {t(`subjects.${subject}`)}
                                  </FieldLabel>
                                  <Input
                                    id={`admissions-${subject}`}
                                    dir="ltr"
                                    inputMode="decimal"
                                    placeholder={t("form.subjectPlaceholder")}
                                    value={value.subjectMarks[subject] ?? ""}
                                    className="h-11"
                                    onChange={(event) =>
                                      update("subjectMarks", {
                                        ...value.subjectMarks,
                                        [subject]: event.target.value,
                                      })
                                    }
                                    aria-invalid={!!errors[subject]}
                                    aria-describedby={
                                      errors[subject]
                                        ? `error-${subject}`
                                        : undefined
                                    }
                                  />
                                  {errors[subject] ? (
                                    <FieldError id={`error-${subject}`}>
                                      {t("form.scoreError", { max: 100 })}
                                    </FieldError>
                                  ) : null}
                                </Field>
                              ))}
                            </FieldGroup>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : null}
                    <Field>
                      <FieldLabel htmlFor="admissions-gender">
                        {t("form.gender")}
                      </FieldLabel>
                      <AdmissionsSelect
                        id="admissions-gender"
                        value={value.gender}
                        onValueChange={(next) => update("gender", next)}
                        placeholder={t("form.genderPlaceholder")}
                        items={(["unknown", "female", "male"] as const).map(
                          (gender) => ({
                            value: gender,
                            label: t(`form.${gender}`),
                          })
                        )}
                      />
                    </Field>
                    <Field data-invalid={!!errors.birthYear}>
                      <FieldLabel htmlFor="admissions-birthYear">
                        {t("form.birthYear")}
                      </FieldLabel>
                      <Input
                        id="admissions-birthYear"
                        placeholder={t("form.birthPlaceholder")}
                        dir="ltr"
                        inputMode="numeric"
                        value={value.birthYear}
                        onChange={(event) =>
                          update("birthYear", event.target.value)
                        }
                        className="h-11"
                        aria-invalid={!!errors.birthYear}
                        aria-describedby={`birth-hint${errors.birthYear ? " birth-error" : ""}`}
                      />
                      <FieldDescription id="birth-hint">
                        {t("form.birthHint")}
                      </FieldDescription>
                      {errors.birthYear ? (
                        <FieldError id="birth-error">
                          {t("form.birthError")}
                        </FieldError>
                      ) : null}
                    </Field>
                    {branch === "scientific" && !service ? (
                      <Field>
                        <FieldLabel htmlFor="admissions-exam">
                          {t("form.architecture")}
                        </FieldLabel>
                        <AdmissionsSelect
                          id="admissions-exam"
                          value={value.architecture}
                          onValueChange={(next) => update("architecture", next)}
                          placeholder={t("form.examPlaceholder")}
                          items={[
                            { value: "unknown", label: t("form.examUnknown") },
                            { value: "passed", label: t("form.examPassed") },
                            { value: "failed", label: t("form.examFailed") },
                          ]}
                        />
                      </Field>
                    ) : null}
                    {branch !== "vocational" && needsSubjects ? (
                      <Field>
                        <FieldLabel htmlFor="admissions-previousAdmission">
                          {t("form.previousAdmission")}
                        </FieldLabel>
                        <AdmissionsSelect
                          id="admissions-previousAdmission"
                          value={value.previousGeneralAdmission}
                          onValueChange={(next) =>
                            update("previousGeneralAdmission", next)
                          }
                          placeholder={t("form.previousPlaceholder")}
                          items={[
                            { value: "unknown", label: t("form.unknown") },
                            { value: "no", label: t("form.previousNo") },
                            { value: "yes", label: t("form.previousYes") },
                          ]}
                        />
                        <FieldDescription>
                          {t("form.previousHint")}
                        </FieldDescription>
                      </Field>
                    ) : null}
                  </FieldGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            {loadError ? (
              <p role="alert" className="text-sm">
                {loadError}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="min-h-12"
              disabled={
                loading ||
                unsupportedSharia ||
                value.certificate === "other" ||
                value.applicantCategory === "other"
              }
            >
              {t(loading ? "form.loading" : "form.submit")}
              <ArrowRight
                aria-hidden="true"
                data-icon="inline-end"
                className="rtl-icon-mirror"
              />
            </Button>
            <p className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
              {t("privacy")}
            </p>
          </CardFooter>
        </Card>
      </form>
      <aside
        className="flex flex-col gap-8 py-4 lg:py-8"
        aria-label={t("form.helpTitle")}
      >
        <div>
          <Compass aria-hidden="true" className="mb-5 size-8 text-primary" />
          <h2 className="text-balance font-heading font-semibold text-2xl leading-relaxed">
            {t("form.helpTitle")}
          </h2>
        </div>
        <ol className="flex flex-col gap-7">
          {[
            { key: "step1", icon: BookOpen },
            { key: "step2", icon: Compass },
            { key: "step3", icon: CircleCheck },
          ].map(({ key, icon: Icon }, index) => (
            <li key={key} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold">
                  {index + 1}. {t(`form.${key}`)}
                </h3>
                <p className="mt-1 text-muted-foreground text-sm leading-7">
                  {t(`form.${key}Body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}
