'use client'

import { useEffect, useRef } from 'react'
import { useYouj } from '@youj/core'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import { clock, type SwitchoverTone, type SwitchoverCopy, type SwitchoverStage } from './data'

/* The switchover as it happened: the four stages as a rail (done, under
 * way, to come), then every event with the home's clock time and a dot in
 * its tone, oldest first. A new event rises in at the foot; the log follows
 * it while you're at the bottom and stays put once you scroll up to read. */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
const STAGES: SwitchoverStage[] = ['detect', 'transfer', 'backup', 'return']
const DOT: Record<SwitchoverTone, string> = {
  neutral: 'bg-line-strong',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
}

export interface SwitchoverEvent {
  id: number
  /** Seconds after midnight, the home's clock. */
  time: number
  text: string
  tone: SwitchoverTone
}

interface TimelineProps {
  events: SwitchoverEvent[]
  /** The stage under way; `done` once the switch back has run to the end. */
  stage: SwitchoverStage | null
  done: boolean
  /** Seconds since the outage began, or null before one. */
  elapsed: number | null
  copy: SwitchoverCopy
}

const span = (seconds: number) => `T+${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export function Timeline({ events, stage, done, elapsed, copy }: TimelineProps) {
  const k = useYouj()
  const scroller = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)
  const at = done ? STAGES.length : stage ? STAGES.indexOf(stage) : -1

  useEffect(() => {
    const el = scroller.current
    if (!el || !pinned.current) return
    el.scrollTo?.({ top: el.scrollHeight, behavior: k.reduced ? 'auto' : 'smooth' })
  }, [events.length, k.reduced])

  return (
    <div data-slot="switchover-timeline" className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow className={VOICE}>{copy.timeline}</Eyebrow>
        <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{elapsed === null ? '' : span(elapsed)}</span>
      </div>
      <ol aria-label={copy.timeline} className="grid grid-cols-4 gap-1.5">
        {STAGES.map((s, i) => {
          const state = i < at ? 'done' : i === at ? 'current' : 'next'
          return (
            <li key={s} data-state={state} aria-current={state === 'current' ? 'step' : undefined} className="flex min-w-0 flex-col gap-1.5">
              <span
                aria-hidden
                className={cn(
                  'h-1 rounded-full transition-[background-color] yj-duration-slow ease-standard',
                  state === 'done' ? 'bg-fg-subtle' : state === 'current' ? 'bg-accent' : 'bg-well',
                )}
              />
              <span className={cn('truncate text-ui-xs', state === 'next' ? 'text-fg-muted' : 'text-fg')}>{copy.stages[s]}</span>
            </li>
          )
        })}
      </ol>
      <div
        ref={scroller}
        // A scroller of plain text has no focusable child, so the keyboard reaches it here.
        tabIndex={0}
        role="group"
        aria-label={copy.timeline}
        onScroll={(e) => {
          const el = e.currentTarget
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8
          // Rows scrolled under the rail fade out rather than being cut (an attribute, not state: no re-render).
          el.toggleAttribute('data-scrolled', el.scrollTop > 2)
        }}
        className="yj-scrollbar -mx-1 h-44 overflow-y-auto px-1 data-scrolled:[mask-image:linear-gradient(to_bottom,transparent,black_1.5rem)] lg:h-auto lg:min-h-44 lg:flex-[1_1_0px]"
      >
        {events.length ? (
          <ol className="flex flex-col">
            {events.map((event) => (
              <li
                key={event.id}
                className="ke-event grid grid-cols-[auto_auto_minmax(0,1fr)] items-baseline gap-x-3 border-b border-line py-1.5 last:border-b-0"
              >
                <time className="font-mono text-ui-sm text-fg-muted tabular-nums">{clock(event.time)}</time>
                <span aria-hidden className={cn('size-1.5 translate-y-[-1px] self-center rounded-full', DOT[event.tone])} />
                <span className="text-ui text-fg">{event.text}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="grid h-full place-items-center px-6 text-center text-ui text-fg-muted">{copy.empty}</p>
        )}
      </div>
    </div>
  )
}
