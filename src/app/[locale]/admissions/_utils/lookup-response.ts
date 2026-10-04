import { encryptedEnvelopeSchema } from "../../../../lib/exam-results/contracts.ts"

const errorCodes = [
  "unavailable",
  "limited",
  "challenge",
  "session",
  "result",
  "invalid",
  "studentNumber",
  "ministry",
  "noCertificates",
  "timeout",
] as const
export type LookupErrorCode = (typeof errorCodes)[number]

export class LookupError extends Error {
  readonly code: LookupErrorCode

  constructor(code: LookupErrorCode) {
    super(code)
    this.code = code
  }
}

export function lookupErrorCode(reason: unknown): LookupErrorCode {
  if (reason instanceof LookupError) return reason.code
  if (reason instanceof Error && reason.name === "TimeoutError")
    return "timeout"
  return "unavailable"
}

async function readJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error("Empty response")
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 40_000) throw new Error("Response too large")
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

export async function readLookupResponse(
  response: Response,
  source: "app" | "ministry" = "app"
): Promise<Record<string, unknown>> {
  // Preserve HTTP failures even when a proxy returns HTML or an empty body.
  const fallback: LookupErrorCode =
    response.status === 429
      ? "limited"
      : [408, 504].includes(response.status)
        ? "timeout"
        : source === "ministry"
          ? "ministry"
          : "unavailable"
  let value: unknown
  try {
    value = await readJson(response)
  } catch (reason) {
    throw new LookupError(
      lookupErrorCode(reason) === "timeout" ? "timeout" : fallback
    )
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new LookupError(fallback)
  const body = value as Record<string, unknown>
  if (source === "app") {
    if (!response.ok || typeof body.error === "string") {
      const code = errorCodes.find((code) => code === body.error)
      throw new LookupError(code ?? fallback)
    }
    return body
  }

  // Ministry application codes are a different contract from our API errors.
  // In particular, 419 means an incorrect student number, not an expired session.
  if (body.success === false) {
    if (body.code === 419 || body.code === "419")
      throw new LookupError("studentNumber")
    if (body.code === 429 || body.code === "429")
      throw new LookupError("limited")
    throw new LookupError(fallback)
  }
  if (!response.ok || body.success !== true) throw new LookupError(fallback)
  if (
    !encryptedEnvelopeSchema.safeParse({ iv: body.iv, data: body.data }).success
  )
    throw new LookupError("ministry")
  return body
}
