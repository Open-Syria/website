"use client"

import type * as React from "react"

import { Link } from "@/i18n/navigation"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type TrackedLinkProps = React.ComponentProps<typeof Link> & {
  gtmEvent: Record<string, unknown> & {
    event: string
  }
}

const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim()
const isGoogleTag = /^(G|GT|AW|DC)-[A-Z0-9]+$/i.test(googleTagId ?? "")

function sendGoogleEvent({
  event,
  ...parameters
}: TrackedLinkProps["gtmEvent"]) {
  if (isGoogleTag) {
    window.gtag?.("event", event, parameters)
    return
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...parameters })
}

export function TrackedLink({ gtmEvent, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        sendGoogleEvent(gtmEvent)
        onClick?.(event)
      }}
    />
  )
}
