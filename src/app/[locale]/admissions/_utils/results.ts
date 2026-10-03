import { careerPriority } from "./careers.ts"
import { getBestStatus } from "./eligibility.ts"
import type {
  ChannelId,
  FieldId,
  Program,
  ProgramResult,
  Status,
} from "./types"

export type ResultFilters = {
  query: string
  channel: ChannelId | "all"
  governorate: string
  field: FieldId | "all"
  status: "available" | "all" | Status
  savedOnly: boolean
  sort: "career" | "name"
}

export const initialFilters: ResultFilters = {
  query: "",
  channel: "all",
  governorate: "all",
  field: "all",
  status: "available",
  savedOnly: false,
  sort: "career",
}

export const statusPriority: Record<Status, number> = {
  meets_requirements: 0,
  needs_confirmation: 1,
  not_eligible: 2,
}

export const channelPriority: Record<ChannelId, number> = {
  general: 0,
  faculty_family: 0,
  disability: 0,
  defence: 0,
  security: 0,
  arab_foreign: 0,
  parallel: 1,
  private: 2,
}

/** Rank by the first track with the displayed status, not a blocked general track. */
export function preferredChannel(result: ProgramResult): ChannelId {
  return result.channels
    .filter((channel) => channel.status === result.status)
    .map((channel) => channel.channel.id)
    .sort((a, b) => channelPriority[a] - channelPriority[b])[0]
}

function searchable(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670ـ]/g, "")
    .toLocaleLowerCase()
    .trim()
}

function expandArabicArticle(value: string) {
  // Arabic contracts ل + ال into لل: search for الترجمة should also find
  // للترجمة. Keep the original matching path for proper names and other words.
  return value.replace(/(^|\s)لل(?=[\u0621-\u064A]{3})/g, "$1ال")
}

export function filterResults(
  results: ProgramResult[],
  filters: ResultFilters,
  saved: string[]
): ProgramResult[] {
  const query = searchable(filters.query)
  return results.flatMap((result) => {
    const { program } = result
    if (
      filters.governorate !== "all" &&
      program.governorate !== filters.governorate
    )
      return []
    if (filters.field !== "all" && program.field !== filters.field) return []
    if (filters.savedOnly && !saved.includes(program.id)) return []
    const terms = Object.values(program.name)
      .concat(
        Object.values(program.institution.name),
        Object.values(program.campus)
      )
      .join(" ")
    const normalizedTerms = searchable(terms)
    if (
      query &&
      !normalizedTerms.includes(query) &&
      !expandArabicArticle(normalizedTerms).includes(expandArabicArticle(query))
    )
      return []
    const channels = result.channels.filter(
      (channel) =>
        filters.channel === "all" || channel.channel.id === filters.channel
    )
    if (!channels.length) return []
    // The selected track determines status; a general rejection must not hide a parallel match.
    const status = getBestStatus(channels.map((channel) => channel.status))
    if (filters.status === "available" && status === "not_eligible") return []
    if (
      filters.status !== "available" &&
      filters.status !== "all" &&
      filters.status !== status
    )
      return []
    return [{ ...result, channels, status }]
  })
}

export function groupByInstitution(
  results: ProgramResult[],
  locale: "ar" | "en",
  sort: ResultFilters["sort"] = "career"
) {
  const groups = new Map<
    string,
    {
      id: string
      institute: boolean
      status: Status
      channel: ChannelId
      institution: Program["institution"]
      results: ProgramResult[]
    }
  >()
  for (const result of results) {
    const institution = result.program.institution
    const institute = result.program.kind === "institute"
    const status = result.status
    const channel = preferredChannel(result)
    // Separate status/track groups keep every confirmed match ahead of conditional
    // choices, even when the same institution offers both.
    const id = `${status}-${institute ? "institute" : "university"}-${channel}-${institution.id}`
    const group = groups.get(id) ?? {
      id,
      institute,
      status,
      channel,
      institution,
      results: [],
    }
    group.results.push(result)
    groups.set(id, group)
  }
  for (const group of groups.values()) {
    group.results.sort(
      (a, b) =>
        (sort === "career"
          ? careerPriority(a.program) - careerPriority(b.program)
          : 0) ||
        a.program.name[locale].localeCompare(b.program.name[locale], locale) ||
        a.program.id.localeCompare(b.program.id)
    )
  }
  return [...groups.values()].sort(
    (a, b) =>
      statusPriority[a.status] - statusPriority[b.status] ||
      Number(a.institute) - Number(b.institute) ||
      channelPriority[a.channel] - channelPriority[b.channel] ||
      (sort === "career"
        ? careerPriority(a.results[0].program) -
          careerPriority(b.results[0].program)
        : 0) ||
      a.institution.name[locale].localeCompare(
        b.institution.name[locale],
        locale
      ) ||
      a.id.localeCompare(b.id)
  )
}

export const INSTITUTIONS_PER_PAGE = 8
export const PROGRAMS_PER_PAGE = 6
