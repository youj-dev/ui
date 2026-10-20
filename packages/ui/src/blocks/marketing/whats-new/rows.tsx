'use client'

import { useId, useState, type ElementType } from 'react'
import { Collapse } from '@youj/motion'
import { ArrowRightIcon, ChevronDownIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import type { WhatsNewCopy, WhatsNewEntry } from './data'

/* The earlier changes, one row each: the date in a gutter, the title and
 * summary, its area and kind, and a disclosure that opens its details
 * (Collapse, the chevron turning with it) and a link to the release notes. */

interface RowProps {
  entry: WhatsNewEntry
  date: string
  ago: string
  copy: WhatsNewCopy
  Link: ElementType
  headingLevel: number
}

export function Row({ entry, date, ago, copy, Link, headingLevel }: RowProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const Heading = `h${headingLevel}` as 'h3'
  const hasMore = !!entry.highlights?.length
  return (
    <article className="grid gap-x-8 gap-y-2 border-t border-line py-6 sm:grid-cols-[--spacing(36)_minmax(0,1fr)]">
      <p className="flex flex-col text-ui-sm text-fg-muted sm:pt-1">
        <time dateTime={new Date(entry.date).toISOString()} className="font-medium text-fg">
          {date}
        </time>
        <span>{ago}</span>
      </p>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{copy.kind[entry.kind]}</Badge>
          <Badge variant="outline">{entry.category}</Badge>
          {entry.version && <span className="font-mono text-ui-sm text-fg-muted">{copy.release(entry.version)}</span>}
        </div>
        <Heading className="text-balance text-ui-lg font-semibold tracking-tight text-fg">{entry.title}</Heading>
        <p className="max-w-2xl text-pretty text-ui text-fg-muted">{entry.summary}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {hasMore && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              aria-label={copy.more(entry.title)}
              onClick={() => setOpen((o) => !o)}
              className="group/more inline-flex items-center gap-1 rounded-sm text-ui font-medium text-fg focus-ring"
            >
              {copy.moreLabel}
              <ChevronDownIcon size={14} aria-hidden className={cn('transition-transform yj-duration-base ease-standard', open && 'rotate-180')} />
            </button>
          )}
          <Link href={entry.href} onClick={entry.onClick} className="inline-flex items-center gap-1 rounded-sm text-ui font-medium text-accent hover:underline focus-ring">
            {copy.readNotes}
            <ArrowRightIcon size={14} aria-hidden className="rtl:-scale-x-100" />
          </Link>
        </div>
        {hasMore && (
          <Collapse id={id} open={open}>
            <ul className="mt-1 flex flex-col gap-1.5 border-s-2 border-line ps-4">
              {entry.highlights!.map((point) => (
                <li key={point} className="text-ui text-fg-muted">
                  {point}
                </li>
              ))}
            </ul>
          </Collapse>
        )}
      </div>
    </article>
  )
}
