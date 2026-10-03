import { comparisonTotal } from "./certificates.ts"
import { isValidScore, meetsMinimum } from "./score.ts"
import type {
  AdmissionsData,
  ChannelResult,
  Condition,
  Finding,
  ProgramResult,
  Status,
  StudentInput,
} from "./types"

function checkCondition(
  condition: Condition,
  student: StudentInput
): "passed" | "failed" | "missing" {
  switch (condition.type) {
    case "certificate_year":
      return condition.allowed.includes(student.certificateYear)
        ? "passed"
        : "failed"
    case "vocational_specialty":
      return !student.vocationalSpecialty
        ? "missing"
        : condition.allowed.includes(student.vocationalSpecialty)
          ? "passed"
          : "failed"
    case "no_previous_general_admission":
      return typeof student.previousGeneralAdmission !== "boolean"
        ? "missing"
        : student.previousGeneralAdmission
          ? "failed"
          : "passed"
    case "subject": {
      const score = student.subjects[condition.subject]
      if (!score) return "missing"
      return meetsMinimum(score, condition.minPercent) ? "passed" : "failed"
    }
    case "gender":
      return student.gender === null
        ? "missing"
        : student.gender === condition.value
          ? "passed"
          : "failed"
    case "birth_year":
      return student.birthYear === null
        ? "missing"
        : student.birthYear >= condition.minimum
          ? "passed"
          : "failed"
    case "governorate":
      return student.eligibilityGovernorate === null
        ? "missing"
        : condition.allowed.includes(student.eligibilityGovernorate)
          ? "passed"
          : "failed"
    case "exam": {
      // Post-admission medical checks cannot be verified by an application-time score tool.
      if (condition.stage === "after_admission") return "missing"
      const result = student.exams[condition.id]
      return result === undefined ? "missing" : result ? "passed" : "failed"
    }
    case "manual":
      return "missing"
  }
}

export function getBestStatus(statuses: Status[]): Status {
  if (statuses.includes("meets_requirements")) return "meets_requirements"
  if (statuses.includes("needs_confirmation")) return "needs_confirmation"
  return "not_eligible"
}

export function evaluateAdmissions(
  data: AdmissionsData,
  student: StudentInput
): ProgramResult[] {
  if (
    !isValidScore(student.score) ||
    ![
      10_000,
      (data.scope.certificateYearMaximum !== undefined ||
      data.scope.admissionRoute === "service"
        ? 0
        : (comparisonTotal(
            data.scope.branch,
            data.scope.certificate === "syrian_or_non_syrian"
              ? student.certificate === "syrian"
                ? "syrian"
                : "non_syrian"
              : data.scope.certificate
          ) ?? 0)) * 100,
    ].includes(student.score.maximum)
  ) {
    throw new RangeError("Invalid admission score")
  }
  for (const score of Object.values(student.subjects)) {
    if (!score || !isValidScore(score) || score.maximum !== 10_000)
      throw new RangeError("Invalid subject percentage")
  }
  if (
    student.shariaFacultyScore != null &&
    (!isValidScore(student.shariaFacultyScore) ||
      student.shariaFacultyScore.maximum !== 10_000)
  )
    throw new RangeError("Invalid Sharia faculty percentage")
  if (
    student.birthYear !== null &&
    (!Number.isInteger(student.birthYear) ||
      student.birthYear < 1900 ||
      student.birthYear > data.scope.certificateYear)
  ) {
    throw new RangeError("Invalid birth year")
  }
  const supported =
    (data.scope.admissionRoute === "service"
      ? ["defence", "security"].includes(student.admissionRoute ?? "standard")
      : data.scope.admissionRoute === "special_quotas"
        ? ["faculty_family", "disability"].includes(
            student.admissionRoute ?? "standard"
          )
        : (student.admissionRoute ?? "standard") === "standard") &&
    student.branch === data.scope.branch &&
    (data.scope.certificate === "syrian_or_non_syrian"
      ? ["syrian", "non_syrian"].includes(student.certificate)
      : student.certificate === data.scope.certificate) &&
    student.applicantCategory === data.scope.applicantCategory &&
    (data.scope.certificateYearMaximum !== undefined
      ? Number.isInteger(student.certificateYear) &&
        student.certificateYear >= 1000 &&
        student.certificateYear <= data.scope.certificateYearMaximum
      : (data.scope.certificateYears ?? [data.scope.certificateYear]).includes(
          student.certificateYear
        ))

  const special =
    data.scope.admissionRoute === "special_quotas" ||
    data.scope.admissionRoute === "service"
  const quotaSelected =
    student.admissionRoute === "faculty_family" ||
    student.admissionRoute === "disability" ||
    student.admissionRoute === "defence" ||
    student.admissionRoute === "security"
  return data.programs
    .filter(
      (program) =>
        !special ||
        !quotaSelected ||
        program.channels.some(
          (channel) => channel.id === student.admissionRoute
        )
    )
    .map((program) => {
      const channels = program.channels
        .filter(
          (channel) =>
            !special || !quotaSelected || channel.id === student.admissionRoute
        )
        .map((channel): ChannelResult => {
          const findings: Finding[] = []
          if (!supported) findings.push({ type: "scope" })
          const score = channel.scoreBasis
            ? student.shariaFacultyScore
            : student.score
          if (channel.minPercent !== null) {
            if (!score && channel.scoreBasis)
              findings.push({
                type: "missing_score",
                basis: channel.scoreBasis,
              })
            else if (score && !meetsMinimum(score, channel.minPercent))
              findings.push({ type: "minimum", required: channel.minPercent })
          }
          for (const condition of channel.conditions) {
            const outcome = checkCondition(condition, student)
            if (outcome !== "passed")
              findings.push({ type: "condition", condition, outcome })
          }
          const failed = findings.some(
            (finding) =>
              finding.type === "scope" ||
              finding.type === "minimum" ||
              (finding.type === "condition" && finding.outcome === "failed")
          )
          const status = failed
            ? "not_eligible"
            : findings.length
              ? "needs_confirmation"
              : "meets_requirements"
          return { channel, status, findings }
        })
      return {
        program,
        channels,
        status: getBestStatus(channels.map((channel) => channel.status)),
      }
    })
}
