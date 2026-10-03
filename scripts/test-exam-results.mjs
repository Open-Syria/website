import assert from "node:assert/strict"
import { createCipheriv, randomBytes } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { readAnswers } from "../src/app/[locale]/admissions/_utils/answers.ts"
import { evaluateAdmissions } from "../src/app/[locale]/admissions/_utils/eligibility.ts"
import {
  initialValues,
  parseStudentForm,
} from "../src/app/[locale]/admissions/_utils/form.ts"
import { applyImportedMarks } from "../src/app/[locale]/admissions/_utils/imported-marks.ts"
import { validateAdmissionsData } from "../src/app/[locale]/admissions/_utils/schema.ts"
import { decodeMarks } from "../src/lib/exam-results/decoder.ts"
import { boundedJson, ResultsService } from "../src/lib/exam-results/service.ts"
import { ResultsStore } from "../src/lib/exam-results/store.ts"

const context = {
  studentNumber: "111111",
  directorateId: 1,
  certificateId: 313,
  examYear: 2026,
  branch: "scientific",
}
const certificate = "الثانوي - علمي - منهاج إدلب"
const key = randomBytes(32)
function fixture() {
  const rows = [
    ["اللغة العربية", 350, 400],
    ["اللغة الإنكليزية", 270, 300],
    ["لغة فرنسية", 100, 300, true],
    ["الرياضيات", 599, 600],
    ["الفيزياء", 360, 400],
    ["الكيمياء", 170, 200],
    ["علم الأحياء", 260, 300],
    ["التربية الدينية", 180, 200],
  ]
  return {
    result: "ناجح",
    total: rows.reduce((sum, row) => sum + (row[3] ? 0 : row[1]), 0),
    max_total: 2400,
    student_info: {
      subscription_number: 111111,
      certificate_name: certificate,
      student_name: "SYNTHETIC PRIVATE NAME",
      student_mother_name: "SYNTHETIC MOTHER",
      center_name: "SYNTHETIC CENTER",
    },
    subject_info: rows.map(
      ([subject_name, exam_mark, max_mark, excluded = false]) => ({
        subject_name,
        exam_mark,
        max_mark,
        excluded_from_total: excluded,
      })
    ),
  }
}
function encrypt(value) {
  const iv = randomBytes(16)
  const cipher = createCipheriv("aes-256-cbc", key, iv)
  return {
    iv: iv.toString("base64"),
    data: Buffer.concat([
      cipher.update(JSON.stringify(value)),
      cipher.final(),
    ]).toString("base64"),
  }
}
test("decoder returns only marks, retains excluded subject and exact foreign-language scores", () => {
  const marks = decodeMarks(encrypt(fixture()), key, context, certificate)
  assert.deepEqual(marks.total, { earned: 218900, maximum: 240000 })
  assert.deepEqual(marks.subjects.foreign_language, {
    earned: 27000,
    maximum: 30000,
  })
  assert.deepEqual(marks.subjects.french, { earned: 10000, maximum: 30000 })
  assert.equal(JSON.stringify(marks).includes("SYNTHETIC"), false)
  assert.equal(JSON.stringify(marks).includes(context.studentNumber), false)
})
test("decoder rejects mismatched identity, branch, totals, unknown/duplicate subjects and failing results", () => {
  const variants = [
    (value) => {
      value.student_info.subscription_number++
    },
    (value) => {
      value.student_info.certificate_name = "different"
    },
    (value) => {
      value.total++
    },
    (value) => {
      value.max_total = 2200
    },
    (value) => {
      value.subject_info[0].subject_name = "unknown"
    },
    (value) => {
      value.subject_info[1].subject_name = value.subject_info[0].subject_name
    },
    (value) => {
      value.subject_info[0].exam_mark = 1000
    },
    (value) => {
      value.result = "راسب"
    },
    (value) => {
      value.subject_info[2].excluded_from_total = false
    },
  ]
  for (const mutate of variants) {
    const value = fixture()
    mutate(value)
    assert.throws(() => decodeMarks(encrypt(value), key, context, certificate))
  }
  assert.throws(() =>
    decodeMarks(
      { iv: "!".repeat(24), data: "a".repeat(32) },
      key,
      context,
      certificate
    )
  )
  assert.throws(() =>
    decodeMarks(encrypt(fixture()), randomBytes(32), context, certificate)
  )
})
test("imported scores retain fractions across submission and tab restore; edits and certificate changes take precedence", () => {
  const marks = decodeMarks(encrypt(fixture()), key, context, certificate)
  const values = applyImportedMarks(
    { ...initialValues, applicantCategory: "syrian_or_equivalent" },
    marks
  )
  assert.equal(values.math, "99.83")
  assert.deepEqual(parseStudentForm(values).input.subjects.math, {
    earned: 59900,
    maximum: 60000,
  })
  assert.deepEqual(parseStudentForm(values).input.subjects.french, {
    earned: 10000,
    maximum: 30000,
  })
  const restored = readAnswers(JSON.stringify({ version: 2, values }))
  assert.deepEqual(parseStudentForm(restored).input.subjects.math, {
    earned: 59900,
    maximum: 60000,
  })
  const catalog = validateAdmissionsData(
    JSON.parse(
      readFileSync(
        new URL(
          "../src/app/[locale]/admissions/_data/2026-2027/scientific.json",
          import.meta.url
        ),
        "utf8"
      )
    )
  )
  const results = evaluateAdmissions(catalog, parseStudentForm(restored).input)
  assert.ok(results.length > 0, "imported marks reach real admissions results")
  assert.deepEqual(
    parseStudentForm({ ...values, math: "50" }).input.subjects.math,
    { earned: 5000, maximum: 10000 }
  )
  assert.deepEqual(
    parseStudentForm({ ...values, certificate: "literary", score: "2000" })
      .input.subjects.math,
    { earned: 9983, maximum: 10000 }
  )
})
test("shared store consumes once across slots, rejects wrong session/context and expires tickets", () => {
  const directory = mkdtempSync(join(tmpdir(), "exam-store-"))
  const one = new ResultsStore(join(directory, "limits.sqlite"))
  const two = new ResultsStore(join(directory, "limits.sqlite"))
  try {
    one.issue("ticket", "session", "context", "certificate", 100)
    assert.equal(two.consume("ticket", "wrong", "context", 200), null)
    assert.equal(two.consume("ticket", "session", "wrong", 200), null)
    assert.equal(
      two.consume("ticket", "session", "context", 200),
      "certificate"
    )
    assert.equal(one.consume("ticket", "session", "context", 200), null)
    one.issue("expired", "session", "context", "certificate", 100)
    assert.equal(two.consume("expired", "session", "context", 120100), null)
    assert.equal(one.take([{ key: "ip", limit: 1, seconds: 60 }], 100), true)
    assert.equal(two.take([{ key: "ip", limit: 1, seconds: 60 }], 101), false)
    assert.equal(two.take([{ key: "ip", limit: 1, seconds: 60 }], 60100), true)
  } finally {
    one.close()
    two.close()
    rmSync(directory, { recursive: true, force: true })
  }
})
function setup(overrides = {}) {
  const store = new ResultsStore(":memory:")
  const config = {
    origin: "https://site.example",
    siteKey: "test-site",
    turnstileSecret: "test-secret",
    signingKey: randomBytes(32),
    decoderKey: key,
    storePath: ":memory:",
    trustProxy: true,
  }
  let challenge = ""
  let calls = 0
  const service = new ResultsService(config, store, async (url) => {
    if (String(url).includes("siteverify")) {
      calls++
      return Response.json({
        success: true,
        hostname: "site.example",
        action: "admissions_lookup",
        cdata: challenge,
        challenge_ts: new Date().toISOString(),
        ...overrides,
      })
    }
    return Response.json({
      success: true,
      data: String(url).includes("directorateResultsNew")
        ? [{ id: 1, name: "ادلب" }]
        : [{ id: 313, name: certificate, rc_id: 3 }],
    })
  })
  function request(body, options = {}) {
    return new Request("https://site.example/api/admissions/results", {
      method: "POST",
      headers: {
        origin: config.origin,
        "content-type": "application/json",
        "cf-connecting-ip": "192.0.2.10",
        "sec-fetch-site": "same-origin",
        ...options,
      },
      body: JSON.stringify(body),
    })
  }
  async function session() {
    const response = await service.handle(request({ action: "session" }))
    assert.equal(response.status, 200)
    assert.match(response.headers.get("cache-control"), /no-store/)
    const data = await response.json()
    challenge = data.challenge
    return {
      cookie: response.headers.get("set-cookie").split(";")[0],
      "x-exam-csrf": data.csrf,
    }
  }
  return { config, store, service, request, session, calls: () => calls }
}

test("private public-metadata snapshots avoid upstream fetches and reject incomplete or wrong-year lists", async () => {
  const s = setup()
  const directory = mkdtempSync(join(tmpdir(), "exam-metadata-"))
  const metadataPath = join(directory, "metadata.json")
  const snapshot = {
    academicYearId: 5,
    examYear: 2026,
    fetchedAt: new Date().toISOString(),
    directorates: { success: true, data: [{ id: 1, name: "Test" }] },
    certificates: {
      1: { success: true, data: [{ id: 313, name: certificate, rc_id: 3 }] },
    },
  }
  const create = () =>
    new ResultsService({ ...s.config, metadataPath }, s.store, async () => {
      throw new Error("Upstream must not be called")
    })
  try {
    writeFileSync(metadataPath, JSON.stringify(snapshot))
    const service = create()
    const response = await service.handle(s.request({ action: "session" }))
    assert.equal(response.status, 200)
    const session = await response.json()
    const headers = {
      cookie: response.headers.get("set-cookie").split(";")[0],
      "x-exam-csrf": session.csrf,
    }
    const options = await service.handle(
      s.request({ action: "certificates", directorateId: 1 }, headers)
    )
    assert.deepEqual((await options.json()).certificates, [
      { id: 313, name: certificate, branch: "scientific" },
    ])
    assert.equal(
      (
        await service.handle(
          s.request({ action: "certificates", directorateId: 2 }, headers)
        )
      ).status,
      400
    )
    for (const invalid of [
      { ...snapshot, examYear: 2025 },
      { ...snapshot, certificates: {} },
      {
        ...snapshot,
        directorates: {
          success: true,
          data: [
            { id: 1, name: "Test" },
            { id: 1, name: "Duplicate" },
          ],
        },
      },
    ]) {
      writeFileSync(metadataPath, JSON.stringify(invalid))
      assert.throws(create)
    }
  } finally {
    s.store.close()
    rmSync(directory, { recursive: true, force: true })
  }
})
test("lookup requires origin, trusted client address, session, CSRF and validated Turnstile", async () => {
  const s = setup()
  try {
    assert.equal(
      (
        await s.service.handle(
          s.request({ action: "session" }, { origin: "https://evil.example" })
        )
      ).status,
      403
    )
    assert.equal(
      (
        await s.service.handle(
          s.request({ action: "session" }, { "cf-connecting-ip": "" })
        )
      ).status,
      503
    )
    const headers = await s.session()
    assert.equal(
      (
        await s.service.handle(
          s.request({ action: "ticket", context, turnstileToken: "test" })
        )
      ).status,
      403
    )
    assert.equal(
      (
        await s.service.handle(
          s.request(
            { action: "ticket", context, turnstileToken: "test" },
            { ...headers, "x-exam-csrf": "bad" }
          )
        )
      ).status,
      403
    )
    const ticket = await s.service.handle(
      s.request({ action: "ticket", context, turnstileToken: "test" }, headers)
    )
    assert.equal(ticket.status, 200)
    assert.equal(s.calls(), 1)
    const issued = await ticket.json()
    const decode = {
      action: "decode",
      context,
      ticket: issued.ticket,
      envelope: encrypt(fixture()),
    }
    const response = await s.service.handle(s.request(decode, headers))
    assert.equal(response.status, 200)
    assert.ok((await response.json()).marks)
    assert.equal(
      (await s.service.handle(s.request(decode, headers))).status,
      403
    )
  } finally {
    s.store.close()
  }
})
test("Turnstile hostname, action, binding, age and failed tokens are enforced", async () => {
  for (const overrides of [
    { hostname: "evil.example" },
    { action: "wrong" },
    { cdata: "wrong" },
    { challenge_ts: "invalid" },
    { challenge_ts: new Date(Date.now() - 301000).toISOString() },
    { success: false },
  ]) {
    const s = setup(overrides)
    try {
      const headers = await s.session()
      assert.equal(
        (
          await s.service.handle(
            s.request(
              { action: "ticket", context, turnstileToken: "test" },
              headers
            )
          )
        ).status,
        403
      )
    } finally {
      s.store.close()
    }
  }
})
test("invalid ciphertext consumes its ticket and produces the same generic result error", async () => {
  const s = setup()
  try {
    const headers = await s.session()
    const issued = await (
      await s.service.handle(
        s.request(
          { action: "ticket", context, turnstileToken: "test" },
          headers
        )
      )
    ).json()
    const envelope = encrypt(fixture())
    envelope.data = Buffer.alloc(32).toString("base64")
    const response = await s.service.handle(
      s.request(
        { action: "decode", context, ticket: issued.ticket, envelope },
        headers
      )
    )
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "result" })
    assert.equal(
      (
        await s.service.handle(
          s.request(
            {
              action: "decode",
              context,
              ticket: issued.ticket,
              envelope: encrypt(fixture()),
            },
            headers
          )
        )
      ).status,
      403
    )
  } finally {
    s.store.close()
  }
})
test("per-session limits reject before additional challenge validation", async () => {
  const s = setup()
  try {
    const headers = await s.session()
    for (let n = 0; n < 6; n++)
      assert.equal(
        (
          await s.service.handle(
            s.request(
              { action: "ticket", context, turnstileToken: "test" },
              headers
            )
          )
        ).status,
        200
      )
    const limited = await s.service.handle(
      s.request({ action: "ticket", context, turnstileToken: "test" }, headers)
    )
    assert.equal(limited.status, 429)
    assert.equal(s.calls(), 6)
    assert.ok(limited.headers.get("retry-after"))
  } finally {
    s.store.close()
  }
})
test("request body limits apply without a content-length header", async () => {
  await assert.rejects(() =>
    boundedJson(new Response(`"${"a".repeat(100)}"`), 50)
  )
})
