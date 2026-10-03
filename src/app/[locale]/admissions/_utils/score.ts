import type { Score } from "./types"

export type ScoreMode = "percentage" | "total"

export function normaliseDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٫,]/g, ".")
    .trim()
}

export function parseScore(
  value: string,
  mode: ScoreMode,
  totalMaximum = 2400
): Score | null {
  const normalised = normaliseDigits(value)
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalised)) return null
  const [whole, fraction = ""] = normalised.split(".")
  const earned = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  const maximum = mode === "total" ? totalMaximum * 100 : 10_000
  if (!Number.isSafeInteger(maximum) || maximum <= 0) return null
  if (!Number.isSafeInteger(earned) || earned < 0 || earned > maximum)
    return null
  return { earned, maximum }
}

export function isValidScore(score: Score): boolean {
  return (
    Number.isSafeInteger(score.earned) &&
    Number.isSafeInteger(score.maximum) &&
    score.maximum > 0 &&
    score.earned >= 0 &&
    score.earned <= score.maximum
  )
}

export function meetsMinimum(score: Score, minPercent: number): boolean {
  if (
    !isValidScore(score) ||
    !Number.isFinite(minPercent) ||
    minPercent < 0 ||
    minPercent > 100
  ) {
    throw new RangeError("Invalid score or admission threshold")
  }
  // Cross-multiply integers; displayed rounding must never change eligibility.
  const thresholdHundredths = Math.round(minPercent * 100)
  return score.earned * 10_000 >= thresholdHundredths * score.maximum
}

/** Display only. Truncation here is not asserted to be the Ministry's rounding rule. */
export function displayPercentage(score: Score): number {
  if (!isValidScore(score)) throw new RangeError("Invalid score")
  return Math.floor((score.earned * 10_000) / score.maximum) / 100
}
