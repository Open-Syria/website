"use client"

import { useTranslations } from "next-intl"
import { useQueryStates } from "nuqs"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import type { Locale } from "@/i18n/routing"
import {
  answerParsers,
  answerQueryOptions,
  restoreAnswerSession,
  toQueryAnswers,
  withQueryAnswers,
} from "../_utils/answer-query-state"
import { answersKey } from "../_utils/answers"
import { certificateCatalogue } from "../_utils/certificates"
import { loadCatalogue } from "../_utils/client-catalogue"
import {
  applyConfirmationAnswer,
  type ConfirmationAnswer,
} from "../_utils/confirmation"
import { evaluateAdmissions } from "../_utils/eligibility"
import {
  type FormValues,
  initialValues,
  parseStudentForm,
} from "../_utils/form"
import { resultParsers, resultQueryOptions } from "../_utils/query-state"
import type { AdmissionsData } from "../_utils/types"
import { useFavourites } from "../_utils/use-favourites"
import { MarksForm } from "./marks-form"
import { ResultsView } from "./results-view"

export function AdmissionsAdvisor({ locale }: { locale: Locale }) {
  const t = useTranslations("Admissions")
  const [data, setData] = useState<AdmissionsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [values, setValues] = useState(initialValues)
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(
    null
  )
  const [editing, setEditing] = useState(true)
  const [undoValues, setUndoValues] = useState<FormValues | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const { saved, toggle, storageError } = useFavourites()
  const [, setQueryState] = useQueryStates(resultParsers, resultQueryOptions)
  const [{ answers }, setAnswerQuery] = useQueryStates(
    answerParsers,
    answerQueryOptions
  )
  const [initialAnswers] = useState(answers)
  const currentValues = useMemo(
    () => (submittedValues ? withQueryAnswers(submittedValues, answers) : null),
    [submittedValues, answers]
  )
  // A numeric blur and the following toggle click can share one render. Merge
  // both changes into the latest draft instead of overwriting the first answer.
  const answerValues = useRef(currentValues)
  useLayoutEffect(() => {
    answerValues.current = currentValues
  }, [currentValues])
  const student = useMemo(
    () => (currentValues ? parseStudentForm(currentValues).input : null),
    [currentValues]
  )
  const results = useMemo(
    () => (student && data ? evaluateAdmissions(data, student) : []),
    [data, student]
  )
  const programIds = useMemo(
    () => new Set(results.map((result) => result.program.id)),
    [results]
  )
  useEffect(() => {
    let active = true
    let restored = null
    try {
      restored = restoreAnswerSession(
        sessionStorage.getItem(answersKey),
        initialAnswers
      )
    } catch {
      /* Calculations also work when storage is unavailable. */
    }
    if (!restored) {
      setValues(withQueryAnswers(initialValues, initialAnswers))
      return
    }
    const { values: restoredValues, answers: restoredAnswers } = restored
    const { input } = parseStudentForm(restoredValues)
    if (!input) return
    setValues(restoredValues)
    if (!initialAnswers) void setAnswerQuery({ answers: restoredAnswers })
    setLoading(true)
    loadCatalogue(
      certificateCatalogue(
        restoredValues.certificate,
        restoredValues.applicantCategory,
        input.certificateYear,
        input.admissionRoute
      )
    )
      .then((catalogue) => {
        if (!active) return
        setData(catalogue)
        setSubmittedValues(restoredValues)
        setEditing(false)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [initialAnswers, setAnswerQuery])
  useEffect(() => {
    if (!currentValues) return
    try {
      sessionStorage.setItem(
        answersKey,
        JSON.stringify({ version: 2, values: currentValues })
      )
    } catch {
      /* Answers remain usable in memory when storage is unavailable. */
    }
  }, [currentValues])
  // Wait for the requested form/results view to commit before finding its target.
  // A cached, hidden locale can contain the same IDs as the active page.
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    const element = Array.from(
      document.querySelectorAll<HTMLElement>(`[id="${id}"]`)
    ).find((candidate) => candidate.getClientRects().length > 0)
    if (!element) return
    pendingFocus.current = null
    element.focus({ preventScroll: true })
    element.scrollIntoView({ block: "start" })
  })
  function focus(id: string) {
    pendingFocus.current = id
  }
  function answerCondition(answer: ConfirmationAnswer) {
    const previous = answerValues.current
    if (!previous) return false
    const next = applyConfirmationAnswer(previous, answer)
    const { input } = parseStudentForm(next)
    if (!input) return false
    answerValues.current = next
    setUndoValues(previous)
    void setAnswerQuery({ answers: toQueryAnswers(next) })
    return true
  }
  if (editing || !student || !data)
    return (
      <MarksForm
        value={values}
        loading={loading}
        loadError={loadError ? t("form.loadError") : undefined}
        onChange={setValues}
        onSubmit={async (input) => {
          if (loading) return
          setLoading(true)
          setLoadError(false)
          try {
            const key = certificateCatalogue(
              values.certificate,
              values.applicantCategory,
              input.certificateYear,
              input.admissionRoute
            )
            const catalogue =
              data?.coverage === key ? data : await loadCatalogue(key)
            if (
              data &&
              (data.coverage !== key ||
                student?.admissionRoute !== input.admissionRoute)
            )
              void setQueryState({
                channel: "all",
                groupPage: 1,
                programPages: {},
              })
            setData(catalogue)
            void setAnswerQuery({ answers: toQueryAnswers(values) })
            setSubmittedValues(values)
            setUndoValues(null)
            setEditing(false)
            focus("admissions-results-title")
          } catch {
            setLoadError(true)
          } finally {
            setLoading(false)
          }
        }}
      />
    )
  return (
    <ResultsView
      data={data}
      results={results}
      student={student}
      locale={locale}
      saved={saved.filter((id) => programIds.has(id))}
      storageError={storageError}
      onSave={toggle}
      onAnswer={answerCondition}
      onUndo={
        undoValues
          ? () => {
              const { input } = parseStudentForm(undoValues)
              if (!input) return
              answerValues.current = undoValues
              void setAnswerQuery({ answers: toQueryAnswers(undoValues) })
              setUndoValues(null)
            }
          : undefined
      }
      onEdit={() => {
        if (currentValues) setValues(currentValues)
        setEditing(true)
        focus("admissions-score")
      }}
      onReset={() => {
        setSubmittedValues(null)
        setUndoValues(null)
        setValues(initialValues)
        try {
          sessionStorage.removeItem(answersKey)
        } catch {
          /* Already unavailable. */
        }
        void setQueryState(null)
        void setAnswerQuery(null)
        setEditing(true)
        focus("admissions-score")
      }}
    />
  )
}
