import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import {
  certificateCatalogue,
  supportsAdmissionRoute,
} from "../src/app/[locale]/admissions/_utils/certificates.ts"
import { faqItems } from "../src/app/[locale]/admissions/_utils/content.ts"
import { evaluateAdmissions } from "../src/app/[locale]/admissions/_utils/eligibility.ts"
import { readFavourites } from "../src/app/[locale]/admissions/_utils/favourites.ts"
import {
  initialValues,
  parseStudentForm,
} from "../src/app/[locale]/admissions/_utils/form.ts"
import {
  filterResults,
  initialFilters,
} from "../src/app/[locale]/admissions/_utils/results.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import { parseScore } from "../src/app/[locale]/admissions/_utils/score.ts"

const bytes = (p) => readFileSync(new URL(p, import.meta.url))
const read = (p) => JSON.parse(bytes(p).toString("utf8"))
const hash = (p) => createHash("sha256").update(bytes(p)).digest("hex")
const runtime = (name) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${name}.json`
const source = (name) => `./admissions/2026-2027/${name}.json`
const data = validateAdmissionsData(read(runtime("special-vocational")))
const ordinary = read(runtime("vocational"))
const options = read(runtime("vocational-options"))
const raw = read(source("vocational-rows"))
const manifest = read(source("special-vocational-manifest"))
const coord = (r) => `${r.announcement}:${r.page}:${r.row}`
const score = (n) => parseScore(String(n), "percentage")
const values = (changes = {}) => ({
  ...initialValues,
  certificate: "vocational",
  certificateYear: "2026",
  applicantCategory: "syrian_or_equivalent",
  admissionRoute: "faculty_family",
  vocationalSpecialty: "industrial-10d6bf41f05b",
  score: "60",
  gender: "male",
  birthYear: "2003",
  ...changes,
})
const input = (changes = {}) => {
  const parsed = parseStudentForm(values())
  assert.deepEqual(parsed.errors, {})
  return { ...parsed.input, ...changes }
}
const qualification = (p) =>
  p.channels[0].conditions.find((c) => c.type === "vocational_specialty")
const qualified = (p, changes = {}) =>
  input({
    score: score(100),
    vocationalSpecialty: qualification(p).allowed[0],
    exams: Object.fromEntries(
      p.channels[0].conditions
        .filter((c) => c.type === "exam")
        .map((c) => [c.id, true])
    ),
    ...changes,
  })
const evaluate = (p, changes = {}) =>
  evaluateAdmissions({ ...data, programs: [p] }, qualified(p, changes))[0]

test("vocational family: all 293 public rows are imported or explicitly excluded and dependencies are pinned", () => {
  assert.equal(data.programs.length, 291)
  assert.equal(manifest.programCount, 291)
  assert.equal(manifest.sourcePublicRowCount, 293)
  assert.equal(manifest.privateRowsExcluded, 536)
  assert.deepEqual(manifest.excludedPublicRows.map(coord), ["6:11:2", "6:11:3"])
  const accounted = [
    ...data.programs.map((p) => coord(p.sources[0])),
    ...manifest.excludedPublicRows.map(coord),
  ]
  assert.equal(new Set(accounted).size, 293)
  assert.deepEqual(
    new Set(accounted),
    new Set(raw.filter((r) => r.sector === "public").map(coord))
  )
  for (const [name, expected] of Object.entries(manifest.dependencies)) {
    const base = name.replace(/\.json$/, "")
    assert.equal(
      hash(
        ["vocational", "vocational-options"].includes(base)
          ? runtime(base)
          : source(base)
      ),
      expected
    )
  }
})

test("vocational family: every identity, exact qualification and published non-score condition is preserved", () => {
  for (const p of data.programs) {
    const base = ordinary.programs.find((b) => `special-${b.id}` === p.id)
    assert.ok(base)
    for (const k of [
      "name",
      "institution",
      "campus",
      "governorate",
      "field",
      "kind",
      "notes",
    ])
      assert.deepEqual(p[k], base[k], `${p.id} ${k}`)
    assert.deepEqual(
      p.channels[0].conditions.filter((c) => c.type !== "manual"),
      base.channels[0].conditions
    )
    for (const ref of [
      ...base.sources,
      { announcement: 6, page: 4 },
      { announcement: 1, page: 11 },
    ])
      assert.ok(
        p.sources.some((r) => JSON.stringify(r) === JSON.stringify(ref))
      )
    assert.deepEqual(
      p.channels.map((c) => c.id),
      ["faculty_family"]
    )
  }
})

test("vocational family: engineering departments use 60, other colleges 50, institutes no overall minimum", () => {
  const counts = { engineering: 0, applied: 0, arts: 0, institutes: 0 }
  for (const p of data.programs) {
    const min = p.channels[0].minPercent
    if (p.kind === "institute") {
      assert.equal(min, null)
      counts.institutes++
    } else if (p.kind === "applied_college") {
      assert.equal(min, 50)
      counts.applied++
    } else if (p.sources[0].page <= 10) {
      assert.equal(min, 60)
      counts.engineering++
    } else {
      assert.equal(min, 50)
      counts.arts++
    }
  }
  assert.deepEqual(counts, {
    engineering: 46,
    applied: 55,
    arts: 5,
    institutes: 185,
  })
  // Career fields are not admission threshold categories.
  const foodAndAgriculturalEngineering = data.programs.filter(
    (p) => p.kind === "faculty" && p.field === "agriculture"
  )
  assert.equal(foodAndAgriculturalEngineering.length, 22)
  assert.ok(
    foodAndAgriculturalEngineering.every((p) => p.channels[0].minPercent === 60)
  )
  assert.ok(
    data.programs
      .filter((p) => p.kind === "applied_college" && p.field === "engineering")
      .every((p) => p.channels[0].minPercent === 50)
  )
})

test("vocational family: every threshold accepts its boundary and rejects a hundredth below", () => {
  for (const p of data.programs) {
    const min = p.channels[0].minPercent
    assert.equal(
      evaluate(p, { score: score(min ?? 0) }).status,
      "needs_confirmation",
      p.id
    )
    if (min !== null)
      assert.equal(
        evaluate(p, { score: score(min - 0.01) }).status,
        "not_eligible",
        p.id
      )
    assert.equal(evaluate(p).status, "needs_confirmation")
  }
})

test("vocational family: every programme checks all 48 exact specialties including regular/dual and all-profession choices", () => {
  for (const p of data.programs) {
    const allowed = qualification(p).allowed
    for (const option of options)
      assert.equal(
        evaluate(p, { vocationalSpecialty: option.id }).status,
        allowed.includes(option.id) ? "needs_confirmation" : "not_eligible",
        `${p.id} ${option.id}`
      )
    assert.ok(
      evaluate(p, { vocationalSpecialty: null }).channels[0].findings.some(
        (f) =>
          f.type === "condition" &&
          f.condition.type === "vocational_specialty" &&
          f.outcome === "missing"
      )
    )
  }
})

test("vocational family: family eligibility and vacant scientific-quota places always require official verification", () => {
  for (const p of data.programs) {
    const manual = p.channels[0].conditions.filter((c) => c.type === "manual")
    assert.equal(manual.length, 2)
    assert.match(manual[0].label.en, /personnel directorate/)
    assert.match(
      manual[1].label.en,
      /places remaining from the scientific faculty-family quota/
    )
    assert.match(manual[1].label.en, /official application/)
    const result = evaluate(p)
    assert.equal(result.status, "needs_confirmation")
    assert.equal(
      result.channels[0].findings.filter(
        (f) => f.type === "condition" && f.condition.type === "manual"
      ).length,
      2
    )
  }
})

test("vocational family: all entrance assessments and railway restrictions survive the reduced thresholds", () => {
  let exams = 0
  let railways = 0
  for (const p of data.programs) {
    for (const c of p.channels[0].conditions) {
      if (c.type === "exam") {
        exams++
        assert.ok(
          evaluate(p, { exams: {} }).channels[0].findings.some(
            (f) => f.type === "condition" && f.condition.type === "exam"
          )
        )
        assert.equal(
          evaluate(p, { exams: { [c.id]: false } }).status,
          c.stage === "before_application"
            ? "not_eligible"
            : "needs_confirmation"
        )
      }
      if (c.type === "birth_year") {
        railways++
        assert.equal(c.minimum, 2003)
        assert.equal(p.channels[0].minPercent, null)
        assert.equal(evaluate(p, { birthYear: 2002 }).status, "not_eligible")
        assert.equal(evaluate(p, { gender: "female" }).status, "not_eligible")
        assert.equal(
          evaluate(p, { birthYear: 2003 }).status,
          "needs_confirmation"
        )
      }
    }
  }
  assert.equal(exams, 37)
  assert.equal(railways, 3)
})

test("vocational family: only Syrian 2026 vocational certificates in the Syrian/equivalent family route are supported", () => {
  const valid = values({ score: "٦٠", certificateYear: "٢٠٢٦" })
  assert.ok(parseStudentForm(valid).input)
  assert.equal(
    certificateCatalogue(
      "vocational",
      "syrian_or_equivalent",
      2026,
      "faculty_family"
    ),
    "special-vocational"
  )
  assert.deepEqual(
    readAnswers(JSON.stringify({ version: 1, values: valid })),
    valid
  )
  for (const change of [
    { admissionRoute: "disability" },
    { certificate: "non-syrian-vocational" },
    { applicantCategory: "arab_and_foreign" },
    { applicantCategory: "other" },
    { certificateYear: "2025" },
    { certificateYear: "2027" },
    { vocationalSpecialty: "invented" },
  ]) {
    const invalid = { ...valid, ...change }
    assert.equal(parseStudentForm(invalid).input, null)
    assert.equal(
      readAnswers(JSON.stringify({ version: 1, values: invalid })),
      null
    )
    if (!change.vocationalSpecialty)
      assert.equal(
        supportsAdmissionRoute(
          invalid.certificate,
          invalid.applicantCategory,
          Number(
            invalid.certificateYear.replace(/[٠-٩]/g, (n) =>
              "٠١٢٣٤٥٦٧٨٩".indexOf(n)
            )
          ),
          invalid.admissionRoute
        ),
        false
      )
  }
  assert.throws(() =>
    certificateCatalogue(
      "vocational",
      "syrian_or_equivalent",
      2026,
      "disability"
    )
  )
})

test("vocational family: hidden academic fields cannot block or change the percentage comparison", () => {
  const parsed = parseStudentForm(
    values({
      math: "invalid",
      subjectMarks: { arabic: "invalid" },
      shariaFacultyScore: "invalid",
      previousGeneralAdmission: "yes",
    })
  )
  assert.deepEqual(parsed.errors, {})
  assert.deepEqual(parsed.input.subjects, {})
  assert.equal(parsed.input.shariaFacultyScore, null)
  assert.equal(parsed.input.previousGeneralAdmission, null)
  assert.equal(
    parseStudentForm(values({ mode: "total", score: "1200" })).input,
    null
  )
})

test("vocational family: evaluator never grants a quota result to other origins, years, branches or categories", () => {
  const p = data.programs[0]
  for (const change of [
    { certificate: "non_syrian" },
    { certificateYear: 2025 },
    { applicantCategory: "arab_and_foreign" },
    { branch: "scientific" },
    { admissionRoute: "standard" },
  ])
    assert.equal(evaluate(p, change).status, "not_eligible")
  assert.deepEqual(
    evaluateAdmissions(data, input({ admissionRoute: "disability" })),
    []
  )
})

test("vocational family: schema rejects unsupported quotas, missing provenance or approval and wrong threshold kinds", () => {
  for (const scope of [
    { certificate: "non_syrian" },
    { certificateYear: 2025 },
    { applicantCategory: "arab_and_foreign" },
    { admissionRoute: undefined },
  ])
    assert.throws(() =>
      validateAdmissionsData({ ...data, scope: { ...data.scope, ...scope } })
    )
  const first = data.programs[0]
  for (const mutate of [
    (p) => {
      p.channels[0].id = "disability"
    },
    (p) => {
      p.channels[0].minPercent = 60
    },
    (p) => {
      p.channels[0].conditions.pop()
    },
    (p) => {
      p.channels[0].conditions = p.channels[0].conditions.filter(
        (c) => c.type !== "vocational_specialty"
      )
    },
    (p) => {
      p.channels[0].conditions.push({
        type: "subject",
        subject: "math",
        minPercent: 60,
      })
    },
    (p) => {
      p.sources = p.sources.filter((s) => s.announcement !== 6 || s.page !== 4)
    },
  ]) {
    const p = structuredClone(first)
    mutate(p)
    assert.throws(() => validateAdmissionsData({ ...data, programs: [p] }))
  }
  const institute = structuredClone(
    data.programs.find((p) => p.kind === "institute")
  )
  institute.channels[0].minPercent = 50
  assert.throws(() =>
    validateAdmissionsData({ ...data, programs: [institute] })
  )
})

test("vocational family: saved IDs, selected-track filters and bilingual source-linked guidance are complete", () => {
  const ids = data.programs.map((p) => p.id)
  assert.equal(new Set(ids).size, 291)
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
  const p = data.programs[0]
  const result = evaluate(p)
  assert.equal(
    filterResults(
      [result],
      { ...initialFilters, channel: "faculty_family" },
      []
    ).length,
    1
  )
  assert.equal(
    filterResults([result], { ...initialFilters, channel: "disability" }, [])
      .length,
    0
  )
  for (const locale of ["en", "ar"]) {
    const m = read(`../messages/${locale}.json`).Admissions
    assert.ok(m.branches["special-vocational"])
    assert.ok(m.form.vocationalFacultyFamilyHint)
    assert.match(m.faq.items.facultyFamily.answer, /291|٢٩١/)
  }
  const refs = faqItems.find((f) => f.id === "facultyFamily").sources
  assert.ok(refs.some((r) => r.announcement === 6 && r.page === 4))
  assert.ok(refs.some((r) => r.announcement === 1 && r.page === 11))
  assert.equal(faqItems.length, 34)
})
