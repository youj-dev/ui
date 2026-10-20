'use client'

import { useId, type ReactNode } from 'react'
import { PaperclipIcon, StarIcon } from '@youj/icons'
import { Toggle } from '@youj/react/components/ui/toggle'
import { cn } from '@youj/react/lib/utils'
import { ME, type Letter } from '../data'
import { KICKER } from '../styles'
import { dated } from '../time'
import { Marked } from './marked'
import { Reply } from './reply'

/**
 * The open letter, set like correspondence: a letterhead line and the date,
 * the subject at display size, the letter at a reading measure with the days
 * it names underlined, what's enclosed, and a reply that unfolds in place.
 */
export function Sheet({
  letter: m,
  now,
  query,
  position,
  replying,
  onReply,
  onCancelReply,
  onSend,
  onStar,
}: {
  letter: Letter
  now: number
  query: string
  position: ReactNode
  replying: boolean
  onReply: () => void
  onCancelReply: () => void
  onSend: (body: string) => Promise<void>
  onStar: (starred: boolean) => void
}) {
  const id = useId()
  const recipients = m.to.map((t) => (t === ME.email ? 'you' : t))
  return (
    <article aria-labelledby={`${id}-subject`} className="flex flex-col px-6 pt-7 pb-6 sm:px-12 sm:pt-10">
      {/* The letterhead: who, from where and to whom; where it sits in the pile, and when it came. */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-line pb-5">
        <p className={cn(KICKER, 'truncate text-fg')}>
          {m.from.name}
          {m.from.org && m.from.org !== m.from.name && <span className="text-fg-muted"> · {m.from.org}</span>}
        </p>
        <span className="flex items-center gap-1 text-ui-sm text-fg-muted tabular-nums">
          {position}
          <Toggle aria-label="Star" aria-keyshortcuts="S" pressed={m.starred} onPressedChange={onStar} size="sm" className="-me-2 -my-1.5 ms-1">
            <StarIcon size={16} active={m.starred} className={cn('transition-colors yj-duration-fast ease-standard', m.starred && 'fill-current text-warning')} />
          </Toggle>
        </span>
        <p className="truncate text-ui text-fg-muted">
          {m.from.email} to {recipients.join(', ')}
          {m.cc?.length ? `, cc ${m.cc.join(', ')}` : ''}
        </p>
        <time dateTime={new Date(m.time).toISOString()} className="text-end text-ui text-fg-muted tabular-nums max-sm:hidden">
          {dated(m.time, now)}
        </time>
      </header>
      <h2 id={`${id}-subject`} className="mt-7 text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-balance text-fg sm:text-[2rem]">
        <Marked text={m.subject} query={query} />
      </h2>
      <div className="mt-6 flex flex-col gap-[1.1em] text-[1.0625rem] leading-[1.72] text-pretty text-fg">
        {m.body.map((p, i) => (
          <p key={i}>
            <Marked text={p} query={query} dates={m.dates.map((d) => d.match)} />
          </p>
        ))}
        {m.signoff && <p>{m.signoff}</p>}
      </div>
      {m.enclosures.length > 0 && (
        <section aria-label="Enclosed" className="mt-8 flex flex-col gap-2 border-t border-line pt-4">
          <p className={KICKER}>Enclosed</p>
          <ul className="flex flex-col">
            {m.enclosures.map((e) => (
              <li key={e.name} className="flex items-baseline gap-2.5 py-1 text-ui-lg">
                <PaperclipIcon size={14} className="shrink-0 translate-y-0.5 text-fg-muted" />
                <span className="min-w-0 truncate text-fg">{e.name}</span>
                <span className="shrink-0 text-ui-sm text-fg-muted tabular-nums">{e.size}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {m.stack !== 'sent' && m.stack !== 'drafts' && (
        <Reply key={m.id} to={m.from.name.split(' ')[0] ?? m.from.name} open={replying} onOpen={onReply} onCancel={onCancelReply} onSend={onSend} />
      )}
    </article>
  )
}
