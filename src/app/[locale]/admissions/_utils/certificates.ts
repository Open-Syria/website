import vocationalOptions from "../_data/2026-2027/vocational-options.json" with {
  type: "json",
}
import { normaliseDigits } from "./score.ts"
import type {
  AdmissionRoute,
  Branch,
  CatalogueId,
  CertificateOrigin,
} from "./types"

export type CertificateOption =
  | "supported"
  | "literary"
  | "sharia"
  | "vocational"
  | "non-syrian-scientific"
  | "non-syrian-literary"
  | "non-syrian-vocational"
  | "other"
export { vocationalOptions }

export function parseCertificateYear(value: string): number | null {
  const normalised = normaliseDigits(value)
  const year = Number(normalised)
  return /^\d{4}$/.test(normalised) && year >= 1000 && year <= 2026
    ? year
    : null
}

export function isOlderPrivate(
  year: number | null,
  applicantCategory: string
): boolean {
  if (year === null || !Number.isInteger(year) || year < 1000) return false
  return applicantCategory === "syrian_or_equivalent"
    ? year <= 2025
    : applicantCategory === "arab_and_foreign" && year <= 2024
}

export function certificateBranch(certificate: CertificateOption): Branch {
  if (certificate === "sharia") return "sharia"
  if (certificate === "non-syrian-vocational") return "vocational"
  if (certificate === "non-syrian-literary") return "literary"
  return certificate === "literary" || certificate === "vocational"
    ? certificate
    : "scientific"
}

export function certificateOrigin(
  certificate: CertificateOption
): CertificateOrigin {
  return certificate === "non-syrian-scientific" ||
    certificate === "non-syrian-literary" ||
    certificate === "non-syrian-vocational"
    ? "non_syrian"
    : "syrian"
}

export function certificateCatalogue(
  certificate: CertificateOption,
  applicantCategory: string = "syrian_or_equivalent",
  certificateYear: number = 2026,
  admissionRoute: AdmissionRoute = "standard"
): CatalogueId {
  if (isServiceRoute(admissionRoute)) {
    if (
      !supportsServiceAdmission(
        certificate,
        applicantCategory,
        certificateYear,
        admissionRoute
      )
    )
      throw new RangeError("Unsupported defence/security certificate")
    return `service-${certificateBranch(certificate)}`
  }
  if (admissionRoute !== "standard") {
    if (
      !supportsSpecialQuotas(
        certificate,
        applicantCategory,
        certificateYear,
        admissionRoute
      )
    )
      throw new RangeError("Unsupported special-quota certificate")
    return `special-${certificateBranch(certificate)}`
  }
  if (isOlderPrivate(certificateYear, applicantCategory)) {
    const branch = certificateBranch(certificate)
    if (certificate === "other" || branch === "sharia")
      throw new RangeError("Unsupported older certificate")
    return applicantCategory === "arab_and_foreign"
      ? `older-foreign-${branch}`
      : `older-${branch}`
  }
  if (applicantCategory === "arab_and_foreign") {
    const branch = certificateBranch(certificate)
    if (certificate === "other" || branch === "sharia")
      throw new RangeError("Unsupported Arab/foreign certificate")
    return `foreign-${branch}`
  }
  return certificate === "supported" || certificate === "other"
    ? "scientific"
    : certificate
}

export function isServiceRoute(route: string): route is "defence" | "security" {
  return route === "defence" || route === "security"
}

export function supportsServiceAdmission(
  certificate: CertificateOption,
  applicantCategory: string,
  year: number | null,
  route: "defence" | "security"
): boolean {
  if (
    applicantCategory !== "syrian_or_equivalent" ||
    certificate === "other" ||
    year === null
  )
    return false
  const branch = certificateBranch(certificate)
  if (route === "security")
    return (
      ["scientific", "literary"].includes(branch) && [2025, 2026].includes(year)
    )
  return branch === "vocational"
    ? year === 2026
    : [2024, 2025, 2026].includes(year)
}

export function supportsAdmissionRoute(
  certificate: CertificateOption,
  applicantCategory: string,
  year: number | null,
  route: AdmissionRoute
): boolean {
  if (route === "standard") return true
  return isServiceRoute(route)
    ? supportsServiceAdmission(certificate, applicantCategory, year, route)
    : ["faculty_family", "disability"].includes(route) &&
        supportsSpecialQuotas(certificate, applicantCategory, year, route)
}

export function supportsSpecialQuotas(
  certificate: CertificateOption,
  applicantCategory: string,
  year: number | null,
  route: AdmissionRoute = "faculty_family"
): boolean {
  return (
    ["faculty_family", "disability"].includes(route) &&
    (["supported", "literary", "sharia"].includes(certificate) ||
      (certificate === "vocational" && route === "faculty_family")) &&
    applicantCategory === "syrian_or_equivalent" &&
    year === 2026
  )
}

export function comparisonTotal(
  branch: Branch,
  origin: CertificateOrigin = "syrian"
): number | null {
  if (origin === "non_syrian") return null
  return branch === "scientific" ? 2400 : branch === "literary" ? 2200 : null
}
