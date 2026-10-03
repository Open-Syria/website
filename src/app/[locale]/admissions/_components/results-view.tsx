"use client"

import { Building2, Compass, Pencil } from "lucide-react"
import { useTranslations } from "next-intl"
import { useQueryStates } from "nuqs"
import { useLayoutEffect, useState } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { Locale } from "@/i18n/routing"
import { vocationalOptions } from "../_utils/certificates"
import type { ConfirmationAnswer } from "../_utils/confirmation"
import { resultParsers, resultQueryOptions } from "../_utils/query-state"
import {
  filterResults,
  groupByInstitution,
  INSTITUTIONS_PER_PAGE,
  initialFilters,
  PROGRAMS_PER_PAGE,
  type ResultFilters,
} from "../_utils/results"
import { displayPercentage } from "../_utils/score"
import type {
  AdmissionsData,
  ProgramResult,
  StudentInput,
} from "../_utils/types"
import { ConditionsDialog } from "./conditions-dialog"
import { ProgramCard } from "./program-card"
import { ResultsFilters } from "./results-filters"

type ReadingAnchor = { programIds: string[]; channelId: string; top: number }

function answerTrigger(programId: string, channelId: string) {
  const card = document.querySelector<HTMLElement>(
    `[data-program-id="${CSS.escape(programId)}"]`
  )
  const channel = card?.querySelector<HTMLElement>(
    `[data-channel-id="${CSS.escape(channelId)}"]`
  )
  return (
    channel?.querySelector<HTMLElement>("[data-answer-trigger]") ??
    channel ??
    card
  )
}

export function ResultsView({
  data,
  results,
  student,
  locale,
  saved,
  storageError,
  onSave,
  onEdit,
  onReset,
  onAnswer,
  onUndo,
}: {
  data: AdmissionsData
  results: ProgramResult[]
  student: StudentInput
  locale: Locale
  saved: string[]
  storageError: boolean
  onSave: (id: string) => void
  onEdit: () => void
  onReset: () => void
  onAnswer: (answer: ConfirmationAnswer) => boolean
  onUndo?: () => void
}) {
  const t = useTranslations("Admissions")
  const [queryState, setQueryState] = useQueryStates(
    resultParsers,
    resultQueryOptions
  )
  const { groupPage, programPages, ...filters } = queryState
  const [openInstitutions, setOpenInstitutions] = useState<string[]>([])
  const [followAnchor, setFollowAnchor] = useState<ReadingAnchor | null>(null)
  const [lastAnchor, setLastAnchor] = useState<ReadingAnchor | null>(null)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [questionContext, setQuestionContext] = useState<{
    result: ProgramResult
    results: ProgramResult[]
    anchor: ReadingAnchor
  } | null>(null)
  const [answerNotice, setAnswerNotice] = useState<
    "updated" | "filteredOut" | "undone" | null
  >(null)
  // Keep the reading surface still while editing. Shared answers and URL state
  // continue to update; regroup only after the dialog has closed.
  const displayedResults = questionContext?.results ?? results
  const filtered = filterResults(displayedResults, filters, saved)
  const noSavedChoices = filters.savedOnly && saved.length === 0
  const groups = groupByInstitution(filtered, locale, filters.sort)
  const currentPage = Math.min(
    groupPage - 1,
    Math.max(0, Math.ceil(groups.length / INSTITUTIONS_PER_PAGE) - 1)
  )
  const visibleGroups = groups.slice(
    currentPage * INSTITUTIONS_PER_PAGE,
    (currentPage + 1) * INSTITUTIONS_PER_PAGE
  )
  // Restore the clicked control's viewport offset, including cross-page moves.
  // If a choice disappears, keep a neighbouring choice in the same position.
  useLayoutEffect(() => {
    if (!followAnchor || questionContext) return
    const followProgramId = followAnchor.programIds.find((id) =>
      groups.some((group) =>
        group.results.some((result) => result.program.id === id)
      )
    )
    if (followProgramId !== followAnchor.programIds[0])
      setAnswerNotice("filteredOut")
    const index = groups.findIndex((group) =>
      group.results.some((result) => result.program.id === followProgramId)
    )
    if (index < 0 || !followProgramId) {
      const summary = document.getElementById("admissions-result-summary")
      const restore = () => {
        summary?.focus({ preventScroll: true })
        if (summary)
          window.scrollBy({
            top:
              summary.getBoundingClientRect().top -
              Math.max(16, followAnchor.top),
            behavior: "instant",
          })
      }
      restore()
      const frame = requestAnimationFrame(() => {
        restore()
        setFollowAnchor(null)
      })
      return () => cancelAnimationFrame(frame)
    }
    const group = groups[index]
    const nextGroupPage = Math.floor(index / INSTITUTIONS_PER_PAGE) + 1
    const nextProgramPage =
      Math.floor(
        group.results.findIndex(
          (result) => result.program.id === followProgramId
        ) / PROGRAMS_PER_PAGE
      ) + 1
    if (!openInstitutions.includes(group.id)) {
      setOpenInstitutions((current) => [...current, group.id])
      return
    }
    if (
      groupPage !== nextGroupPage ||
      (programPages[group.id] ?? 1) !== nextProgramPage
    ) {
      void setQueryState({
        groupPage: nextGroupPage,
        programPages:
          nextProgramPage > 1 ? { [group.id]: nextProgramPage } : {},
      })
      return
    }
    const trigger = answerTrigger(followProgramId, followAnchor.channelId)
    if (!trigger) return
    const restore = () => {
      trigger.focus({ preventScroll: true })
      window.scrollBy({
        top: trigger.getBoundingClientRect().top - followAnchor.top,
        behavior: "instant",
      })
    }
    restore()
    const frame = requestAnimationFrame(() => {
      restore()
      setFollowAnchor(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [
    followAnchor,
    questionContext,
    groups,
    groupPage,
    programPages,
    openInstitutions,
    setQueryState,
  ])
  function answer(next: ConfirmationAnswer) {
    if (!onAnswer(next)) return
    setAnswerNotice("updated")
  }
  function openQuestions(result: ProgramResult) {
    const ids = visibleGroups.flatMap((group) =>
      group.results.map(({ program }) => program.id)
    )
    const index = ids.indexOf(result.program.id)
    const anchor = {
      channelId: result.channels[0].channel.id,
      programIds: [
        result.program.id,
        ...ids.slice(index + 1),
        ...ids.slice(0, index).reverse(),
      ],
      top:
        answerTrigger(
          result.program.id,
          result.channels[0].channel.id
        )?.getBoundingClientRect().top ?? 100,
    }
    setLastAnchor(anchor)
    setQuestionContext({ result, results, anchor })
    setAnswerNotice(null)
    setQuestionsOpen(true)
  }
  const count = (status: ProgramResult["status"]) =>
    results.filter((result) => result.status === status).length
  function applyFilters(next: ResultFilters) {
    void setQueryState({ ...next, groupPage: 1, programPages: {} })
    setOpenInstitutions([])
  }
  return (
    <div className="flex flex-col gap-7 [overflow-anchor:none]">
      {questionContext ? (
        <ConditionsDialog
          open={questionsOpen}
          result={questionContext.result}
          student={student}
          locale={locale}
          notice={
            answerNotice &&
            !filterResults(
              results.filter(
                ({ program }) =>
                  program.id === questionContext.result.program.id
              ),
              filters,
              saved
            ).length
              ? "filteredOut"
              : answerNotice
          }
          onOpenChange={setQuestionsOpen}
          onClosed={() => {
            setFollowAnchor(questionContext.anchor)
            setQuestionContext(null)
          }}
          onAnswer={answer}
          onUndo={
            onUndo
              ? () => {
                  onUndo()
                  setAnswerNotice("undone")
                }
              : undefined
          }
        />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="admissions-results-title"
            tabIndex={-1}
            className="scroll-mt-6 font-heading font-semibold text-3xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("results.title")}
          </h2>
          <p className="mt-2 font-medium text-primary text-sm">
            {t("results.profile", {
              branch: t(`branches.${data.coverage}`),
              year: student.certificateYear,
            })}
            {student.admissionRoute && student.admissionRoute !== "standard"
              ? ` · ${t(`channels.${student.admissionRoute}`)}`
              : ""}
            {data.scope.applicantCategory === "arab_and_foreign"
              ? ` · ${t(student.certificate === "syrian" ? "form.syrianCertificate" : "form.nonSyrianCertificate")}`
              : ""}
            {data.scope.branch === "vocational"
              ? ` · ${vocationalOptions.find((option) => option.id === student.vocationalSpecialty)?.name[locale] ?? ""}`
              : ""}
          </p>
          <p className="mt-2 text-muted-foreground">{t("disclaimer")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" onClick={onEdit}>
            <Pencil aria-hidden="true" data-icon="inline-start" />
            {t("results.edit")}
          </Button>
          <Button variant="ghost" className="min-h-11" onClick={onReset}>
            {t("results.reset")}
          </Button>
        </div>
      </div>
      {data.scope.admissionRoute === "service" ? (
        <Alert>
          <AlertDescription className="whitespace-pre-line">
            {t(
              student.admissionRoute === "security"
                ? "form.securityHint"
                : "form.defenceHint"
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {data.scope.admissionRoute === "special_quotas" ? (
        <Alert>
          <AlertDescription className="whitespace-pre-line">
            {t(
              student.admissionRoute === "disability"
                ? "form.disabilityHint"
                : data.scope.branch === "vocational"
                  ? "form.vocationalFacultyFamilyHint"
                  : "form.facultyFamilyHint"
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card sm:grid-cols-4">
        {[
          {
            label: t("results.score"),
            value: <bdi dir="ltr">{displayPercentage(student.score)}%</bdi>,
          },
          { label: t("results.meets"), value: count("meets_requirements") },
          { label: t("results.pending"), value: count("needs_confirmation") },
          { label: t("results.saved"), value: saved.length },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-3 border-border p-5"
          >
            <dt className="text-muted-foreground text-sm">{item.label}</dt>
            <dd className="font-heading font-semibold text-3xl text-primary">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <ResultsFilters
        data={data}
        results={results}
        locale={locale}
        filters={filters}
        onChange={applyFilters}
        saved={saved}
        storageError={storageError}
      />
      {answerNotice === "filteredOut" ? (
        <div
          id="admissions-answer-notice"
          tabIndex={-1}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p role="status" className="text-sm leading-6">
            {t(`questions.${answerNotice}`)}
          </p>
          {onUndo ? (
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                onUndo()
                setAnswerNotice("undone")
                setFollowAnchor(lastAnchor)
              }}
            >
              {t("questions.undo")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <p
        id="admissions-result-summary"
        tabIndex={-1}
        className="font-medium text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        {t("results.summary", {
          programs: filtered.length,
          institutions: groups.length,
        })}
      </p>
      <p className="sr-only" role="status">
        {t("results.saveNotice", { count: saved.length })}
      </p>
      {groups.length ? (
        <div
          id="admissions-result-list"
          className="flex scroll-mt-6 flex-col gap-5"
          tabIndex={-1}
        >
          <Accordion
            multiple
            value={openInstitutions}
            onValueChange={setOpenInstitutions}
            className="gap-4 [&_[data-slot=accordion-content]]:animate-none!"
          >
            {visibleGroups.map((group) => {
              const page = Math.min(
                (programPages[group.id] ?? 1) - 1,
                Math.max(
                  0,
                  Math.ceil(group.results.length / PROGRAMS_PER_PAGE) - 1
                )
              )
              return (
                <AccordionItem
                  value={group.id}
                  key={group.id}
                  className="rounded-xl border bg-card px-4 sm:px-6"
                >
                  <AccordionTrigger
                    id={`group-${group.id}`}
                    className="min-h-20 gap-4"
                    headerClassName="sticky top-0 z-10 -mx-4 rounded-xl bg-card px-4 sm:-mx-6 sm:px-6"
                  >
                    <Building2
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <span className="flex flex-1 flex-col items-start gap-2">
                      <span
                        dir="auto"
                        lang={
                          group.institution.name.en ===
                          group.institution.name.ar
                            ? "ar"
                            : locale
                        }
                        className={
                          group.institution.name.en ===
                          group.institution.name.ar
                            ? "font-(family-name:--font-arabic) font-semibold text-lg leading-7"
                            : "font-heading font-semibold text-lg leading-7"
                        }
                      >
                        {group.institution.name[locale]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t(`statuses.${group.status}`)} ·{" "}
                        {t(`channels.${group.channel}`)}
                      </span>
                    </span>
                    <Badge variant="outline">{group.results.length}</Badge>
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pt-1">
                    <div className="flex flex-col gap-4 pb-2">
                      {group.results
                        .slice(
                          page * PROGRAMS_PER_PAGE,
                          (page + 1) * PROGRAMS_PER_PAGE
                        )
                        .map((result) => (
                          <ProgramCard
                            key={result.program.id}
                            result={result}
                            sources={data.sources}
                            locale={locale}
                            saved={saved.includes(result.program.id)}
                            onSave={() => onSave(result.program.id)}
                            onQuestions={openQuestions}
                          />
                        ))}
                      <ResultPagination
                        page={page}
                        total={group.results.length}
                        size={PROGRAMS_PER_PAGE}
                        label={t("results.programPagination", {
                          name: group.institution.name[locale],
                        })}
                        onChange={(next) => {
                          const pages = { ...programPages }
                          if (next === 0) delete pages[group.id]
                          else pages[group.id] = next + 1
                          void setQueryState({ programPages: pages })
                          document
                            .getElementById(`group-${group.id}`)
                            ?.focus({ preventScroll: true })
                          document
                            .getElementById(`group-${group.id}`)
                            ?.scrollIntoView({ block: "start" })
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
          <ResultPagination
            page={currentPage}
            total={groups.length}
            size={INSTITUTIONS_PER_PAGE}
            label={t("results.institutionPagination")}
            onChange={(next) => {
              void setQueryState({ groupPage: next + 1, programPages: {} })
              setOpenInstitutions([])
              document
                .getElementById("admissions-result-list")
                ?.focus({ preventScroll: true })
              document
                .getElementById("admissions-result-list")
                ?.scrollIntoView({ block: "start" })
            }}
          />
        </div>
      ) : (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {t(noSavedChoices ? "results.noSaved" : "results.noResults")}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                noSavedChoices ? "results.noSavedBody" : "results.noResultsBody"
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => applyFilters(initialFilters)}
            >
              {t(
                noSavedChoices
                  ? "results.browseChoices"
                  : "results.clearFilters"
              )}
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}

function ResultPagination({
  page,
  total,
  size,
  label,
  onChange,
}: {
  page: number
  total: number
  size: number
  label: string
  onChange: (page: number) => void
}) {
  const t = useTranslations("Admissions.results")
  if (total <= size) return null
  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-center gap-3 pt-2"
    >
      <Button
        variant="outline"
        className="min-h-11"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        {t("previous")}
      </Button>
      <span aria-live="polite" className="text-muted-foreground text-sm">
        {t("pageRange", {
          start: page * size + 1,
          end: Math.min((page + 1) * size, total),
          total,
        })}
      </span>
      <Button
        variant="outline"
        className="min-h-11"
        disabled={(page + 1) * size >= total}
        onClick={() => onChange(page + 1)}
      >
        {t("next")}
      </Button>
    </nav>
  )
}
