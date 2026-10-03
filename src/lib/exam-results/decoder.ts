import { createDecipheriv } from "node:crypto"
import { z } from "zod"
import {
  encryptedEnvelopeSchema,
  type ImportedMarks,
  type LookupContext,
  type ResultSubject,
} from "./contracts.ts"

const markSchema = z.object({
  subject_name: z.string().min(1).max(120),
  exam_mark: z.number().finite().min(0).max(10_000),
  max_mark: z.number().finite().positive().max(10_000),
  excluded_from_total: z.boolean(),
})
const decodedSchema = z.object({
  total: z.number().finite().nonnegative(),
  max_total: z.number().finite().positive(),
  result: z.literal("ناجح"),
  student_info: z.object({
    subscription_number: z.number().int().positive(),
    certificate_name: z.string().max(200),
  }),
  subject_info: z.array(markSchema).min(5).max(24),
})

export function normalizeArabic(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F\u0670ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
const aliases: Record<string, ResultSubject | "other"> = Object.fromEntries(
  Object.entries({
    math: ["الرياضيات"],
    physics: ["الفيزياء"],
    chemistry: ["الكيمياء"],
    biology: ["علم الأحياء", "علم الاحياء", "العلوم", "علم الأحياء والأرض"],
    arabic: ["اللغة العربية", "لغة عربية"],
    english: [
      "اللغة الإنكليزية",
      "اللغة الإنجليزية",
      "لغة إنكليزية",
      "لغة إنجليزية",
    ],
    french: ["اللغة الفرنسية", "لغة فرنسية"],
    russian: ["اللغة الروسية", "لغة روسية"],
    religion: ["التربية الدينية", "التربية الإسلامية", "التربية المسيحية"],
    other: [
      "التاريخ",
      "الجغرافيا",
      "الفلسفة",
      "الفلسفة والعلوم الإنسانية",
      "التربية الوطنية",
    ],
  }).flatMap(([subject, names]) =>
    names.map((name) => [
      normalizeArabic(name),
      subject as ResultSubject | "other",
    ])
  )
)

function hundredths(value: number) {
  const result = Math.round(value * 100)
  if (
    !Number.isSafeInteger(result) ||
    Math.abs(value * 100 - result) > 0.000001
  )
    throw new Error("Invalid result")
  return result
}
export function decodeBase64(value: string) {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value
    )
  )
    throw new Error("Invalid result")
  const buffer = Buffer.from(value, "base64")
  if (buffer.toString("base64") !== value) throw new Error("Invalid result")
  return buffer
}

/** Server-only adapter. Never return upstream identity fields or decoder errors. */
export function decodeMarks(
  envelope: unknown,
  key: Buffer,
  context: LookupContext,
  certificateName: string
): ImportedMarks {
  const parsed = encryptedEnvelopeSchema.parse(envelope)
  const iv = decodeBase64(parsed.iv)
  const data = decodeBase64(parsed.data)
  if (key.length !== 32 || iv.length !== 16 || !data.length || data.length % 16)
    throw new Error("Invalid result")
  const decipher = createDecipheriv("aes-256-cbc", key, iv)
  const bytes = Buffer.concat([decipher.update(data), decipher.final()])
  const plaintext = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  const result = decodedSchema.parse(JSON.parse(plaintext))
  if (
    String(result.student_info.subscription_number) !==
      context.studentNumber.replace(/^0+(?=\d)/, "") ||
    normalizeArabic(result.student_info.certificate_name) !==
      normalizeArabic(certificateName)
  )
    throw new Error("Invalid result")
  const maximum = context.branch === "scientific" ? 2400 : 2200
  if (result.max_total !== maximum || result.total > maximum)
    throw new Error("Invalid result")
  const subjects: ImportedMarks["subjects"] = {}
  const labels = new Set<string>()
  let earned = 0
  let max = 0
  let languages = 0
  for (const row of result.subject_info) {
    const label = normalizeArabic(row.subject_name)
    const subject = aliases[label]
    if (!subject || labels.has(label) || row.exam_mark > row.max_mark)
      throw new Error("Invalid result")
    labels.add(label)
    const score = {
      earned: hundredths(row.exam_mark),
      maximum: hundredths(row.max_mark),
    }
    if (!row.excluded_from_total) {
      earned += score.earned
      max += score.maximum
    }
    if (subject === "other") continue
    if (subjects[subject]) throw new Error("Invalid result")
    subjects[subject] = score
    if (
      ["english", "french", "russian"].includes(subject) &&
      !row.excluded_from_total
    ) {
      languages++
      subjects.foreign_language = score
    }
  }
  if (
    earned !== hundredths(result.total) ||
    max !== hundredths(result.max_total) ||
    languages !== 1 ||
    !subjects.arabic ||
    !subjects.religion ||
    (context.branch === "scientific" &&
      (!subjects.math ||
        !subjects.physics ||
        !subjects.chemistry ||
        !subjects.biology))
  )
    throw new Error("Invalid result")
  return {
    branch: context.branch,
    examYear: 2026,
    total: { earned, maximum: max },
    subjects,
  }
}
