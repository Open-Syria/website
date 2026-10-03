import type { ReactNode } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type FaqAccordionProps = Readonly<{
  items: ReadonlyArray<{
    id: string
    question: string
    answer: string
    details?: ReactNode
  }>
}>

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion
      data-slot="faq-accordion"
      multiple
      defaultValue={items.slice(0, 1).map((item) => item.id)}
      hiddenUntilFound
      className="rounded-xl border bg-card px-5 sm:px-6"
    >
      {items.map((item) => (
        <AccordionItem value={item.id} key={item.id}>
          <AccordionTrigger className="py-5 text-base leading-7">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            <p className="whitespace-pre-line text-muted-foreground leading-8">
              {item.answer}
            </p>
            {item.details ? <div className="mt-4">{item.details}</div> : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
