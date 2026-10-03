"use client"

import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Locale } from "@/i18n/routing"
import {
  type ConfirmationAnswer,
  questionChannels,
} from "../_utils/confirmation"
import type { ProgramResult, StudentInput } from "../_utils/types"
import { ConditionQuestions } from "./condition-questions"

export function ConditionsDialog({
  open,
  result,
  student,
  locale,
  notice,
  onOpenChange,
  onClosed,
  onAnswer,
  onUndo,
}: {
  open: boolean
  result: ProgramResult
  student: StudentInput
  locale: Locale
  notice: "updated" | "filteredOut" | "undone" | null
  onOpenChange: (open: boolean) => void
  onClosed: () => void
  onAnswer: (answer: ConfirmationAnswer) => void
  onUndo?: () => void
}) {
  const t = useTranslations("Admissions.questions")
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape/backdrop dismissal must also commit the active numeric field.
        if (!next && document.activeElement instanceof HTMLInputElement)
          document.activeElement.blur()
        onOpenChange(next)
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClosed()
      }}
    >
      <DialogContent
        data-slot="conditions-dialog"
        showCloseButton={false}
        finalFocus={false}
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b p-5 pe-16">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription dir="auto">
            {result.program.name[locale]} ·{" "}
            {result.program.institution.name[locale]}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="absolute end-3 top-3"
              aria-label={t("close")}
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5">
          <ConditionQuestions
            channels={questionChannels(result)}
            student={student}
            locale={locale}
            onAnswer={onAnswer}
          />
        </div>
        <div className="shrink-0 border-t bg-popover p-4">
          <p
            className="mb-3 min-h-12 text-muted-foreground text-xs leading-6"
            role="status"
          >
            {t(notice ?? "sharedHint")}
          </p>
          <DialogFooter className="grid grid-cols-2">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={!onUndo}
              onClick={onUndo}
            >
              {t("undo")}
            </Button>
            <Button
              className="min-h-11"
              onClick={() => {
                const invalid = document.querySelector<HTMLElement>(
                  '[data-slot="conditions-dialog"] [aria-invalid="true"]'
                )
                if (invalid) invalid.focus()
                else onOpenChange(false)
              }}
            >
              {t("done")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
