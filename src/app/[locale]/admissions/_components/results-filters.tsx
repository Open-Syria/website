"use client"

import { Bookmark, RotateCcw, SlidersHorizontal, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/i18n/routing"
import {
  filterResults,
  initialFilters,
  type ResultFilters,
} from "../_utils/results"
import type { AdmissionsData, ProgramResult } from "../_utils/types"
import { AdmissionsSelect } from "./admissions-select"

type FilterProps = {
  data: AdmissionsData
  results: ProgramResult[]
  locale: Locale
  filters: ResultFilters
  onChange: (filters: ResultFilters) => void
}

export function ResultsFilters({
  saved,
  storageError,
  ...props
}: FilterProps & { saved: string[]; storageError: boolean }) {
  const t = useTranslations("Admissions.results")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(props.filters)
  const activeCount = (
    Object.keys(initialFilters) as (keyof ResultFilters)[]
  ).filter(
    (key) =>
      key !== "savedOnly" &&
      props.filters[key] !==
        (key === "status" && props.filters.savedOnly
          ? "all"
          : initialFilters[key])
  ).length
  const matches = open ? filterResults(props.results, draft, saved).length : 0
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 md:flex">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) setDraft(props.filters)
            setOpen(next)
          }}
        >
          <DialogTrigger
            render={<Button variant="outline" className="min-h-11 md:hidden" />}
          >
            <SlidersHorizontal aria-hidden="true" data-icon="inline-start" />
            {t("filtersShort")}
            {activeCount ? (
              <Badge variant="secondary">{activeCount}</Badge>
            ) : null}
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
          >
            <DialogHeader className="shrink-0 border-b p-5 pe-16">
              <DialogTitle>{t("filters")}</DialogTitle>
            </DialogHeader>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="absolute end-3 top-3"
                  aria-label={t("closeFilters")}
                />
              }
            >
              <X aria-hidden="true" />
            </DialogClose>
            <div
              className="min-h-0 overflow-y-auto overscroll-contain p-5"
              data-slot="filter-dialog-body"
            >
              <FilterFields {...props} filters={draft} onChange={setDraft} />
              <p className="mt-4 text-muted-foreground text-xs leading-6">
                {t(storageError ? "storageError" : "savedHint")}
              </p>
            </div>
            <DialogFooter className="grid shrink-0 grid-cols-2 border-t bg-popover p-4">
              <Button
                variant="outline"
                className="h-auto min-h-11 whitespace-normal"
                onClick={() => setDraft(initialFilters)}
              >
                {t("clearFilters")}
              </Button>
              <Button
                className="h-auto min-h-11 whitespace-normal"
                onClick={() => {
                  props.onChange(draft)
                  setOpen(false)
                }}
              >
                {t("showFiltered", { count: matches })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          variant={props.filters.savedOnly ? "default" : "outline"}
          className="min-h-11"
          aria-pressed={props.filters.savedOnly}
          aria-label={`${t("savedOnly")} (${saved.length})`}
          onClick={() => {
            const savedOnly = !props.filters.savedOnly
            props.onChange({
              ...initialFilters,
              savedOnly,
              status: savedOnly ? "all" : "available",
            })
          }}
        >
          <Bookmark
            aria-hidden="true"
            data-icon="inline-start"
            fill={props.filters.savedOnly ? "currentColor" : "none"}
          />
          <span className="md:hidden">{t("savedShort")}</span>
          <span className="hidden md:inline">{t("savedOnly")}</span>
          <Badge variant="secondary">{saved.length}</Badge>
        </Button>
      </div>
      <div className="hidden rounded-xl border bg-card p-5 md:block">
        <FilterFields {...props} />
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs leading-6">
            {t(storageError ? "storageError" : "savedHint")}
          </p>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={t("clearFilters")}
            onClick={() => props.onChange(initialFilters)}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function FilterFields({
  data,
  results,
  locale,
  filters,
  onChange: applyFilters,
}: FilterProps) {
  const t = useTranslations("Admissions")
  const id = useId()
  const governorates = [
    ...new Set(data.programs.map((program) => program.governorate)),
  ].sort((a, b) =>
    t(`governorates.${a}`).localeCompare(t(`governorates.${b}`), locale)
  )
  const fields = [...new Set(data.programs.map((program) => program.field))]
  const update = <Key extends keyof ResultFilters>(
    key: Key,
    value: ResultFilters[Key]
  ) => applyFilters({ ...filters, [key]: value })
  return (
    <FieldGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <Field>
        <FieldLabel htmlFor={`${id}-admissions-search`}>
          {t("results.search")}
        </FieldLabel>
        <Input
          id={`${id}-admissions-search`}
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
          placeholder={t("results.searchPlaceholder")}
          className="h-11"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-filter-governorate`}>
          {t("results.governorate")}
        </FieldLabel>
        <AdmissionsSelect<ResultFilters["governorate"]>
          id={`${id}-filter-governorate`}
          value={filters.governorate}
          onValueChange={(next) => update("governorate", next)}
          placeholder={t("results.allGovernorates")}
          items={[
            { value: "all", label: t("results.allGovernorates") },
            ...governorates.map((id) => ({
              value: id,
              label: t(`governorates.${id}`),
            })),
          ]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-filter-field`}>
          {t("results.field")}
        </FieldLabel>
        <AdmissionsSelect<ResultFilters["field"]>
          id={`${id}-filter-field`}
          value={filters.field}
          onValueChange={(next) => update("field", next)}
          placeholder={t("results.allFields")}
          items={[
            { value: "all", label: t("results.allFields") },
            ...fields.map((id) => ({
              value: id,
              label: t(`fields.${id}`),
            })),
          ]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-filter-channel`}>
          {t("results.channel")}
        </FieldLabel>
        <AdmissionsSelect<ResultFilters["channel"]>
          id={`${id}-filter-channel`}
          value={filters.channel}
          onValueChange={(next) => update("channel", next)}
          placeholder={t("results.allChannels")}
          items={[
            { value: "all", label: t("results.allChannels") },
            ...(
              [
                "general",
                "faculty_family",
                "disability",
                "defence",
                "security",
                "parallel",
                "arab_foreign",
                "private",
              ] as const
            )
              .filter((id) =>
                results.some((result) =>
                  result.channels.some((channel) => channel.channel.id === id)
                )
              )
              .map((id) => ({
                value: id,
                label: t(`channels.${id}`),
              })),
          ]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-filter-status`}>
          {t("results.status")}
        </FieldLabel>
        <AdmissionsSelect<ResultFilters["status"]>
          id={`${id}-filter-status`}
          value={filters.status}
          onValueChange={(next) => update("status", next)}
          placeholder={t("results.available")}
          items={[
            { value: "available", label: t("results.available") },
            { value: "all", label: t("results.allStatuses") },
            ...(
              [
                "meets_requirements",
                "needs_confirmation",
                "not_eligible",
              ] as const
            ).map((id) => ({ value: id, label: t(`statuses.${id}`) })),
          ]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-filter-sort`}>
          {t("results.sort")}
        </FieldLabel>
        <AdmissionsSelect<ResultFilters["sort"]>
          id={`${id}-filter-sort`}
          value={filters.sort}
          onValueChange={(next) => update("sort", next)}
          placeholder={t("results.sortCareer")}
          items={[
            { value: "career", label: t("results.sortCareer") },
            { value: "name", label: t("results.sortName") },
          ]}
        />
      </Field>
    </FieldGroup>
  )
}
