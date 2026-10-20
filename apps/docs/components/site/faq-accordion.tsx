'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@youj/react'

/**
 * One group of the FAQ. Several answers can be open at once, so a reader can
 * compare them. Closed answers stay in the page (`hiddenUntilFound`), so
 * find-in-page opens the one it lands on, and a link to `/faq#<id>` opens
 * that question and brings it into view, on load and on every hash change.
 * The panels wear the accordion's own collapse (reduced motion: instant).
 */
export function FaqAccordion({ items }: { items: { id: string; question: string; answer: ReactNode }[] }) {
  const [open, setOpen] = useState<string[]>([])

  useEffect(() => {
    const ids = new Set(items.map((i) => i.id))
    const follow = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!ids.has(id)) return
      setOpen((prev) => (prev.includes(id) ? prev : [...prev, id]))
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
    }
    follow()
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [items])

  return (
    <Accordion multiple hiddenUntilFound value={open} onValueChange={(value) => setOpen(value as string[])} className="border-t border-line">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} id={item.id} className="scroll-mt-[calc(var(--header-height)+1.5rem)] border-line">
          <AccordionTrigger className="type-body-strong -mx-2.5 px-2.5 py-4.5 text-fg">{item.question}</AccordionTrigger>
          <AccordionContent className="prose max-w-[64ch] pe-8 text-[14.5px] leading-relaxed">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
