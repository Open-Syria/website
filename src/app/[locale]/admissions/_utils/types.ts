export type LocalizedText = { ar: string; en: string }
export type Branch = "scientific" | "literary" | "vocational" | "sharia"
export type CatalogueId =
  | Branch
  | "service-scientific"
  | "service-literary"
  | "service-sharia"
  | "service-vocational"
  | "special-scientific"
  | "special-literary"
  | "special-sharia"
  | "special-vocational"
  | "non-syrian-scientific"
  | "non-syrian-literary"
  | "non-syrian-vocational"
  | "foreign-scientific"
  | "foreign-literary"
  | "foreign-vocational"
  | "older-scientific"
  | "older-literary"
  | "older-vocational"
  | "older-foreign-scientific"
  | "older-foreign-literary"
  | "older-foreign-vocational"
export type CertificateOrigin = "syrian" | "non_syrian"
export type AdmissionRoute =
  | "standard"
  | "faculty_family"
  | "disability"
  | "defence"
  | "security"
export type ChannelId =
  | "general"
  | "parallel"
  | "arab_foreign"
  | "private"
  | Exclude<AdmissionRoute, "standard">
export type Status =
  | "meets_requirements"
  | "needs_confirmation"
  | "not_eligible"
export type Subject =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "arabic"
  | "foreign_language"
  | "english"
  | "french"
  | "russian"
  | "religion"
export type FieldId =
  | "technology"
  | "engineering"
  | "health"
  | "business"
  | "agriculture"
  | "science"
  | "languages"
  | "education"
  | "law"
  | "arts"
  | "media"
  | "tourism"
  | "humanities"
  | "religion"

/** Integer hundredths, retaining the original denominator for exact comparisons. */
export type Score = { earned: number; maximum: number }
export type SourceReference = {
  announcement: number
  page: number
  table?: number
  row?: number
}
export type Condition =
  | { type: "certificate_year"; allowed: number[] }
  | { type: "vocational_specialty"; allowed: string[]; label: LocalizedText }
  | { type: "subject"; subject: Subject; minPercent: number }
  | { type: "gender"; value: "female" | "male" }
  | { type: "birth_year"; minimum: number }
  | { type: "no_previous_general_admission" }
  | { type: "governorate"; allowed: string[] }
  | { type: "manual"; label: LocalizedText }
  | {
      type: "exam"
      id: string
      label: LocalizedText
      stage: "before_application" | "after_admission"
    }

export type Channel = {
  id: ChannelId
  /** null means all applicants, never a missing or unreadable threshold. */
  minPercent: number | null
  /** PDF 4 pp5–6: official percentage after adding religious-subject marks. */
  scoreBasis?: "sharia_subjects_included"
  conditions: Condition[]
}

export type Program = {
  id: string
  name: LocalizedText
  institution: { id: string; name: LocalizedText }
  campus: LocalizedText
  governorate: string
  field: FieldId
  kind: "faculty" | "applied_college" | "institute"
  channels: Channel[]
  notes: LocalizedText[]
  sources: SourceReference[]
}

export type SourceDocument = {
  title: LocalizedText
  filename: string
  url: string
  sha256: string
  pageCount: number
}

export type AdmissionsData = {
  academicYear: string
  version: string
  coverage: CatalogueId
  reviewedAt: string
  reviewLevel: "single_visual_review"
  scope: {
    branch: Branch
    certificateYear: number
    certificate: CertificateOrigin | "syrian_or_non_syrian"
    certificateYears?: number[]
    /** PDF 7 private-only routes; certificateYear remains the edition year. */
    certificateYearMaximum?: number
    admissionRoute?: "special_quotas" | "service"
    applicantCategory: "syrian_or_equivalent" | "arab_and_foreign"
  }
  sources: (SourceDocument & { announcement: number })[]
  supportDirectory: SourceDocument
  programs: Program[]
}

export type StudentInput = {
  admissionRoute?: AdmissionRoute
  branch: string
  certificateYear: number
  certificate: string
  applicantCategory: string
  vocationalSpecialty?: string | null
  previousGeneralAdmission: boolean | null
  score: Score
  shariaFacultyScore?: Score | null
  subjects: Partial<Record<Subject, Score>>
  gender: "female" | "male" | null
  birthYear: number | null
  /** Official eligibility origin, distinct from a preferred study location. */
  eligibilityGovernorate: string | null
  exams: Record<string, boolean | undefined>
}

export type Finding =
  | { type: "scope" }
  | { type: "minimum"; required: number }
  | { type: "missing_score"; basis: "sharia_subjects_included" }
  | { type: "condition"; condition: Condition; outcome: "missing" | "failed" }

export type ChannelResult = {
  channel: Channel
  status: Status
  findings: Finding[]
}

export type ProgramResult = {
  program: Program
  channels: ChannelResult[]
  status: Status
}
