'use client'

import { CalendarPlusIcon } from '@youj/icons'
import { toast } from '@youj/react/components/ui/toast'
import { cn } from '@youj/react/lib/utils'
import type { Letter } from '../data'
import { KICKER } from '../styles'

/** The margin beside a letter: the days it names, each a chip that files it in the calendar, and your history with its sender. */
export function Margin({ letter: m, className }: { letter: Letter; className?: string }) {
  if (!m.dates.length && !m.history) return null
  return (
    <aside aria-label="In the margin" className={cn('flex flex-col gap-6 text-ui', className)}>
      {m.dates.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className={KICKER}>Named in the letter</p>
          <ul className="flex flex-col gap-2">
            {m.dates.map((d) => (
              <li key={d.match}>
                <button
                  type="button"
                  onClick={() => toast(`Added to your calendar: ${d.when}`, { description: d.what })}
                  className="group/date flex w-full flex-col gap-0.5 rounded-md border border-line bg-surface px-3 py-2 text-start transition-colors yj-duration-fast ease-standard focus-ring hover:border-line-control"
                >
                  <span className="flex items-center gap-2 font-semibold text-fg">
                    {d.when}
                    <CalendarPlusIcon size={13} className="ms-auto text-fg-muted transition-colors yj-duration-fast ease-standard group-hover/date:text-fg" />
                  </span>
                  <span className="text-fg-muted">{d.what}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {m.history && (
        <section className="flex flex-col gap-1.5">
          <p className={KICKER}>{m.from.name}</p>
          {m.from.role && (
            <p className="text-fg">
              {m.from.role}
              {m.from.org && m.from.org !== m.from.name ? `, ${m.from.org}` : ''}
            </p>
          )}
          <p className="text-fg-muted italic">{m.history}</p>
        </section>
      )}
    </aside>
  )
}
