import { z } from "zod"

import type { AdmissionsData } from "./types"

const text = z.object({ ar: z.string().min(1), en: z.string().min(1) }).strict()
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const sourceDocument = z
  .object({
    title: text,
    filename: z.string().endsWith(".pdf"),
    url: z
      .url()
      .refine(
        (value) => new URL(value).origin === "https://mohe.gov.sy",
        "Use an official Ministry PDF"
      ),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    pageCount: z.number().int().positive(),
  })
  .strict()
const percent = z
  .number()
  .min(0)
  .max(100)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
    "At most two decimal places"
  )
const reference = z
  .object({
    announcement: z.number().int().positive(),
    page: z.number().int().positive(),
    table: z.number().int().positive().optional(),
    row: z.number().int().positive().optional(),
  })
  .strict()
const condition = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("certificate_year"),
      allowed: z.array(z.number().int().min(2024).max(2026)).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("vocational_specialty"),
      allowed: z.array(id).min(1),
      label: text,
    })
    .strict(),
  z.object({ type: z.literal("no_previous_general_admission") }).strict(),
  z
    .object({
      type: z.literal("subject"),
      subject: z.enum([
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
      ]),
      minPercent: percent,
    })
    .strict(),
  z
    .object({ type: z.literal("gender"), value: z.enum(["female", "male"]) })
    .strict(),
  z
    .object({
      type: z.literal("birth_year"),
      minimum: z.number().int().min(1900).max(2100),
    })
    .strict(),
  z
    .object({ type: z.literal("governorate"), allowed: z.array(id).min(1) })
    .strict(),
  z.object({ type: z.literal("manual"), label: text }).strict(),
  z
    .object({
      type: z.literal("exam"),
      id,
      label: text,
      stage: z.enum(["before_application", "after_admission"]),
    })
    .strict(),
])

export const admissionsSchema = z
  .object({
    academicYear: z.string().regex(/^\d{4}-\d{4}$/),
    version: z.string().min(1),
    coverage: z.enum([
      "scientific",
      "service-scientific",
      "service-literary",
      "service-sharia",
      "service-vocational",
      "special-scientific",
      "special-literary",
      "special-sharia",
      "special-vocational",
      "literary",
      "sharia",
      "vocational",
      "non-syrian-scientific",
      "non-syrian-literary",
      "non-syrian-vocational",
      "foreign-scientific",
      "foreign-literary",
      "foreign-vocational",
      "older-scientific",
      "older-literary",
      "older-vocational",
      "older-foreign-scientific",
      "older-foreign-literary",
      "older-foreign-vocational",
    ]),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reviewLevel: z.literal("single_visual_review"),
    scope: z
      .object({
        branch: z.enum(["scientific", "literary", "vocational", "sharia"]),
        certificateYear: z.number().int(),
        certificate: z.enum(["syrian", "non_syrian", "syrian_or_non_syrian"]),
        certificateYears: z.array(z.number().int()).min(1).optional(),
        certificateYearMaximum: z.number().int().min(1000).max(2025).optional(),
        admissionRoute: z.enum(["special_quotas", "service"]).optional(),
        applicantCategory: z.enum(["syrian_or_equivalent", "arab_and_foreign"]),
      })
      .strict(),
    sources: z
      .array(
        sourceDocument.extend({ announcement: z.number().int().positive() })
      )
      .min(1),
    supportDirectory: sourceDocument,
    programs: z
      .array(
        z
          .object({
            id,
            name: text,
            institution: z.object({ id, name: text }).strict(),
            campus: text,
            governorate: id,
            field: z.enum([
              "technology",
              "engineering",
              "health",
              "business",
              "agriculture",
              "science",
              "languages",
              "education",
              "law",
              "arts",
              "media",
              "tourism",
              "humanities",
              "religion",
            ]),
            kind: z.enum(["faculty", "applied_college", "institute"]),
            channels: z
              .array(
                z
                  .object({
                    id: z.enum([
                      "general",
                      "parallel",
                      "arab_foreign",
                      "private",
                      "faculty_family",
                      "disability",
                      "defence",
                      "security",
                    ]),
                    minPercent: percent.nullable(),
                    scoreBasis: z
                      .literal("sharia_subjects_included")
                      .optional(),
                    conditions: z.array(condition),
                  })
                  .strict()
              )
              .min(1),
            notes: z.array(text),
            sources: z.array(reference).min(1),
          })
          .strict()
      )
      .min(1),
  })
  .strict()
  .superRefine((data, context) => {
    const seen = new Set<string>()
    const institutions = new Map<string, string>()
    const sources = new Map(
      data.sources.map((source) => [source.announcement, source])
    )
    const addIssue = (message: string) =>
      context.addIssue({ code: "custom", message })
    const foreignApplicant = data.scope.applicantCategory === "arab_and_foreign"
    const olderPrivate = data.coverage.startsWith("older-")
    const special = data.coverage.startsWith("special-")
    const service = data.coverage.startsWith("service-")
    if (service) {
      if (
        data.scope.admissionRoute !== "service" ||
        foreignApplicant ||
        data.scope.certificateYear !== 2026 ||
        data.scope.certificateYearMaximum !== undefined ||
        data.scope.certificate !==
          (data.scope.branch === "sharia"
            ? "syrian"
            : "syrian_or_non_syrian") ||
        JSON.stringify(data.scope.certificateYears) !==
          (data.scope.branch === "vocational" ? "[2026]" : "[2024,2025,2026]")
      )
        addIssue(
          "Defence/security scope requires the published certificate origins, years and Syrian/equivalent category"
        )
    } else if (special) {
      if (
        data.scope.admissionRoute !== "special_quotas" ||
        data.scope.certificate !== "syrian" ||
        data.scope.certificateYear !== 2026 ||
        foreignApplicant ||
        data.scope.certificateYears ||
        data.scope.certificateYearMaximum !== undefined
      )
        addIssue(
          "Special quotas require a Syrian 2026 certificate and Syrian/equivalent applicant"
        )
    } else if (data.scope.admissionRoute)
      addIssue("Special quota scope requires a special catalogue")
    if (
      data.scope.branch === "sharia" &&
      (data.scope.certificate !== "syrian" ||
        foreignApplicant ||
        data.scope.certificateYear !== 2026)
    )
      addIssue(
        "The Sharia route requires a Syrian 2026 certificate and Syrian/equivalent applicant"
      )
    const expectedCoverage = service
      ? `service-${data.scope.branch}`
      : special
        ? `special-${data.scope.branch}`
        : olderPrivate
          ? `older-${foreignApplicant ? "foreign-" : ""}${data.scope.branch}`
          : foreignApplicant
            ? `foreign-${data.scope.branch}`
            : data.scope.certificate === "non_syrian"
              ? `non-syrian-${data.scope.branch}`
              : data.scope.branch
    if (data.coverage !== expectedCoverage)
      addIssue("Catalogue certificate or branch disagrees with scope")
    if (olderPrivate) {
      if (
        data.scope.branch === "sharia" ||
        data.scope.certificate !== "syrian_or_non_syrian" ||
        data.scope.certificateYear !== 2026 ||
        data.scope.certificateYears ||
        data.scope.certificateYearMaximum !== (foreignApplicant ? 2024 : 2025)
      )
        addIssue(
          "PDF 7 older private scope requires both certificate origins and the category-specific maximum year"
        )
    } else if (data.scope.certificateYearMaximum !== undefined) {
      addIssue(
        "A maximum certificate year is only supported for older private catalogues"
      )
    } else if (foreignApplicant) {
      if (
        data.scope.certificate !== "syrian_or_non_syrian" ||
        JSON.stringify(data.scope.certificateYears) !== "[2025,2026]" ||
        data.scope.certificateYear !== 2026
      )
        addIssue(
          "Announcements 9 and 11 require Syrian/non-Syrian certificates from 2025 or 2026"
        )
    } else if (
      !service &&
      (data.scope.certificate === "syrian_or_non_syrian" ||
        data.scope.certificateYears)
    ) {
      addIssue(
        "Multiple certificate origins/years only supported for announcements 9 and 11"
      )
    }
    if (sources.size !== data.sources.length)
      addIssue("Duplicate source announcement")
    for (const program of data.programs) {
      if (
        program.channels.some(
          (channel) =>
            channel.scoreBasis &&
            (data.coverage !== "sharia" ||
              channel.id === "private" ||
              channel.minPercent === null)
        )
      )
        addIssue(`Invalid Sharia score basis: ${program.id}`)
      if (seen.has(program.id)) addIssue(`Duplicate program: ${program.id}`)
      seen.add(program.id)
      const name = JSON.stringify(program.institution.name)
      const previous = institutions.get(program.institution.id)
      if (previous && previous !== name)
        addIssue(`Inconsistent institution: ${program.institution.id}`)
      institutions.set(program.institution.id, name)
      const channels = new Set(program.channels.map((channel) => channel.id))
      if (special && data.scope.branch === "vocational") {
        const channel = program.channels[0]
        if (
          channels.size !== 1 ||
          !channels.has("faculty_family") ||
          !channel.conditions.some((c) => c.type === "vocational_specialty") ||
          channel.conditions.filter((c) => c.type === "manual").length < 2 ||
          channel.conditions.some((c) =>
            ["subject", "no_previous_general_admission"].includes(c.type)
          ) ||
          !program.sources.some((s) => s.announcement === 6 && s.page === 4) ||
          !program.sources.some((s) => s.announcement === 1 && s.page === 11) ||
          (program.kind === "institute"
            ? channel.minPercent !== null
            : program.kind === "applied_college"
              ? channel.minPercent !== 50
              : ![50, 60].includes(channel.minPercent ?? -1))
        )
          addIssue(`Invalid vocational faculty-family choice: ${program.id}`)
      }
      for (const channel of program.channels) {
        if (service) {
          const allowedYears = channel.conditions.find(
            (c) => c.type === "certificate_year"
          )?.allowed
          if (
            !["defence", "security"].includes(channel.id) ||
            channel.minPercent === null ||
            channel.scoreBasis ||
            !channel.conditions.some((c) => c.type === "manual") ||
            !allowedYears ||
            allowedYears.some(
              (y) => !data.scope.certificateYears?.includes(y)
            ) ||
            (channel.id === "security" &&
              (allowedYears.includes(2024) ||
                ["sharia", "vocational"].includes(data.scope.branch))) ||
            channel.conditions.some((c) =>
              ["subject", "no_previous_general_admission"].includes(c.type)
            )
          )
            addIssue(`Invalid defence/security choice: ${program.id}`)
        } else if (
          ["defence", "security"].includes(channel.id) ||
          channel.conditions.some((c) => c.type === "certificate_year")
        )
          addIssue(
            `Service conditions require a service catalogue: ${program.id}`
          )
      }
      if (
        program.channels.some((channel) =>
          special
            ? !["faculty_family", "disability"].includes(channel.id) ||
              channel.scoreBasis ||
              !channel.conditions.some((c) => c.type === "manual")
            : ["faculty_family", "disability"].includes(channel.id)
        )
      )
        addIssue(
          `Invalid special-quota channel or missing official verification: ${program.id}`
        )
      if (
        olderPrivate &&
        (channels.size !== 1 ||
          !channels.has("private") ||
          program.channels.some((ch) =>
            ch.conditions.some(
              (c) => c.type !== "exam" && c.type !== "vocational_specialty"
            )
          ))
      )
        addIssue(
          `Older certificates use only the private tables and their entrance/qualification conditions: ${program.id}`
        )
      if (channels.size !== program.channels.length)
        addIssue(`Duplicate channel: ${program.id}`)
      if (channels.has("private") && channels.size !== 1)
        addIssue(`Mixed public/private channels: ${program.id}`)
      if (
        foreignApplicant
          ? channels.has("general") || channels.has("parallel")
          : channels.has("arab_foreign")
      )
        addIssue(`Wrong applicant channel: ${program.id}`)
      if (
        (data.scope.certificate === "non_syrian" || foreignApplicant) &&
        (channels.has("general") ||
          program.channels.some((channel) =>
            channel.conditions.some(
              (condition) =>
                condition.type === "subject" ||
                condition.type === "no_previous_general_admission"
            )
          ))
      )
        addIssue(
          `Unsupported condition or channel for announcement 8/9/10/11: ${program.id}`
        )
      for (const ref of program.sources) {
        const source = sources.get(ref.announcement)
        if (!source || ref.page > source.pageCount)
          addIssue(`Invalid source page: ${program.id}`)
      }
    }
  })

export function validateAdmissionsData(value: unknown): AdmissionsData {
  return admissionsSchema.parse(value)
}
