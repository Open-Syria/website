import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import { certificateCatalogue } from "../src/app/[locale]/admissions/_utils/certificates.ts"
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
const hash = (p) => createHash("sha256").update(bytes(p)).digest("hex")
const path = (key) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${key}.json`
const branches = ["scientific", "literary", "sharia", "vocational"]
const data = Object.fromEntries(
  branches.map((b) => [b, validateAdmissionsData(read(path(`service-${b}`)))])
)
const raw = read("./admissions/2026-2027/service-admission-rows.json")
const manifest = read("./admissions/2026-2027/service-admission-manifest.json")
const pct = (n) => parseScore(String(n), "percentage")
const coordinate = (r) => [r.announcement, r.page, r.table, r.row].join(":")
const values = (branch, route = "defence", rest = {}) => ({
  ...initialValues,
  certificate: branch === "scientific" ? "supported" : branch,
  applicantCategory: "syrian_or_equivalent",
  admissionRoute: route,
  score: "100",
  vocationalSpecialty: "maritime-830da4ff90c9",
  ...rest,
})
const student = (branch, route = "defence", rest = {}) => {
  const parsed = parseStudentForm(values(branch, route))
  assert.deepEqual(parsed.errors, {})
  return { ...parsed.input, gender: "male", birthYear: 2005, ...rest }
}

test("service tables: all 58 raw source rows are retained and all dependencies are pinned", () => {
  assert.equal(raw.length, 58)
  assert.equal(manifest.sourceRowCount, 58)
  assert.equal(
    manifest.extractedRowsSha256,
    hash("./admissions/2026-2027/service-admission-rows.json")
  )
  assert.equal(
    manifest.vocationalOptionsSha256,
    hash(path("vocational-options"))
  )
  const used = new Set(
    Object.values(data).flatMap((d) =>
      d.programs.flatMap((p) =>
        p.sources.filter((s) => s.table).map(coordinate)
      )
    )
  )
  assert.deepEqual(used, new Set(raw.map(coordinate)))
  // Regression for merged header/condition cells: the first data row must not
  // accidentally extract a later row at the centre of the spanning rectangle.
  for (const [ann, page, table, minimum] of [
    [2, 21, 1, 70],
    [2, 21, 2, 85],
    [4, 8, 2, 75],
    [8, 32, 1, 70],
    [8, 40, 2, 75],
  ]) {
    const r = raw.find(
      (r) => r.announcement === ann && r.page === page && r.table === table
    )
    assert.equal(Number(r.cells[2]), minimum)
  }
})

for (const [branch, count] of [
  ["scientific", 23],
  ["literary", 4],
  ["sharia", 2],
  ["vocational", 2],
]) {
  test(`${branch} service: every imported minimum/year matches both printed source tables`, () => {
    const d = data[branch]
    assert.equal(d.programs.length, count)
    assert.equal(manifest.catalogues[d.coverage], count)
    for (const p of d.programs) {
      assert.equal(p.channels.length, 1)
      const c = p.channels[0]
      for (const s of p.sources.filter((s) => s.table)) {
        const r = raw.find((r) => coordinate(r) === coordinate(s))
        assert.ok(r)
        assert.equal(c.id, r.route)
        assert.equal(
          c.minPercent,
          Number(r.cells[r.announcement === 10 ? 1 : 2].replace("%", ""))
        )
        const expected = [6, 10].includes(r.announcement)
          ? [2026]
          : r.cells[0]
              .match(/202[456]/g)
              .map(Number)
              .sort()
        assert.deepEqual(
          c.conditions.find((x) => x.type === "certificate_year").allowed,
          expected
        )
      }
      assert.ok(c.conditions.some((x) => x.type === "manual"))
      assert.ok(
        !c.conditions.some((x) =>
          ["subject", "no_previous_general_admission"].includes(x.type)
        )
      )
    }
  })
  test(`${branch} service: every score, year and gender boundary is enforced for both origins`, () => {
    for (const p of data[branch].programs) {
      const c = p.channels[0]
      const d = { ...data[branch], programs: [p] }
      const s = student(branch, c.id, {
        gender:
          c.conditions.find((x) => x.type === "gender")?.value ?? "female",
        vocationalSpecialty: c.conditions.find(
          (x) => x.type === "vocational_specialty"
        )?.allowed[0],
      })
      const result = (s) => evaluateAdmissions(d, s)[0].channels[0]
      for (const certificate of branch === "sharia"
        ? ["syrian"]
        : ["syrian", "non_syrian"]) {
        for (const certificateYear of [2024, 2025, 2026]) {
          const validYear = c.conditions
            .find((x) => x.type === "certificate_year")
            .allowed.includes(certificateYear)
          const input = {
            ...s,
            certificate,
            certificateYear,
            score: pct(c.minPercent),
          }
          assert.equal(
            result(input).status,
            validYear ? "needs_confirmation" : "not_eligible",
            p.id
          )
          assert.equal(
            result({ ...input, score: pct(c.minPercent - 0.01) }).status,
            "not_eligible"
          )
        }
      }
      if (c.conditions.some((x) => x.type === "gender"))
        assert.equal(
          result({ ...s, gender: s.gender === "male" ? "female" : "male" })
            .status,
          "not_eligible"
        )
      assert.equal(
        result({ ...s, applicantCategory: "arab_and_foreign" }).status,
        "not_eligible"
      )
      assert.equal(
        result({ ...s, admissionRoute: "standard" }).status,
        "not_eligible"
      )
      assert.equal(
        result({ ...s, certificateYear: 2023 }).status,
        "not_eligible"
      )
      assert.equal(
        result({ ...s, certificateYear: 2027 }).status,
        "not_eligible"
      )
      assert.throws(() =>
        result({ ...s, score: parseScore("2400", "total", 2400) })
      )
    }
  })
}

test("service routing uses exact branch/year/category rules and never falls through to older private admission", () => {
  for (const cert of [
    "supported",
    "literary",
    "sharia",
    "non-syrian-scientific",
    "non-syrian-literary",
  ]) {
    for (const year of [2024, 2025, 2026]) {
      const v = values("scientific", "defence", {
        certificate: cert,
        certificateYear: String(year),
      })
      assert.ok(parseStudentForm(v).input)
      assert.ok(
        certificateCatalogue(
          cert,
          "syrian_or_equivalent",
          year,
          "defence"
        ).startsWith("service-")
      )
      assert.deepEqual(
        readAnswers(JSON.stringify({ version: 1, values: v })),
        v
      )
    }
  }
  for (const overrides of [
    { certificateYear: "2023" },
    { certificateYear: "2027" },
    { applicantCategory: "arab_and_foreign" },
    { certificate: "other" },
    { certificate: "vocational", certificateYear: "2025" },
    { certificate: "sharia", admissionRoute: "security" },
    { certificateYear: "2024", admissionRoute: "security" },
    { certificate: "vocational", admissionRoute: "security" },
    { admissionRoute: "invented" },
  ])
    assert.equal(
      parseStudentForm({ ...values("scientific"), ...overrides }).input,
      null
    )
  assert.throws(() =>
    certificateCatalogue("supported", "syrian_or_equivalent", 2024, "security")
  )
  assert.equal(
    certificateCatalogue("supported", "syrian_or_equivalent", 2025, "standard"),
    "older-scientific"
  )
})

test("the Higher Institute accepts both genders and has its own years, exam and fee without military-college restrictions", () => {
  const ps = data.scientific.programs.filter(
    (p) => p.institution.id === "higher-institute-applied-sciences-technology"
  )
  assert.equal(ps.length, 8)
  for (const p of ps) {
    const c = p.channels[0]
    assert.equal(p.kind, "faculty")
    assert.equal(c.minPercent, 85)
    assert.ok(
      !c.conditions.some((x) => x.type === "gender" || x.type === "birth_year")
    )
    const labels = c.conditions
      .filter((x) => x.label)
      .map((x) => x.label.en)
      .join(" ")
    assert.match(labels, /examination.*Damascus.*registration fee/)
    assert.doesNotMatch(labels, /165|unmarried|Ministry of Defence/)
    assert.equal(
      evaluateAdmissions(
        { ...data.scientific, programs: [p] },
        student("scientific", "defence", { gender: "female", birthYear: 1990 })
      )[0].status,
      "needs_confirmation"
    )
  }
})

test("security nationality, date of birth, official assessments and 10/20-year service terms remain explicit", () => {
  for (const branch of ["scientific", "literary"])
    for (const p of data[branch].programs.filter(
      (p) => p.channels[0].id === "security"
    )) {
      const c = p.channels[0]
      const s = student(branch, "security", {
        gender: c.conditions.find((x) => x.type === "gender").value,
      })
      const fixture = { ...data[branch], programs: [p] }
      assert.equal(
        evaluateAdmissions(fixture, { ...s, birthYear: 2004 })[0].status,
        "not_eligible"
      )
      assert.equal(
        evaluateAdmissions(fixture, { ...s, birthYear: 2005 })[0].status,
        "needs_confirmation"
      )
      const labels = c.conditions
        .filter((x) => x.label)
        .map((x) => x.label.en)
        .join(" ")
      for (const pattern of [
        /five years/,
        /170 cm/,
        /160 cm/,
        /18–28/,
        /interviews/,
        /nomination\/secondment/,
      ])
        assert.match(labels, pattern)
      assert.match(
        labels,
        new RegExp(`${p.kind === "institute" ? 10 : 20}-year service`)
      )
      assert.equal(p.governorate, "unspecified")
    }
})

test("maritime vocational admission preserves navigation/mechanics separation and campus timing", () => {
  const d = data.vocational
  for (const certificate of ["syrian", "non_syrian"])
    for (const p of d.programs) {
      const specialty = p.channels[0].conditions.find(
        (c) => c.type === "vocational_specialty"
      ).allowed[0]
      assert.equal(
        evaluateAdmissions(
          { ...d, programs: [p] },
          student("vocational", "defence", {
            certificate,
            vocationalSpecialty: specialty,
          })
        )[0].status,
        "needs_confirmation"
      )
      assert.equal(
        evaluateAdmissions(
          { ...d, programs: [p] },
          student("vocational", "defence", {
            certificate,
            vocationalSpecialty: "other-all-professions",
          })
        )[0].status,
        "not_eligible"
      )
      assert.ok(p.notes.some((n) => /Damascus.*Latakia/.test(n.en)))
    }
  assert.ok(
    manifest.exclusions.some(
      (x) => x.announcement === 1 && x.page === 9 && /Top-ten/.test(x.reason)
    )
  )
})

test("service form ignores irrelevant subject/architecture/Sharia scores and requires official percentages", () => {
  const v = values("sharia", "defence", {
    certificateYear: "٢٠٢٤",
    score: "٧٠",
    math: "invalid",
    subjectMarks: { arabic: "invalid" },
    shariaFacultyScore: "invalid",
    architecture: "failed",
  })
  const { input, errors } = parseStudentForm(v)
  assert.deepEqual(errors, {})
  assert.equal(input.certificateYear, 2024)
  assert.deepEqual(input.subjects, {})
  assert.deepEqual(input.exams, {})
  assert.equal(input.shariaFacultyScore, null)
  assert.equal(
    parseStudentForm({ ...values("scientific"), mode: "total", score: "2400" })
      .input,
    null
  )
})

test("service schemas reject unsupported years/channels or missing official verification", () => {
  for (const change of [
    { admissionRoute: undefined },
    { certificate: "non_syrian" },
    { certificateYears: [2025, 2026] },
    { applicantCategory: "arab_and_foreign" },
  ])
    assert.throws(() =>
      validateAdmissionsData({
        ...data.scientific,
        scope: { ...data.scientific.scope, ...change },
      })
    )
  for (const modify of [
    (c) => {
      c.id = "general"
    },
    (c) => {
      c.conditions = c.conditions.filter((c) => c.type !== "manual")
    },
    (c) => {
      c.conditions = c.conditions.filter((c) => c.type !== "certificate_year")
    },
    (c) => {
      c.conditions.push({ type: "no_previous_general_admission" })
    },
    (c) => {
      c.minPercent = null
    },
  ]) {
    const d = structuredClone(data.scientific)
    modify(d.programs[0].channels[0])
    assert.throws(() => validateAdmissionsData(d))
  }
})

test("service choices persist as favourites and both locales expose complete source-linked guidance", () => {
  const ids = Object.values(data).flatMap((d) => d.programs.map((p) => p.id))
  assert.equal(ids.length, 31)
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
  assert.equal(faqItems.length, 34)
  assert.ok(
    faqItems.find((q) => q.id === "serviceAdmission").sources.length >= 10
  )
  for (const locale of ["ar", "en"]) {
    const m = read(`../messages/${locale}.json`).Admissions
    for (const b of branches) assert.ok(m.branches[`service-${b}`])
    for (const id of ["defence", "security"]) assert.ok(m.channels[id])
    assert.ok(m.governorates.unspecified)
    assert.ok(m.form.serviceScoreHint)
    assert.ok(m.results.certificateYearsCondition)
    assert.ok(m.faq.items.serviceAdmission.answer)
  }
})
