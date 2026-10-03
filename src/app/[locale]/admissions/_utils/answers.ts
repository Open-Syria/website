import {
  additionalSubjects,
  type FormValues,
  parseStudentForm,
} from "./form.ts"

export const answersKey = "opensyria:admissions:2026-2027:answers"

const choices = {
  admissionRoute: [
    "standard",
    "faculty_family",
    "disability",
    "defence",
    "security",
  ],
  certificate: [
    "supported",
    "literary",
    "sharia",
    "vocational",
    "non-syrian-scientific",
    "non-syrian-literary",
    "non-syrian-vocational",
    "other",
  ],
  applicantCategory: ["", "syrian_or_equivalent", "arab_and_foreign", "other"],
  previousGeneralAdmission: ["unknown", "yes", "no"],
  mode: ["percentage", "total"],
  gender: ["unknown", "male", "female"],
  architecture: ["unknown", "passed", "failed"],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

/** Treat stored answers as untrusted input, then rerun the same form validation. */
export function readAnswers(raw: string | null): FormValues | null {
  return readAnswerSession(raw)?.values ?? null
}

export function readAnswerSession(
  raw: string | null
): { version: 1 | 2; values: FormValues } | null {
  try {
    const stored: unknown = JSON.parse(raw ?? "null")
    if (
      !isRecord(stored) ||
      (stored.version !== 1 && stored.version !== 2) ||
      !isRecord(stored.values)
    )
      return null
    const value = stored.values
    if (value.admissionRoute === undefined) value.admissionRoute = "standard"
    if (value.shariaFacultyScore === undefined) value.shariaFacultyScore = ""
    // Existing sessions only supported 2026 certificates.
    if (value.certificateYear === undefined) value.certificateYear = "2026"
    // Earlier scientific-only sessions did not have a vocational selector.
    if (value.vocationalSpecialty === undefined) value.vocationalSpecialty = ""
    if (typeof value.vocationalSpecialty !== "string") return null
    for (const [key, allowed] of Object.entries(choices))
      if (!allowed.some((choice) => choice === value[key])) return null
    for (const key of [
      "certificateYear",
      "score",
      "shariaFacultyScore",
      "math",
      "birthYear",
    ])
      if (typeof value[key] !== "string" || value[key].length > 32) return null
    if (!isRecord(value.subjectMarks)) return null
    if (
      value.eligibilityGovernorate !== undefined &&
      (typeof value.eligibilityGovernorate !== "string" ||
        !/^[a-z-]{0,32}$/.test(value.eligibilityGovernorate))
    )
      return null
    if (value.exams !== undefined) {
      if (!isRecord(value.exams) || Object.keys(value.exams).length > 500)
        return null
      for (const [id, passed] of Object.entries(value.exams))
        if (
          !/^[a-z0-9-]{1,100}$/.test(id) ||
          id === "architecture-exam" ||
          typeof passed !== "boolean"
        )
          return null
    }
    for (const [key, mark] of Object.entries(value.subjectMarks))
      if (
        !additionalSubjects.some((subject) => subject === key) ||
        typeof mark !== "string" ||
        mark.length > 32
      )
        return null
    const values = value as FormValues
    return parseStudentForm(values).input
      ? { version: stored.version, values }
      : null
  } catch {
    return null
  }
}
