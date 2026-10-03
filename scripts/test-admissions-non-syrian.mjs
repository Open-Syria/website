import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import { certificateCatalogue } from "../src/app/[locale]/admissions/_utils/certificates.ts"
import { evaluateAdmissions } from "../src/app/[locale]/admissions/_utils/eligibility.ts"
import { readFavourites } from "../src/app/[locale]/admissions/_utils/favourites.ts"
import {
  initialValues,
  parseStudentForm,
} from "../src/app/[locale]/admissions/_utils/form.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import { parseScore } from "../src/app/[locale]/admissions/_utils/score.ts"

const file = (path) => readFileSync(new URL(path, import.meta.url))
const read = (path) => JSON.parse(file(path))
const digest = (path) => createHash("sha256").update(file(path)).digest("hex")
const dataPath = (name) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${name}.json`
const catalogues = Object.fromEntries(
  ["scientific", "literary"].map((branch) => [
    branch,
    validateAdmissionsData(read(dataPath(`non-syrian-${branch}`))),
  ])
)
const values = (branch, overrides = {}) => ({
  ...initialValues,
  certificate: `non-syrian-${branch}`,
  applicantCategory: "syrian_or_equivalent",
  score: "80",
  ...overrides,
})
const profile = (branch, overrides = {}) => {
  const parsed = parseStudentForm(values(branch, overrides))
  assert.deepEqual(parsed.errors, {})
  assert.ok(parsed.input)
  return parsed.input
}
const evaluate = (branch, overrides = {}) =>
  evaluateAdmissions(catalogues[branch], profile(branch, overrides))

for (const [branch, publicCount, privateCount] of [
  ["scientific", 618, 389],
  ["literary", 217, 131],
]) {
  test(`non-Syrian ${branch}: every public row and threshold is preserved with provenance`, () => {
    const data = catalogues[branch]
    const key = `non-syrian-${branch}`
    const rowPath = `./admissions/2026-2027/${key}-rows.json`
    const rows = read(rowPath)
    const manifest = read(`./admissions/2026-2027/${key}-manifest.json`)
    assert.equal(rows.length, publicCount)
    assert.equal(data.programs.length, publicCount + privateCount)
    assert.equal(manifest.extractedRowsSha256, digest(rowPath))
    assert.equal(manifest.privateCatalogueSha256, digest(dataPath(branch)))
    assert.equal(data.scope.certificate, "non_syrian")
    assert.equal(data.scope.branch, branch)
    const ids = new Set()
    for (const row of rows) {
      const id = `${key}-public-${String(row.page).padStart(2, "0")}-${String(row.row).padStart(3, "0")}`
      assert.ok(!ids.has(id))
      ids.add(id)
      const p = data.programs.find((p) => p.id === id)
      assert.ok(p, id)
      assert.deepEqual(p.sources[0], {
        announcement: 8,
        page: row.page,
        row: row.row,
      })
      assert.equal(p.channels.length, 1)
      assert.equal(p.channels[0].id, "parallel")
      assert.equal(
        p.channels[0].minPercent,
        Number(row.parallel.replace("%", ""))
      )
      assert.ok(
        p.channels[0].conditions.every(
          (c) => !["subject", "no_previous_general_admission"].includes(c.type)
        )
      )
    }
    assert.equal(ids.size, publicCount)
  })

  test(`non-Syrian ${branch}: all referenced private choices retain the reviewed thresholds and tests`, () => {
    const old = read(dataPath(branch))
    const originals = old.programs.filter((p) => p.channels[0].id === "private")
    assert.equal(originals.length, privateCount)
    for (const p of originals) {
      const id = `non-syrian-${branch}-${p.id.replace(/^literary-/, "")}`
      const imported = catalogues[branch].programs.find(
        (next) => next.id === id
      )
      assert.ok(imported, id)
      assert.deepEqual(imported.name, p.name)
      assert.deepEqual(imported.institution, p.institution)
      assert.deepEqual(imported.campus, p.campus)
      assert.equal(imported.channels[0].minPercent, p.channels[0].minPercent)
      assert.deepEqual(
        imported.channels[0].conditions.map(({ label, ...c }) => c),
        p.channels[0].conditions.map(({ label, ...c }) => c)
      )
      assert.ok(
        imported.sources.some((s) => s.announcement === 7 && s.page === 4)
      )
      assert.ok(
        imported.sources.some((s) => s.announcement === 8 && s.page === 2)
      )
    }
    const domesticIds = new Set(old.programs.map((p) => p.id))
    assert.ok(catalogues[branch].programs.every((p) => !domesticIds.has(p.id)))
  })

  test(`non-Syrian ${branch}: every threshold rejects 0.01 below and accepts the exact minimum`, () => {
    const student = profile(branch)
    for (const program of catalogues[branch].programs) {
      const minimum = program.channels[0].minPercent
      assert.equal(typeof minimum, "number")
      const dataset = { ...catalogues[branch], programs: [program] }
      for (const delta of [0, -0.01]) {
        const [result] = evaluateAdmissions(dataset, {
          ...student,
          score: parseScore((minimum + delta).toFixed(2), "percentage"),
        })
        assert.equal(
          result.channels[0].findings.some((f) => f.type === "minimum"),
          delta < 0,
          program.id
        )
      }
    }
  })

  test(`non-Syrian ${branch}: percentage-only form, scope isolation and stored answers`, () => {
    const v = values(branch, {
      score: "٧٥٫٢٥",
      math: "invalid hidden value",
      subjectMarks: { english: "invalid" },
    })
    const input = parseStudentForm(v).input
    assert.equal(input.score.earned, 7525)
    assert.equal(input.score.maximum, 10000)
    assert.deepEqual(input.subjects, {})
    assert.equal(certificateCatalogue(v.certificate), `non-syrian-${branch}`)
    assert.deepEqual(readAnswers(JSON.stringify({ version: 1, values: v })), v)
    assert.equal(
      parseStudentForm({ ...v, mode: "total", score: "1800" }).input,
      null
    )
    assert.equal(
      parseStudentForm({ ...v, applicantCategory: "other" }).input,
      null
    )
    for (const override of [
      { certificate: "syrian" },
      { certificateYear: 2025 },
      { applicantCategory: "other" },
      { branch: "vocational" },
    ]) {
      assert.ok(
        evaluateAdmissions(catalogues[branch], { ...input, ...override }).every(
          (r) => r.status === "not_eligible"
        )
      )
    }
    assert.throws(
      () =>
        evaluateAdmissions(catalogues[branch], {
          ...input,
          score: { earned: 180000, maximum: 240000 },
        }),
      RangeError
    )
    const ids = catalogues[branch].programs.map((p) => p.id)
    assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
  })
}

test("foreign academic language and computing options do not inherit Syrian subject minimums", () => {
  for (const branch of ["scientific", "literary"]) {
    const results = evaluate(branch, {
      score: "50",
      previousGeneralAdmission: "yes",
    })
    const english = results.filter(
      (r) =>
        r.program.channels[0].id === "parallel" &&
        r.program.name.ar === "اللغة الإنكليزية"
    )
    assert.ok(english.length > 5)
    assert.ok(english.every((r) => r.status === "meets_requirements"))
    if (branch === "scientific") {
      const computers = results.filter(
        (r) => r.program.name.ar === "المعهد التقاني للحاسوب"
      )
      assert.ok(computers.length > 5)
      assert.ok(computers.every((r) => r.status === "meets_requirements"))
    }
  }
})

test("architecture retains separate public/private minima and its entrance requirement", () => {
  for (const channel of ["parallel", "private"]) {
    const minimum = channel === "parallel" ? 75 : 65
    const matches = (overrides) =>
      evaluate("scientific", overrides).filter(
        (r) =>
          r.program.channels[0].id === channel &&
          r.program.channels[0].conditions.some(
            (c) => c.id === "architecture-exam"
          )
      )
    assert.ok(matches({}).length > 5)
    assert.ok(
      matches({ score: String(minimum) }).every(
        (r) => r.status === "needs_confirmation"
      )
    )
    assert.ok(
      matches({ score: String(minimum), architecture: "failed" }).every(
        (r) => r.status === "not_eligible"
      )
    )
    assert.ok(
      matches({
        score: (minimum - 0.01).toFixed(2),
        architecture: "passed",
      }).every((r) => r.status === "not_eligible")
    )
    assert.ok(
      matches({ score: String(minimum), architecture: "passed" })
        .filter((r) => !r.program.name.ar.includes("محافظات"))
        .every((r) => r.status === "meets_requirements")
    )
  }
})

test("merged oil/railway conditions keep gender, birth year and post-admission assessment", () => {
  const select = (overrides) =>
    evaluate("scientific", overrides).filter((r) =>
      r.program.channels[0].conditions.some((c) => c.type === "birth_year")
    )
  assert.equal(select({}).length, 5)
  assert.ok(
    select({ gender: "female", birthYear: "2003" }).every(
      (r) => r.status === "not_eligible"
    )
  )
  assert.ok(
    select({ gender: "male", birthYear: "2002" }).every(
      (r) => r.status === "not_eligible"
    )
  )
  const eligible = select({ gender: "male", birthYear: "2003" })
  assert.ok(eligible.every((r) => r.status === "needs_confirmation"))
  assert.ok(
    eligible.every(
      (r) =>
        r.channels[0].findings.length === 1 &&
        r.channels[0].findings[0].condition.stage === "after_admission"
    )
  )
})

test("reviewed institute names and ambiguous campus retain the correct group and source note", () => {
  for (const data of Object.values(catalogues)) {
    for (const name of [
      "المعهد التقاني للترجمة التطبيقية",
      "المعهد التقاني للإرشاد النفسي والتربوي",
      "المعهد التقاني القانوني",
    ]) {
      const p = data.programs.find(
        (p) => p.name.ar === name && p.channels[0].id === "parallel"
      )
      assert.ok(p, name)
      assert.equal(p.kind, "institute")
    }
  }
  const p = catalogues.scientific.programs.find(
    (p) => p.campus.ar === "دير الزور / القامشلي"
  )
  assert.equal(p.governorate, "hasakah")
  assert.ok(p.notes.length)
})

test("schema rejects a wrong origin and Syrian-only conditions or channels on PDF 8 routes", () => {
  const data = catalogues.scientific
  assert.throws(() =>
    validateAdmissionsData({
      ...data,
      scope: { ...data.scope, certificate: "syrian" },
    })
  )
  for (const channel of [
    { id: "general", minPercent: 50, conditions: [] },
    {
      id: "parallel",
      minPercent: 50,
      conditions: [{ type: "subject", subject: "math", minPercent: 60 }],
    },
  ]) {
    assert.throws(() =>
      validateAdmissionsData({
        ...data,
        programs: [{ ...data.programs[0], channels: [channel] }],
      })
    )
  }
})
