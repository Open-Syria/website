import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { DatasetBreadcrumbItem } from "../_utils/breadcrumbs"

type DatasetBreadcrumbsProps = {
  className?: string
  items: readonly DatasetBreadcrumbItem[]
}

function DatasetBreadcrumbs({ className, items }: DatasetBreadcrumbsProps) {
  if (items.length <= 1) {
    return null
  }

  return (
    <Breadcrumb className={cn("mb-6", className)}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1

          return (
            <Fragment key={item.url}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {isCurrentPage ? (
                  <BreadcrumbPage className="max-w-[min(100%,36rem)] truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    render={<Link href={item.href} />}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export { DatasetBreadcrumbs }
