import { HelpCircle } from "lucide-react"
import { cacheLife } from "next/cache"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { getLandingFaqContent } from "../_utils/faq"

type LandingFaqProps = Readonly<{
  locale: Locale
}>

export async function LandingFaq({ locale }: LandingFaqProps) {
  "use cache"

  cacheLife("hours")

  const faq = await getLandingFaqContent(locale)
  const defaultValue = faq.items[0] ? [faq.items[0].id] : undefined

  return (
    <section
      aria-labelledby="home-faq-title"
      className="bg-background-light py-16 sm:py-20"
    >
      <div
        className={cn(
          "page-content",
          "grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start"
        )}
      >
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-sm">
            <HelpCircle aria-hidden="true" className="size-4 text-primary" />
            {faq.eyebrow}
          </p>
          <h2
            className="mt-5 max-w-2xl text-balance font-heading font-semibold text-3xl leading-tight sm:text-4xl"
            id="home-faq-title"
          >
            {faq.title}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-7">
            {faq.description}
          </p>
        </div>

        <Accordion
          className="rounded-md border bg-background px-4 shadow-sm sm:px-6"
          defaultValue={defaultValue}
          hiddenUntilFound
        >
          {faq.items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="py-5 text-base leading-6">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-7">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
