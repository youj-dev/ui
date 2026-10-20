'use client'

import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { AvatarStack } from '../../../components/ui/avatar-stack'
import { Badge } from '../../../components/ui/badge'
import { Sparkline } from '../../../components/ui/sparkline'
import { cn } from '../../../lib/utils'
import { useLoop } from './use-loop'

/* Three ambient demos. Each is a picture (inert, hidden from assistive tech:
 * its tile's text says the same), plays only while on screen and holds its
 * representative frame under reduced motion. */

/* A coarse world, one character per dot: `x` is land, `o` a region. */
const WORLD = [
  '...xxxx.....xxxxxxxx...',
  '..xxxxxo...xxoxxxxxxxx.',
  '.xxoxxx....xxxxxxxoxxx.',
  '..xxxx.....xoxxxxxxxx..',
  '...xox......xxx..xoxx..',
  '....xx......xox....xx..',
  '.....xo......x.....xox.',
  '.....x.............xx..',
]

export function RegionsDemo() {
  const k = useYouj()
  const { ref, running } = useLoop(1, 1000)
  let region = 0
  return (
    <div ref={ref} aria-hidden inert className="flex h-full flex-col justify-between gap-4">
      <MotionFeatures>
        <div className="grid grid-cols-[repeat(23,minmax(0,1fr))] gap-1 px-1">
          {WORLD.flatMap((row, r) =>
            [...row].map((cell, c) => {
              if (cell === '.') return <span key={`${r}-${c}`} className="aspect-square" />
              if (cell === 'x') return <span key={`${r}-${c}`} className="aspect-square rounded-full bg-well" />
              const i = region++
              return (
                <span key={`${r}-${c}`} className="relative aspect-square rounded-full bg-accent">
                  {running && (
                    <m.span
                      className="absolute inset-0 rounded-full bg-accent"
                      initial={{ scale: 1, opacity: 0.55 }}
                      animate={{ scale: 3.2, opacity: 0 }}
                      transition={{ ...k.tween('deliberate', 'enter'), duration: k.duration('deliberate') * 3, repeat: Infinity, delay: i * k.duration('slow') }}
                    />
                  )}
                </span>
              )
            }),
          )}
        </div>
      </MotionFeatures>
      <div className="flex items-end justify-between gap-3">
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight text-fg tabular-nums">
            <Counter value={38} mode="roll" duration="deliberate" />
          </span>
          <span className="text-ui-sm text-fg-muted">regions</span>
        </p>
        <Badge variant="secondary" className="tabular-nums">
          p50 38 ms
        </Badge>
      </div>
    </div>
  )
}

const REVIEWERS = [
  { id: 'gh', name: 'Grace Hopper' },
  { id: 'al', name: 'Ada Lovelace' },
  { id: 'ks', name: 'Katherine Johnson' },
  { id: 'ml', name: 'Margaret Hamilton' },
]

const PINS = [
  { at: 'top-[22%] start-[18%]', who: 'GH', note: 'Can this be 2px taller?' },
  { at: 'top-[58%] start-[62%]', who: 'AL', note: 'Ship it, the copy reads well.' },
]

export function ReviewDemo() {
  const { ref, step } = useLoop(5, 1400, 3)
  return (
    <div ref={ref} aria-hidden inert className="flex h-full flex-col gap-4">
      <div className="relative min-h-32 flex-1 rounded-lg border border-line bg-canvas p-3">
        <div className="flex flex-col gap-2">
          <span className="h-2.5 w-1/2 rounded-full bg-well" />
          <span className="h-2 w-4/5 rounded-full bg-well" />
          <span className="h-2 w-2/3 rounded-full bg-well" />
          <span className="mt-1 h-6 w-16 rounded-md bg-accent" />
        </div>
        {PINS.map((pin, i) => {
          const shown = step >= i + 1 && step < 4
          const open = step === i + 2 || (i === 1 && step === 3)
          return (
            <span key={pin.who} className={cn('absolute flex items-start gap-1.5', pin.at)}>
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full rounded-ss-none bg-accent text-[0.625rem] font-semibold text-on-accent shadow-sm',
                  'transition-[scale,opacity] yj-duration-base ease-enter',
                  shown ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                )}
              >
                {pin.who}
              </span>
              <span
                className={cn(
                  'max-w-36 rounded-md border border-line bg-surface px-2 py-1 text-ui-xs text-fg shadow-sm',
                  'transition-[opacity,translate] yj-duration-base ease-enter',
                  shown && open ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 rtl:translate-x-1',
                )}
              >
                {pin.note}
              </span>
            </span>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <AvatarStack users={REVIEWERS} size="sm" max={3} label="Reviewers" />
        <span className="text-ui-sm text-fg-muted tabular-nums">5 comments</span>
      </div>
    </div>
  )
}

const TTFB = [92, 88, 90, 81, 84, 72, 70, 66, 61, 58, 52, 47, 41, 38]

export function InsightsDemo() {
  return (
    <div aria-hidden inert className="flex h-full flex-col justify-end gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-fg tabular-nums">
            <Counter value={38} from={92} duration="deliberate" />
          </span>
          <span className="text-ui-sm text-fg-muted">ms TTFB</span>
        </p>
        <Badge variant="success" className="tabular-nums">
          −59% since March
        </Badge>
      </div>
      <Sparkline data={TTFB} className="h-16 w-full" />
      <div className="flex justify-between text-ui-xs text-fg-muted tabular-nums">
        <span>dpl_31aa</span>
        <span>dpl_8c1e</span>
      </div>
    </div>
  )
}
