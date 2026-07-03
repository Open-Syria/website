import { SiteControls } from "@/components/site-controls"
import { OpenSyriaHorizontalLogo } from "@/components/ui/svgs/openSyriaHorizontalLogo"
import { Link } from "@/i18n/navigation"
import { pageContainerClassName, pageGutterClassName } from "@/lib/layout"
import { cn } from "@/lib/utils"

type SiteHeaderProps = Readonly<{
  children?: React.ReactNode
  className?: string
}>

export function SiteHeader({ children, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "border-b bg-background/95 py-3 text-foreground backdrop-blur",
        pageGutterClassName,
        className
      )}
    >
      <div
        className={cn(
          pageContainerClassName,
          "flex items-center justify-between gap-4"
        )}
      >
        <Link
          aria-label="OpenSyria"
          className="inline-flex h-10 shrink-0 items-center text-foreground [--opensyria-logo-foreground:currentColor] [--opensyria-logo-map-gradient-end:currentColor] [--opensyria-logo-map-gradient-highlight-end:var(--accent-foreground)] [--opensyria-logo-map-gradient-highlight-start:var(--primary)] [--opensyria-logo-map-gradient-start:var(--primary)] [--opensyria-logo-primary:var(--primary)]"
          href="/"
        >
          <OpenSyriaHorizontalLogo className="h-8 w-auto max-w-36 sm:h-9 sm:max-w-44" />
        </Link>

        <div className="flex items-center gap-2">
          {children}
          <SiteControls />
        </div>
      </div>
    </header>
  )
}
