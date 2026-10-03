import { z } from "zod"

export const lookupContextSchema = z
  .object({
    studentNumber: z.string().regex(/^[0-9]{1,12}$/),
    directorateId: z.number().int().positive().max(1_000_000),
    certificateId: z.number().int().positive().max(1_000_000),
    examYear: z.literal(2026),
    branch: z.enum(["scientific", "literary"]),
  })
  .strict()

export type LookupContext = z.infer<typeof lookupContextSchema>
export const resultSubjects = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "arabic",
  "foreign_language",
  "english",
  "french",
  "russian",
  "religion",
] as const
export type ResultSubject = (typeof resultSubjects)[number]
export const rawScoreSchema = z
  .object({
    earned: z.number().int().min(0).max(1_000_000),
    maximum: z.number().int().positive().max(1_000_000),
  })
  .strict()
  .refine((value) => value.earned <= value.maximum)

export const importedMarksSchema = z
  .object({
    branch: z.enum(["scientific", "literary"]),
    examYear: z.literal(2026),
    total: rawScoreSchema,
    subjects: z.partialRecord(z.enum(resultSubjects), rawScoreSchema),
  })
  .strict()
export type ImportedMarks = z.infer<typeof importedMarksSchema>
export type ResultScore = z.infer<typeof rawScoreSchema>
export type ExamOption = { id: number; name: string }
export type CertificateOption = ExamOption & { branch: LookupContext["branch"] }

export const encryptedEnvelopeSchema = z
  .object({
    iv: z.string().length(24),
    data: z.string().min(24).max(32_768),
  })
  .strict()

export const resultsRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("session") }).strict(),
  z
    .object({
      action: z.literal("certificates"),
      directorateId: lookupContextSchema.shape.directorateId,
    })
    .strict(),
  z
    .object({
      action: z.literal("ticket"),
      context: lookupContextSchema,
      turnstileToken: z.string().min(1).max(2048),
    })
    .strict(),
  z
    .object({
      action: z.literal("decode"),
      context: lookupContextSchema,
      ticket: z.string().regex(/^[a-f0-9]{64}$/),
      envelope: encryptedEnvelopeSchema,
    })
    .strict(),
])

export const ministryOrigin = "https://examresult.edu-access.net"
export const ministryHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  version: "1.0.1",
}
export function resultUrl(context: LookupContext) {
  return `${ministryOrigin}/studentResult/${context.studentNumber}/${context.certificateId}/${context.examYear}/${context.directorateId}`
}
