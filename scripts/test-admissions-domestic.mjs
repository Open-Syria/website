import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import { vocationalOptions } from "../src/app/[locale]/admissions/_utils/certificates.ts"
import { evaluateAdmissions } from "../src/app/[locale]/admissions/_utils/eligibility.ts"
import { readFavourites } from "../src/app/[locale]/admissions/_utils/favourites.ts"
import {
  initialValues,
  parseStudentForm,
} from "../src/app/[locale]/admissions/_utils/form.ts"
import {
  filterResults,
  groupByInstitution,
  initialFilters,
} from "../src/app/[locale]/admissions/_utils/results.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import {
  displayPercentage,
  parseScore,
} from "../src/app/[locale]/admissions/_utils/score.ts"

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"))
const catalogues = Object.fromEntries(
  ["literary", "vocational"].map((branch) => [
    branch,
    validateAdmissionsData(
      read(`../src/app/[locale]/admissions/_data/2026-2027/${branch}.json`)
    ),
  ])
)
const profile = (certificate, overrides = {}) => {
  const parsed = parseStudentForm({
    ...initialValues,
    certificate,
    applicantCategory: "syrian_or_equivalent",
    score: "70",
    previousGeneralAdmission: "no",
    ...overrides,
  })
  assert.deepEqual(parsed.errors, {})
  assert.ok(parsed.input)
  return parsed.input
}
const computer = vocationalOptions.find(
  (o) =>
    o.category === "industrial" && o.name.en.endsWith("Computer technologies")
)
const commercial = vocationalOptions.find((o) => o.category === "commercial")
const result = (branch, input, id) =>
  evaluateAdmissions(catalogues[branch], input).find((r) => r.program.id === id)

for (const [branch, expected, omitted] of [
  ["literary", 396, 19],
  ["vocational", 827, 2],
]) {
  test(`${branch}: every extracted row is imported or explicitly excluded with a reason`, () => {
    const data = catalogues[branch]
    const rows = read(`./admissions/2026-2027/${branch}-rows.json`)
    const manifest = read(`./admissions/2026-2027/${branch}-manifest.json`)
    assert.equal(data.programs.length, expected)
    assert.equal(manifest.excludedRows.length, omitted)
    const excluded = new Map(manifest.excludedRows.map((r) => [r.id, r.reason]))
    const programs = new Map(data.programs.map((p) => [p.id, p]))
    const ids = new Set()
    for (const row of rows) {
      const id = `${branch}-${row.sector}-${String(row.page).padStart(2, "0")}-${String(row.row).padStart(3, "0")}`
      assert.ok(!ids.has(id))
      ids.add(id)
      if (excluded.has(id)) {
        assert.equal(
          excluded.get(id),
          branch === "literary" ? "sharia_certificate" : "military_admission"
        )
        assert.ok(!programs.has(id))
        continue
      }
      const p = programs.get(id)
      assert.ok(p, id)
      assert.deepEqual(p.sources[0], {
        announcement: row.announcement,
        page: row.page,
        row: row.row,
      })
      for (const track of row.sector === "private"
        ? ["private"]
        : ["general", "parallel"]) {
        const cell = row[track]
        const ch = p.channels.find((c) => c.id === track)
        if (!cell || cell === "-") {
          assert.equal(ch, undefined)
          continue
        }
        assert.ok(ch)
        // Compare directly with the numeric source cell; all-applicant labels contain جميع.
        const minimum = cell.includes("جميع")
          ? null
          : Number(cell.match(/\d+(?:\.\d+)?/)[0])
        assert.equal(ch.minPercent, minimum, `${id} ${track}`)
      }
    }
    assert.equal(rows.length, programs.size + excluded.size)
    for (const p of data.programs)
      for (const ch of p.channels) {
        const specialty = ch.conditions.filter(
          (c) => c.type === "vocational_specialty"
        )
        assert.equal(specialty.length, branch === "vocational" ? 1 : 0)
        for (const condition of specialty)
          for (const id of condition.allowed)
            assert.ok(
              vocationalOptions.some((o) => o.id === id),
              id
            )
      }
  })
}

test("literary totals use 2200 and cannot silently use scientific's 2400 denominator", () => {
  const input = profile("literary", { mode: "total", score: "١٢١٠" })
  assert.equal(input.score.maximum, 220000)
  assert.equal(displayPercentage(input.score), 55)
  assert.equal(
    parseStudentForm({
      ...initialValues,
      certificate: "literary",
      applicantCategory: "syrian_or_equivalent",
      mode: "total",
      score: "2200.01",
    }).input,
    null
  )
  assert.throws(
    () =>
      evaluateAdmissions(catalogues.literary, {
        ...input,
        score: parseScore("1210", "total"),
      }),
    RangeError
  )
  const mismatched = evaluateAdmissions(catalogues.literary, {
    ...input,
    branch: "scientific",
    score: parseScore("100", "percentage"),
  })
  assert.ok(mismatched.every((r) => r.status === "not_eligible"))
})

test("literary language admissions use the subject mark, with different general/parallel minimums", () => {
  const id = "literary-public-01-004"
  const lowTotal = profile("literary", {
    score: "50",
    subjectMarks: { arabic: "75" },
  })
  const a = result("literary", lowTotal, id)
  assert.equal(a.channels[0].channel.minPercent, null)
  assert.equal(a.channels[0].status, "meets_requirements")
  const b = result(
    "literary",
    profile("literary", { subjectMarks: { arabic: "65" } }),
    id
  )
  assert.equal(b.channels[0].status, "not_eligible")
  assert.equal(b.channels[1].status, "meets_requirements")
  assert.equal(
    result("literary", profile("literary"), id).status,
    "needs_confirmation"
  )
})

test("literary media needs both language minimums and prior general acceptance blocks only general", () => {
  const program = catalogues.literary.programs.find(
    (p) => p.name.ar === "الإعلام" && p.campus.ar === "دمشق"
  )
  const complete = profile("literary", {
    score: "80",
    subjectMarks: { arabic: "80", foreign_language: "80" },
  })
  assert.equal(
    result("literary", complete, program.id).status,
    "meets_requirements"
  )
  assert.equal(
    result(
      "literary",
      { ...complete, subjects: { arabic: parseScore("80", "percentage") } },
      program.id
    ).status,
    "needs_confirmation"
  )
  const previous = result(
    "literary",
    { ...complete, previousGeneralAdmission: true },
    program.id
  )
  assert.equal(previous.channels[0].status, "not_eligible")
  assert.equal(previous.channels[1].status, "meets_requirements")
})

test("vocational matching requires the exact certificate specialty, irrespective of score", () => {
  const computing = profile("vocational", { vocationalSpecialty: computer.id })
  const id = "vocational-public-05-002"
  assert.equal(result("vocational", computing, id).status, "meets_requirements")
  const business = profile("vocational", {
    vocationalSpecialty: commercial.id,
    score: "100",
  })
  assert.equal(result("vocational", business, id).status, "not_eligible")
  assert.equal(
    result("vocational", { ...computing, vocationalSpecialty: null }, id)
      .status,
    "needs_confirmation"
  )
  assert.equal(
    parseStudentForm({
      ...initialValues,
      certificate: "vocational",
      applicantCategory: "syrian_or_equivalent",
      score: "70",
    }).errors.vocationalSpecialty,
    true
  )
  assert.equal(
    parseStudentForm({
      ...initialValues,
      certificate: "vocational",
      applicantCategory: "syrian_or_equivalent",
      vocationalSpecialty: computer.id,
      score: "1400",
      mode: "total",
    }).errors.score,
    true
  )
})

test("unlisted vocational specialties only match rows explicitly open to every profession", () => {
  const input = profile("vocational", {
    score: "100",
    vocationalSpecialty: "other-vocational-specialty",
  })
  const matches = evaluateAdmissions(catalogues.vocational, input).filter(
    (r) => r.status !== "not_eligible"
  )
  assert.ok(matches.length > 0)
  for (const r of matches)
    for (const ch of r.channels) {
      const condition = ch.channel.conditions.find(
        (c) => c.type === "vocational_specialty"
      )
      assert.equal(condition.allowed.length, vocationalOptions.length)
    }
  assert.equal(
    result("vocational", input, "vocational-public-05-002").status,
    "not_eligible"
  )
})

test("entrance assessments and post-admission rail checks remain pending in both new branches", () => {
  for (const [branch, input] of [
    ["literary", profile("literary", { score: "100" })],
    [
      "vocational",
      profile("vocational", { score: "100", vocationalSpecialty: computer.id }),
    ],
  ]) {
    const results = evaluateAdmissions(catalogues[branch], input)
    const exams = results.filter((r) =>
      r.channels.some((c) =>
        c.channel.conditions.some((x) => x.type === "exam")
      )
    )
    assert.ok(exams.length > 0)
    assert.ok(exams.every((r) => r.status !== "meets_requirements"))
  }
  const rail = catalogues.vocational.programs.filter((p) =>
    p.name.ar.includes("للخطوط الحديدية")
  )
  assert.equal(rail.length, 3)
  for (const p of rail)
    for (const ch of p.channels) {
      assert.ok(
        ch.conditions.some((c) => c.type === "birth_year" && c.minimum === 2003)
      )
      assert.ok(
        ch.conditions.some((c) => c.type === "gender" && c.value === "male")
      )
      assert.ok(
        ch.conditions.some(
          (c) => c.type === "exam" && c.stage === "after_admission"
        )
      )
    }
})

test("new certificate selections restore from tab storage and favourites retain all branches", () => {
  const values = {
    ...initialValues,
    certificate: "vocational",
    applicantCategory: "syrian_or_equivalent",
    score: "75",
    vocationalSpecialty: computer.id,
  }
  assert.deepEqual(readAnswers(JSON.stringify({ version: 1, values })), values)
  assert.equal(
    readAnswers(
      JSON.stringify({
        version: 1,
        values: { ...values, vocationalSpecialty: "unknown" },
      })
    ),
    null
  )
  const ids = [
    "public-01-005",
    "literary-public-01-004",
    "vocational-public-05-002",
  ]
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
})

test("reviewed Arabic names remain searchable using their printed spelling", () => {
  const results = evaluateAdmissions(catalogues.literary, profile("literary"))
  for (const [query, id, field] of [
    ["التركية", "literary-public-02-019", "languages"],
    ["الترجمة", "literary-public-02-027", "languages"],
    ["عين عرب", "literary-public-01-014", "languages"],
    ["إدارة الأعمال", "literary-public-06-027", "business"],
    ["سلقين", "literary-public-06-036", "languages"],
    ["الترجمة التطبيقية", "literary-public-06-036", "languages"],
    ["للترجمة التطبيقية", "literary-public-06-036", "languages"],
    ["البرامج الإذاعية", "literary-public-07-014", "media"],
  ]) {
    const matches = filterResults(
      results,
      { ...initialFilters, status: "all", query, field },
      []
    )
    assert.ok(
      matches.some((r) => r.program.id === id),
      `${query}: ${id}`
    )
  }
})

test("shortened institute labels in announcement 4 p6 retain institute grouping", () => {
  const results = evaluateAdmissions(catalogues.literary, profile("literary"))
  for (const [id, name, field] of [
    [
      "literary-public-06-035",
      "المعهد التقاني للإرشاد النفسي والتربوي",
      "education",
    ],
    ["literary-public-06-036", "المعهد التقاني للترجمة التطبيقية", "languages"],
  ]) {
    const row = results.find((r) => r.program.id === id)
    assert.equal(row.program.name.ar, name)
    assert.equal(row.program.kind, "institute")
    assert.equal(row.program.field, field)
    assert.ok(row.program.institution.id.startsWith("public-institute-"))
    const group = groupByInstitution([row], "ar")[0]
    assert.equal(group.institute, true)
  }
})

test("vocational electronic technologies belong to engineering rather than health", () => {
  const rows = catalogues.vocational.programs.filter((p) =>
    /^vocational-public-06-00[2-6]$/.test(p.id)
  )
  assert.equal(rows.length, 5)
  for (const row of rows) {
    assert.equal(row.name.ar, "الكلية التطبيقية — التقانات الإلكترونية")
    assert.equal(row.kind, "applied_college")
    assert.equal(row.field, "engineering")
  }
})

test("private degree fields follow the specialization, not just the parent faculty", () => {
  const programs = Object.values(catalogues).flatMap((data) => data.programs)
  for (const [name, field] of [
    ["الإعلام والفنون التطبيقية - التصميم الغرافيكي", "arts"],
    [
      "هندسة الذكاء الاصطناعي - الهندسة الطبية الذكية والمعلوماتية الحيوية",
      "technology",
    ],
    ["الشريعة والقانون - القانون", "law"],
    ["الشريعة والقانون - القانون والأحوال الشخصية", "law"],
    ["الشريعة والقانون - الاقتصاد الإسلامي", "business"],
    ["الدراسات الإسلامية والعربية - اللغة العربية", "languages"],
  ]) {
    const matches = programs.filter((p) => p.name.ar === name)
    assert.ok(matches.length, name)
    assert.ok(
      matches.every((p) => p.field === field),
      name
    )
  }
})

test("all imported numerical and subject thresholds reject a hundredth below and accept the boundary", () => {
  let boundaries = 0
  for (const data of Object.values(catalogues)) {
    for (const program of data.programs) {
      const onlyProgram = { ...data, programs: [program] }
      for (const channel of program.channels) {
        const input = profile(data.scope.branch, {
          score: "100",
          vocationalSpecialty: computer.id,
        })
        const check = (student) =>
          evaluateAdmissions(onlyProgram, student)[0].channels.find(
            (c) => c.channel.id === channel.id
          )
        if (channel.minPercent !== null && channel.minPercent > 0) {
          for (const offset of [-0.01, 0]) {
            const scored = check({
              ...input,
              score: parseScore(
                (channel.minPercent + offset).toFixed(2),
                "percentage"
              ),
            })
            assert.equal(
              scored.findings.some((f) => f.type === "minimum"),
              offset < 0,
              `${program.id} ${channel.id}`
            )
          }
          boundaries++
        }
        for (const condition of channel.conditions) {
          if (condition.type !== "subject" || condition.minPercent <= 0)
            continue
          for (const offset of [-0.01, 0]) {
            const scored = check({
              ...input,
              subjects: {
                [condition.subject]: parseScore(
                  (condition.minPercent + offset).toFixed(2),
                  "percentage"
                ),
              },
            })
            assert.equal(
              scored.findings.some(
                (f) => f.type === "condition" && f.condition === condition
              ),
              offset < 0,
              `${program.id} ${channel.id} ${condition.subject}`
            )
          }
          boundaries++
        }
      }
    }
  }
  assert.ok(boundaries > 1000)
})

test("regular/dual education and wired/wireless certificates remain distinct", () => {
  const rows = catalogues.vocational.programs
  for (const [id, allowedName, rejectedName] of [
    [
      "vocational-public-05-007",
      "التصنيع الميكانيكي",
      "التصنيع الميكانيكي (تعليم مزدوج)",
    ],
    [
      "vocational-public-05-008",
      "التصنيع الميكانيكي (تعليم مزدوج)",
      "التصنيع الميكانيكي",
    ],
    ["vocational-private-56-004", "اتصالات سلكية", "اتصالات لاسلكية"],
    ["vocational-private-56-018", "اتصالات لاسلكية", "اتصالات سلكية"],
  ]) {
    const program = rows.find((p) => p.id === id)
    assert.ok(program, id)
    for (const [name, eligible] of [
      [allowedName, true],
      [rejectedName, false],
    ]) {
      const option = vocationalOptions.find((o) =>
        o.name.ar.endsWith(` — ${name}`)
      )
      assert.ok(option, name)
      const input = profile("vocational", {
        score: "100",
        vocationalSpecialty: option.id,
      })
      const evaluated = evaluateAdmissions(
        { ...catalogues.vocational, programs: [program] },
        input
      )[0]
      assert.equal(
        evaluated.status === "meets_requirements",
        eligible,
        `${id}: ${name}`
      )
    }
  }
})
