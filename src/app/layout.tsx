import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type RootLayoutProps = Readonly<{
  children: React.ReactNode
}>

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
}

export default function RootLayout({ children }: RootLayoutProps) {
  return children
}
