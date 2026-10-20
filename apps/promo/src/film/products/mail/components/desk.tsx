'use client'

import { Counter } from '@youj/motion'
import { PageTransition } from '@youj/motion/interactions'
import { InboxIcon, SearchIcon } from '@youj/icons'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@youj/react/components/ui/empty'
import { cn } from '@youj/react/lib/utils'
import { STACK_NAMES } from '../styles'
import type { Folio } from '../use-folio'
import { DeskClear } from './desk-clear'
import { KeyLegend } from './key-legend'
import { Margin } from './margin'
import { Sheet } from './sheet'

/**
 * The desk: the letter at hand as a sheet on top of the pile (up to two
 * sheets' edges beneath it, falling away as the pile thins), its margin
 * beside it, and the keys at the foot. Each new letter settles in from the
 * pile. With the inbox dealt with, the desk is clear.
 */
export function Desk({ folio }: { folio: Folio }) {
  const { current, order, stack, query, position } = folio
  const edges = Math.min(2, Math.max(0, order.length - 1))

  return (
    <section aria-label="Desk" className="flex min-h-0 flex-col bg-transparent">
      <div ref={folio.refs.desk} className="min-h-0 flex-1 overflow-y-auto yj-scrollbar">
        <div className={cn('mx-auto grid w-full max-w-[62rem] gap-x-10 gap-y-8 px-8 pt-8 pb-12', current && 'xl:grid-cols-[minmax(0,42rem)_12.5rem] xl:justify-center')}>
          {current ? (
            <>
              <div className="relative isolate">
                {[1, 2].map((i) => (
                  <span
                    key={i}
                    aria-hidden
                    className={cn(
                      'absolute rounded-xl border border-line bg-surface shadow-xs transition-[opacity,translate] yj-duration-slow ease-standard',
                      i === 1 ? 'inset-x-3 top-1.5 -bottom-1.5 -z-10' : 'inset-x-6 top-3 -bottom-3 -z-20',
                      i > edges && '-translate-y-2 opacity-0',
                    )}
                  />
                ))}
                <PageTransition routeKey={current.id} variant="fade-through" className="-m-6 p-6">
                  <div className="rounded-xl border border-line bg-surface shadow-md">
                    <Sheet
                      letter={current}
                      now={folio.now}
                      query={query}
                      replying={folio.replying}
                      onReply={() => folio.setReplying(true)}
                      onCancelReply={() => folio.setReplying(false)}
                      onSend={(body) => folio.reply(current, body)}
                      onStar={(starred) => folio.star(current, starred)}
                      position={
                        <>
                          <Counter value={position} mode="roll" inView={false} /> of {order.length}
                        </>
                      }
                    />
                  </div>
                </PageTransition>
              </div>
              <Margin letter={current} className="xl:pt-16" />
            </>
          ) : stack === 'inbox' && !query ? (
            <DeskClear folio={folio} />
          ) : (
            <Empty className="pt-[14vh]">
              <EmptyHeader>
                <EmptyMedia variant="icon">{query ? <SearchIcon /> : <InboxIcon />}</EmptyMedia>
                <EmptyTitle>{query ? 'No letters match' : `Nothing in ${STACK_NAMES[stack]}`}</EmptyTitle>
                <EmptyDescription>{query ? `Nothing in ${STACK_NAMES[stack]} mentions “${query.trim()}”.` : 'Letters you file here will wait for you.'}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
      <footer className="flex shrink-0 justify-center border-t border-line bg-canvas/70 youj-allow-glass px-4 py-2 backdrop-blur-md">
        <KeyLegend folio={folio} />
      </footer>
    </section>
  )
}
