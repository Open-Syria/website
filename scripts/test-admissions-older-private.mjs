import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import {
  certificateCatalogue,
  parseCertificateYear,
  vocationalOptions,
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

const bytes = (path) => readFileSync(new URL(path, import.meta.url))
const read = (path) => JSON.parse(bytes(path).toString("utf8"))
const digest = (path) => createHash("sha256").update(bytes(path)).digest("hex")
const dataPath = (key) =>
  `../src/app/[locale]/admissions/_data/2026-2027/${key}.json`
const configurations = [false, true].flatMap((foreign) =>
  ["scientific", "literary", "vocational"].map((branch) => ({
    branch,
    foreign,
    key: `older-${foreign ? "foreign-" : ""}${branch}`,
    category: foreign ? "arab_and_foreign" : "syrian_or_equivalent",
    maximum: foreign ? 2024 : 2025,
    count: branch === "scientific" ? 389 : branch === "literary" ? 131 : 536,
  }))
)
const catalogues = Object.fromEntries(
  configurations.map((c) => [
    c.key,
    validateAdmissionsData(read(dataPath(c.key))),
  ])
)
const values = (c, overrides = {}) => ({
  ...initialValues,
  certificate: c.branch === "scientific" ? "supported" : c.branch,
  certificateYear: String(c.maximum),
  applicantCategory: c.category,
  score: "80",
  vocationalSpecialty: vocationalOptions[0].id,
  ...overrides,
})
const profile = (c, overrides = {}) => {
  const parsed = parseStudentForm(values(c, overrides))
  assert.deepEqual(parsed.errors, {})
  assert.ok(parsed.input)
  return parsed.input
}

for (const c of configurations) {
  const data = catalogues[c.key]
  test(`${c.key}: all private source rows and original requirements are preserved`, () => {
    const manifest = read(`./admissions/2026-2027/${c.key}-manifest.json`)
    assert.equal(data.programs.length, c.count)
    assert.equal(manifest.privateRows, c.count)
    assert.equal(
      manifest.prerequisiteCatalogueSha256,
      digest(dataPath(c.branch))
    )
    assert.equal(
      manifest.extractedRowsSha256,
      digest(`./admissions/2026-2027/${manifest.extractedRowsFile}`)
    )
    const original = read(dataPath(c.branch)).programs.filter(
      (p) => p.channels[0].id === "private"
    )
    for (const [i, p] of data.programs.entries()) {
      const { id: _id, sources: _sources, ...actual } = p
      const { id: _baseId, sources: _baseSources, ...expected } = original[i]
      assert.deepEqual(actual, expected)
      for (const ref of original[i].sources)
        assert.ok(
          p.sources.some((r) => JSON.stringify(r) === JSON.stringify(ref))
        )
      assert.ok(
        p.sources.some(
          (r) =>
            r.announcement === 7 &&
            r.page ===
              (c.foreign
                ? c.branch === "vocational"
                  ? 7
                  : 5
                : c.branch === "vocational"
                  ? 6
                  : 4)
        )
      )
      assert.deepEqual(
        p.channels.map((ch) => ch.id),
        ["private"]
      )
    }
    const rows = read(
      `./admissions/2026-2027/${manifest.extractedRowsFile}`
    ).filter((r) => r.sector === "private")
    assert.deepEqual(
      new Set(
        data.programs.map((p) => `${p.sources[0].page}/${p.sources[0].row}`)
      ),
      new Set(rows.map((r) => `${r.page}/${r.row}`))
    )
  })

  test(`${c.key}: category year boundary and both certificate origins stay isolated from public admission`, () => {
    for (const origin of ["syrian", "non_syrian"])
      for (const year of [1995, 2010, c.maximum]) {
        const certificate =
          origin === "non_syrian"
            ? `non-syrian-${c.branch}`
            : c.branch === "scientific"
              ? "supported"
              : c.branch
        const v = values(c, { certificate, certificateYear: String(year) })
        const input = profile(c, { certificate, certificateYear: String(year) })
        assert.equal(certificateCatalogue(certificate, c.category, year), c.key)
        const results = evaluateAdmissions(data, input)
        assert.ok(results.some((r) => r.status !== "not_eligible"))
        assert.deepEqual(
          readAnswers(JSON.stringify({ version: 1, values: v })),
          v
        )
        for (const channel of ["general", "parallel", "arab_foreign"])
          assert.equal(
            filterResults(results, { ...initialFilters, channel }, []).length,
            0
          )
      }
    for (const changes of [
      { certificateYear: c.maximum + 1 },
      { certificateYear: 2027 },
      { certificateYear: 2024.5 },
      { certificateYear: 0 },
      { certificate: "invented" },
      {
        applicantCategory: c.foreign
          ? "syrian_or_equivalent"
          : "arab_and_foreign",
      },
      { branch: "sharia" },
    ])
      assert.ok(
        evaluateAdmissions(data, { ...profile(c), ...changes }).every(
          (r) => r.status === "not_eligible"
        )
      )
    assert.throws(
      () =>
        evaluateAdmissions(data, {
          ...profile(c),
          score: parseScore("1800", "total", 2400),
        }),
      RangeError
    )
  })

  test(`${c.key}: every minimum accepts its boundary and rejects a hundredth below; entrance tests survive`, () => {
    for (const p of data.programs) {
      const ch = p.channels[0]
      assert.notEqual(ch.minPercent, null)
      const allowed = ch.conditions.find(
        (r) => r.type === "vocational_specialty"
      )?.allowed[0]
      for (const offset of [-0.01, 0]) {
        const input = profile(c, {
          score: (ch.minPercent + offset).toFixed(2),
          ...(allowed ? { vocationalSpecialty: allowed } : {}),
          previousGeneralAdmission: "yes",
        })
        const r = evaluateAdmissions({ ...data, programs: [p] }, input)[0]
          .channels[0]
        assert.equal(
          r.findings.some((f) => f.type === "minimum"),
          offset < 0
        )
        if (offset === 0)
          assert.equal(
            r.status,
            ch.conditions.some((r) => r.type === "exam")
              ? "needs_confirmation"
              : "meets_requirements"
          )
      }
    }
    assert.equal(
      data.programs
        .flatMap((p) => p.channels[0].conditions)
        .filter((r) => r.type === "exam").length,
      c.branch === "scientific" ? 31 : c.branch === "literary" ? 8 : 7
    )
  })
}

test("Old/new routing changes only at the category's published boundary", () => {
  for (const branch of ["scientific", "literary", "vocational"])
    for (const certificate of [
      branch === "scientific" ? "supported" : branch,
      `non-syrian-${branch}`,
    ]) {
      assert.equal(
        certificateCatalogue(certificate, "syrian_or_equivalent", 2026),
        certificate === "supported" ? "scientific" : certificate
      )
      assert.equal(
        certificateCatalogue(certificate, "syrian_or_equivalent", 2025),
        `older-${branch}`
      )
      assert.equal(
        certificateCatalogue(certificate, "arab_and_foreign", 2025),
        `foreign-${branch}`
      )
      assert.equal(
        certificateCatalogue(certificate, "arab_and_foreign", 2024),
        `older-foreign-${branch}`
      )
    }
  assert.throws(
    () => certificateCatalogue("sharia", "syrian_or_equivalent", 2025),
    RangeError
  )
})

test("Older form uses official percentages and ignores hidden subject/prior-general inputs", () => {
  for (const c of configurations) {
    const input = profile(c, {
      math: "garbage",
      subjectMarks: { arabic: "invalid" },
      previousGeneralAdmission: "yes",
    })
    assert.deepEqual(input.subjects, {})
    assert.equal(input.previousGeneralAdmission, null)
    assert.equal(
      parseStudentForm(values(c, { mode: "total", score: "1800" })).input,
      null
    )
    for (const certificateYear of [
      "",
      "other",
      "20.24",
      "2027",
      "0000",
      "20245",
    ])
      assert.equal(parseStudentForm(values(c, { certificateYear })).input, null)
  }
  assert.equal(parseCertificateYear("٢٠٢٤"), 2024)
  assert.equal(parseCertificateYear("۲۰۱۹"), 2019)
  assert.equal(
    profile(configurations[0], { certificateYear: "٢٠٢٤", score: "٧٥٫٥" })
      .certificateYear,
    2024
  )
  assert.equal(
    parseStudentForm({
      ...initialValues,
      certificate: "sharia",
      certificateYear: "2025",
      applicantCategory: "syrian_or_equivalent",
      score: "80",
    }).input,
    null
  )
})

test("Older vocational choices still reject a wrong regular/dual or professional qualification", () => {
  for (const c of configurations.filter((c) => c.branch === "vocational")) {
    const data = catalogues[c.key]
    for (const p of data.programs) {
      const allowed = p.channels[0].conditions.find(
        (r) => r.type === "vocational_specialty"
      ).allowed
      const wrong = vocationalOptions.find((o) => !allowed.includes(o.id))
      if (wrong)
        assert.equal(
          evaluateAdmissions(
            { ...data, programs: [p] },
            profile(c, { score: "100", vocationalSpecialty: wrong.id })
          )[0].status,
          "not_eligible"
        )
    }
    assert.equal(
      parseStudentForm(values(c, { vocationalSpecialty: "" })).input,
      null
    )
    const architecture = profile(c)
    assert.ok(architecture.vocationalSpecialty)
  }
})

test("Older catalogue schema rejects altered categories, years, origins and non-private conditions", () => {
  for (const c of configurations) {
    const data = catalogues[c.key]
    for (const scope of [
      { certificateYearMaximum: c.maximum + 1 },
      { certificateYearMaximum: undefined },
      { certificateYears: [2024] },
      { certificate: "syrian" },
      { branch: "sharia" },
      {
        applicantCategory: c.foreign
          ? "syrian_or_equivalent"
          : "arab_and_foreign",
      },
    ])
      assert.throws(() =>
        validateAdmissionsData({ ...data, scope: { ...data.scope, ...scope } })
      )
    for (const id of ["general", "parallel", "arab_foreign"]) {
      const bad = structuredClone(data)
      bad.programs[0].channels[0].id = id
      assert.throws(() => validateAdmissionsData(bad))
    }
    for (const rule of [
      { type: "subject", subject: "math", minPercent: 60 },
      { type: "no_previous_general_admission" },
    ]) {
      const bad = structuredClone(data)
      bad.programs[0].channels[0].conditions.push(rule)
      assert.throws(() => validateAdmissionsData(bad))
    }
  }
})

test("Older favourites, localization and source-linked guidance cover all six routes", () => {
  const ids = Object.values(catalogues).flatMap((d) =>
    d.programs.map((p) => p.id)
  )
  assert.equal(ids.length, 2112)
  assert.equal(new Set(ids).size, 2112)
  assert.deepEqual(readFavourites(JSON.stringify(ids)), ids)
  assert.equal(faqItems.length, 34)
  assert.deepEqual(
    faqItems
      .find((q) => q.id === "olderPrivate")
      .sources.filter((r) => r.announcement === 7)
      .map((r) => r.page),
    [1, 2, 4, 5, 6, 7]
  )
  assert.ok(
    faqItems
      .find((q) => q.id === "olderPrivate")
      .sources.some((r) => r.announcement === 1 && r.page === 7)
  )
  for (const locale of ["en", "ar"]) {
    const m = read(`../messages/${locale}.json`).Admissions
    assert.ok(m.faq.items.olderPrivate.answer)
    for (const c of configurations) assert.ok(m.branches[c.key])
    for (const key of [
      "olderPrivateHint",
      "olderPrivateScoreHint",
      "shariaYearHint",
      "shariaYearError",
    ])
      assert.ok(m.form[key])
  }
})
