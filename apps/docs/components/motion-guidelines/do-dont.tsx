'use client'

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useYouj, type Youj } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CheckIcon, MousePointerIcon } from '@youj/icons'
import { InlineCode } from '@/components/docs/inline-code'
import { useLifecycle } from '@/components/motion-playground/use-lifecycle'
import { cn } from '@/lib/cn'
import { DO_DONT, type DoDontId } from '@/lib/motion-guidelines'

/* A guideline as a live pair: the same moment done the Youj way and the
 * way it usually goes wrong. The "don't" side uses values that aren't tokens
 * on purpose, and still follows Speed, so the comparison stays fair. Pairs
 * loop only while on screen; under reduced motion both hold still, and the
 * reduced pair shows its end states. */

/** Ticks every `ms` (scaled by Speed) while `ref` is on screen and motion is allowed. */
function useTick(ms: number, ref: RefObject<Element | null>) {
  const k = useYouj()
  const [tick, setTick] = useState(0)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  useEffect(() => {
    if (!visible || k.reduced) return
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1)
    }, ms * k.timeScale)
    return () => window.clearInterval(id)
  }, [visible, k.reduced, k.timeScale, ms])
  return tick
}

/** An off-token tween for the "don't" side, still on the site's clock. */
const off = (k: Youj, seconds: number): { duration: number; ease: 'easeInOut' } | { duration: 0 } =>
  k.reduced ? { duration: 0 } : { duration: seconds * k.timeScale, ease: 'easeInOut' }

function Side({ kind, caption, children }: { kind: 'do' | 'dont'; caption: string; children: ReactNode }) {
  const good = kind === 'do'
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div aria-hidden className="relative grid h-44 place-items-center overflow-hidden bg-canvas dot-grid">
        {children}
      </div>
      <figcaption className="flex items-start gap-2.5 border-t border-line px-3.5 py-2.5">
        <span
          className={cn(
            'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold',
            good ? 'bg-success-subtle text-success-text' : 'bg-danger-subtle text-danger-text',
          )}
        >
          {good ? 'Do' : 'Don’t'}
        </span>
        <span className="pt-px text-[12.5px] leading-snug text-fg-muted">
          <InlineCode text={caption} />
        </span>
      </figcaption>
    </figure>
  )
}

export function DoDont({ example }: { example: DoDontId }) {
  const root = useRef<HTMLDivElement>(null)
  const pair = DO_DONT[example]
  const { every, Demo } = DEMOS[example]
  // One clock for both sides, so they play the same moment together.
  const tick = useTick(every, root)
  return (
    <div ref={root} className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      <Side kind="do" caption={pair.do}>
        <Demo good tick={tick} />
      </Side>
      <Side kind="dont" caption={pair.dont}>
        <Demo good={false} tick={tick} />
      </Side>
    </div>
  )
}

type DemoProps = { good: boolean; tick: number }

/* 1 · Grow from the trigger. */
function Origin({ good, tick }: DemoProps) {
  const k = useYouj()
  const open = k.reduced || tick % 2 === 1
  const life = useLifecycle(open)
  return (
    <div className="relative h-36 w-56 rounded-lg border border-line bg-surface">
      <span className="absolute end-2 top-2 inline-flex h-6 items-center rounded-md border border-line bg-canvas px-2 text-[11px] font-medium text-fg">Share</span>
      {good ? (
        life.mounted && (
          <div ref={life.ref}>
            <div
              {...life.attrs}
              className="yj-pop absolute end-2 top-10 w-36 rounded-md border border-line bg-overlay p-2 shadow-md [--transform-origin:calc(100%-1.25rem)_-0.25rem] rtl:[--transform-origin:1.25rem_-0.25rem]"
            >
              <Lines />
            </div>
          </div>
        )
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={off(k, 0.36)}
              style={{ transformOrigin: 'center' }}
              className="absolute end-2 top-10 w-36 rounded-md border border-line bg-overlay p-2 shadow-md"
            >
              <Lines />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

function Lines() {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="h-1.5 w-4/5 rounded-full bg-fg-subtle" />
      <span className="h-1.5 w-3/5 rounded-full bg-line-strong" />
      <span className="h-1.5 w-2/3 rounded-full bg-line-strong" />
    </span>
  )
}

/* 2 · Move only what changed. */
const FEED = ['Build passed', 'Preview ready', 'Domain verified', 'Sam commented', 'Priya deployed', 'Cache warmed']

function OnlyChanged({ good, tick }: DemoProps) {
  const k = useYouj()
  // The newest three: each tick one arrives at the top and the oldest leaves.
  const rows = [0, 1, 2].map((i) => ({ id: tick - i, text: FEED[(((tick - i) % FEED.length) + FEED.length) % FEED.length]! }))
  // A box of fixed height, the list at its top: a row leaving at the bottom never re-centers the rest.
  if (good) {
    return (
      <div className="h-[7.25rem] w-52">
        <PresenceList className="flex flex-col gap-1.5">
          {rows.map((row, i) => (
            <PresenceItem key={row.id} className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[11.5px] text-fg">
              <span className={cn('size-1.5 shrink-0 rounded-full', i === 0 ? 'bg-accent' : 'bg-line-strong')} />
              {row.text}
            </PresenceItem>
          ))}
        </PresenceList>
      </div>
    )
  }
  // Keyed on the whole list: every change remounts it, so every row enters again.
  return (
    <ul key={tick} className="h-[7.25rem] w-52 flex flex-col gap-1.5">
      {rows.map((row, i) => (
        <motion.li
          key={row.id}
          initial={k.reduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={k.reduced ? { duration: 0 } : { ...off(k, 0.3), delay: i * 0.09 * k.timeScale }}
          className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[11.5px] text-fg"
        >
          <span className={cn('size-1.5 shrink-0 rounded-full', i === 0 ? 'bg-accent' : 'bg-line-strong')} />
          {row.text}
        </motion.li>
      ))}
    </ul>
  )
}

/* 3 · Hover keeps up with the pointer. */
const ITEMS = ['Open', 'Rename', 'Duplicate', 'Move to…', 'Delete']
const PATH = [0, 1, 2, 3, 4, 3, 2, 1]

function Hover({ good, tick }: DemoProps) {
  const k = useYouj()
  const at = k.reduced ? 1 : PATH[tick % PATH.length]!
  return (
    <div className="relative w-44 rounded-lg border border-line bg-overlay p-1 shadow-sm">
      {ITEMS.map((item, i) => (
        <span
          key={item}
          className={cn('flex h-6 items-center rounded-[5px] px-2 text-[11.5px] transition-colors ease-standard', i === at ? 'bg-hover text-fg' : 'text-fg-muted', good && 'yj-duration-fast')}
          // The "don't": a 400 ms fade, scaled like everything else.
          style={good ? undefined : { transitionDuration: `calc(400ms * var(--yj-time-scale, 1) * var(--yj-motion, 1))` }}
        >
          {item}
        </span>
      ))}
      {/* The pointer glides from row to row, the same on both sides; only the highlight differs. */}
      <MousePointerIcon
        size={14}
        strokeWidth={2}
        className="absolute end-6 top-2.5 text-fg transition-transform yj-duration-fast ease-standard"
        style={{ transform: `translateY(${at * 1.5}rem)` }}
      />
    </div>
  )
}

/* 4 · Keep the meaning, remove the travel. Both sides are the reduced state. */
function Reduced({ good, tick }: DemoProps) {
  const k = useYouj()
  const shown = k.reduced || tick % 2 === 1
  return (
    <div className="relative h-36 w-56 overflow-hidden rounded-lg border border-line bg-surface">
      <span className="absolute start-2 top-2 type-label">reduced motion</span>
      <AnimatePresence>
        {shown && (
          <motion.span
            initial={good ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={good ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 40 }}
            transition={good ? { duration: 0 } : off(k, 0.36)}
            className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md border border-line bg-overlay px-2.5 py-2 text-[11.5px] font-medium text-fg shadow-md"
          >
            <span className="grid size-4 place-items-center rounded-full bg-success text-canvas">
              <CheckIcon size={10} strokeWidth={3} />
            </span>
            Changes saved
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Each pair's demo and how often its moment comes round, in milliseconds at 1× speed. */
const DEMOS: Record<DoDontId, { every: number; Demo: (props: DemoProps) => ReactNode }> = {
  origin: { every: 1400, Demo: Origin },
  'only-changed': { every: 1600, Demo: OnlyChanged },
  hover: { every: 260, Demo: Hover },
  reduced: { every: 1500, Demo: Reduced },
}
