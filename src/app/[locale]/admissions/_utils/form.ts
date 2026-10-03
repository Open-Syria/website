import {
  type CertificateOption,
  certificateBranch,
  certificateOrigin,
  comparisonTotal,
  isOlderPrivate,
  isServiceRoute,
  parseCertificateYear,
  supportsAdmissionRoute,
  vocationalOptions,
} from "./certificates.ts"
import { importedSubject } from "./imported-marks.ts"
import { normaliseDigits, parseScore, type ScoreMode } from "./score.ts"
import type { AdmissionRoute, StudentInput, Subject } from "./types"

export const additionalSubjects = [
  "physics",
  "chemistry",
  "biology",
  "arabic",
  "foreign_language",
  "english",
  "french",
  "russian",
  "religion",
] as const satisfies readonly Subject[]

export type FormValues = {
  importedMarks?: ImportedMarks
  admissionRoute: AdmissionRoute
  certificate: CertificateOption
  certificateYear: string
  vocationalSpecialty: string
  applicantCategory: "syrian_or_equivalent" | "arab_and_foreign" | "other" | ""
  previousGeneralAdmission: "unknown" | "yes" | "no"
  mode: ScoreMode
  score: string
  shariaFacultyScore: string
  math: string
  subjectMarks: Partial<Record<Subject, string>>
  gender: "female" | "male" | "unknown"
  birthYear: string
  architecture: "unknown" | "passed" | "failed"
  exams?: Record<string, boolean>
  eligibilityGovernorate?: string
}
export const initialValues: FormValues = {
  admissionRoute: "standard",
  certificate: "supported",
  certificateYear: "2026",
  vocationalSpecialty: "",
  applicantCategory: "",
  previousGeneralAdmission: "unknown",
  mode: "percentage",
  score: "",
  shariaFacultyScore: "",
  math: "",
  subjectMarks: {},
  gender: "unknown",
  birthYear: "",
  architecture: "unknown",
}
export type FormErrors = Partial<
  Record<
    | "certificate"
    | "admissionRoute"
    | "certificateYear"
    | "vocationalSpecialty"
    | "applicantCategory"
    | "score"
    | "shariaFacultyScore"
    | Subject
    | "birthYear",
    true
  >
>

export function parseStudentForm(values: FormValues): {
  input: StudentInput | null
  errors: FormErrors
} {
  const errors: FormErrors = {}
  const branch = certificateBranch(values.certificate)
  const origin = certificateOrigin(values.certificate)
  const foreignApplicant = values.applicantCategory === "arab_and_foreign"
  const certificateYear = parseCertificateYear(values.certificateYear)
  const admissionRoute = values.admissionRoute ?? "standard"
  const service = isServiceRoute(admissionRoute)
  if (
    !supportsAdmissionRoute(
      values.certificate,
      values.applicantCategory,
      certificateYear,
      admissionRoute
    )
  )
    errors.admissionRoute = true
  const olderPrivate =
    !service &&
    branch !== "sharia" &&
    isOlderPrivate(certificateYear, values.applicantCategory)
  const needsSubjects =
    branch !== "vocational" &&
    origin === "syrian" &&
    !foreignApplicant &&
    !olderPrivate &&
    !service
  const total = olderPrivate || service ? null : comparisonTotal(branch, origin)
  const score = parseScore(values.score, values.mode, total ?? 0)
  const shariaText =
    branch === "sharia" && admissionRoute === "standard"
      ? values.shariaFacultyScore.trim()
      : ""
  const shariaFacultyScore = shariaText
    ? parseScore(shariaText, "percentage")
    : null
  if (shariaText && !shariaFacultyScore) errors.shariaFacultyScore = true
  const math = values.math.trim()
    ? (importedSubject(values, "math", values.math) ??
      parseScore(values.math, "percentage"))
    : null
  const birthText = normaliseDigits(values.birthYear)
  const birthYear = birthText ? Number(birthText) : null
  if (values.certificate === "other") errors.certificate = true
  if (branch === "sharia" && foreignApplicant) errors.applicantCategory = true
  if (
    certificateYear === null ||
    (branch === "sharia" && certificateYear !== 2026 && !service)
  )
    errors.certificateYear = true
  if (
    branch === "vocational" &&
    !vocationalOptions.some(
      (option) => option.id === values.vocationalSpecialty
    )
  )
    errors.vocationalSpecialty = true
  if (values.applicantCategory !== "syrian_or_equivalent" && !foreignApplicant)
    errors.applicantCategory = true
  if (!score) errors.score = true
  if (needsSubjects && values.math.trim() && !math) errors.math = true
  const subjects: StudentInput["subjects"] =
    needsSubjects && math ? { math } : {}
  for (const subject of needsSubjects ? additionalSubjects : []) {
    const value = values.subjectMarks[subject]?.trim()
    if (!value) continue
    const mark =
      importedSubject(values, subject, value) ?? parseScore(value, "percentage")
    if (mark) subjects[subject] = mark
    else errors[subject] = true
  }
  if (
    birthText &&
    (!/^\d{4}$/.test(birthText) ||
      birthYear === null ||
      birthYear < 1900 ||
      birthYear > 2026)
  )
    errors.birthYear = true
  if (Object.keys(errors).length || !score || certificateYear === null)
    return { input: null, errors }
  return {
    errors,
    input: {
      admissionRoute,
      branch,
      vocationalSpecialty:
        branch === "vocational" ? values.vocationalSpecialty : null,
      certificate: origin,
      certificateYear,
      applicantCategory: values.applicantCategory,
      previousGeneralAdmission:
        !needsSubjects || values.previousGeneralAdmission === "unknown"
          ? null
          : values.previousGeneralAdmission === "yes",
      score,
      shariaFacultyScore,
      subjects,
      gender: values.gender === "unknown" ? null : values.gender,
      birthYear,
      eligibilityGovernorate: values.eligibilityGovernorate || null,
      exams: {
        ...values.exams,
        ...(values.architecture === "unknown" || service
          ? {}
          : { "architecture-exam": values.architecture === "passed" }),
      },
    },
  }
}

import type { ImportedMarks } from "@/lib/exam-results/contracts"
