import {
  type ImportedMarks,
  importedMarksSchema,
  type ResultScore,
} from "../../../../lib/exam-results/contracts.ts"
import type { FormValues } from "./form"
import { displayPercentage, normaliseDigits } from "./score.ts"
import type { Subject } from "./types"

export function applyImportedMarks(
  values: FormValues,
  marks: ImportedMarks
): FormValues {
  const subjectMarks: FormValues["subjectMarks"] = {}
  for (const [subject, score] of Object.entries(marks.subjects)) {
    if (subject !== "math" && score)
      subjectMarks[subject as Subject] = String(displayPercentage(score))
  }
  return {
    ...values,
    mode: "total",
    score: String(marks.total.earned / 100),
    math: marks.subjects.math
      ? String(displayPercentage(marks.subjects.math))
      : "",
    subjectMarks,
    importedMarks: marks,
  }
}

/** Raw fractions survive display rounding, but never override an edited field. */
export function importedSubject(
  values: FormValues,
  subject: Subject,
  text: string
): ResultScore | null {
  const parsed = importedMarksSchema.safeParse(values.importedMarks)
  if (
    !parsed.success ||
    normaliseDigits(values.certificateYear) !== "2026" ||
    values.certificate !==
      (parsed.data.branch === "scientific" ? "supported" : "literary")
  )
    return null
  const raw = parsed.data.subjects[subject]
  return raw && normaliseDigits(text) === String(displayPercentage(raw))
    ? raw
    : null
}
