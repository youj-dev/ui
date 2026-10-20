'use client'

import type { Ref } from 'react'

/* The problems a send found, gathered at the top of the page (GOV.UK's error
 * summary): it takes focus so the count is heard, and each line links to its
 * question, focusing the question's first answer. It goes once the last is
 * fixed. */

interface ProblemSummaryProps {
  ref?: Ref<HTMLDivElement>
  problems: { id: string; number: number; message: string }[]
  title: string
  link: (number: number, message: string) => string
  /** The element id of a question. */
  target: (id: string) => string
}

export function ProblemSummary({ ref, problems, title, link, target }: ProblemSummaryProps) {
  const go = (id: string) => {
    const question = document.getElementById(target(id))
    question?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    question
      ?.querySelector<HTMLElement>('[data-yj-autofocus], [role=radio], [role=checkbox], input, textarea, button, [tabindex="0"]')
      ?.focus({ preventScroll: true })
  }
  if (!problems.length) return null
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={title}
      className="mb-8 flex flex-col gap-2 rounded-lg border border-danger-line bg-danger-subtle p-4 outline-none focus-ring"
    >
      <p className="text-ui-lg font-semibold text-danger-text">{title}</p>
      <ul className="flex flex-col gap-1">
        {problems.map((p) => (
          <li key={p.id}>
            <a
              href={`#${target(p.id)}`}
              onClick={(event) => {
                event.preventDefault()
                go(p.id)
              }}
              className="rounded-sm text-ui text-danger-text underline underline-offset-2 hover:no-underline focus-ring"
            >
              {link(p.number, p.message)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
