import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import {
  certificateCatalogue,
  comparisonTotal,
} from "../src/app/[locale]/admissions/_utils/certificates.ts"
import { faqItems } from "../src/app/[locale]/admissions/_utils/content.ts"
import { evaluateAdmissions } from "../src/app/[locale]/admissions/_utils/eligibility.ts"
import { readFavourites } from "../src/app/[locale]/admissions/_utils/favourites.ts"
import {
  initialValues,
  parseStudentForm,
} from "../src/app/[locale]/admissions/_utils/form.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import { parseScore } from "../src/app/[locale]/admissions/_utils/score.ts"

const bytes = (p) => readFileSync(new URL(p, import.meta.url))
const read = (p) => JSON.parse(bytes(p).toString("utf8"))
const digest = (p) => createHash("sha256").update(bytes(p)).digest("hex")
const path = (key) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${key}.json`
const data = validateAdmissionsData(read(path("sharia")))
const literary = validateAdmissionsData(read(path("literary")))
const rows = read("./admissions/2026-2027/literary-rows.json")
const manifest = read("./admissions/2026-2027/sharia-manifest.json")
const dedicated = data.programs.filter((p) =>
  p.channels.some((c) => c.scoreBasis)
)
const values = (overrides = {}) => ({
  ...initialValues,
  certificate: "sharia",
  applicantCategory: "syrian_or_equivalent",
  score: "80",
  previousGeneralAdmission: "no",
  ...overrides,
})
const profile = (overrides = {}) => {
  const parsed = parseStudentForm(values(overrides))
  assert.deepEqual(parsed.errors, {})
  assert.ok(parsed.input)
  return parsed.input
}
const result = (program, overrides = {}) =>
  evaluateAdmissions({ ...data, programs: [program] }, profile(overrides))[0]

test("Sharia: all 415 source rows are imported or excluded once with pinned inputs", () => {
  assert.equal(data.programs.length, 373)
  assert.equal(rows.length, 415)
  assert.equal(
    manifest.extractedRowsSha256,
    digest("./admissions/2026-2027/literary-rows.json")
  )
  assert.equal(manifest.literaryCatalogueSha256, digest(path("literary")))
  assert.deepEqual(manifest.channels, {
    general: 242,
    parallel: 242,
    private: 131,
  })
  const ids = [...data.programs, ...manifest.excludedRows].map((p) => p.id)
  assert.equal(new Set(ids).size, 415)
  assert.deepEqual(
    new Set(ids),
    new Set(
      rows.map(
        (r) =>
          `sharia-${r.sector}-${String(r.page).padStart(2, "0")}-${String(r.row).padStart(3, "0")}`
      )
    )
  )
  for (const program of data.programs) {
    const ref = program.sources[0]
    const row = rows.find(
      (r) =>
        r.announcement === ref.announcement &&
        r.page === ref.page &&
        r.row === ref.row
    )
    assert.ok(row, program.id)
    assert.ok(program.sources.some((r) => r.announcement === 3 && r.page === 2))
  }
})

test("Sharia faculty alternatives replace 19 literary rows; 23 direct-registration institutes are excluded", () => {
  assert.equal(dedicated.length, 19)
  assert.equal(
    manifest.excludedRows.filter(
      (r) => r.reason === "replaced_by_sharia_certificate_row"
    ).length,
    19
  )
  const direct = manifest.excludedRows.filter(
    (r) => r.reason === "direct_institute_registration_pdf3_p4"
  )
  assert.deepEqual(
    direct.map((r) => r.id),
    Array.from(
      { length: 23 },
      (_, i) => `sharia-public-07-${String(i + 18).padStart(3, "0")}`
    )
  )
  for (const p of dedicated) {
    assert.match(p.name.ar, /ثانوية شرعية/)
    assert.deepEqual(
      p.channels.map((c) => [c.id, c.minPercent]),
      [
        ["general", 55],
        ["parallel", 50],
      ]
    )
    assert.ok(
      p.channels.every(
        (c) =>
          c.scoreBasis === "sharia_subjects_included" &&
          c.conditions.every((c) => c.type !== "subject")
      )
    )
    assert.ok(p.sources.some((r) => r.announcement === 4 && r.page === 5))
  }
  assert.ok(
    !data.programs.some(
      (p) =>
        p.id.startsWith("sharia-public") &&
        p.name.ar === "المعهد المتوسط للعلوم الشرعية والعربية"
    )
  )
  assert.ok(data.programs.some((p) => p.id === "sharia-private-40-010"))
})

test("Every shared choice preserves literary/private names, thresholds, conditions and notes", () => {
  for (const program of data.programs.filter((p) => !dedicated.includes(p))) {
    const original = literary.programs.find(
      (p) => p.id === program.id.replace("sharia-", "literary-")
    )
    assert.ok(original)
    const { id: _id, sources: _sources, ...actual } = program
    const { id: _oldId, sources: _oldSources, ...expected } = original
    assert.deepEqual(actual, expected)
    for (const ref of original.sources)
      assert.ok(
        program.sources.some((r) => JSON.stringify(r) === JSON.stringify(ref))
      )
  }
  assert.equal(
    data.programs.filter((p) => p.channels[0].id === "private").length,
    131
  )
})

test("Every Sharia threshold checks the correct score at the exact boundary", () => {
  for (const program of data.programs)
    for (const channel of program.channels) {
      if (channel.minPercent === null) continue
      for (const offset of [-0.01, 0]) {
        const score = (channel.minPercent + offset).toFixed(2)
        const overrides = channel.scoreBasis
          ? { score: "100", shariaFacultyScore: score }
          : { score, shariaFacultyScore: "0" }
        const checked = result(program, overrides).channels.find(
          (c) => c.channel.id === channel.id
        )
        assert.equal(
          checked.findings.some((f) => f.type === "minimum"),
          offset < 0,
          `${program.id}/${channel.id}/${score}`
        )
      }
    }
})

test("Missing dedicated score stays pending even with a high ordinary score; scores never substitute for one another", () => {
  const program = dedicated[0]
  assert.ok(
    result(program, { score: "100" }).channels.every(
      (c) =>
        c.status === "needs_confirmation" &&
        c.findings.some((f) => f.type === "missing_score")
    )
  )
  assert.equal(
    result(program, { score: "100", shariaFacultyScore: "49.99" }).status,
    "not_eligible"
  )
  assert.ok(
    result(program, { score: "0", shariaFacultyScore: "55" }).channels.every(
      (c) => c.status === "meets_requirements"
    )
  )
  const parallelOnly = result(program, { shariaFacultyScore: "50" })
  assert.deepEqual(
    parallelOnly.channels.map((c) => c.status),
    ["not_eligible", "meets_requirements"]
  )
  for (const p of dedicated) {
    const pending = result(p, {
      shariaFacultyScore: "55",
      previousGeneralAdmission: "yes",
    })
    assert.equal(pending.channels[0].status, "not_eligible")
    assert.ok(
      !pending.channels[1].findings.some(
        (f) =>
          f.type === "condition" &&
          f.condition.type === "no_previous_general_admission"
      )
    )
  }
  const quota = dedicated.filter((p) =>
    p.channels.some((c) => c.conditions.some((c) => c.type === "governorate"))
  )
  assert.equal(quota.length, 1)
  assert.ok(
    quota.every(
      (p) =>
        result(p, { shariaFacultyScore: "100" }).status === "needs_confirmation"
    )
  )
  assert.equal(
    result(quota[0], {
      shariaFacultyScore: "100",
      eligibilityGovernorate: "hasakah",
    }).status,
    "meets_requirements"
  )
  assert.equal(
    result(quota[0], {
      shariaFacultyScore: "100",
      eligibilityGovernorate: "homs",
    }).status,
    "not_eligible"
  )
  const ordinary = dedicated.find((p) => p.id === "sharia-public-06-009")
  assert.equal(
    result(ordinary, { shariaFacultyScore: "100" }).status,
    "meets_requirements"
  )
})

test("Sharia subjects and assessments remain active outside the dedicated faculty rows", () => {
  const subjectProgram = data.programs.find((p) =>
    p.channels.some((c) => c.conditions.some((c) => c.type === "subject"))
  )
  const good = result(subjectProgram, {
    subjectMarks: {
      arabic: "100",
      foreign_language: "100",
      english: "100",
      french: "100",
      russian: "100",
    },
  })
  assert.ok(
    good.channels.every((c) =>
      c.findings.every(
        (f) => f.type !== "condition" || f.condition.type !== "subject"
      )
    )
  )
  const missing = result(subjectProgram)
  assert.ok(
    missing.channels.some((c) =>
      c.findings.some(
        (f) =>
          f.type === "condition" &&
          f.condition.type === "subject" &&
          f.outcome === "missing"
      )
    )
  )
  const legal = data.programs.find((p) => p.id === "sharia-public-07-017")
  assert.equal(result(legal).status, "needs_confirmation")
  assert.ok(
    result(legal).channels.every((c) =>
      c.findings.some(
        (f) =>
          f.type === "condition" &&
          f.condition.type === "exam" &&
          f.condition.stage === "after_admission"
      )
    )
  )
})

test("Sharia form and schema restrict scope and reject invalid extra scores", () => {
  assert.equal(certificateCatalogue("sharia"), "sharia")
  assert.equal(comparisonTotal("sharia"), null)
  assert.throws(
    () => certificateCatalogue("sharia", "arab_and_foreign"),
    RangeError
  )
  for (const overrides of [
    { certificateYear: "2025" },
    { applicantCategory: "arab_and_foreign" },
    { mode: "total" },
    ...["-1", "100.01", "abc", "55.555"].map((shariaFacultyScore) => ({
      shariaFacultyScore,
    })),
  ])
    assert.equal(parseStudentForm(values(overrides)).input, null)
  assert.deepEqual(
    profile({ shariaFacultyScore: "٥٥٫٥" }).shariaFacultyScore,
    parseScore("55.5", "percentage")
  )
  for (const score of [
    { earned: -1, maximum: 10000 },
    { earned: 10001, maximum: 10000 },
    { earned: 55, maximum: 100 },
  ])
    assert.throws(
      () =>
        evaluateAdmissions(data, { ...profile(), shariaFacultyScore: score }),
      RangeError
    )
  for (const change of [
    { certificate: "non_syrian" },
    { applicantCategory: "arab_and_foreign" },
    { certificateYear: 2025 },
  ]) {
    assert.throws(() =>
      validateAdmissionsData({ ...data, scope: { ...data.scope, ...change } })
    )
    assert.ok(
      evaluateAdmissions(data, { ...profile(), ...change }).every(
        (r) => r.status === "not_eligible"
      )
    )
  }
  const bad = structuredClone(literary)
  bad.programs[0].channels[0].scoreBasis = "sharia_subjects_included"
  assert.throws(() => validateAdmissionsData(bad))
})

test("Sharia storage restores both scores, migrates old sessions and accepts stable favourites", () => {
  const selected = values({ shariaFacultyScore: "55" })
  assert.deepEqual(
    readAnswers(JSON.stringify({ version: 1, values: selected })),
    selected
  )
  const old = values({ certificate: "literary" })
  delete old.shariaFacultyScore
  assert.equal(
    readAnswers(JSON.stringify({ version: 1, values: old })).shariaFacultyScore,
    ""
  )
  for (const shariaFacultyScore of [15, null, "100.01"])
    assert.equal(
      readAnswers(
        JSON.stringify({ version: 1, values: values({ shariaFacultyScore }) })
      ),
      null
    )
  const ids = data.programs.map((p) => p.id)
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
})

test("Sharia form, result explanations and source-linked FAQ exist in both languages", () => {
  assert.equal(faqItems.length, 34)
  const faq = faqItems.find((f) => f.id === "sharia")
  assert.ok(faq.sources.some((r) => r.announcement === 3 && r.page === 4))
  assert.ok(faq.sources.some((r) => r.announcement === 4 && r.page === 5))
  for (const locale of ["en", "ar"]) {
    const m = read(`../messages/${locale}.json`).Admissions
    for (const key of [
      "sharia",
      "shariaScoreHint",
      "shariaFacultyScore",
      "shariaFacultyScoreHint",
      "shariaScopeHint",
    ])
      assert.ok(m.form[key])
    assert.ok(m.results.shariaScoreBasis && m.results.shariaScoreMissing)
    assert.ok(m.branches.sharia)
    assert.ok(m.faq.items.sharia.answer)
  }
})
