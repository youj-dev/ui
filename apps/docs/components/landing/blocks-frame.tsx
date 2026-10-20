'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { useLoop } from '@/components/landing/use-loop'
import { cn } from '@/lib/cn'

/* Blocks, in one small picture: an app frame, assembled from blocks. Its sidebar, its bar, a row of figures and
 * a chart each drop into a dashed slot in reading order (the `smooth`
 * spring, one a step of the deliberate token), the frame holds whole, then
 * they lift off together (`fast`, exit) and land again. The homepage's
 * family tile and its Start section's third way in both draw it. Transform
 * and opacity only; it runs only on screen in a visible tab, and reduced
 * motion shows the frame whole. A picture: whoever renders it hides it from
 * assistive technology. */

/** Bar heights in the chart block, percent of its well; the eighth is the accent. */
const BARS = [38, 52, 44, 66, 58, 80, 62, 92, 74]

/** One block's slot in the frame: a dashed outline that waits, and the block that drops into it. */
function Slot({ placed, className, children }: { placed: boolean; className?: string; children: ReactNode }) {
  const k = useYouj()
  return (
    <div className={cn('relative rounded-[7px] border border-dashed border-line-strong', className)}>
      <motion.div
        className="absolute -inset-px flex rounded-[7px] border border-line bg-surface shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_6%,transparent)]"
        initial={false}
        animate={placed ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={k.reduced ? { duration: 0 } : placed ? k.spring('smooth') : k.tween('fast', 'exit')}
      >
        {children}
      </motion.div>
    </div>
  )
}

/** Steps of the deliberate token in one round: the four blocks land one a step, the frame holds, then they lift off together. */
const ROUND = 9
/** The step the server draws and the round starts from: the frame whole. */
const WHOLE = 3

export function BlocksFrame({ className }: { className?: string }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(WHOLE)
  useLoop(root, k.ms('deliberate'), () => setStep((s) => (s + 1) % ROUND))
  // Step 0 lands the first block and step 3 the last; the round's last step lifts them all.
  const placed = k.reduced ? 4 : step === ROUND - 1 ? 0 : Math.min(4, step + 1)
  return (
    <div
      ref={root}
      // How many blocks are in: the round's state, for whoever reads it (the tests do).
      data-placed={placed}
      className={cn(
        'grid h-[9.75rem] w-[14.5rem] grid-cols-[3rem_minmax(0,1fr)] grid-rows-[1.375rem_1.875rem_minmax(0,1fr)] gap-1.5 rounded-xl border border-line bg-canvas p-1.5 shadow-md',
        className,
      )}
    >
      <Slot placed={placed > 0} className="row-span-3">
        <div className="flex w-full flex-col gap-2 p-2">
          <span className="size-2.5 rounded-[3px] bg-fg" />
          <span className="mt-1 h-1 w-6 rounded-full bg-line-strong" />
          <span className="flex items-center gap-1">
            <span className="particle size-1" />
            <span className="h-1 w-4 rounded-full bg-fg" />
          </span>
          <span className="h-1 w-5 rounded-full bg-line-strong" />
          <span className="h-1 w-4 rounded-full bg-line-strong" />
        </div>
      </Slot>
      <Slot placed={placed > 1}>
        <div className="flex w-full items-center gap-1.5 px-2">
          <span className="h-1.5 w-9 rounded-full bg-fg" />
          <span className="ms-auto h-2.5 w-10 rounded-full border border-line" />
          <span className="h-2.5 w-5 rounded-[3px] bg-fg" />
        </div>
      </Slot>
      <Slot placed={placed > 2}>
        <div className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-[6px] bg-line">
          {[28, 20, 24].map((w) => (
            <span key={w} className="flex flex-col justify-center gap-1 bg-surface px-1.5">
              <span className="h-[3px] w-5 rounded-full bg-line-strong" />
              <span className="h-1.5 rounded-full bg-fg" style={{ width: w }} />
            </span>
          ))}
        </div>
      </Slot>
      <Slot placed={placed > 3}>
        <div className="flex w-full items-end gap-1 px-2 pt-2 pb-1.5">
          {BARS.map((h, i) => (
            <span key={i} className={cn('flex-1 rounded-[2px]', i === 7 ? 'bg-accent' : 'bg-line-strong')} style={{ height: `${h}%` }} />
          ))}
        </div>
      </Slot>
    </div>
  )
}

/**
 * The frame drawn only in the browser, once it's mounted: the server sends its empty box. For a second picture of
 * it on a page that already draws one in full (the homepage's family tile), so the copy costs the page's HTML
 * nothing; it hydrates near the screen (start-stack-on-view), well before it's seen.
 */
export function BlocksFrameLater({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <BlocksFrame className={className} /> : <div className={cn('h-[9.75rem] w-[14.5rem]', className)} />
}
