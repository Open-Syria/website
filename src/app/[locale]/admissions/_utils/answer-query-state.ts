import { parseAsJson } from "nuqs/server"
import { readAnswerSession } from "./answers.ts"
import { additionalSubjects, type FormValues } from "./form.ts"
import { normaliseDigits, parseScore } from "./score.ts"

const emptyAnswers = {
  math: "",
  subjectMarks: {},
  shariaFacultyScore: "",
  birthYear: "",
  gender: "unknown",
  previousGeneralAdmission: "unknown",
  architecture: "unknown",
  exams: {},
  eligibilityGovernorate: "",
} satisfies Partial<FormValues>

export type QueryAnswers = Partial<Pick<FormValues, keyof typeof emptyAnswers>>

/** A complete snapshot: omitted fields are unanswered, not inherited from storage. */
export function withQueryAnswers(
  values: FormValues,
  answers: QueryAnswers | null
): FormValues {
  return { ...values, ...emptyAnswers, ...answers }
}

export function toQueryAnswers(values: FormValues): QueryAnswers | null {
  const answers: QueryAnswers = {}
  for (const key of ["math", "shariaFacultyScore", "birthYear"] as const) {
    const value = normaliseDigits(values[key]).trim()
    if (value) answers[key] = value
  }
  for (const key of [
    "gender",
    "previousGeneralAdmission",
    "architecture",
  ] as const)
    if (values[key] !== "unknown")
      Object.assign(answers, { [key]: values[key] })
  const marks = Object.entries(values.subjectMarks)
    .map(([key, value]) => [key, normaliseDigits(value ?? "").trim()])
    .filter(([, value]) => value)
  if (marks.length) answers.subjectMarks = Object.fromEntries(marks)
  if (Object.keys(values.exams ?? {}).length) answers.exams = values.exams
  if (values.eligibilityGovernorate)
    answers.eligibilityGovernorate = values.eligibilityGovernorate
  return Object.keys(answers).length ? answers : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function percentage(value: unknown) {
  return (
    typeof value === "string" &&
    value.length <= 32 &&
    !!parseScore(value, "percentage")
  )
}

function validateQueryAnswers(value: unknown): QueryAnswers | null {
  if (!isRecord(value)) return null
  for (const [key, answer] of Object.entries(value)) {
    switch (key) {
      case "math":
      case "shariaFacultyScore":
        if (!percentage(answer)) return null
        break
      case "birthYear":
        if (
          typeof answer !== "string" ||
          !/^\d{4}$/.test(normaliseDigits(answer)) ||
          Number(normaliseDigits(answer)) < 1900 ||
          Number(normaliseDigits(answer)) > 2026
        )
          return null
        break
      case "gender":
        if (answer !== "female" && answer !== "male") return null
        break
      case "previousGeneralAdmission":
        if (answer !== "yes" && answer !== "no") return null
        break
      case "architecture":
        if (answer !== "passed" && answer !== "failed") return null
        break
      case "subjectMarks":
        if (
          !isRecord(answer) ||
          Object.entries(answer).some(
            ([subject, mark]) =>
              !additionalSubjects.some((allowed) => allowed === subject) ||
              !percentage(mark)
          )
        )
          return null
        break
      case "exams":
        if (
          !isRecord(answer) ||
          Object.keys(answer).length > 500 ||
          Object.entries(answer).some(
            ([id, passed]) =>
              !/^[a-z0-9-]{1,100}$/.test(id) ||
              id === "architecture-exam" ||
              typeof passed !== "boolean"
          )
        )
          return null
        break
      case "eligibilityGovernorate":
        if (
          typeof answer !== "string" ||
          ![
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
          ].includes(answer)
        )
          return null
        break
      default:
        return null
    }
  }
  return value as QueryAnswers
}

export const answerParsers = { answers: parseAsJson(validateQueryAnswers) }
export const answerQueryOptions = {
  urlKeys: { answers: "a" },
  shallow: true,
  history: "replace",
} as const

export function restoreAnswerSession(
  raw: string | null,
  answers: QueryAnswers | null
) {
  const session = readAnswerSession(raw)
  if (!session) return null
  // Migrate older tabs once. URL-aware sessions never resurrect cleared answers.
  const snapshot =
    answers ?? (session.version === 1 ? toQueryAnswers(session.values) : null)
  return {
    values: withQueryAnswers(session.values, snapshot),
    answers: snapshot,
  }
}
