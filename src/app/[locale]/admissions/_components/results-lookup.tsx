"use client"

import { DownloadIcon } from "lucide-react"
import Script from "next/script"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  type CertificateOption,
  type ExamOption,
  type ImportedMarks,
  importedMarksSchema,
  ministryHeaders,
} from "@/lib/exam-results/contracts"
import {
  LookupError,
  type LookupErrorCode,
  lookupErrorCode,
  readLookupResponse,
} from "../_utils/lookup-response"
import { normaliseDigits } from "../_utils/score"
import { AdmissionsSelect } from "./admissions-select"

type Session = {
  csrf: string
  siteKey: string
  challenge: string
  directorates: ExamOption[]
}
type Turnstile = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      action: string
      cData: string
      size: "compact" | "flexible"
      appearance: "interaction-only"
      language: string
      callback: (token: string) => void
      "expired-callback": () => void
      "error-callback": () => void
    }
  ) => string
  remove: (id: string) => void
  reset: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

export function ResultsLookup({
  branch,
  onImport,
}: {
  branch: "scientific" | "literary"
  onImport: (marks: ImportedMarks) => void
}) {
  const t = useTranslations("Admissions.lookup")
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [directorate, setDirectorate] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<CertificateOption[]>([])
  const [certificate, setCertificate] = useState<string | null>(null)
  const [studentNumber, setStudentNumber] = useState("")
  const [token, setToken] = useState("")
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<LookupErrorCode | "">("")
  const [imported, setImported] = useState(false)
  const challengeRef = useRef<HTMLDivElement>(null)
  const widget = useRef<string | undefined>(undefined)
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  async function api(body: unknown, csrf?: string, signal?: AbortSignal) {
    return readLookupResponse(
      await fetch("/api/admissions/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-exam-csrf": csrf } : {}),
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(body),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
          : AbortSignal.timeout(20_000),
      })
    )
  }
  function failure(reason: unknown) {
    setError(lookupErrorCode(reason))
  }
  function cancel() {
    generation.current++
    controller.current?.abort()
    controller.current = null
    setBusy(false)
  }
  async function changeOpen(next: boolean) {
    cancel()
    setOpen(next)
    setError("")
    setToken("")
    setStudentNumber("")
    setSession(null)
    setDirectorate(null)
    setCertificate(null)
    setCertificates([])
    if (!next) return
    setBusy(true)
    const current = generation.current
    const abort = new AbortController()
    controller.current = abort
    try {
      const result = await api({ action: "session" }, undefined, abort.signal)
      if (current === generation.current) setSession(result as Session)
    } catch (reason) {
      if (current === generation.current) failure(reason)
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }
  useEffect(() => {
    if (
      !open ||
      !session ||
      !ready ||
      !challengeRef.current ||
      !window.turnstile
    )
      return
    const container = challengeRef.current
    const turnstile = window.turnstile
    const { siteKey, challenge } = session
    let size: "compact" | "flexible" | undefined
    function render() {
      const nextSize = container.clientWidth < 300 ? "compact" : "flexible"
      if (size === nextSize) return
      size = nextSize
      if (widget.current) turnstile.remove(widget.current)
      setToken("")
      widget.current = turnstile.render(container, {
        sitekey: siteKey,
        action: "admissions_lookup",
        cData: challenge,
        size,
        appearance: "interaction-only",
        language: locale,
        callback: (nextToken) => {
          setToken(nextToken)
          setError((current) => (current === "challenge" ? "" : current))
        },
        "expired-callback": () => setToken(""),
        "error-callback": () => {
          setToken("")
          setError("challenge")
        },
      })
    }
    render()
    const observer = new ResizeObserver(render)
    observer.observe(container)
    return () => {
      observer.disconnect()
      if (widget.current) turnstile.remove(widget.current)
      widget.current = undefined
    }
  }, [open, session, ready, locale])
  useEffect(
    () => () => {
      generation.current++
      controller.current?.abort()
    },
    []
  )
  async function selectDirectorate(id: string) {
    cancel()
    setDirectorate(id)
    setCertificate(null)
    setCertificates([])
    setError("")
    if (!session) return
    setBusy(true)
    const current = generation.current
    const abort = new AbortController()
    controller.current = abort
    try {
      const result = await api(
        { action: "certificates", directorateId: Number(id) },
        session.csrf,
        abort.signal
      )
      if (current !== generation.current) return
      const options = (result.certificates as CertificateOption[]).filter(
        (value) => value.branch === branch
      )
      setCertificates(options)
      if (options.length === 1) setCertificate(String(options[0].id))
      if (!options.length) setError("noCertificates")
    } catch (reason) {
      if (current === generation.current) failure(reason)
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }
  async function lookup() {
    if (!session || !directorate || !certificate || !token || busy) return
    const number = normaliseDigits(studentNumber)
    if (!/^\d{1,12}$/.test(number)) {
      setError("invalid")
      return
    }
    const current = ++generation.current
    const abort = new AbortController()
    controller.current = abort
    setBusy(true)
    setError("")
    setToken("")
    const context = {
      studentNumber: number,
      directorateId: Number(directorate),
      certificateId: Number(certificate),
      examYear: 2026,
      branch,
    }
    try {
      const issued = await api(
        { action: "ticket", context, turnstileToken: token },
        session.csrf,
        abort.signal
      )
      const upstream = await readLookupResponse(
        await fetch(String(issued.url), {
          headers: ministryHeaders,
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
          referrerPolicy: "no-referrer",
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15_000)]),
        }),
        "ministry"
      )
      const result = await api(
        {
          action: "decode",
          ticket: issued.ticket,
          context,
          envelope: { iv: upstream.iv, data: upstream.data },
        },
        session.csrf,
        abort.signal
      )
      const parsed = importedMarksSchema.safeParse(result.marks)
      if (!parsed.success) throw new LookupError("result")
      if (current !== generation.current) return
      onImport(parsed.data)
      setImported(true)
      await changeOpen(false)
    } catch (reason) {
      if (current === generation.current) failure(reason)
    } finally {
      if (current === generation.current) {
        setBusy(false)
        if (widget.current) window.turnstile?.reset(widget.current)
      }
    }
  }
  return (
    <Field>
      <Dialog open={open} onOpenChange={(next) => void changeOpen(next)}>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 w-full whitespace-normal"
            />
          }
        >
          <DownloadIcon data-icon="inline-start" aria-hidden="true" />
          {t("open")}
        </DialogTrigger>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto px-1" aria-busy={busy}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="exam-directorate">
                  {t("directorate")}
                </FieldLabel>
                <AdmissionsSelect
                  id="exam-directorate"
                  disabled={busy || !session}
                  value={directorate}
                  onValueChange={(id) => void selectDirectorate(id)}
                  placeholder={t("choose")}
                  items={(session?.directorates ?? []).map((value) => ({
                    value: String(value.id),
                    label: value.name,
                  }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="exam-certificate">
                  {t("certificate")}
                </FieldLabel>
                <AdmissionsSelect
                  id="exam-certificate"
                  disabled={busy || !certificates.length}
                  value={certificate}
                  onValueChange={(next) => {
                    setCertificate(next)
                    setError((current) =>
                      current === "studentNumber" || current === "invalid"
                        ? ""
                        : current
                    )
                  }}
                  placeholder={t("choose")}
                  items={certificates.map((value) => ({
                    value: String(value.id),
                    label: value.name,
                  }))}
                />
              </Field>
              <Field
                data-invalid={error === "invalid" || error === "studentNumber"}
              >
                <FieldLabel htmlFor="exam-number">{t("number")}</FieldLabel>
                <Input
                  id="exam-number"
                  disabled={busy}
                  value={studentNumber}
                  onChange={(event) => {
                    setStudentNumber(event.target.value)
                    setError((current) =>
                      current === "studentNumber" || current === "invalid"
                        ? ""
                        : current
                    )
                  }}
                  inputMode="numeric"
                  dir="ltr"
                  autoComplete="off"
                  maxLength={12}
                  aria-invalid={
                    error === "invalid" || error === "studentNumber"
                  }
                  aria-describedby={error ? "exam-lookup-error" : undefined}
                />
              </Field>
              {session ? (
                <>
                  <Script
                    id="exam-turnstile"
                    src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                    onReady={() => setReady(true)}
                    onError={() => setError("challenge")}
                  />
                  <div
                    ref={challengeRef}
                    className="flex w-full min-w-0 justify-center"
                  />
                </>
              ) : null}
              {error ? (
                <Alert id="exam-lookup-error" variant="destructive">
                  <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
                </Alert>
              ) : null}
              {busy ? (
                <p role="status" className="text-muted-foreground text-sm">
                  {t("loading")}
                </p>
              ) : null}
            </FieldGroup>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {t("cancel")}
            </DialogClose>
            {!session && !busy ? (
              <Button type="button" onClick={() => void changeOpen(true)}>
                {t("retry")}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={
                  busy || !token || !certificate || !studentNumber.trim()
                }
                onClick={() => void lookup()}
              >
                {t("submit")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {imported ? (
        <p role="status" className="text-sm">
          {t("success")}
        </p>
      ) : null}
    </Field>
  )
}
