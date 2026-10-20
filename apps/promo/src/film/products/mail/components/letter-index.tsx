'use client'

import { useId } from 'react'
import { Counter, PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { cn } from '@youj/react/lib/utils'
import { KINDS } from '../data'
import { KICKER, STACK_NAMES } from '../styles'
import type { Folio } from '../use-folio'
import { IndexRow } from './index-row'

/**
 * The index: the stack's name and the morning's progress, then its letters,
 * the inbox grouped by what each needs. A filed letter folds out while the
 * rest glide up, the current one's highlight going with its row. The arrow
 * keys move through it as J and K do.
 */
export function LetterIndex({ folio, className }: { folio: Folio; className?: string }) {
  const uid = useId()
  const { stack, order, current, query, now, handled } = folio
  const left = folio.count('inbox')
  const groups = stack === 'inbox' ? KINDS.map((kind) => ({ ...kind, items: order.filter((m) => m.kind === kind.id) })).filter((g) => g.items.length) : [{ id: stack, label: null, items: order }]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex flex-col gap-3 px-5 pt-5 pb-3">
        <div className="flex items-baseline gap-3">
          <Reveal key={stack} as="h2" inView={false} variant="fade" duration="base" className="text-xl leading-tight font-semibold tracking-tight text-fg">
            {STACK_NAMES[stack]}
          </Reveal>
          <p className="ms-auto text-ui-sm text-fg-muted tabular-nums">
            {stack === 'inbox' ? (
              <>
                <Counter value={left} mode="roll" inView={false} /> to go{handled > 0 && ` · ${handled} dealt with`}
              </>
            ) : (
              `${order.length} ${order.length === 1 ? 'letter' : 'letters'}`
            )}
          </p>
        </div>
        {stack === 'inbox' && (
          // The morning's progress: what you've dealt with, of all there was.
          <div aria-hidden className="h-0.5 overflow-hidden rounded-full bg-band">
            <span
              className="block h-full origin-left rounded-full bg-accent transition-transform yj-duration-deliberate ease-emphasized rtl:origin-right"
              style={{ transform: `scaleX(${handled + left ? handled / (handled + left) : 0})` }}
            />
          </div>
        )}
      </div>
      {order.length ? (
        <div
          ref={folio.refs.index}
          className="flex flex-col px-2 pb-6"
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            folio.step(event.key === 'ArrowDown' ? 1 : -1)
          }}
        >
          <PresenceList as="div" className="flex flex-col">
            {groups.map((g) => {
              const name = g.label ? { 'aria-labelledby': `${uid}-${g.id}` } : { 'aria-label': STACK_NAMES[stack] }
              return (
                <PresenceItem as="section" key={g.id} {...name} className="flex flex-col">
                  {g.label && (
                    <h3 id={`${uid}-${g.id}`} className={cn(KICKER, 'flex items-baseline gap-2 px-4 pt-4 pb-1.5')}>
                      {g.label}
                      <span className="tracking-normal tabular-nums">{g.items.length}</span>
                    </h3>
                  )}
                  <PresenceList {...name} className="flex flex-col">
                    {g.items.map((m) => (
                      <PresenceItem key={m.id}>
                        <IndexRow letter={m} now={now} query={query} current={m.id === current?.id} onOpen={() => folio.open(m.id)} />
                      </PresenceItem>
                    ))}
                  </PresenceList>
                </PresenceItem>
              )
            })}
          </PresenceList>
        </div>
      ) : (
        <p className="px-7 pt-6 text-ui text-fg-muted">
          {query ? `Nothing in ${STACK_NAMES[stack]} mentions “${query.trim()}”.` : stack === 'inbox' ? 'Nothing waiting.' : `Nothing in ${STACK_NAMES[stack]}.`}
        </p>
      )}
    </div>
  )
}
