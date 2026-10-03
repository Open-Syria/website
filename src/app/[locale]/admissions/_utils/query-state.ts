import {
  createParser,
  parseAsBoolean,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
  type UrlKeys,
} from "nuqs/server"

// Bound URL pagination before using it as an array index. Unknown values use defaults.
const page = createParser({
  parse: (value) =>
    /^\d{1,4}$/.test(value) && Number(value) > 0 ? Number(value) : null,
  serialize: String,
}).withDefault(1)

const programPages = parseAsJson((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (
    entries.length > 8 ||
    entries.some(
      ([key, page]) =>
        !/^[a-z0-9_-]{1,160}$/.test(key) ||
        !Number.isInteger(page) ||
        page < 2 ||
        page > 9999
    )
  )
    return null
  return Object.fromEntries(entries) as Record<string, number>
}).withDefault({})

export const resultParsers = {
  query: parseAsString.withDefault(""),
  governorate: createParser({
    parse: (value) =>
      [
        "all",
        "multiple",
        "damascus",
        "rif-dimashq",
        "aleppo",
        "homs",
        "hama",
        "latakia",
        "tartous",
        "idlib",
        "daraa",
        "sweida",
        "quneitra",
        "deir-ez-zor",
        "raqqa",
        "hasakah",
      ].includes(value)
        ? value
        : null,
    serialize: String,
  }).withDefault("all"),
  field: parseAsStringLiteral([
    "all",
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
  ]).withDefault("all"),
  channel: parseAsStringLiteral([
    "all",
    "general",
    "faculty_family",
    "disability",
    "defence",
    "security",
    "parallel",
    "arab_foreign",
    "private",
  ]).withDefault("all"),
  status: parseAsStringLiteral([
    "available",
    "all",
    "meets_requirements",
    "needs_confirmation",
    "not_eligible",
  ]).withDefault("available"),
  savedOnly: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(["career", "name"]).withDefault("career"),
  groupPage: page,
  programPages,
}

export const resultUrlKeys = {
  query: "q",
  governorate: "g",
  field: "f",
  channel: "c",
  status: "s",
  savedOnly: "fav",
  sort: "o",
  groupPage: "p",
  programPages: "pp",
} satisfies UrlKeys<typeof resultParsers>

export const resultQueryOptions = {
  urlKeys: resultUrlKeys,
  clearOnDefault: true,
  shallow: true,
  history: "replace",
} as const
