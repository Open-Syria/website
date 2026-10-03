import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { createLoader, createSerializer } from "nuqs/server"
import {
  answerParsers,
  answerQueryOptions,
  restoreAnswerSession,
  toQueryAnswers,
  withQueryAnswers,
} from "../src/app/[locale]/admissions/_utils/answer-query-state.ts"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import {
  careerFor,
  careerPriority,
} from "../src/app/[locale]/admissions/_utils/careers.ts"
import {
  applyConfirmationAnswer,
  canAnswerCondition,
  collectQuestions,
  questionChannels,
} from "../src/app/[locale]/admissions/_utils/confirmation.ts"
import {
  faqItems,
  guideSections,
} from "../src/app/[locale]/admissions/_utils/content.ts"
import { evaluateAdmissions } from "../src/app/[locale]/admissions/_utils/eligibility.ts"
import { readFavourites } from "../src/app/[locale]/admissions/_utils/favourites.ts"
import {
  initialValues,
  parseStudentForm,
} from "../src/app/[locale]/admissions/_utils/form.ts"
import {
  resultParsers,
  resultUrlKeys,
} from "../src/app/[locale]/admissions/_utils/query-state.ts"
import {
  filterResults,
  groupByInstitution,
  initialFilters,
} from "../src/app/[locale]/admissions/_utils/results.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import {
  displayPercentage,
  meetsMinimum,
  normaliseDigits,
  parseScore,
} from "../src/app/[locale]/admissions/_utils/score.ts"

const raw = JSON.parse(
  readFileSync(
    new URL(
      "../src/app/[locale]/admissions/_data/2026-2027/scientific.json",
      import.meta.url
    ),
    "utf8"
  )
)
const data = validateAdmissionsData(raw)

test("admissions translations preserve readable Unicode copy", () => {
  for (const locale of ["ar", "en"]) {
    const messages = JSON.parse(
      readFileSync(
        new URL(`../messages/${locale}.json`, import.meta.url),
        "utf8"
      )
    )
    function check(value, path) {
      if (typeof value === "string") {
        assert.doesNotMatch(value, /\?{2,}|\uFFFD|\w\?\w/, path)
      } else if (value && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) {
          check(item, `${path}.${key}`)
        }
      }
    }
    check(messages.Admissions, locale)
  }
})

test("shared questions deduplicate student answers without merging distinct exams or official checks", () => {
  const before = {
    type: "exam",
    id: "entrance-a",
    stage: "before_application",
    label: { ar: "A", en: "A" },
  }
  const after = { ...before, id: "medical", stage: "after_admission" }
  const channels = [
    {
      id: "general",
      minPercent: 60,
      conditions: [
        { type: "subject", subject: "math", minPercent: 60 },
        { type: "no_previous_general_admission" },
        { type: "governorate", allowed: ["homs"] },
        before,
        after,
      ],
    },
    {
      id: "parallel",
      minPercent: 50,
      scoreBasis: "sharia_subjects_included",
      conditions: [
        { type: "subject", subject: "math", minPercent: 50 },
        { type: "governorate", allowed: ["aleppo"] },
        before,
        { ...before, id: "entrance-b" },
        { type: "manual", label: { ar: "official", en: "official" } },
      ],
    },
  ]
  const original = structuredClone(channels)
  const questions = collectQuestions(channels)
  assert.equal(
    questions.conditions.filter((c) => c.type === "subject").length,
    1
  )
  assert.equal(
    questions.conditions.filter((c) => c.type === "governorate").length,
    1
  )
  assert.equal(
    questions.conditions.filter(
      (c) => c.type === "no_previous_general_admission"
    ).length,
    1
  )
  assert.deepEqual(
    questions.conditions.filter((c) => c.type === "exam").map((c) => c.id),
    ["entrance-a", "entrance-b"]
  )
  assert.equal(questions.shariaScore, true)
  assert.deepEqual(
    channels,
    original,
    "Each track retains its own thresholds and origin restrictions"
  )
  assert.deepEqual(
    collectQuestions([{ id: "parallel", conditions: [after] }]),
    { conditions: [], shariaScore: false }
  )
  assert.equal(
    collectQuestions([channels[1]]).conditions.some(
      (c) => c.type === "no_previous_general_admission"
    ),
    false
  )
})

test("question scope excludes tracks blocked by fixed profile rules but keeps editable failed answers", () => {
  const general = {
    id: "general",
    minPercent: 80,
    conditions: [{ type: "no_previous_general_admission" }],
  }
  const parallel = {
    id: "parallel",
    minPercent: 60,
    conditions: [{ type: "subject", subject: "math", minPercent: 60 }],
  }
  const result = {
    channels: [
      { channel: general, findings: [{ type: "minimum", required: 80 }] },
      {
        channel: parallel,
        findings: [
          {
            type: "condition",
            condition: parallel.conditions[0],
            outcome: "failed",
          },
        ],
      },
    ],
  }
  assert.deepEqual(questionChannels(result), [parallel])
  const sharia = { ...general, scoreBasis: "sharia_subjects_included" }
  assert.deepEqual(
    questionChannels({
      channels: [
        { channel: sharia, findings: [{ type: "minimum", required: 55 }] },
      ],
    }),
    [sharia],
    "The separate Sharia percentage remains editable"
  )
  assert.equal(
    collectQuestions(questionChannels(result)).conditions.some(
      (c) => c.type === "no_previous_general_admission"
    ),
    false
  )
  result.channels[1].findings = [
    {
      type: "condition",
      condition: { type: "certificate_year", allowed: [2026] },
      outcome: "failed",
    },
  ]
  assert.deepEqual(questionChannels(result), [])
})

test("inline answers recalculate every relevant choice using actual subject marks", () => {
  const values = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "90",
  }
  const fixture = {
    ...data,
    programs: [60, 75].map((minimum, index) => ({
      ...data.programs[0],
      id: `subject-${index}`,
      channels: [
        {
          id: "general",
          minPercent: 50,
          conditions: [
            { type: "subject", subject: "math", minPercent: minimum },
          ],
        },
      ],
    })),
  }
  const updated = applyConfirmationAnswer(values, {
    type: "subject",
    subject: "math",
    value: "٦٥",
  })
  const results = evaluateAdmissions(fixture, parseStudentForm(updated).input)
  assert.deepEqual(
    results.map((result) => result.status),
    ["meets_requirements", "not_eligible"]
  )
  assert.equal(filterResults(results, initialFilters, []).length, 1)
  assert.equal(values.math, "", "Previous answers remain available for undo")
  const cleared = applyConfirmationAnswer(updated, {
    type: "subject",
    subject: "math",
    value: "",
  })
  assert.ok(
    evaluateAdmissions(fixture, parseStudentForm(cleared).input).every(
      (result) => result.status === "needs_confirmation"
    )
  )
  assert.equal(
    parseStudentForm(
      applyConfirmationAnswer(values, {
        type: "subject",
        subject: "math",
        value: "101",
      })
    ).input,
    null
  )
})

test("inline exam answers persist and can be cleared without overriding official checks", () => {
  const values = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "90",
  }
  const before = {
    type: "exam",
    id: "entrance-example",
    stage: "before_application",
    label: { ar: "اختبار", en: "Test" },
  }
  const after = { ...before, id: "medical-example", stage: "after_admission" }
  const manual = {
    type: "manual",
    label: { ar: "تحقق رسمي", en: "Official verification" },
  }
  assert.equal(canAnswerCondition(before), true)
  assert.equal(canAnswerCondition(after), false)
  assert.equal(canAnswerCondition(manual), false)
  const updated = applyConfirmationAnswer(values, {
    type: "exam",
    id: before.id,
    value: true,
  })
  const restored = readAnswers(JSON.stringify({ version: 1, values: updated }))
  assert.deepEqual(parseStudentForm(restored).input.exams, {
    [before.id]: true,
  })
  const fixture = {
    ...data,
    programs: [
      {
        ...data.programs[0],
        channels: [{ id: "general", minPercent: 50, conditions: [before] }],
      },
    ],
  }
  assert.equal(
    evaluateAdmissions(fixture, parseStudentForm(restored).input)[0].status,
    "meets_requirements"
  )
  const failed = applyConfirmationAnswer(updated, {
    type: "exam",
    id: before.id,
    value: false,
  })
  assert.equal(
    evaluateAdmissions(fixture, parseStudentForm(failed).input)[0].status,
    "not_eligible"
  )
  const cleared = applyConfirmationAnswer(updated, {
    type: "exam",
    id: before.id,
    value: undefined,
  })
  assert.equal(
    evaluateAdmissions(fixture, parseStudentForm(cleared).input)[0].status,
    "needs_confirmation"
  )
  fixture.programs[0].channels[0].conditions = [before, after, manual]
  const injected = applyConfirmationAnswer(updated, {
    type: "exam",
    id: after.id,
    value: true,
  })
  assert.equal(
    evaluateAdmissions(fixture, parseStudentForm(injected).input)[0].status,
    "needs_confirmation"
  )
  for (const extras of [
    { exams: { [before.id]: "yes" } },
    { exams: [] },
    { exams: { "architecture-exam": true } },
    { eligibilityGovernorate: {} },
  ]) {
    assert.equal(
      readAnswers(
        JSON.stringify({ version: 1, values: { ...values, ...extras } })
      ),
      null
    )
  }
})

test("inline answers remain consistent with the edit form and restored session", () => {
  let values = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "90",
  }
  for (const answer of [
    { type: "previous_admission", value: "no" },
    { type: "gender", value: "female" },
    { type: "birth_year", value: "٢٠٠٨" },
    { type: "governorate", value: "homs" },
    { type: "exam", id: "architecture-exam", value: true },
    { type: "subject", subject: "english", value: "٨٠" },
  ])
    values = applyConfirmationAnswer(values, answer)
  const restored = readAnswers(JSON.stringify({ version: 1, values }))
  const { input } = parseStudentForm(restored)
  assert.equal(input.previousGeneralAdmission, false)
  assert.equal(input.gender, "female")
  assert.equal(input.birthYear, 2008)
  assert.equal(input.eligibilityGovernorate, "homs")
  assert.equal(input.exams["architecture-exam"], true)
  assert.equal(input.subjects.english.earned, 8000)
  assert.equal(values.architecture, "passed")
  assert.equal(
    parseStudentForm(
      applyConfirmationAnswer(values, {
        type: "exam",
        id: "architecture-exam",
        value: undefined,
      })
    ).input.exams["architecture-exam"],
    undefined
  )
})

test("reviewed health-sciences labels are searchable without changing choice or exam IDs", () => {
  const input = parseStudentForm({
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "90",
  }).input
  const results = evaluateAdmissions(data, input)
  for (const [id, query] of [
    ["public-10-013", "تقويم الكلام"],
    ["public-10-017", "الأطراف الاصطناعية"],
    ["public-10-025", "التحليل المخبري"],
  ]) {
    assert.ok(
      filterResults(
        results,
        { ...initialFilters, status: "all", query },
        []
      ).some((result) => result.program.id === id),
      query
    )
  }
  const review = JSON.parse(
    readFileSync(
      new URL("./admissions/2026-2027/visual-review.json", import.meta.url),
      "utf8"
    )
  )
  for (const entry of review.catalogueChanges) {
    const catalogue = JSON.parse(
      readFileSync(
        new URL(
          `../src/app/[locale]/admissions/_data/2026-2027/${entry.catalogue}`,
          import.meta.url
        ),
        "utf8"
      )
    )
    for (const correction of entry.names) {
      const program = catalogue.programs.find((p) => p.id === correction.id)
      assert.deepEqual(program.name, correction.after)
      // Media entrance IDs predate these display corrections and remain stable.
      const examId = correction.id.endsWith("07-014")
        ? "entrance-964ea8a21ace"
        : correction.id.endsWith("07-016")
          ? "entrance-d401bb176a22"
          : null
      if (examId) {
        for (const channel of program.channels) {
          assert.ok(
            channel.conditions.some((c) => c.type === "exam" && c.id === examId)
          )
        }
      }
    }
  }
})

test("visual review accounts for every page of the pinned source pack", () => {
  const review = JSON.parse(
    readFileSync(
      new URL("./admissions/2026-2027/visual-review.json", import.meta.url),
      "utf8"
    )
  )
  const sources = [...data.sources, data.supportDirectory]
  assert.equal(review.documents.length, sources.length)
  let reviewedPages = 0
  let thisPass = 0
  for (const source of sources) {
    const document = review.documents.find(
      (entry) => entry.filename === source.filename
    )
    assert.equal(document.sha256, source.sha256)
    assert.equal(document.pageCount, source.pageCount)
    assert.deepEqual(document.remainingPages, [])
    const pages = [
      ...document.previouslyReviewedPages,
      ...document.reviewedPagesThisPass.map((entry) => entry.page),
    ].sort((a, b) => a - b)
    assert.deepEqual(
      pages,
      Array.from({ length: source.pageCount }, (_, index) => index + 1)
    )
    reviewedPages += pages.length
    thisPass += document.reviewedPagesThisPass.length
  }
  assert.equal(reviewedPages, 309)
  assert.equal(thisPass, 24)
  assert.equal(review.remainingPages, 0)
})

test("form keeps unknown conditions pending and accepts localized totals and birth years", () => {
  const { input, errors } = parseStudentForm({
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    mode: "total",
    score: "١٤٢٨",
    math: "٥٥",
    birthYear: "٢٠٠٣",
  })
  assert.deepEqual(errors, {})
  assert.equal(displayPercentage(input.score), 59.5)
  assert.equal(displayPercentage(input.subjects.math), 55)
  assert.equal(input.birthYear, 2003)
  assert.equal(input.gender, null)
  assert.equal(input.previousGeneralAdmission, null)
  assert.deepEqual(input.exams, {})
  for (const [field, value] of [
    ["certificate", "other"],
    ["applicantCategory", ""],
    ["applicantCategory", "other"],
    ["score", "100.01"],
    ["math", "-1"],
    ["birthYear", "2e3"],
    ["birthYear", "2027"],
  ]) {
    const result = parseStudentForm({
      ...initialValues,
      applicantCategory: "syrian_or_equivalent",
      score: "59.5",
      [field]: value,
    })
    assert.equal(result.input, null)
    assert.equal(result.errors[field], true)
  }
})

test("guide references and both translations cover the shipped data", () => {
  const messages = Object.fromEntries(
    ["ar", "en"].map((locale) => [
      locale,
      JSON.parse(
        readFileSync(
          new URL(`../messages/${locale}.json`, import.meta.url),
          "utf8"
        )
      ).Admissions,
    ])
  )
  const keys = (object, prefix = "") =>
    Object.entries(object).flatMap(([key, value]) =>
      typeof value === "string"
        ? [`${prefix}${key}`]
        : keys(value, `${prefix}${key}.`)
    )
  assert.deepEqual(keys(messages.ar).sort(), keys(messages.en).sort())
  for (const section of [...guideSections, ...faqItems]) {
    for (const ref of section.sources) {
      const source = data.sources.find(
        (item) => item.announcement === ref.announcement
      )
      assert.ok(source && ref.page > 0 && ref.page <= source.pageCount)
    }
  }
  for (const locale of ["ar", "en"]) {
    for (const section of guideSections)
      assert.ok(messages[locale].guide.sections[section.id]?.body)
    for (const item of faqItems)
      assert.ok(messages[locale].faq.items[item.id]?.answer)
    for (const program of data.programs) {
      assert.ok(messages[locale].governorates[program.governorate])
      assert.ok(messages[locale].fields[program.field])
      for (const channel of program.channels)
        assert.ok(messages[locale].channels[channel.id])
    }
  }
  const localizedValues = (value) => {
    if (!value || typeof value !== "object") return []
    if (typeof value.ar === "string") return [value.ar]
    return Object.values(value).flatMap(localizedValues)
  }
  for (const value of localizedValues(data)) {
    assert.match(
      value,
      /[\u0621-\u064A]/,
      "Arabic source names must retain Arabic characters"
    )
    assert.ok(
      !value.includes("??"),
      "Source text must not contain encoding replacements"
    )
  }
})
const student = (overrides = {}) => ({
  branch: "scientific",
  certificateYear: 2026,
  certificate: "syrian",
  applicantCategory: "syrian_or_equivalent",
  previousGeneralAdmission: false,
  score: parseScore("59.5", "percentage"),
  subjects: {},
  gender: null,
  birthYear: null,
  eligibilityGovernorate: null,
  exams: {},
  ...overrides,
})
const programResult = (id, input = student()) =>
  evaluateAdmissions(data, input).find((result) => result.program.id === id)
const channel = (result, id) =>
  result.channels.find((entry) => entry.channel.id === id)

test("Arabic and Persian digits and decimal separators are accepted", () => {
  assert.equal(normaliseDigits(" ٥٩٫٥ "), "59.5")
  for (const value of ["59.5", "٥٩٫٥", "۵۹٫۵", "59,5"]) {
    assert.equal(displayPercentage(parseScore(value, "percentage")), 59.5)
  }
})

test("blank, malformed, over-precise, negative and out-of-range scores are rejected", () => {
  for (const value of [
    "",
    " ",
    "NaN",
    "Infinity",
    "-1",
    "100.01",
    "59.999",
    "5e1",
    "59%",
    "5 9",
    "1,000",
  ]) {
    assert.equal(parseScore(value, "percentage"), null, value)
  }
  assert.equal(parseScore("2400.01", "total"), null)
  assert.equal(displayPercentage(parseScore("2400", "total")), 100)
  assert.equal(displayPercentage(parseScore("0", "percentage")), 0)
})

test("total comparisons retain precision at and below a threshold", () => {
  assert.equal(displayPercentage(parseScore("1356", "total")), 56.5)
  assert.equal(meetsMinimum(parseScore("1356", "total"), 56.5), true)
  assert.equal(meetsMinimum(parseScore("1428", "total"), 59.5), true)
  assert.equal(meetsMinimum(parseScore("1427.99", "total"), 59.5), false)
  assert.equal(meetsMinimum(parseScore("59.49", "percentage"), 59.5), false)
})

test("invalid input is rejected by the engine, not just the form", () => {
  for (const score of [
    { earned: NaN, maximum: 10_000 },
    { earned: 10001, maximum: 10000 },
    { earned: 1, maximum: 0 },
  ]) {
    assert.throws(
      () => evaluateAdmissions(data, student({ score })),
      RangeError
    )
  }
  assert.throws(
    () =>
      evaluateAdmissions(
        data,
        student({ subjects: { math: { earned: NaN, maximum: 10000 } } })
      ),
    RangeError
  )
  assert.throws(
    () => evaluateAdmissions(data, student({ birthYear: 2003.5 })),
    RangeError
  )
})

test("unsupported branch, year, certificate and applicant category never match", () => {
  for (const overrides of [
    { branch: "literary" },
    { certificateYear: 2025 },
    { certificate: "foreign" },
    { applicantCategory: "other" },
  ]) {
    assert.ok(
      evaluateAdmissions(data, student(overrides)).every(
        (result) => result.status === "not_eligible"
      )
    )
  }
})

test("previous general admission restricts general only; an unknown answer remains pending", () => {
  for (const previousGeneralAdmission of [null, undefined, true, false]) {
    const result = programResult(
      "public-19-009",
      student({ previousGeneralAdmission })
    )
    assert.equal(
      channel(result, "general").status,
      typeof previousGeneralAdmission !== "boolean"
        ? "needs_confirmation"
        : previousGeneralAdmission
          ? "not_eligible"
          : "meets_requirements"
    )
    assert.equal(channel(result, "parallel").status, "meets_requirements")
    assert.equal(
      programResult("private-21-009", student({ previousGeneralAdmission }))
        .status,
      "meets_requirements"
    )
  }
})

test("59.5 profile matches source-backed general and parallel options", () => {
  assert.equal(
    channel(programResult("public-19-009"), "general").status,
    "meets_requirements"
  )
  const physiotherapy = programResult("public-17-031")
  assert.equal(channel(physiotherapy, "general").status, "not_eligible")
  assert.equal(channel(physiotherapy, "parallel").status, "meets_requirements")
  assert.equal(programResult("public-03-004").status, "not_eligible")
  assert.equal(programResult("private-21-009").status, "meets_requirements")
})

test("computing institutes require 60% mathematics for both general and parallel", () => {
  assert.equal(programResult("public-18-013").status, "needs_confirmation")
  const math55 = student({ subjects: { math: parseScore("55", "percentage") } })
  const result = programResult("public-18-013", math55)
  assert.equal(channel(result, "general").status, "not_eligible")
  assert.equal(channel(result, "parallel").status, "not_eligible")
  assert.equal(
    programResult(
      "public-18-017",
      student({ subjects: { math: parseScore("49.99", "percentage") } })
    ).status,
    "not_eligible"
  )
})

test("all applicants still requires the subject and supported certificate", () => {
  const result = programResult(
    "public-18-017",
    student({ subjects: { math: parseScore("60", "percentage") } })
  )
  assert.equal(channel(result, "general").channel.minPercent, null)
  assert.equal(result.status, "meets_requirements")
})

test("gender and age omissions are conditional, explicit failures block", () => {
  assert.equal(programResult("public-17-043").status, "needs_confirmation")
  assert.equal(
    programResult("public-17-043", student({ gender: "male" })).status,
    "not_eligible"
  )
  assert.equal(
    programResult("public-17-043", student({ gender: "female" })).status,
    "meets_requirements"
  )
  assert.equal(
    programResult("public-19-035", student({ gender: "male", birthYear: 2002 }))
      .status,
    "not_eligible"
  )
  const result = programResult(
    "public-19-035",
    student({ gender: "male", birthYear: 2003 })
  )
  assert.equal(
    result.status,
    "needs_confirmation",
    "post-admission examination remains outstanding"
  )
})

test("entrance exams must be confirmed and cannot override a failed score", () => {
  assert.equal(
    programResult(
      "public-01-027",
      student({ score: parseScore("80", "percentage") })
    ).status,
    "needs_confirmation"
  )
  assert.equal(
    programResult(
      "public-01-027",
      student({
        score: parseScore("80", "percentage"),
        exams: { "architecture-exam": true },
      })
    ).status,
    "meets_requirements"
  )
  assert.equal(
    programResult(
      "public-01-027",
      student({ exams: { "architecture-exam": true } })
    ).status,
    "not_eligible"
  )
})

test("unknown official governorate and manual rules cannot silently pass", () => {
  const fixture = structuredClone(data)
  fixture.programs = [fixture.programs[0]]
  fixture.programs[0].channels = [
    {
      id: "general",
      minPercent: 50,
      conditions: [{ type: "governorate", allowed: ["homs"] }],
    },
  ]
  assert.equal(
    evaluateAdmissions(fixture, student())[0].status,
    "needs_confirmation"
  )
  assert.equal(
    evaluateAdmissions(
      fixture,
      student({ eligibilityGovernorate: "aleppo" })
    )[0].status,
    "not_eligible"
  )
  assert.equal(
    evaluateAdmissions(fixture, student({ eligibilityGovernorate: "homs" }))[0]
      .status,
    "meets_requirements"
  )
  fixture.programs[0].channels[0].conditions = [
    { type: "manual", label: { ar: "تحقق", en: "Check" } },
  ]
  assert.equal(
    evaluateAdmissions(fixture, student())[0].status,
    "needs_confirmation"
  )
})

test("full scientific coverage preserves every source row and available track", () => {
  assert.equal(data.coverage, "scientific")
  assert.equal(data.programs.length, 1169)
  const results = evaluateAdmissions(data, student())
  const groups = groupByInstitution(results, "ar")
  assert.equal(
    groups.reduce((count, group) => count + group.results.length, 0),
    1169
  )
  assert.equal(
    data.programs.filter((p) => p.id.startsWith("public-")).length,
    780
  )
  assert.equal(
    data.programs.filter((p) => p.id.startsWith("private-")).length,
    389
  )
  assert.equal(
    data.programs.flatMap((p) => p.channels).filter((c) => c.id === "parallel")
      .length,
    778
  )
  const rows = JSON.parse(
    readFileSync(
      new URL("./admissions/2026-2027/rows.json", import.meta.url),
      "utf8"
    )
  )
  const ids = rows.map(
    (row) =>
      `${row.sector}-${String(row.page).padStart(2, "0")}-${String(row.row).padStart(3, "0")}`
  )
  assert.deepEqual(
    data.programs.map((p) => p.id),
    ids
  )
  for (const [index, row] of rows.entries()) {
    const program = data.programs[index]
    assert.deepEqual(program.sources[0], {
      announcement: row.sector === "public" ? 2 : 7,
      page: row.page,
      row: row.row,
    })
    for (const key of row.sector === "public"
      ? ["general", "parallel"]
      : ["private"]) {
      const cell = row[key]
      const track = program.channels.find((c) => c.id === key)
      if (!cell || cell === "-") {
        assert.equal(track, undefined)
        continue
      }
      assert.ok(track)
      const number = cell.match(/\d+(?:\.\d+)?/)
      assert.equal(
        track.minPercent,
        cell.includes("جميع المتقدم") ? null : Number(number[0])
      )
      if (cell.includes("امتحان"))
        assert.ok(track.conditions.some((c) => c.type === "exam"))
    }
  }
})

test("filtering evaluates the selected track and retains saved blocked choices for review", () => {
  const results = evaluateAdmissions(data, student())
  const general = filterResults(
    results,
    { ...initialFilters, channel: "general" },
    []
  )
  assert.ok(!general.some((result) => result.program.id === "public-17-031"))
  const parallel = filterResults(
    results,
    { ...initialFilters, channel: "parallel" },
    []
  )
  assert.ok(parallel.some((result) => result.program.id === "public-17-031"))
  const saved = filterResults(
    results,
    { ...initialFilters, savedOnly: true, status: "all" },
    ["public-03-004"]
  )
  assert.equal(saved.length, 1)
  assert.equal(saved[0].status, "not_eligible")
  assert.ok(
    filterResults(results, { ...initialFilters, query: "اندلس" }, []).length > 0
  )
})

test("data validation rejects lost thresholds, bad source references and duplicate identities", () => {
  for (const mutate of [
    (value) => {
      delete value.programs[0].channels[0].minPercent
    },
    (value) => {
      value.programs[0].sources[0].page = 1000
    },
    (value) => {
      value.programs[0].channels[0].minPercent = 105
    },
    (value) => {
      value.programs.push(value.programs[0])
    },
    (value) => {
      value.programs[0].channels.push(value.programs[0].channels[0])
    },
    (value) => {
      value.sources[0].url = "https://example.com/source.pdf"
    },
  ]) {
    const invalid = structuredClone(raw)
    mutate(invalid)
    assert.throws(() => validateAdmissionsData(invalid))
  }
})

test("all matches precede conditional choices, then faculties, tracks and career guidance", () => {
  const results = evaluateAdmissions(
    data,
    student({ score: parseScore("100", "percentage") })
  )
  for (const locale of ["ar", "en"])
    for (const sort of ["career", "name"]) {
      const groups = groupByInstitution(results, locale, sort)
      let previous = -1
      for (const group of groups) {
        const status = [
          "meets_requirements",
          "needs_confirmation",
          "not_eligible",
        ].indexOf(group.status)
        const track = ["general", "parallel", "private"].indexOf(group.channel)
        const priority = status * 100 + Number(group.institute) * 10 + track
        assert.ok(
          priority >= previous,
          `${group.id} violates status, institution or track ordering`
        )
        previous = priority
        assert.ok(
          group.results.every(
            (r) =>
              (r.program.kind === "institute") === group.institute &&
              r.status === group.status &&
              r.channels.some(
                (c) =>
                  c.channel.id === group.channel && c.status === group.status
              )
          )
        )
        if (sort === "career")
          for (let i = 1; i < group.results.length; i++)
            assert.ok(
              careerPriority(group.results[i - 1].program) <=
                careerPriority(group.results[i].program)
            )
      }
      assert.equal(new Set(groups.map((g) => g.id)).size, groups.length)
      assert.equal(
        groups.flatMap((g) => g.results).length,
        data.programs.length
      )
    }
  const before = data.programs.map((p) => careerFor(p).outlook)
  const low = evaluateAdmissions(
    data,
    student({ score: parseScore("40", "percentage") })
  )
  assert.deepEqual(
    low.map((r) => careerFor(r.program).outlook),
    before,
    "Career guidance is independent of student marks"
  )
})

test("an eligible parallel track determines ordering when general is blocked", () => {
  const results = evaluateAdmissions(
    data,
    student({
      score: parseScore("70", "percentage"),
      previousGeneralAdmission: true,
    })
  )
  const groups = groupByInstitution(results, "ar")
  const matches = groups.filter(
    (group) => group.status === "meets_requirements"
  )
  assert.ok(matches.some((group) => group.channel === "parallel"))
  assert.ok(matches.every((group) => group.channel !== "general"))
})

test("URL state uses short keys, omits defaults, and validates foreign filter values", () => {
  const load = createLoader(resultParsers, { urlKeys: resultUrlKeys })
  const serialize = createSerializer(resultParsers, { urlKeys: resultUrlKeys })
  assert.deepEqual(load(""), {
    ...initialFilters,
    groupPage: 1,
    programPages: {},
  })
  assert.equal(serialize(load("")), "")
  const state = load(
    "?q=Damascus&g=rif-dimashq&f=health&c=parallel&s=all&fav=true&o=name&p=2"
  )
  assert.deepEqual(state, {
    query: "Damascus",
    governorate: "rif-dimashq",
    field: "health",
    channel: "parallel",
    status: "all",
    savedOnly: true,
    sort: "name",
    groupPage: 2,
    programPages: {},
  })
  assert.equal(
    serialize(state),
    "?q=Damascus&g=rif-dimashq&f=health&c=parallel&s=all&fav=true&o=name&p=2"
  )
  assert.deepEqual(
    load("?g=unknown&f=unknown&c=unknown&s=unknown&o=unknown&p=-2&pp=invalid"),
    load("")
  )
  assert.equal(load("?p=2oops").groupPage, 1)
  assert.deepEqual(load({ pp: JSON.stringify({ group: -1 }) }).programPages, {})
  const pages = { "meets_requirements-university-general-damascus": 2 }
  assert.deepEqual(load(serialize({ programPages: pages })).programPages, pages)
  for (const governorate of new Set(data.programs.map((p) => p.governorate)))
    assert.equal(load({ g: governorate }).governorate, governorate)
})

test("answer URLs round-trip all supported conditions and preserve other filters", () => {
  const load = createLoader(answerParsers, answerQueryOptions)
  const serialize = createSerializer(answerParsers, answerQueryOptions)
  const values = {
    ...initialValues,
    score: "75",
    applicantCategory: "syrian_or_equivalent",
    math: "٦٥",
    subjectMarks: { english: "80", physics: "" },
    birthYear: "٢٠٠٧",
    gender: "female",
    previousGeneralAdmission: "no",
    architecture: "passed",
    shariaFacultyScore: "85.5",
    eligibilityGovernorate: "homs",
    exams: { "entrance-123": true, "entrance-456": false },
  }
  const snapshot = toQueryAnswers(values)
  const url = serialize("?q=computer&g=homs&p=2&custom=keep", {
    answers: snapshot,
  })
  const params = new URLSearchParams(url)
  assert.equal(params.get("q"), "computer")
  assert.equal(params.get("custom"), "keep")
  assert.equal(params.get("p"), "2")
  assert.deepEqual(load(url).answers, snapshot)
  assert.equal(snapshot.math, "65")
  assert.equal(snapshot.birthYear, "2007")
  assert.deepEqual(snapshot.subjectMarks, { english: "80" })
  assert.equal(snapshot.score, undefined)
  const restored = withQueryAnswers(values, load(url).answers)
  assert.deepEqual(
    parseStudentForm(restored).input,
    parseStudentForm(values).input
  )
  assert.deepEqual(load(serialize({ answers: {} })).answers, {})
  assert.equal(load(serialize(url, { answers: null })).answers, null)
})

test("URL answers override storage, migrate old tabs, and never resurrect cleared answers", () => {
  const values = {
    ...initialValues,
    score: "75",
    applicantCategory: "syrian_or_equivalent",
    math: "65",
    previousGeneralAdmission: "yes",
    exams: { "entrance-123": false },
  }
  const legacy = JSON.stringify({ version: 1, values })
  const current = JSON.stringify({ version: 2, values })
  assert.deepEqual(
    restoreAnswerSession(legacy, null).answers,
    toQueryAnswers(values)
  )
  for (const raw of [legacy, current]) {
    const restored = restoreAnswerSession(raw, {
      previousGeneralAdmission: "no",
    })
    assert.equal(restored.values.previousGeneralAdmission, "no")
    assert.equal(restored.values.math, "")
    assert.deepEqual(restored.values.exams, {})
    assert.equal(restored.values.score, "75")
    const cleared = restoreAnswerSession(raw, {})
    assert.equal(cleared.values.previousGeneralAdmission, "unknown")
    assert.deepEqual(cleared.values.exams, {})
  }
  assert.equal(restoreAnswerSession(current, null).answers, null)
  assert.equal(restoreAnswerSession(current, null).values.math, "")
  const serialize = createSerializer(answerParsers, answerQueryOptions)
  const cleared = withQueryAnswers(values, null)
  assert.equal(toQueryAnswers(cleared), null)
  assert.equal(
    serialize("?q=computer&a=%7B%7D", { answers: toQueryAnswers(cleared) }),
    "?q=computer"
  )
  const changed = withQueryAnswers(values, { math: "50" })
  const undone = withQueryAnswers(changed, toQueryAnswers(values))
  assert.deepEqual(
    parseStudentForm(undone).input,
    parseStudentForm(values).input
  )
})

test("answer URL parsers reject malformed scores, conditions and arbitrary overrides", () => {
  const load = createLoader(answerParsers, answerQueryOptions)
  for (const value of [
    null,
    [],
    "yes",
    { math: "101" },
    { math: "-1" },
    { math: 65 },
    { birthYear: "2027" },
    { birthYear: "2000oops" },
    { gender: "unknown" },
    { previousGeneralAdmission: true },
    { subjectMarks: { unknown: "75" } },
    { subjectMarks: { english: "101" } },
    { exams: { test: "yes" } },
    { exams: { "architecture-exam": true } },
    { architecture: true },
    { eligibilityGovernorate: "anywhere" },
    { score: "100" },
    { status: "meets_requirements" },
  ])
    assert.equal(load({ a: JSON.stringify(value) }).answers, null)
  assert.equal(load({ a: "broken" }).answers, null)
  assert.deepEqual(load({ a: '{"exams":{"entrance-123":false}}' }).answers, {
    exams: { "entrance-123": false },
  })
})

test("stored favourites and tab answers reject malformed or stale input", () => {
  assert.deepEqual(
    readFavourites('["public-01-001","public-01-001",null,{},"bad"]'),
    ["public-01-001"]
  )
  for (const raw of [null, "broken", "{}", "null"]) {
    assert.deepEqual(readFavourites(raw), [])
    assert.equal(readAnswers(raw), null)
  }
  const values = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "٧٠",
    subjectMarks: { physics: "٦٥" },
  }
  assert.deepEqual(readAnswers(JSON.stringify({ version: 1, values })), values)
  for (const invalid of [
    { ...values, score: "101" },
    { ...values, mode: "other" },
    { ...values, gender: "invalid" },
    { ...values, subjectMarks: { physics: {} } },
    { ...values, subjectMarks: { unknown: "65" } },
    { ...values, score: 70 },
  ])
    assert.equal(
      readAnswers(JSON.stringify({ version: 1, values: invalid })),
      null
    )
  assert.deepEqual(readAnswers(JSON.stringify({ version: 2, values })), values)
  assert.equal(readAnswers(JSON.stringify({ version: 3, values })), null)
})

test("subject-ranked choices use subject marks and keep regional quotas pending", () => {
  const biology = data.programs.find(
    (p) =>
      p.id.startsWith("public-") &&
      p.campus.ar === "دمشق" &&
      p.name.ar.includes("علم الحياة") &&
      p.name.ar.includes("تخصصي")
  )
  const input = student({
    score: parseScore("50", "percentage"),
    subjects: { biology: parseScore("75", "percentage") },
  })
  const result = programResult(biology.id, input)
  assert.equal(channel(result, "general").channel.minPercent, null)
  assert.equal(channel(result, "general").status, "meets_requirements")
  assert.equal(
    channel(
      programResult(
        biology.id,
        student({
          ...input,
          subjects: { biology: parseScore("74.99", "percentage") },
        })
      ),
      "general"
    ).status,
    "not_eligible"
  )
  const regional = programResult(
    "public-01-005",
    student({ score: parseScore("100", "percentage") })
  )
  assert.equal(regional.status, "needs_confirmation")
  assert.ok(
    regional.channels.every((c) =>
      c.findings.some(
        (f) => f.type === "condition" && f.condition.type === "governorate"
      )
    )
  )
})

test("regional certificate origin is answerable and ordinary province choices remain open", () => {
  const values = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "100",
    previousGeneralAdmission: "no",
  }
  const get = (values, id) =>
    evaluateAdmissions(data, parseStudentForm(values).input).find(
      (result) => result.program.id === id
    )
  const east = "public-01-011"
  const ordinary = "public-01-012"
  assert.equal(get(values, east).status, "needs_confirmation")
  for (const origin of ["deir-ez-zor", "hasakah", "raqqa", "damascus"]) {
    const answered = applyConfirmationAnswer(values, {
      type: "governorate",
      value: origin,
    })
    assert.equal(
      get(answered, east).status,
      origin === "damascus" ? "not_eligible" : "meets_requirements"
    )
    assert.equal(get(answered, ordinary).status, "meets_requirements")
    const url = createSerializer(
      answerParsers,
      answerQueryOptions
    )({ answers: toQueryAnswers(answered) })
    const restored = withQueryAnswers(
      values,
      createLoader(answerParsers, answerQueryOptions)(url).answers
    )
    assert.equal(get(restored, east).status, get(answered, east).status)
    assert.equal(
      get(
        applyConfirmationAnswer(answered, { type: "governorate", value: "" }),
        east
      ).status,
      "needs_confirmation"
    )
  }
  // The printed label omits the initial lam: it is still a reserved Sweida row.
  assert.equal(get(values, "public-14-006").status, "needs_confirmation")
  const sweida = { ...values, eligibilityGovernorate: "sweida" }
  assert.equal(get(sweida, "public-14-006").status, "meets_requirements")
  assert.equal(
    get({ ...values, eligibilityGovernorate: "homs" }, "public-14-006").status,
    "not_eligible"
  )
  assert.equal(get(values, "public-14-007").status, "meets_requirements")
  assert.ok(
    get(values, east).program.sources.some(
      (ref) => ref.announcement === 1 && ref.page === 6
    )
  )
  assert.ok(
    get(values, "public-14-006").program.sources.some(
      (ref) => ref.announcement === 1 && ref.page === 5
    )
  )
})

test("all private architecture and arts exam cells are retained with the correct exam", () => {
  const architecture = data.programs.filter(
    (p) =>
      p.id.startsWith("private-") &&
      p.channels[0].conditions.some(
        (c) => c.type === "exam" && c.id === "architecture-exam"
      )
  )
  assert.equal(architecture.length, 23)
  const interiorArt = data.programs.find(
    (p) =>
      p.id.startsWith("private-30") && p.name.ar.includes("العمارة الداخلية")
  )
  assert.ok(
    interiorArt.channels[0].conditions.some(
      (c) => c.type === "exam" && c.label.ar.includes("الفنون الجميلة")
    )
  )
  assert.ok(
    !interiorArt.channels[0].conditions.some(
      (c) => c.type === "exam" && c.id === "architecture-exam"
    )
  )
  assert.equal(
    data.programs
      .filter((p) => p.id.startsWith("private-"))
      .flatMap((p) => p.channels[0].conditions)
      .filter((c) => c.type === "exam").length,
    31
  )
})

test("additional subject percentages validate separately and unknown marks stay unknown", () => {
  const form = {
    ...initialValues,
    applicantCategory: "syrian_or_equivalent",
    score: "70",
    subjectMarks: { biology: "٧٥", arabic: "80", religion: "60" },
  }
  const result = parseStudentForm(form)
  assert.deepEqual(result.errors, {})
  assert.equal(displayPercentage(result.input.subjects.biology), 75)
  assert.equal(result.input.subjects.french, undefined)
  for (const subject of [
    "biology",
    "physics",
    "chemistry",
    "arabic",
    "foreign_language",
    "english",
    "french",
    "russian",
    "religion",
  ]) {
    const invalid = parseStudentForm({
      ...form,
      subjectMarks: { [subject]: "100.01" },
    })
    assert.equal(invalid.input, null)
    assert.equal(invalid.errors[subject], true)
  }
})
