'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useInView } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import type { LogoCloudLogo } from './data'

/* The grid that trades its logos in place: every few beats one cell (never
 * the one that just changed, never a neighbour's turn twice running) lets
 * its logo drift up and blur away while the next customer not on show rises
 * in from below and comes into focus, so the grid stays calm but never
 * still, and no logo shows twice at once. It rests while the pointer or
 * focus is on the block, while it's off screen or its tab hidden, and when
 * paused. Reduced motion: the first cells, still. */

/** The order the cells take their turns in: spread out, so no two neighbours change one after the other. */
const TURNS = [5, 0, 6, 3, 1, 7, 2, 4]
/** Beats between two changes, in units of the `deliberate` duration. */
const BEATS = 4

export function Wordmark({ name, logo, mark }: LogoCloudLogo) {
  return (
    logo ?? (
      <span className="flex items-center gap-2 whitespace-nowrap">
        {mark && (
          <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
            {mark}
          </svg>
        )}
        <span className="text-lg font-semibold tracking-tight">{name}</span>
      </span>
    )
  )
}

interface CycleProps {
  logos: LogoCloudLogo[]
  cells: number
  /** Changes are held (paused, or the pointer or focus is on the block). */
  held: boolean
}

export function Cycle({ logos, cells, held }: CycleProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const count = Math.min(cells, logos.length)
  const [shown, setShown] = useState(() => logos.slice(0, count).map((logo) => logo.name))
  const next = useRef(count)
  const turn = useRef(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  const running = !k.reduced && !held && inView && visible && logos.length > count
  const period = k.ms('deliberate') * BEATS
  // The cells as shown, for the timer to read without an updater (Strict Mode runs those twice).
  const current = useRef(shown)
  useEffect(() => {
    if (!running) return
    // lint-blocks-allow: a cadence that only paces the swap animation, on the motion tokens' clock
    const timer = setInterval(() => {
      const now = current.current
      const order = TURNS.filter((cell) => cell < now.length)
      const cell = order[turn.current++ % order.length] ?? 0
      // The next customer not on show.
      let candidate = logos[next.current % logos.length]!
      for (let tries = 0; tries < logos.length && now.includes(candidate.name); tries++) candidate = logos[++next.current % logos.length]!
      next.current++
      current.current = now.map((name, i) => (i === cell ? candidate.name : name))
      setShown(current.current)
    }, period)
    return () => clearInterval(timer)
  }, [running, logos, period])

  const byName = new Map(logos.map((logo) => [logo.name, logo]))
  return (
    <MotionFeatures>
      <div ref={ref} aria-hidden className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        {shown.map((name, cell) => {
          const logo = byName.get(name)
          return (
            <div key={cell} className={cn('relative grid h-16 place-items-center overflow-hidden text-fg-muted', cell >= 6 && 'max-sm:hidden')}>
              <AnimatePresence initial={false} mode="popLayout">
                <m.span
                  key={name}
                  className="col-start-1 row-start-1"
                  initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: k.tween('slow', 'enter') }}
                  exit={{ opacity: 0, y: -14, filter: 'blur(6px)', transition: k.tween('base', 'exit') }}
                >
                  {logo && <Wordmark {...logo} />}
                </m.span>
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </MotionFeatures>
  )
}
