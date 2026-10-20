'use client'

import { CheckIcon, SearchIcon } from '@youj/icons'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import { Progress } from '../../../components/ui/progress'
import { Spinner } from '../../../components/ui/spinner'
import { cn } from '../../../lib/utils'
import { useLoop } from './use-loop'

/* Two demos of the day-to-day: a build that skips what it already has, and
 * the command palette finding a command as it's typed. Pictures (inert), on
 * screen only; reduced motion holds the finished frame. */

const STEPS = [
  { label: 'Install dependencies', time: 0.4, cached: true },
  { label: 'Compile 212 routes', time: 1.9 },
  { label: 'Prerender 1,204 pages', time: 0.6, cached: true },
  { label: 'Upload to 38 regions', time: 0.8 },
]

export function BuildsDemo() {
  // Beats 0–3 run each step, 4–6 hold the finished build.
  const { ref, step } = useLoop(7, 900, 6)
  const done = Math.min(step, STEPS.length)
  return (
    <div ref={ref} aria-hidden inert className="flex h-full flex-col justify-end gap-3">
      <ul className="flex flex-col gap-1.5">
        {STEPS.map((s, i) => {
          const state = i < done ? 'done' : i === done ? 'running' : 'pending'
          return (
            <li key={s.label} className="flex h-6 items-center gap-2 text-ui-sm">
              <span className="grid size-4 shrink-0 place-items-center">
                {state === 'done' ? (
                  <span className="grid size-4 place-items-center rounded-full bg-success-subtle text-success-text">
                    <CheckIcon size={10} strokeWidth={3} trigger="mount" />
                  </span>
                ) : state === 'running' ? (
                  <Spinner size={12} className="text-fg-muted" />
                ) : (
                  <span className="size-1.5 rounded-full bg-well" />
                )}
              </span>
              <span className={cn('min-w-0 flex-1 truncate transition-colors yj-duration-fast ease-standard', state === 'pending' ? 'text-fg-muted' : 'text-fg')}>
                {s.label}
              </span>
              {s.cached && (
                <span className={cn('rounded-sm bg-accent-subtle px-1 text-ui-xs text-accent transition-opacity yj-duration-fast', state === 'done' ? 'opacity-100' : 'opacity-0')}>cached</span>
              )}
              <span className={cn('w-9 text-end text-ui-xs text-fg-muted tabular-nums transition-opacity yj-duration-fast', state === 'done' ? 'opacity-100' : 'opacity-0')}>
                {s.time} s
              </span>
            </li>
          )
        })}
      </ul>
      <Progress value={(done / STEPS.length) * 100} aria-label="Build progress" />
      <p className="flex justify-between text-ui-xs text-fg-muted">
        <span>{done === STEPS.length ? 'Ready' : 'Building…'}</span>
        <span className="tabular-nums">{done === STEPS.length ? 'Built in 3.7 s' : `${done} of ${STEPS.length}`}</span>
      </p>
    </div>
  )
}

const COMMANDS = ['Roll back production', 'Tail logs for api', 'Add a domain', 'Promote preview']
const QUERIES = [
  { text: 'roll', hit: 0 },
  { text: 'logs', hit: 1 },
  { text: 'dom', hit: 2 },
]
const HOLD = 7
/* One beat per typed character, then a hold on the match. */
const FRAMES = QUERIES.flatMap((q) => [...Array.from({ length: q.text.length }, (_, n) => ({ q, typed: n + 1 })), ...Array.from({ length: HOLD }, () => ({ q, typed: q.text.length }))])

export function PaletteDemo() {
  const { ref, step } = useLoop(FRAMES.length, 150, QUERIES[0]!.text.length + 1)
  const frame = FRAMES[step]!
  const typed = frame.q.text.slice(0, frame.typed)
  const active = frame.typed >= 2 ? frame.q.hit : 0
  return (
    <div ref={ref} aria-hidden inert className="flex h-full flex-col justify-end gap-3">
      <div className="overflow-hidden rounded-lg border border-line bg-canvas shadow-sm">
        <div className="flex h-9 items-center gap-2 border-b border-line px-3 text-ui-sm">
          <SearchIcon size={14} className="text-fg-muted" />
          <span className="text-fg">{typed}</span>
          <span className="-ms-1.5 h-4 w-px bg-accent" />
          <KbdGroup className="ms-auto">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>
        <div className="relative p-1">
          <span
            className="absolute inset-x-1 top-1 h-8 rounded-md bg-hover transition-transform yj-duration-fast ease-standard"
            style={{ transform: `translateY(${active * 100}%)` }}
          />
          <ul>
            {COMMANDS.map((c, i) => (
              <li key={c} className={cn('relative flex h-8 items-center px-2.5 text-ui-sm transition-colors yj-duration-fast', i === active ? 'text-fg' : 'text-fg-muted')}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
