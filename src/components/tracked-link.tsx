"use client"

import { sendGTMEvent } from "@next/third-parties/google"
import type * as React from "react"

import { Link } from "@/i18n/navigation"

type TrackedLinkProps = React.ComponentProps<typeof Link> & {
  gtmEvent: Record<string, unknown> & {
    event: string
  }
}

export function TrackedLink({ gtmEvent, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        sendGTMEvent(gtmEvent)
        onClick?.(event)
      }}
    />
  )
}
