import type { Metadata } from "next"

import { NotFoundDocument } from "@/components/not-found-document"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  robots: {
    follow: true,
    index: false,
  },
  title: "Page not found | OpenSyria",
}

export default function NotFound() {
  return <NotFoundDocument />
}
