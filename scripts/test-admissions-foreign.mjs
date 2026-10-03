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
import { resultParsers } from "../src/app/[locale]/admissions/_utils/query-state.ts"
import {
  filterResults,
  groupByInstitution,
  initialFilters,
} from "../src/app/[locale]/admissions/_utils/results.ts"
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
    validateAdmissionsData(read(dataPath(`foreign-${branch}`))),
  ])
)
const values = (branch, overrides = {}) => ({
  ...initialValues,
  certificate: `non-syrian-${branch}`,
  applicantCategory: "arab_and_foreign",
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
  test(`Arab/foreign ${branch}: every public row and threshold is preserved with provenance`, () => {
    const data = catalogues[branch]
    const key = `foreign-${branch}`
    const rowPath = `./admissions/2026-2027/${key}-rows.json`
    const rows = read(rowPath)
    const manifest = read(`./admissions/2026-2027/${key}-manifest.json`)
    assert.equal(rows.length, publicCount)
    assert.equal(data.programs.length, publicCount + privateCount)
    assert.equal(manifest.extractedRowsSha256, digest(rowPath))
    assert.equal(manifest.privateCatalogueSha256, digest(dataPath(branch)))
    assert.equal(data.scope.certificate, "syrian_or_non_syrian")
    assert.deepEqual(data.scope.certificateYears, [2025, 2026])
    assert.equal(data.scope.branch, branch)
    const ids = new Set()
    for (const row of rows) {
      const id = `${key}-public-${String(row.page).padStart(2, "0")}-${String(row.row).padStart(3, "0")}`
      assert.ok(!ids.has(id))
      ids.add(id)
      const p = data.programs.find((p) => p.id === id)
      assert.ok(p, id)
      assert.deepEqual(p.sources[0], {
        announcement: 9,
        page: row.page,
        row: row.row,
      })
      assert.equal(p.channels.length, 1)
      assert.equal(p.channels[0].id, "arab_foreign")
      assert.equal(
        p.channels[0].minPercent,
        Number(row.minimum.replace("%", ""))
      )
      assert.ok(
        p.channels[0].conditions.every(
          (c) => !["subject", "no_previous_general_admission"].includes(c.type)
        )
      )
    }
    assert.equal(ids.size, publicCount)
  })

  test(`Arab/foreign ${branch}: all referenced private choices retain the reviewed thresholds and tests`, () => {
    const old = read(dataPath(branch))
    const originals = old.programs.filter((p) => p.channels[0].id === "private")
    assert.equal(originals.length, privateCount)
    for (const p of originals) {
      const id = `foreign-${branch}-${p.id.replace(/^literary-/, "")}`
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
        imported.sources.some((s) => s.announcement === 7 && s.page === 5)
      )
      assert.ok(
        imported.sources.some((s) => s.announcement === 9 && s.page === 2)
      )
    }
    const domesticIds = new Set(old.programs.map((p) => p.id))
    assert.ok(catalogues[branch].programs.every((p) => !domesticIds.has(p.id)))
  })

  test(`Arab/foreign ${branch}: every threshold rejects 0.01 below and accepts the exact minimum`, () => {
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

  test(`Arab/foreign ${branch}: both origins and years use one isolated applicant catalogue`, () => {
    for (const certificate of [
      branch === "scientific" ? "supported" : "literary",
      `non-syrian-${branch}`,
    ]) {
      for (const certificateYear of ["2025", "2026"]) {
        const v = values(branch, {
          certificate,
          certificateYear,
          math: "invalid hidden mark",
          subjectMarks: { english: "invalid" },
          previousGeneralAdmission: "yes",
        })
        const input = parseStudentForm(v).input
        assert.ok(input)
        assert.equal(input.certificateYear, Number(certificateYear))
        assert.deepEqual(input.subjects, {})
        assert.equal(input.previousGeneralAdmission, null)
        assert.equal(
          certificateCatalogue(certificate, v.applicantCategory),
          `foreign-${branch}`
        )
        assert.deepEqual(
          readAnswers(JSON.stringify({ version: 1, values: v })),
          v
        )
        assert.ok(
          evaluateAdmissions(catalogues[branch], input).some(
            (r) => r.status === "meets_requirements"
          )
        )
        for (const override of [
          { certificate: "unknown" },
          { certificateYear: 2024 },
          { certificateYear: 2027 },
          { applicantCategory: "syrian_or_equivalent" },
          { branch: "vocational" },
        ]) {
          assert.ok(
            evaluateAdmissions(catalogues[branch], {
              ...input,
              ...override,
            }).every((r) => r.status === "not_eligible")
          )
        }
        const total = parseStudentForm({
          ...v,
          mode: "total",
          score: branch === "scientific" ? "1800" : "1650",
        })
        if (certificate.startsWith("non-syrian")) {
          assert.equal(total.input, null)
          assert.throws(
            () =>
              evaluateAdmissions(catalogues[branch], {
                ...input,
                score: { earned: 180000, maximum: 240000 },
              }),
            RangeError
          )
        } else {
          assert.ok(total.input)
          assert.equal(
            total.input.score.maximum,
            branch === "scientific" ? 240000 : 220000
          )
          assert.equal(
            total.input.score.earned / total.input.score.maximum,
            0.75
          )
          assert.ok(
            evaluateAdmissions(catalogues[branch], total.input).some(
              (r) => r.status === "meets_requirements"
            )
          )
          assert.throws(
            () =>
              evaluateAdmissions(catalogues[branch], {
                ...input,
                score: {
                  earned: 100000,
                  maximum: branch === "scientific" ? 220000 : 240000,
                },
              }),
            RangeError
          )
        }
      }
    }
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
        r.program.channels[0].id === "arab_foreign" &&
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
  for (const channel of ["arab_foreign", "private"]) {
    const minimum = channel === "arab_foreign" ? 75 : 65
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
    select({ gender: "female", birthYear: "2000" }).every(
      (r) => r.status === "not_eligible"
    )
  )
  assert.ok(
    select({ gender: "male", birthYear: "1999" }).every(
      (r) => r.status === "not_eligible"
    )
  )
  const eligible = select({ gender: "male", birthYear: "2000" })
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
        (p) => p.name.ar === name && p.channels[0].id === "arab_foreign"
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

test("schema rejects a wrong origin and Syrian-only conditions or channels on PDF 9 routes", () => {
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
      id: "arab_foreign",
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

test("invalid vocational specialties and unsupported year profiles cannot submit or restore, and old answers migrate to 2026", () => {
  for (const overrides of [
    { certificate: "vocational", vocationalSpecialty: "other" },
    { certificateYear: "other" },
    { certificateYear: "2027" },
    {
      certificateYear: "2025",
      certificate: "sharia",
      applicantCategory: "syrian_or_equivalent",
    },
  ]) {
    const v = values("scientific", overrides)
    assert.equal(parseStudentForm(v).input, null)
    assert.equal(readAnswers(JSON.stringify({ version: 1, values: v })), null)
  }
  assert.equal(
    certificateCatalogue("vocational", "arab_and_foreign"),
    "foreign-vocational"
  )
  const { certificateYear, ...old } = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "70",
  }
  const restored = readAnswers(JSON.stringify({ version: 1, values: old }))
  assert.equal(restored.certificateYear, "2026")
})

test("every merged assessment, gender and age cell survives the import", () => {
  for (const branch of ["scientific", "literary"]) {
    const rows = read(`./admissions/2026-2027/foreign-${branch}-rows.json`)
    for (const row of rows) {
      const id = `foreign-${branch}-public-${String(row.page).padStart(2, "0")}-${String(row.row).padStart(3, "0")}`
      const p = catalogues[branch].programs.find((p) => p.id === id)
      const c = p.channels[0].conditions
      const condition = row.condition.replace(/[ـ\s-]/g, "")
      assert.equal(
        c.some((c) => c.type === "exam"),
        condition.length > 0,
        id
      )
      const assessment = c.find((c) => c.type === "exam")
      if (assessment)
        assert.equal(
          assessment.stage,
          row.condition.includes("بعد القبول")
            ? "after_admission"
            : "before_application",
          id
        )
      assert.equal(
        c.some((c) => c.type === "birth_year" && c.minimum === 2000),
        row.condition.includes("2000"),
        id
      )
      assert.equal(
        c.some((c) => c.type === "gender" && c.value === "male"),
        p.name.ar.includes("ذكور"),
        id
      )
      assert.equal(
        c.some((c) => c.type === "gender" && c.value === "female"),
        p.name.ar.includes("إناث"),
        id
      )
      if (row.condition.includes("2000")) {
        assert.ok(
          p.notes.some((n) => n.en.includes("no state-employment obligation"))
        )
        assert.ok(p.sources.some((s) => s.announcement === 9 && s.page === 3))
      }
    }
  }
})

test("foreign channel filters and sorting stay separate from general and parallel, with shared-year favourites", () => {
  const results = evaluate("scientific", { architecture: "passed" })
  for (const channel of ["general", "parallel"]) {
    assert.equal(
      filterResults(results, { ...initialFilters, channel }, []).length,
      0
    )
  }
  const filtered = filterResults(
    results,
    { ...initialFilters, channel: "arab_foreign" },
    []
  )
  assert.ok(filtered.length > 500)
  assert.ok(
    filtered.every((r) =>
      r.channels.every((c) => c.channel.id === "arab_foreign")
    )
  )
  assert.equal(resultParsers.channel.parse("arab_foreign"), "arab_foreign")
  const groups = groupByInstitution(results, "en")
  for (const status of [
    "meets_requirements",
    "needs_confirmation",
    "not_eligible",
  ]) {
    for (const institute of [true, false]) {
      const subset = groups.filter(
        (g) => g.status === status && g.institute === institute
      )
      const firstPrivate = subset.findIndex((g) => g.channel === "private")
      if (firstPrivate >= 0)
        assert.ok(
          subset.slice(firstPrivate).every((g) => g.channel === "private")
        )
    }
  }
  const ids = [
    "scientific",
    "literary",
    "sharia",
    "older-scientific",
    "special-scientific",
    "special-literary",
    "special-sharia",
    "special-vocational",
    "service-scientific",
    "service-literary",
    "service-sharia",
    "service-vocational",
    "older-literary",
    "older-vocational",
    "older-foreign-scientific",
    "older-foreign-literary",
    "older-foreign-vocational",
    "vocational",
    "non-syrian-scientific",
    "non-syrian-literary",
    "non-syrian-vocational",
    "foreign-scientific",
    "foreign-literary",
    "foreign-vocational",
  ].flatMap((key) => read(dataPath(key)).programs.map((p) => p.id))
  assert.equal(ids.length, 10494)
  assert.equal(new Set(ids).size, 10494)
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
})

test("schema rejects foreign year/category drift and cross-route public channels", () => {
  const data = catalogues.scientific
  for (const scope of [
    { certificateYears: [2026] },
    { certificateYears: [2024, 2025, 2026] },
    { applicantCategory: "syrian_or_equivalent" },
  ]) {
    assert.throws(() =>
      validateAdmissionsData({ ...data, scope: { ...data.scope, ...scope } })
    )
  }
  assert.throws(() =>
    validateAdmissionsData({
      ...data,
      programs: [
        {
          ...data.programs[0],
          channels: [{ id: "parallel", minPercent: 80, conditions: [] }],
        },
      ],
    })
  )
  for (const locale of ["ar", "en"]) {
    const messages = read(`../messages/${locale}.json`).Admissions
    for (const branch of ["scientific", "literary"]) {
      assert.ok(messages.branches[`foreign-${branch}`])
      for (const p of catalogues[branch].programs) {
        for (const c of p.channels) assert.ok(messages.channels[c.id])
        assert.ok(messages.fields[p.field])
        assert.ok(messages.governorates[p.governorate])
      }
    }
  }
})
