import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { readFileSync } from "node:fs"
import { isIP } from "node:net"
import { z } from "zod"
import {
  type CertificateOption,
  type ExamOption,
  type LookupContext,
  ministryHeaders,
  ministryOrigin,
  resultsRequestSchema,
  resultUrl,
} from "./contracts.ts"
import { decodeBase64, decodeMarks } from "./decoder.ts"
import { ResultsStore } from "./store.ts"

type Config = {
  origin: string
  siteKey: string
  turnstileSecret: string
  signingKey: Buffer
  decoderKey: Buffer
  storePath: string
  trustProxy: boolean
  metadataPath?: string
}
class LookupError extends Error {
  readonly code: string
  readonly status: number
  constructor(code: string, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}
function configuration(): Config {
  const origin = new URL(process.env.EXAM_RESULTS_SITE_ORIGIN ?? "")
  const signingKey = decodeBase64(process.env.EXAM_RESULTS_SIGNING_KEY ?? "")
  const decoderKey = decodeBase64(process.env.EXAM_RESULTS_DECODER_KEY ?? "")
  const siteKey = process.env.EXAM_RESULTS_TURNSTILE_SITE_KEY ?? ""
  const turnstileSecret = process.env.EXAM_RESULTS_TURNSTILE_SECRET ?? ""
  const storePath = process.env.EXAM_RESULTS_STORE_PATH ?? ""
  if (
    process.env.EXAM_RESULTS_ENABLED !== "true" ||
    signingKey.length !== 32 ||
    decoderKey.length !== 32 ||
    !siteKey ||
    !turnstileSecret ||
    !storePath ||
    (origin.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(origin.hostname))
  )
    throw new LookupError("unavailable", 503)
  return {
    origin: origin.origin,
    signingKey,
    decoderKey,
    siteKey,
    turnstileSecret,
    storePath,
    trustProxy: process.env.EXAM_RESULTS_TRUST_PROXY === "true",
    metadataPath: process.env.EXAM_RESULTS_METADATA_PATH || undefined,
  }
}

export async function boundedJson(
  response: Request | Response,
  maximum: number
): Promise<unknown> {
  if (
    Number(response.headers.get("content-length") ?? 0) > maximum ||
    !response.body
  )
    throw new LookupError("invalid", 400)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      (async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.length
          if (size > maximum) throw new LookupError("invalid", 400)
          chunks.push(value)
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new LookupError("invalid", 400)),
          10_000
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
    await reader.cancel().catch(() => {})
  }
}

const optionSchema = z.object({
  id: z.number().int().positive().max(1_000_000),
  name: z.string().min(1).max(200),
})
const directoratesSchema = z.object({
  success: z.literal(true),
  data: z.array(optionSchema).min(1).max(30),
})
const certificatesSchema = z.object({
  success: z.literal(true),
  data: z.array(optionSchema.extend({ rc_id: z.number().int() })).max(100),
})

const metadataSnapshotSchema = z
  .object({
    academicYearId: z.literal(5),
    examYear: z.literal(2026),
    fetchedAt: z.iso.datetime(),
    directorates: directoratesSchema,
    certificates: z.record(
      z.string().regex(/^[1-9][0-9]*$/),
      certificatesSchema
    ),
  })
  .strict()

export class ResultsService {
  private config: Config
  private store: ResultsStore
  private fetcher: typeof fetch
  private snapshot?: z.infer<typeof metadataSnapshotSchema>
  constructor(
    config: Config,
    store: ResultsStore,
    fetcher: typeof fetch = fetch
  ) {
    this.config = config
    this.store = store
    this.fetcher = fetcher
    if (config.metadataPath) {
      this.snapshot = metadataSnapshotSchema.parse(
        JSON.parse(readFileSync(config.metadataPath, "utf8"))
      )
      const ids = this.snapshot.directorates.data.map((value) =>
        String(value.id)
      )
      if (
        new Set(ids).size !== ids.length ||
        Object.keys(this.snapshot.certificates).length !== ids.length ||
        ids.some((id) => !this.snapshot?.certificates[id])
      )
        throw new LookupError("unavailable", 503)
    }
  }
  private hash(value: string) {
    return createHmac("sha256", this.config.signingKey)
      .update(value)
      .digest("hex")
  }
  private equals(a: string, b: string) {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
  }
  private contextHash(context: LookupContext) {
    return this.hash(`context:${JSON.stringify(context)}`)
  }
  private sessionCookie() {
    return this.config.origin.startsWith("https:")
      ? "__Host-exam-session"
      : "exam-session"
  }
  private readSession(request: Request) {
    const cookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${this.sessionCookie()}=`))
      ?.slice(this.sessionCookie().length + 1)
    if (!cookie || !/^[a-f0-9]{64}\.[0-9]{13}\.[a-f0-9]{64}$/.test(cookie))
      return null
    const [id, expiry, signature] = cookie.split(".")
    if (
      Number(expiry) <= Date.now() ||
      Number(expiry) > Date.now() + 7_200_000 ||
      !this.equals(this.hash(`session:${id}.${expiry}`), signature)
    )
      return null
    return cookie
  }
  private sessionId(session: string) {
    return this.hash(`sid:${session.split(".")[0]}`)
  }
  private challenge(session: string) {
    return this.hash(`challenge:${session}`)
  }
  private async metadata(path: string) {
    // Some provider networks reject data-centre connections. Operators may
    // supply a validated public metadata snapshot for this fixed exam year.
    // The browser still fetches every individual result directly.
    if (this.snapshot) {
      if (path === "/directorateResultsNew/5") return this.snapshot.directorates
      const id = /^\/directorateCertificates\/([1-9][0-9]*)\/5$/.exec(path)?.[1]
      if (id && this.snapshot.certificates[id])
        return this.snapshot.certificates[id]
      throw new LookupError("invalid", 400)
    }
    const cached = this.store.cached(path)
    if (cached) return cached
    if (!this.store.take([{ key: "metadata:global", limit: 45, seconds: 60 }]))
      throw new LookupError("limited", 429)
    const response = await this.fetcher(`${ministryOrigin}${path}`, {
      headers: ministryHeaders,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    if (response.status === 429) throw new LookupError("limited", 429)
    if (!response.ok) throw new LookupError("unavailable", 503)
    let body: unknown
    try {
      body = await boundedJson(response, 48_000)
      // Validate before storing; metadata contains no individual results.
      if (path.startsWith("/directorateResultsNew/"))
        directoratesSchema.parse(body)
      else certificatesSchema.parse(body)
    } catch {
      // A malformed provider response is not an error in the student's input.
      throw new LookupError("unavailable", 503)
    }
    this.store.cache(path, body)
    return body
  }
  private async directorates(): Promise<ExamOption[]> {
    return directoratesSchema.parse(
      await this.metadata("/directorateResultsNew/5")
    ).data
  }
  private async certificates(
    directorateId: number
  ): Promise<CertificateOption[]> {
    if (
      !(await this.directorates()).some((value) => value.id === directorateId)
    )
      throw new LookupError("invalid", 400)
    return certificatesSchema
      .parse(await this.metadata(`/directorateCertificates/${directorateId}/5`))
      .data.flatMap((value) => {
        const branch = [3, 20].includes(value.rc_id)
          ? "scientific"
          : [4, 21].includes(value.rc_id)
            ? "literary"
            : null
        return branch ? [{ id: value.id, name: value.name, branch }] : []
      })
  }
  private async verifyChallenge(token: string, ip: string, session: string) {
    const response = await this.fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          secret: this.config.turnstileSecret,
          response: token,
          remoteip: ip,
        }),
      }
    )
    if (!response.ok) throw new LookupError("challenge", 403)
    const result = z
      .object({
        success: z.literal(true),
        hostname: z.string(),
        action: z.literal("admissions_lookup"),
        cdata: z.string(),
        challenge_ts: z.string(),
      })
      .safeParse(await boundedJson(response, 8000))
    if (
      !result.success ||
      result.data.hostname !== new URL(this.config.origin).hostname ||
      !this.equals(result.data.cdata, this.challenge(session))
    )
      throw new LookupError("challenge", 403)
    const age = Date.now() - Date.parse(result.data.challenge_ts)
    if (!Number.isFinite(age) || age < -10_000 || age > 300_000)
      throw new LookupError("challenge", 403)
  }
  async handle(request: Request): Promise<Response> {
    const headers = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    })
    try {
      if (
        request.method !== "POST" ||
        request.headers.get("origin") !== this.config.origin ||
        (request.headers.get("sec-fetch-site") &&
          request.headers.get("sec-fetch-site") !== "same-origin") ||
        request.headers.get("content-type")?.split(";")[0] !==
          "application/json" ||
        request.headers.get("content-encoding")
      )
        throw new LookupError("invalid", 403)
      const ip = this.config.trustProxy
        ? (request.headers.get("cf-connecting-ip") ?? "")
        : new URL(this.config.origin).hostname === "localhost" ||
            new URL(this.config.origin).hostname === "127.0.0.1"
          ? "127.0.0.1"
          : ""
      if (!isIP(ip)) throw new LookupError("unavailable", 503)
      const ipHash = this.hash(`ip:${ip}`)
      if (
        !this.store.take([
          { key: "request:global", limit: 1200, seconds: 60 },
          { key: `request:${ipHash}`, limit: 90, seconds: 60 },
        ])
      )
        throw new LookupError("limited", 429)
      const body = resultsRequestSchema.safeParse(
        await boundedJson(request, 40_000)
      )
      if (!body.success) throw new LookupError("invalid", 400)
      const input = body.data
      let session = this.readSession(request)
      if (input.action === "session") {
        if (
          !this.store.take([
            { key: `session:${ipHash}`, limit: 15, seconds: 60 },
          ])
        )
          throw new LookupError("limited", 429)
        if (!session) {
          const value = `${randomBytes(32).toString("hex")}.${Date.now() + 7_190_000}`
          session = `${value}.${this.hash(`session:${value}`)}`
          headers.set(
            "Set-Cookie",
            `${this.sessionCookie()}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7190${this.config.origin.startsWith("https:") ? "; Secure" : ""}`
          )
        }
        return Response.json(
          {
            siteKey: this.config.siteKey,
            csrf: this.hash(`csrf:${session}`),
            challenge: this.challenge(session),
            directorates: await this.directorates(),
          },
          { headers }
        )
      }
      if (
        !session ||
        !this.equals(
          request.headers.get("x-exam-csrf") ?? "",
          this.hash(`csrf:${session}`)
        )
      )
        throw new LookupError("session", 403)
      const sid = this.sessionId(session)
      if (!this.store.take([{ key: `request:${sid}`, limit: 60, seconds: 60 }]))
        throw new LookupError("limited", 429)
      if (input.action === "certificates")
        return Response.json(
          { certificates: await this.certificates(input.directorateId) },
          { headers }
        )
      const action = input.action
      if (
        !this.store.take([
          { key: `${action}:global`, limit: 1200, seconds: 900 },
          { key: `${action}:daily`, limit: 20_000, seconds: 86400 },
          { key: `${action}:${ipHash}`, limit: 30, seconds: 900 },
          { key: `${action}:${sid}`, limit: 6, seconds: 900 },
        ])
      )
        throw new LookupError("limited", 429)
      if (input.action === "ticket") {
        const certificate = (
          await this.certificates(input.context.directorateId)
        ).find(
          (value) =>
            value.id === input.context.certificateId &&
            value.branch === input.context.branch
        )
        if (!certificate) throw new LookupError("invalid", 400)
        await this.verifyChallenge(input.turnstileToken, ip, session)
        const ticket = randomBytes(32).toString("hex")
        this.store.issue(
          this.hash(`ticket:${ticket}`),
          sid,
          this.contextHash(input.context),
          certificate.name
        )
        return Response.json(
          { ticket, url: resultUrl(input.context), expiresIn: 120 },
          { headers }
        )
      }
      const certificate = this.store.consume(
        this.hash(`ticket:${input.ticket}`),
        sid,
        this.contextHash(input.context)
      )
      if (!certificate) throw new LookupError("session", 403)
      try {
        return Response.json(
          {
            marks: decodeMarks(
              input.envelope,
              this.config.decoderKey,
              input.context,
              certificate
            ),
          },
          { headers }
        )
      } catch {
        throw new LookupError("result", 400)
      }
    } catch (error) {
      const failure =
        error instanceof LookupError
          ? error
          : new LookupError("unavailable", 503)
      if (failure.status === 429) headers.set("Retry-After", "900")
      // Never log request bodies, student numbers, ciphertext, upstream data or secrets.
      return Response.json(
        { error: failure.code },
        { status: failure.status, headers }
      )
    }
  }
}

let service: ResultsService | undefined
export async function handleResultsRequest(request: Request) {
  try {
    if (!service) {
      const config = configuration()
      service = new ResultsService(config, new ResultsStore(config.storePath))
    }
    return await service.handle(request)
  } catch {
    return Response.json(
      { error: "unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      }
    )
  }
}
