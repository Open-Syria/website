"use client"

import { BookOpenText } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Link } from "@/i18n/navigation"
import { trustedExternalLinkRel } from "@/lib/links"
import { siteLinks } from "@/lib/site"

type DatasetPageNavigationProps = {
  apiDocsLabel: string
  ariaLabel: string
  openDataLabel: string
}

export function DatasetPageNavigation({
  apiDocsLabel,
  ariaLabel,
  openDataLabel,
}: DatasetPageNavigationProps) {
  return (
    <NavigationMenu aria-label={ariaLabel} className="hidden flex-none sm:flex">
      <NavigationMenuList className="justify-end gap-1">
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/datasets" />}
          >
            {openDataLabel}
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={
              <a
                href={siteLinks.docs}
                rel={trustedExternalLinkRel}
                target="_blank"
              />
            }
          >
            <BookOpenText aria-hidden="true" />
            {apiDocsLabel}
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
