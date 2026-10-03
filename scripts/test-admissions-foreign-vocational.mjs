import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import {
  certificateBranch,
  certificateCatalogue,
  certificateOrigin,
  vocationalOptions,
} from "../src/app/[locale]/admissions/_utils/certificates.ts"
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

const key = "foreign-vocational"
const file = (path) => readFileSync(new URL(path, import.meta.url))
const read = (path) => JSON.parse(file(path))
const digest = (path) => createHash("sha256").update(file(path)).digest("hex")
const dataPath = (name) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${name}.json`
const data = validateAdmissionsData(read(dataPath(key)))
const rows = read(`./admissions/2026-2027/${key}-rows.json`)
const manifest = read(`./admissions/2026-2027/${key}-manifest.json`)
const corrections = read(
  `./admissions/2026-2027/${key}-corrections.json`
).corrections
const correctedRows = rows.map((row) => {
  const result = { ...row }
  for (const correction of corrections) {
    if (
      correction.cells.some(
        (cell) => cell.page === row.page && cell.row === row.row
      )
    )
      result[correction.field] = correction.corrected
  }
  return result
})
const id = (page, row) =>
  `${key}-public-${String(page).padStart(2, "0")}-${String(row).padStart(3, "0")}`
const program = (page, row) => {
  const found = data.programs.find((p) => p.id === id(page, row))
  assert.ok(found, id(page, row))
  return found
}
const qualification = (p) =>
  p.channels[0].conditions.find((c) => c.type === "vocational_specialty")
const values = (overrides = {}) => ({
  ...initialValues,
  certificate: "vocational",
  applicantCategory: "arab_and_foreign",
  score: "60",
  vocationalSpecialty: qualification(program(11, 2)).allowed[0],
  ...overrides,
})
const profile = (overrides = {}) => {
  const parsed = parseStudentForm(values(overrides))
  assert.deepEqual(parsed.errors, {})
  assert.ok(parsed.input)
  return parsed.input
}
const result = (p, overrides = {}) =>
  evaluateAdmissions(
    { ...data, programs: [p] },
    profile({ vocationalSpecialty: qualification(p).allowed[0], ...overrides })
  )[0]

test("PDF 11: every grid row has a public choice, a documented continuation", () => {
  assert.equal(rows.length, 244)
  assert.equal(data.programs.length, 777)
  assert.equal(manifest.publicCount, 241)
  assert.equal(manifest.privateCount, 536)
  assert.equal(
    manifest.extractedRowsSha256,
    digest(`./admissions/2026-2027/${key}-rows.json`)
  )
  assert.equal(
    manifest.correctionsSha256,
    digest(`./admissions/2026-2027/${key}-corrections.json`)
  )
  assert.equal(manifest.privateCatalogueSha256, digest(dataPath("vocational")))
  assert.equal(manifest.optionsSha256, digest(dataPath("vocational-options")))
  const expectedExclusions = new Map([
    [id(12, 7), "merged_grid_continuation"],
    [id(11, 13), "merged_grid_continuation"],
    [id(15, 7), "merged_grid_continuation"],
  ])
  assert.deepEqual(
    new Map(manifest.excludedRows.map((r) => [r.id, r.reason])),
    expectedExclusions
  )
  for (const row of correctedRows) {
    const ident = id(row.page, row.row)
    const exclusion = manifest.excludedRows.find((r) => r.id === ident)
    const p = data.programs.find((p) => p.id === ident)
    if (exclusion) {
      assert.equal(p, undefined)
      if (exclusion.mergedInto) {
        assert.ok(
          data.programs
            .find((p) => p.id === exclusion.mergedInto)
            ?.sources.some(
              (s) =>
                s.announcement === 11 &&
                s.page === row.page &&
                s.row === row.row
            )
        )
      }
    } else {
      assert.ok(p, ident)
      assert.deepEqual(p.sources[0], {
        announcement: 11,
        page: row.page,
        row: row.row,
      })
      assert.equal(p.channels.length, 1)
      assert.equal(p.channels[0].id, "arab_foreign")
      assert.equal(
        p.channels[0].minPercent,
        row.minimum.includes("%") ? Number(row.minimum.replace("%", "")) : null
      )
      assert.ok(qualification(p))
    }
  }
})

test("PDF 11: all visual corrections refer to the exact original cells and carry no silent replacements", () => {
  assert.equal(corrections.length, 77)
  assert.equal(
    corrections.reduce((count, c) => count + c.cells.length, 0),
    395
  )
  for (const c of corrections) {
    for (const cell of c.cells) {
      const original = rows.find(
        (r) => r.page === cell.page && r.row === cell.row
      )
      assert.equal(original[c.field], c.original)
    }
    assert.ok(c.cells.length)
  }
  assert.equal(program(4, 6).name.ar, "الكلية التطبيقية — ميكاترونيكس")
  assert.equal(program(11, 12).name.ar, "المعهد التقاني للصناعات النسيجية")
  assert.equal(program(15, 5).governorate, "hasakah")
  assert.equal(program(7, 6).campus.ar, "حمص")
  assert.equal(program(7, 6).name.ar, "كلية التربية الموسيقية")
  assert.equal(program(17, 12).campus.ar, "حمص")
  assert.equal(program(17, 18).campus.ar, "حماة")
  assert.equal(program(17, 19).governorate, "hama")
})

test("PDF 11: merged grid lines do not duplicate electrical, textile or agricultural-machinery choices", () => {
  for (const [page, kept, continuation] of [
    [12, 6, 7],
    [11, 12, 13],
    [15, 6, 7],
  ]) {
    const p = program(page, kept)
    assert.ok(
      p.sources.some(
        (s) =>
          s.announcement === 11 && s.page === page && s.row === continuation
      )
    )
    assert.equal(
      data.programs.filter(
        (x) =>
          x.channels[0].id === "arab_foreign" &&
          x.name.ar === p.name.ar &&
          x.campus.ar === p.campus.ar &&
          JSON.stringify(qualification(x)) === JSON.stringify(qualification(p))
      ).length,
      1
    )
  }
  assert.notDeepEqual(
    qualification(program(17, 16)).allowed,
    qualification(program(17, 17)).allowed,
    "Kitchen and restaurant qualifications remain separate"
  )
})

test("PDF 7 pp6–7: all 536 private vocational choices retain exact qualifications, thresholds and exams", () => {
  const domestic = read(dataPath("vocational"))
  const privateChoices = domestic.programs.filter(
    (p) => p.channels[0].id === "private"
  )
  assert.equal(privateChoices.length, 536)
  for (const original of privateChoices) {
    const p = data.programs.find(
      (p) => p.id === `${key}-${original.id.replace(/^vocational-/, "")}`
    )
    assert.ok(p)
    assert.deepEqual(p.channels, original.channels)
    assert.deepEqual(p.name, original.name)
    assert.deepEqual(p.institution, original.institution)
    assert.deepEqual(p.campus, original.campus)
    assert.deepEqual(p.sources, [
      ...original.sources,
      { announcement: 7, page: 6 },
      { announcement: 7, page: 7 },
    ])
  }
})

test("PDF 11: equivalent qualifications retain issuer, specialty and regular/dual education distinctions", () => {
  const regular = program(5, 16)
  const dual = program(5, 17)
  assert.notDeepEqual(
    qualification(regular).allowed,
    qualification(dual).allowed
  )
  assert.equal(result(regular).status, "meets_requirements")
  assert.equal(
    result(dual, { vocationalSpecialty: qualification(regular).allowed[0] })
      .status,
    "not_eligible"
  )
  assert.equal(
    result(regular, { vocationalSpecialty: qualification(dual).allowed[0] })
      .status,
    "not_eligible"
  )
  const petroleum = program(5, 6)
  const petroleumOption = vocationalOptions.find(
    (o) => o.id === qualification(petroleum).allowed[0]
  )
  assert.equal(petroleumOption.category, "petroleum")
  assert.equal(
    result(petroleum, {
      vocationalSpecialty: qualification(program(11, 2)).allowed[0],
    }).status,
    "not_eligible"
  )
  assert.equal(qualification(program(11, 2)).allowed.length, 1)
  assert.equal(
    result(program(11, 2), {
      score: "100",
      vocationalSpecialty: "other-vocational-specialty",
    }).status,
    "not_eligible"
  )
})

test("PDF 11: all-applicant rows waive only the overall minimum, not the qualification", () => {
  const p = program(12, 2)
  assert.equal(p.channels[0].minPercent, null)
  assert.equal(result(p, { score: "0" }).status, "meets_requirements")
  assert.equal(
    result(p, {
      score: "100",
      vocationalSpecialty: "other-vocational-specialty",
    }).status,
    "not_eligible"
  )
  const arts = program(7, 2)
  assert.deepEqual(
    new Set(qualification(arts).allowed),
    new Set(vocationalOptions.map((o) => o.id))
  )
  assert.equal(
    result(arts, {
      score: "50",
      vocationalSpecialty: "other-vocational-specialty",
    }).status,
    "needs_confirmation"
  )
})

test("PDF 11: every public/private minimum accepts the boundary and rejects one hundredth below it", () => {
  for (const p of data.programs) {
    const minimum = p.channels[0].minPercent
    if (minimum === null) {
      assert.ok(
        !result(p, { score: "0" }).channels[0].findings.some(
          (f) => f.type === "minimum"
        )
      )
      continue
    }
    for (const delta of [0, -0.01]) {
      const r = result(p, { score: (minimum + delta).toFixed(2) })
      assert.equal(
        r.channels[0].findings.some((f) => f.type === "minimum"),
        delta < 0,
        p.id
      )
    }
  }
})

test("PDF 11 railway choices enforce male applicants, birth in 2000 or later and a pending post-admission check", () => {
  const choices = data.programs.filter((p) =>
    p.channels[0].conditions.some((c) => c.type === "birth_year")
  )
  assert.equal(choices.length, 3)
  for (const p of choices) {
    assert.equal(
      result(p, { gender: "female", birthYear: "2000" }).status,
      "not_eligible"
    )
    assert.equal(
      result(p, { gender: "male", birthYear: "1999" }).status,
      "not_eligible"
    )
    const r = result(p, { gender: "male", birthYear: "2000" })
    assert.equal(r.status, "needs_confirmation")
    assert.equal(r.channels[0].findings.length, 1)
    assert.equal(r.channels[0].findings[0].condition.stage, "after_admission")
    const input = profile({
      gender: "male",
      birthYear: "2000",
      vocationalSpecialty: qualification(p).allowed[0],
    })
    input.exams["post-admission-assessment"] = true
    assert.equal(
      evaluateAdmissions({ ...data, programs: [p] }, input)[0].status,
      "needs_confirmation"
    )
  }
})

test("PDF 11 arts, music, tourism and interview requirements retain their pre-application stages", () => {
  for (const [page, row, text] of [
    [7, 2, "arts"],
    [7, 6, "music"],
    [17, 2, "foreign-language"],
    [18, 2, "interview"],
    [20, 10, "calligraphy"],
  ]) {
    const p = program(page, row)
    const exam = p.channels[0].conditions.find((c) => c.type === "exam")
    assert.equal(exam.stage, "before_application")
    assert.ok(exam.label.en.includes(text))
    assert.equal(result(p).status, "needs_confirmation")
    const input = profile({ vocationalSpecialty: qualification(p).allowed[0] })
    input.exams[exam.id] = false
    assert.equal(
      evaluateAdmissions({ ...data, programs: [p] }, input)[0].status,
      "not_eligible"
    )
  }
})

test("PDF 11 study-location notes are not mistaken for eligibility requirements", () => {
  for (const [page, row, expected] of [
    [18, 8, "Faculty of Agriculture"],
    [19, 10, "Homs"],
  ]) {
    const p = program(page, row)
    assert.ok(p.notes.some((n) => n.en.includes(expected)))
    assert.equal(result(p, { score: "0" }).status, "meets_requirements")
    assert.ok(
      !p.channels[0].conditions.some(
        (c) => c.type === "manual" || c.type === "exam"
      )
    )
  }
})

test("PDF 11 accepts both vocational origins and both certificate years, and restores the exact profile", () => {
  for (const certificate of ["vocational", "non-syrian-vocational"]) {
    for (const certificateYear of ["2025", "2026"]) {
      const v = values({
        certificate,
        certificateYear,
        score: "٦٠٫٢٥",
        math: "invalid hidden value",
        subjectMarks: { english: "invalid" },
        previousGeneralAdmission: "yes",
      })
      const input = parseStudentForm(v).input
      assert.ok(input)
      assert.equal(input.score.earned, 6025)
      assert.equal(input.score.maximum, 10000)
      assert.deepEqual(input.subjects, {})
      assert.equal(input.previousGeneralAdmission, null)
      assert.equal(input.certificateYear, Number(certificateYear))
      assert.equal(certificateBranch(certificate), "vocational")
      assert.equal(input.certificate, certificateOrigin(certificate))
      assert.equal(certificateCatalogue(certificate, "arab_and_foreign"), key)
      assert.equal(
        evaluateAdmissions({ ...data, programs: [program(11, 2)] }, input)[0]
          .status,
        "meets_requirements"
      )
      assert.deepEqual(
        readAnswers(JSON.stringify({ version: 1, values: v })),
        v
      )
    }
  }
  for (const overrides of [
    { certificateYear: "other" },
    { certificateYear: "2027" },
    { applicantCategory: "other" },
    { vocationalSpecialty: "" },
    { vocationalSpecialty: "invented" },
    { mode: "total", score: "1800" },
  ]) {
    const v = values(overrides)
    assert.equal(parseStudentForm(v).input, null)
    assert.equal(readAnswers(JSON.stringify({ version: 1, values: v })), null)
  }
  const input = profile()
  for (const overrides of [
    { certificateYear: 2024 },
    { applicantCategory: "syrian_or_equivalent" },
    { branch: "scientific" },
    { certificate: "invented" },
  ]) {
    assert.ok(
      evaluateAdmissions(data, { ...input, ...overrides }).every(
        (r) => r.status === "not_eligible"
      )
    )
  }
  assert.throws(
    () =>
      evaluateAdmissions(data, {
        ...input,
        score: parseScore("1800", "total", 2400),
      }),
    RangeError
  )
  assert.deepEqual(
    readFavourites(JSON.stringify(data.programs.map((p) => p.id))),
    data.programs.map((p) => p.id)
  )
})

test("PDF 11 schema and result filters never expose the Syrian general track or subject restrictions", () => {
  const results = evaluateAdmissions(data, profile())
  assert.equal(
    filterResults(results, { ...initialFilters, channel: "general" }, [])
      .length,
    0
  )
  assert.ok(
    filterResults(results, { ...initialFilters, channel: "arab_foreign" }, [])
      .length
  )
  for (const p of data.programs) {
    assert.ok(
      p.channels.every((c) => ["arab_foreign", "private"].includes(c.id))
    )
    assert.ok(
      p.channels.every(
        (c) =>
          !c.conditions.some((rule) =>
            ["subject", "no_previous_general_admission"].includes(rule.type)
          )
      )
    )
  }
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

test("PDF 11 every field, location, track and qualification has matching Arabic/English UI labels", () => {
  for (const locale of ["ar", "en"]) {
    const messages = read(`../messages/${locale}.json`).Admissions
    assert.ok(messages.branches[key])
    assert.ok(messages.form.foreignVocationalHint)
    assert.ok(messages.faq.items.foreignVocational.answer)
    for (const p of data.programs) {
      assert.ok(messages.fields[p.field])
      assert.ok(messages.governorates[p.governorate])
      assert.ok(messages.channels[p.channels[0].id])
      assert.ok(
        qualification(p).allowed.every((id) =>
          vocationalOptions.some((o) => o.id === id && o.name[locale])
        )
      )
    }
  }
})

test("PDF 11 keeps its own public thresholds and railway exemption instead of copying PDF 10", () => {
  const publicChoices = data.programs.filter(
    (p) => p.channels[0].id === "arab_foreign"
  )
  for (const [minimum, expected] of [
    [60, 55],
    [50, 76],
    [null, 110],
  ]) {
    assert.equal(
      publicChoices.filter((p) => p.channels[0].minPercent === minimum).length,
      expected
    )
  }
  assert.equal(program(7, 2).channels[0].minPercent, 50)
  assert.equal(program(17, 2).channels[0].minPercent, null)
  assert.ok(
    program(15, 2).notes.some((n) =>
      n.en.includes("no state-employment obligation")
    )
  )
  const unique = new Set(
    publicChoices.map((p) =>
      JSON.stringify([
        p.name.ar,
        p.institution.id,
        p.campus.ar,
        qualification(p).allowed,
      ])
    )
  )
  assert.equal(unique.size, publicChoices.length)
})
