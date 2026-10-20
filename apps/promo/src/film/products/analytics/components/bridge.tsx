'use client'

import { useRef } from 'react'
import { motion, type Transition } from 'motion/react'
import { useYouj } from '@youj/core'
import { HourglassIcon, ArrowLeftIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@youj/react/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { Eyebrow } from '@youj/react/components/ui/typography'
import { cn } from '@youj/react/lib/utils'
import type { Week } from '../data'
import { driverInk, driverTone, KICKER, signed } from '../format'
import { Num } from './num'
import { scaleFor, ScaleGrid } from './scale'

/* Fig. 2, the bridge: last week's total to this week's, one driver at a
 * time, largest first. Every row is one height (--row: taller on a phone,
 * where a name takes two lines) with a 24px track centered in it and a 16px
 * bar centered in that, so a bar's end and the next row's start line up and
 * the dotted step between them is always the row less the bar. */

const ROW = 'grid h-(--row) grid-cols-[minmax(0,12fr)_minmax(0,13fr)] items-center gap-x-4 px-3 py-2'
const TRACK = 'relative block h-6'

/** The dotted step from where a bar ends down to where the next row's bar starts. */
function Step({ at, delay, dim }: { at: number; delay: number; dim?: boolean }) {
  const k = useYouj()
  return (
    <motion.span
      aria-hidden
      className="absolute top-[calc(100%-0.25rem)] h-[calc(var(--row)-1rem)] border-s border-dotted border-line-strong"
      style={{ insetInlineStart: `${at * 100}%` }}
      initial={k.reduced ? false : { opacity: 0 }}
      animate={{ opacity: dim ? 0.35 : 1 }}
      transition={k.reduced ? { type: false } : { ...k.tween('fast'), delay }}
    />
  )
}

/** Last week's total, or this week's: a figure and a firm mark on the scale. */
function Total({ label, value, at, delay, step }: { label: string; value: number; at: number; delay: number; step?: { at: number; delay: number } }) {
  const k = useYouj()
  return (
    <div className={ROW}>
      <span className="flex flex-col">
        <Eyebrow className={KICKER}>{label}</Eyebrow>
        <span className="text-ui-lg font-semibold text-fg tabular-nums">
          <Num value={value} />
        </span>
      </span>
      <span className={TRACK}>
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-fg rtl:translate-x-1/2"
          style={{ insetInlineStart: `${at * 100}%` }}
          initial={k.reduced ? false : { opacity: 0, scaleY: 0.3 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay }}
        />
        {step && <Step at={step.at} delay={step.delay} />}
      </span>
    </div>
  )
}

/**
 * Each bar starts where the one above it ended, so the bars step across the
 * scale; they grow in that order, from the running total, in the direction
 * of the change. The drivers are a vertical toggle group: one tab stop, the
 * arrows move between them, the selected one is lifted by the group's
 * sliding key, and once one is open the page follows keyboard focus.
 */
export function Bridge({ week, selected, onSelect }: { week: Week; selected: string | null; onSelect: (id: string | null) => void }) {
  const k = useYouj()
  // Whether the last move in the group was a pointer's: a click focuses a row too, but the click does the choosing.
  const pointer = useRef(false)
  const start = week.revenue.previous
  let running = start
  const rows = week.drivers.map((d) => {
    const from = running
    running += d.amount
    return { driver: d, from, to: running }
  })
  const scale = scaleFor([start, ...rows.map((r) => r.to)], 10_000, 2_000)
  const begin = (i: number) => k.duration('instant') + i * k.stagger('loose')
  const grow = (i: number): Transition => (k.reduced ? { type: false } : { ...k.tween('slow', 'emphasized'), delay: begin(i) })
  const landed = (i: number) => begin(i) + k.duration('slow') * 0.7

  return (
    <div className="relative flex flex-col [--row:4.5rem] md:[--row:3.25rem]">
      <ScaleGrid scale={scale} row="grid grid-cols-[minmax(0,12fr)_minmax(0,13fr)] gap-x-4" inset="px-3" />
      <Total key={`last-${week.offset}`} label="Last week" value={start} at={scale.at(start)} delay={0} step={{ at: scale.at(start), delay: begin(0) }} />
      <ToggleGroup
        variant="segmented"
        orientation="vertical"
        aria-label="What moved revenue"
        value={selected ? [selected] : []}
        onValueChange={(value) => onSelect((value[0] as string | undefined) ?? null)}
        onPointerDown={() => (pointer.current = true)}
        onKeyDown={() => (pointer.current = false)}
        // shape: the bridge's rows are the choices, a table of drivers you pick one of, not a control track
        className="w-full data-[variant=segmented]:gap-0 data-[variant=segmented]:rounded-lg data-[variant=segmented]:bg-transparent data-[variant=segmented]:p-0"
      >
        {rows.map(({ driver: d, from, to }, i) => {
          const dim = selected !== null && selected !== d.id
          return (
            <ToggleGroupItem
              key={`${week.offset}-${d.id}`}
              value={d.id}
              aria-label={`${d.name}, ${signed(d.amount)}`}
              onFocus={() => !pointer.current && selected !== null && selected !== d.id && onSelect(d.id)}
              // shape: a driver's row in the bridge, at the table's row height
              className={cn(ROW, 'w-full flex-none text-start font-normal whitespace-normal active:scale-[0.99]', 'data-[variant=segmented]:rounded-md')}
            >
              <span className="flex min-w-0 flex-col">
                <span className={cn('line-clamp-2 text-ui-lg text-fg transition-opacity yj-duration-base ease-standard md:line-clamp-1', dim && 'opacity-60')}>{d.name}</span>
                <span className={cn('text-ui-sm tabular-nums', driverInk(d))}>{signed(d.amount)}</span>
              </span>
              <span className={cn(TRACK, 'transition-opacity yj-duration-base ease-standard', dim && 'opacity-35')}>
                <span className="absolute inset-y-1" style={{ insetInlineStart: `${scale.at(Math.min(from, to)) * 100}%`, width: `${Math.max(Math.abs(scale.at(to) - scale.at(from)) * 100, 0.6)}%` }}>
                  <motion.span
                    aria-hidden
                    className={cn('absolute inset-0 rounded-xs', driverTone(d), d.amount >= 0 ? 'origin-left rtl:origin-right' : 'origin-right rtl:origin-left')}
                    initial={k.reduced ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={grow(i)}
                  />
                </span>
                <Step at={scale.at(to)} delay={landed(i)} dim={dim} />
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <Total key={`this-${week.offset}`} label="This week" value={week.revenue.value} at={scale.at(week.revenue.value)} delay={landed(rows.length - 1)} />
    </div>
  )
}

/** The week in progress has no drivers yet: an honest empty state that leads back to the last memo. */
export function DriversPending({ lastWeek, onBack }: { lastWeek: number; onBack: () => void }) {
  return (
    <Empty className="border border-dashed border-line py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HourglassIcon />
        </EmptyMedia>
        <EmptyTitle>Drivers come when the week closes</EmptyTitle>
        <EmptyDescription>A week’s change is only worth explaining once it has happened. Turn back to week {lastWeek} for the last memo.</EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeftIcon size={14} className="rtl:-scale-x-100" /> Week {lastWeek}
      </Button>
    </Empty>
  )
}
