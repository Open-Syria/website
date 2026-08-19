"use client"

import { Braces } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Link } from "@/i18n/navigation"

type DatasetPageNavigationProps = {
  apiGuideLabel: string
  ariaLabel: string
  openDataLabel: string
}

export function DatasetPageNavigation({
  apiGuideLabel,
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
            render={<Link href="/api" />}
          >
            <Braces aria-hidden="true" />
            {apiGuideLabel}
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
