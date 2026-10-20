import { PaperclipIcon, StarIcon } from '@youj/icons'
import { cn } from '@youj/react/lib/utils'
import type { Letter } from '../data'
import { back, backDay, when } from '../time'
import { Marked } from './marked'

/**
 * One letter in the index: sender and time, then the subject, with an
 * unread dot in the margin that goes out once it's read. Only the current
 * letter is in the tab order; J and K (or the arrows) move through the rest.
 */
export function IndexRow({ letter: m, now, query, current, onOpen }: { letter: Letter; now: number; query: string; current: boolean; onOpen: () => void }) {
  const aside = m.until !== undefined
  const label = [
    `${m.read ? '' : 'Unread, '}${m.from.name}`,
    m.subject,
    aside ? `back ${back(m.until!, now)}` : when(m.time, now),
    m.starred && 'starred',
    m.enclosures.length > 0 && `${m.enclosures.length} ${m.enclosures.length === 1 ? 'enclosure' : 'enclosures'}`,
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <button
      type="button"
      data-letter={m.id}
      aria-label={label}
      aria-current={current ? 'true' : undefined}
      tabIndex={current ? 0 : -1}
      onClick={onOpen}
      className="relative flex w-full flex-col gap-0.5 rounded-md py-2.5 ps-6 pe-3 text-start transition-colors yj-duration-fast ease-standard focus-ring hover:bg-hover aria-[current=true]:bg-selected"
    >
      <span aria-hidden className={cn('absolute top-[1.2rem] start-2.5 size-1.5 rounded-full bg-accent transition-[opacity,scale] yj-duration-slow ease-standard', m.read && 'scale-50 opacity-0')} />
      <span className="flex items-baseline gap-3">
        <span className={cn('min-w-0 flex-1 truncate text-ui-lg text-fg', !m.read && 'font-semibold')}>
          <Marked text={m.from.name} query={query} />
        </span>
        {m.starred && <StarIcon size={12} aria-hidden className="shrink-0 translate-y-px fill-current text-warning" />}
        {m.enclosures.length > 0 && <PaperclipIcon size={12} aria-hidden className="shrink-0 translate-y-px text-fg-muted" />}
        <span className={cn('shrink-0 text-ui-sm tabular-nums', aside ? 'text-accent-text' : 'text-fg-muted')}>{aside ? backDay(m.until!, now) : when(m.time, now)}</span>
      </span>
      <span className={cn('truncate text-ui', m.read ? 'text-fg-muted' : 'text-fg')}>
        <Marked text={m.subject} query={query} />
      </span>
    </button>
  )
}
