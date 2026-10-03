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
import {
  filterResults,
  initialFilters,
} from "../src/app/[locale]/admissions/_utils/results.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import { parseScore } from "../src/app/[locale]/admissions/_utils/score.ts"

const bytes = (p) => readFileSync(new URL(p, import.meta.url))
const read = (p) => JSON.parse(bytes(p).toString("utf8"))
const hash = (p) => createHash("sha256").update(bytes(p)).digest("hex")
const path = (key) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${key}.json`
const sourcePath = (key) => `./admissions/2026-2027/${key}.json`
const branches = ["scientific", "literary", "sharia"]
const data = Object.fromEntries(
  branches.map((b) => [b, validateAdmissionsData(read(path(`special-${b}`)))])
)
const raws = read(sourcePath("special-quota-rows"))
const corrections = read(sourcePath("special-quota-corrections"))
const pct = (n) => parseScore(String(n), "percentage")
const values = (branch, route = "faculty_family", rest = {}) => ({
  ...initialValues,
  certificate: branch === "scientific" ? "supported" : branch,
  applicantCategory: "syrian_or_equivalent",
  admissionRoute: route,
  score: "100",
  previousGeneralAdmission: "no",
  ...rest,
})
const profile = (branch, route = "faculty_family", rest = {}) => {
  const { input, errors } = parseStudentForm(values(branch, route))
  assert.deepEqual(errors, {})
  const subjects = Object.fromEntries(
    [
      "math",
      "physics",
      "chemistry",
      "biology",
      "arabic",
      "foreign_language",
      "english",
      "french",
      "russian",
      "religion",
    ].map((s) => [s, pct(100)])
  )
  const exams = Object.fromEntries(
    data[branch].programs.flatMap((p) =>
      p.channels.flatMap((c) =>
        c.conditions.filter((c) => c.type === "exam").map((c) => [c.id, true])
      )
    )
  )
  return {
    ...input,
    subjects,
    exams,
    gender: "female",
    birthYear: 2006,
    ...rest,
  }
}
const choice = (branch, page, row, route = "faculty_family") => {
  const p = data[branch].programs.find(
    (p) =>
      p.id ===
      `special-${branch}-public-${String(page).padStart(2, "0")}-${String(row).padStart(3, "0")}`
  )
  assert.ok(p)
  const channel = p.channels.find((c) => c.id === route)
  assert.ok(channel)
  return { p, channel }
}

for (const [branch, count, family, disability] of [
  ["scientific", 623, 621, 225],
  ["literary", 225, 220, 160],
  ["sharia", 183, 179, 118],
]) {
  test(`${branch} special quotas: all rows are accounted for and source inputs are pinned`, () => {
    const d = data[branch]
    const m = read(sourcePath(`special-${branch}-manifest`))
    assert.equal(d.programs.length, count)
    assert.equal(m.channels.faculty_family, family)
    assert.equal(m.channels.disability, disability)
    assert.equal(m.sourceRowCount, d.programs.length + m.excluded.length)
    assert.equal(m.prerequisiteCatalogueSha256, hash(path(branch)))
    assert.equal(m.extractedRowsSha256, hash(sourcePath("special-quota-rows")))
    assert.equal(
      m.correctionsSha256,
      hash(sourcePath("special-quota-corrections"))
    )
    const original = read(path(branch))
    for (const p of d.programs) {
      const ref = p.sources[0]
      const base = original.programs.find(
        (x) =>
          x.sources[0].announcement === ref.announcement &&
          x.sources[0].page === ref.page &&
          x.sources[0].row === ref.row
      )
      assert.ok(base)
      for (const key of [
        "name",
        "institution",
        "campus",
        "governorate",
        "field",
        "kind",
      ])
        assert.deepEqual(p[key], base[key])
      for (const c of p.channels) {
        assert.ok(["faculty_family", "disability"].includes(c.id))
        assert.ok(c.conditions.some((x) => x.type === "manual"))
        assert.ok(!c.scoreBasis)
      }
    }
  })
  test(`${branch} special quotas: every score and subject boundary stays pending official approval`, () => {
    for (const p of data[branch].programs)
      for (const c of p.channels) {
        const fixture = { ...data[branch], programs: [p] }
        const gender =
          c.conditions.find((x) => x.type === "gender")?.value ?? "female"
        const s = profile(branch, c.id, { gender })
        const result = (student) =>
          evaluateAdmissions(fixture, student)[0].channels[0]
        assert.equal(result(s).status, "needs_confirmation", p.id)
        if (c.minPercent !== null) {
          assert.equal(
            result({ ...s, score: pct(c.minPercent) }).status,
            "needs_confirmation",
            p.id
          )
          const below = { ...s, score: pct(c.minPercent - 0.01) }
          assert.equal(result(below).status, "not_eligible", p.id)
          assert.ok(result(below).findings.some((x) => x.type === "minimum"))
        }
        for (const requirement of c.conditions.filter(
          (x) => x.type === "subject"
        )) {
          assert.equal(
            result({
              ...s,
              subjects: {
                ...s.subjects,
                [requirement.subject]: pct(requirement.minPercent),
              },
            }).status,
            "needs_confirmation",
            p.id
          )
          assert.equal(
            result({
              ...s,
              subjects: {
                ...s.subjects,
                [requirement.subject]: pct(requirement.minPercent - 0.01),
              },
            }).status,
            "not_eligible",
            p.id
          )
        }
      }
  })
  test(`${branch} special quotas: only the selected quota is evaluated and other scopes fail`, () => {
    for (const route of ["faculty_family", "disability"]) {
      const s = profile(branch, route)
      const results = evaluateAdmissions(data[branch], s)
      assert.equal(
        results.length,
        route === "faculty_family" ? family : disability
      )
      assert.ok(
        results.every(
          (r) => r.channels.length === 1 && r.channels[0].channel.id === route
        )
      )
      assert.equal(
        filterResults(
          results,
          {
            ...initialFilters,
            status: "all",
            channel:
              route === "faculty_family" ? "disability" : "faculty_family",
          },
          []
        ).length,
        0
      )
      for (const bad of [
        { certificate: "non_syrian" },
        { certificateYear: 2025 },
        { applicantCategory: "arab_and_foreign" },
        { branch: "vocational" },
        { admissionRoute: "standard" },
      ])
        assert.ok(
          evaluateAdmissions(data[branch], { ...s, ...bad }).every(
            (r) => r.status === "not_eligible"
          )
        )
      assert.ok(
        evaluateAdmissions(read(path(branch)), s).every(
          (r) => r.status === "not_eligible"
        )
      )
    }
  })
}

test("review corrections preserve raw text and never silently replace another cell", () => {
  assert.equal(raws.length, 1064)
  assert.equal(corrections.length, 180)
  const seen = new Set()
  for (const c of corrections) {
    const key = `${c.branch}:${c.page}:${c.row}:${c.field}`
    assert.ok(!seen.has(key))
    seen.add(key)
    const r = raws.find(
      (r) => r.branch === c.branch && r.page === c.page && r.row === c.row
    )
    assert.equal(r[c.field], c.original)
    assert.ok(c.replacement && c.reason)
  }
})

test("faculty-family academic thresholds are taken from their column, with Sharia subject exemption", () => {
  assert.equal(choice("scientific", 1, 4).channel.minPercent, 75)
  assert.equal(choice("scientific", 1, 6).channel.minPercent, 60)
  assert.equal(choice("scientific", 11, 28).channel.minPercent, 50)
  assert.ok(
    choice("scientific", 11, 28).channel.conditions.some(
      (c) => c.subject === "english" && c.minPercent === 80
    )
  )
  assert.ok(
    choice("literary", 1, 29).channel.conditions.some(
      (c) => c.subject === "english" && c.minPercent === 75
    )
  )
  assert.ok(
    !choice("literary", 5, 22).channel.conditions.some(
      (c) => c.type === "subject"
    )
  )
  assert.ok(
    !choice("scientific", 15, 3).channel.conditions.some(
      (c) => c.type === "subject"
    )
  )
  assert.ok(
    !data.sharia.programs.some((p) => p.channels.some((c) => c.scoreBasis))
  )
  assert.ok(
    !data.sharia.programs.some(
      (p) => p.sources[0].page === 7 && p.sources[0].row >= 18
    )
  )
  assert.ok(
    !data.sharia.programs.some(
      (p) => p.sources[0].page === 5 && p.sources[0].row >= 41
    )
  )
})

test("disability language, merged cells, overall and specialty restrictions remain distinct", () => {
  for (const [b, p, r, subject] of [
    ["scientific", 11, 3, "arabic"],
    ["literary", 1, 10, "arabic"],
    ["literary", 1, 35, "english"],
    ["literary", 2, 10, "french"],
  ]) {
    const c = choice(b, p, r, "disability").channel
    assert.equal(c.minPercent, null)
    assert.ok(
      c.conditions.some((x) => x.subject === subject && x.minPercent === 50)
    )
  }
  const software = choice("scientific", 1, 6, "disability").channel
  assert.equal(software.minPercent, 75)
  assert.ok(
    software.conditions.some((c) =>
      c.label?.en.includes("restricted to the software")
    )
  )
  assert.ok(!software.conditions.some((c) => c.type === "subject"))
  assert.equal(choice("literary", 6, 15, "disability").channel.minPercent, null)
  assert.deepEqual(
    choice("literary", 5, 22, "disability")
      .channel.conditions.filter((c) => c.type === "subject")
      .map((c) => [c.subject, c.minPercent]),
    [
      ["religion", 60],
      ["arabic", 60],
    ]
  )
  assert.ok(
    choice("literary", 3, 8, "disability").channel.conditions.some((c) =>
      c.label?.en.includes("does not specify a disability type")
    )
  )
  assert.ok(
    choice("literary", 4, 24, "disability").channel.conditions.some(
      (c) => c.type === "governorate" && c.allowed.includes("hasakah")
    )
  )
})

test("medical limits, tests and previous admission cannot be satisfied by a score alone", () => {
  const arts = choice("literary", 6, 20, "disability")
  assert.ok(
    arts.channel.conditions.some((c) =>
      c.label?.en.includes("hearing disability at most 50%")
    )
  )
  assert.ok(
    arts.channel.conditions.some(
      (c) => c.type === "exam" && c.stage === "before_application"
    )
  )
  const music = choice("literary", 6, 26, "disability").channel
  assert.ok(
    music.conditions.some((c) =>
      c.label?.en.includes("visual disability at most 30%")
    )
  )
  const p = choice("scientific", 1, 27).p
  const d = { ...data.scientific, programs: [p] }
  assert.equal(
    evaluateAdmissions(
      d,
      profile("scientific", "faculty_family", {
        exams: { "architecture-exam": false },
      })
    )[0].status,
    "not_eligible"
  )
  assert.equal(
    evaluateAdmissions(
      d,
      profile("scientific", "faculty_family", {
        previousGeneralAdmission: true,
      })
    )[0].status,
    "not_eligible"
  )
  const legal = data.literary.programs.find((p) =>
    p.name.en.includes("القانوني")
  )
  assert.ok(
    legal.channels[0].conditions.some(
      (c) => c.type === "exam" && c.stage === "after_admission"
    )
  )
})

test("form routing and session migration preserve the quota without enabling other origins or years", () => {
  for (const branch of branches)
    for (const route of ["faculty_family", "disability"]) {
      const v = values(branch, route, { score: "٦٠", certificateYear: "٢٠٢٦" })
      const { input } = parseStudentForm(v)
      assert.ok(input)
      assert.equal(
        certificateCatalogue(
          v.certificate,
          v.applicantCategory,
          input.certificateYear,
          input.admissionRoute
        ),
        `special-${branch}`
      )
      assert.deepEqual(
        readAnswers(JSON.stringify({ version: 1, values: v })),
        v
      )
      for (const change of [
        { certificateYear: "2025" },
        { certificate: "non-syrian-scientific" },
        { certificate: "non-syrian-vocational" },
        { applicantCategory: "arab_and_foreign" },
        { admissionRoute: "invented" },
      ])
        assert.equal(parseStudentForm({ ...v, ...change }).input, null)
    }
  const old = values("scientific", "standard")
  delete old.admissionRoute
  assert.equal(
    readAnswers(JSON.stringify({ version: 1, values: old })).admissionRoute,
    "standard"
  )
  assert.equal(
    parseStudentForm(
      values("sharia", "faculty_family", { shariaFacultyScore: "invalid" })
    ).input.shariaFacultyScore,
    null
  )
  assert.throws(() =>
    certificateCatalogue(
      "non-syrian-scientific",
      "syrian_or_equivalent",
      2026,
      "disability"
    )
  )
})

test("schema rejects public/private mixes and missing quota documentation", () => {
  for (const change of [
    { certificate: "non_syrian" },
    { certificateYear: 2025 },
    { applicantCategory: "arab_and_foreign" },
    { admissionRoute: undefined },
    { certificateYears: [2026] },
  ])
    assert.throws(() =>
      validateAdmissionsData({
        ...data.scientific,
        scope: { ...data.scientific.scope, ...change },
      })
    )
  for (const edit of [
    (c) => {
      c.id = "general"
    },
    (c) => {
      c.conditions = c.conditions.filter((x) => x.type !== "manual")
    },
    (c) => {
      c.scoreBasis = "sharia_subjects_included"
    },
  ]) {
    const d = structuredClone(data.scientific)
    edit(d.programs[0].channels[0])
    assert.throws(() => validateAdmissionsData(d))
  }
})

test("quota favourites, both languages and FAQ provenance are available", () => {
  const ids = Object.values(data).flatMap((d) => d.programs.map((p) => p.id))
  assert.equal(ids.length, 1031)
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
  assert.equal(faqItems.length, 34)
  for (const lang of ["ar", "en"]) {
    const m = read(`../messages/${lang}.json`).Admissions
    for (const b of branches) assert.ok(m.branches[`special-${b}`])
    for (const id of ["faculty_family", "disability"]) assert.ok(m.channels[id])
    for (const id of ["facultyFamily", "disability"]) {
      assert.ok(m.faq.items[id].answer)
      assert.ok(faqItems.find((x) => x.id === id).sources.length)
    }
  }
})
