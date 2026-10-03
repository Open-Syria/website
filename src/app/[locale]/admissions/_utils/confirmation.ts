import type { FormValues } from "./form"
import type { Channel, Condition, ProgramResult, Subject } from "./types"

/** Do not ask about a track blocked by the main score/certificate profile. */
export function questionChannels(result: ProgramResult): Channel[] {
  return result.channels
    .filter(
      ({ channel, findings }) =>
        !findings.some(
          (finding) =>
            (finding.type === "minimum" && !channel.scoreBasis) ||
            finding.type === "scope" ||
            (finding.type === "condition" &&
              finding.outcome === "failed" &&
              !canAnswerCondition(finding.condition))
        )
    )
    .map(({ channel }) => channel)
}

export function conditionQuestionKey(condition: Condition) {
  if (condition.type === "subject") return `subject-${condition.subject}`
  if (condition.type === "exam") return `exam-${condition.id}`
  return condition.type
}

/** Each answer belongs to the student, even when several tracks ask for it. */
export function collectQuestions(channels: Channel[]) {
  return {
    conditions: [
      ...new Map(
        channels.flatMap((channel) =>
          channel.conditions
            .filter(canAnswerCondition)
            .map(
              (condition) =>
                [conditionQuestionKey(condition), condition] as const
            )
        )
      ).values(),
    ],
    shariaScore: channels.some((channel) => !!channel.scoreBasis),
  }
}

export type ConfirmationAnswer =
  | { type: "subject"; subject: Subject; value: string }
  | { type: "sharia_score"; value: string }
  | { type: "birth_year"; value: string }
  | { type: "gender"; value: FormValues["gender"] }
  | { type: "governorate"; value: string }
  | {
      type: "previous_admission"
      value: FormValues["previousGeneralAdmission"]
    }
  | { type: "exam"; id: string; value: boolean | undefined }

export function canAnswerCondition(condition: Condition) {
  return (
    [
      "subject",
      "gender",
      "birth_year",
      "governorate",
      "no_previous_general_admission",
    ].includes(condition.type) ||
    (condition.type === "exam" && condition.stage === "before_application")
  )
}

/** Save actual answers, never a guessed pass/fail override of a published rule. */
export function applyConfirmationAnswer(
  values: FormValues,
  answer: ConfirmationAnswer
): FormValues {
  switch (answer.type) {
    case "subject":
      return answer.subject === "math"
        ? { ...values, math: answer.value }
        : {
            ...values,
            subjectMarks: {
              ...values.subjectMarks,
              [answer.subject]: answer.value,
            },
          }
    case "sharia_score":
      return { ...values, shariaFacultyScore: answer.value }
    case "birth_year":
      return { ...values, birthYear: answer.value }
    case "gender":
      return { ...values, gender: answer.value }
    case "governorate":
      return { ...values, eligibilityGovernorate: answer.value }
    case "previous_admission":
      return { ...values, previousGeneralAdmission: answer.value }
    case "exam": {
      if (answer.id === "architecture-exam")
        return {
          ...values,
          architecture:
            answer.value === undefined
              ? "unknown"
              : answer.value
                ? "passed"
                : "failed",
        }
      const exams = { ...values.exams }
      if (answer.value === undefined) delete exams[answer.id]
      else exams[answer.id] = answer.value
      return { ...values, exams }
    }
  }
}
