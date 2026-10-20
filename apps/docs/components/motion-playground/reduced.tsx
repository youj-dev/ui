'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, cubicBezier, motion } from 'motion/react'
import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import { YoujProvider, useYouj } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CheckIcon } from '@youj/icons'
import { Button, SegmentedControl, SegmentedControlItem } from '@youj/react'
import { cn } from '@/lib/cn'
import { springCurve } from './springs'
import { INTERACTIONS, type Interaction } from './state'
import { Timeline, type TimelineHandle, type TimelineRow } from './timeline'
import { useClock } from './use-clock'
import { useLifecycle } from './use-lifecycle'
import { ControlField, Stage, TokenSelect, Workbench } from './workbench'
import type { ViewProps } from './views'

/* Reduced motion: one interaction, twice, side by side. Each lane is a
 * YoujProvider of its own, one with motion and one reduced, around the
 * same components. Reduced motion keeps what the motion meant and removes
 * the travel: the timeline shows the same events, with no time between. If
 * the reader has asked for reduced motion, both lanes honor it. */

const INTERACTION_LABEL: Record<Interaction, string> = { insert: 'Add a row', tabs: 'Switch a segment', save: 'Confirm a save', menu: 'Open a menu' }

const KEEPS: Record<Interaction, { keeps: string; drops: string }> = {
  insert: { keeps: 'The new row, where it lands, and the rows below making room.', drops: 'The 6 px rise, the fade and the glide.' },
  tabs: { keeps: 'Which segment is selected, shown and announced.', drops: 'The key’s glide from one segment to the next.' },
  save: { keeps: 'The check and the word “Saved”, announced once.', drops: 'The pop and its one overshoot.' },
  menu: { keeps: 'The menu, where it opens from, and closing with Escape.', drops: 'The scale and the fade.' },
}

/** The motion each interaction replaces, in the site's personality: what moves, for how long, on which curve. */
function motionOf(interaction: Interaction, personality: MotionPersonality): { label: string; ms: number; sample: (t: number) => number; detail: string } {
  const tokens = motionPersonalities[personality]
  if (interaction === 'menu') {
    const ms = tokens.durations.fast
    const fn = cubicBezier(...(tokens.easings.enter as unknown as [number, number, number, number]))
    return { label: 'Menu pops in', ms, sample: (t) => fn(t / ms), detail: 'fast · enter' }
  }
  const token = interaction === 'save' ? 'settle' : 'smooth'
  const curve = springCurve(tokens.springs[token])
  const what = interaction === 'insert' ? 'Rows glide down' : interaction === 'tabs' ? 'Key glides' : 'Badge pops in'
  return { label: what, ms: curve.settle, sample: curve.at, detail: `spring ${token}` }
}

export function ReducedView({ state, update }: ViewProps) {
  const k = useYouj()
  const [run, setRun] = useState(0)
  const interaction = state.interaction
  const timeline = useRef<TimelineHandle>(null)
  const clock = useClock((t) => timeline.current?.at(t))
  const moving = useMemo(() => motionOf(interaction, k.motionPersonality), [interaction, k.motionPersonality])
  const rows = useMemo<TimelineRow[]>(
    () => [
      { label: `Motion: ${moving.label.toLowerCase()}`, start: 0, duration: moving.ms, sample: moving.sample, detail: `${moving.detail} · ${Math.round(moving.ms)} ms` },
      { label: 'Reduced: it’s there', start: 0, duration: 0, sample: () => 1, detail: 'instant · 0 ms' },
    ],
    [moving],
  )

  // Both lanes start on a replay; the playhead with them.
  useEffect(() => {
    if (k.reduced) {
      clock.stop()
      timeline.current?.at(moving.ms)
      return
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => clock.start(k.timeScale, moving.ms)))
    return () => cancelAnimationFrame(id)
  }, [run, interaction, moving, clock, k.reduced, k.timeScale])

  return (
    <Workbench
      stage={
        <Stage caption={k.reduced ? 'Your reduced-motion setting is on, so both lanes are reduced.' : 'The same components, with motion and reduced. Replay to run both.'} onReplay={() => setRun((r) => r + 1)} minHeight={340}>
          <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
            <Lane title="With motion" reducedMotion={k.reduced ? 'always' : 'never'} interaction={interaction} run={run} />
            <Lane title="Reduced motion" reducedMotion="always" interaction={interaction} run={run} />
          </div>
        </Stage>
      }
      strip={<Timeline ref={timeline} rows={rows} horizon={moving.ms * 1.1} label={`With motion, ${moving.label.toLowerCase()} over ${Math.round(moving.ms)} ms. Reduced, the same change happens at once.`} />}
      controls={
        <>
          <TokenSelect
            label="Interaction"
            value={interaction}
            onChange={(next) => update({ interaction: next })}
            options={INTERACTIONS.map((i) => ({ value: i, label: INTERACTION_LABEL[i] }))}
          />
          <ControlField label="Keeps">
            <p className="text-[12px] leading-snug text-pretty text-fg-muted">{KEEPS[interaction].keeps}</p>
          </ControlField>
          <ControlField label="Removes">
            <p className="text-[12px] leading-snug text-pretty text-fg-muted">{KEEPS[interaction].drops}</p>
          </ControlField>
          <p className="border-t border-line pt-4 text-[12px] leading-snug text-pretty text-fg-muted">
            Youj reads it from the OS, or from <code className="code-inline">reducedMotion=&quot;always&quot;</code> on a
            provider. In JavaScript, <code className="code-inline">k.reduced</code>; in CSS, every duration times{' '}
            <code className="code-inline">--yj-motion</code>, which is 0.
          </p>
        </>
      }
    />
  )
}

function Lane({ title, reducedMotion, interaction, run }: { title: string; reducedMotion: 'always' | 'never'; interaction: Interaction; run: number }) {
  const site = useYouj()
  return (
    <section aria-label={title} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2">
        <p className="text-[12.5px] font-medium text-fg">{title}</p>
        <span className="font-mono text-[10.5px] text-fg-muted">reducedMotion=&quot;{reducedMotion}&quot;</span>
      </header>
      {/* A provider resets Speed unless it's given; this one keeps the playground's. */}
      <YoujProvider timeScale={site.timeScale} reducedMotion={reducedMotion}>
        <div className="relative grid min-h-52 place-items-center p-4">
          <Vignette interaction={interaction} run={run} lane={title} />
        </div>
      </YoujProvider>
    </section>
  )
}

const SEED = [
  { id: 'a', text: 'Build passed in 38s' },
  { id: 'b', text: 'Sam opened a preview' },
  { id: 'c', text: 'Domain verified' },
]

function Vignette({ interaction, run, lane }: { interaction: Interaction; run: number; lane: string }) {
  const k = useYouj()
  const [rows, setRows] = useState(SEED)
  const [segment, setSegment] = useState('day')
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)
  const menu = useLifecycle(open)
  const { reset } = menu

  // Every replay: back to the start at once, then the interaction two frames later (a frame to paint the start).
  useEffect(() => {
    setRows(SEED)
    setSegment('day')
    setSaved(false)
    setOpen(false)
    reset()
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (interaction === 'insert') setRows([{ id: `n${run}`, text: 'Priya promoted a41f9e2' }, ...SEED])
        if (interaction === 'tabs') setSegment('month')
        if (interaction === 'save') setSaved(true)
        if (interaction === 'menu') setOpen(true)
      })
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [run, interaction, reset])

  if (interaction === 'insert') {
    return (
      <PresenceList className="flex w-full max-w-60 flex-col gap-1.5">
        {rows.map((row) => (
          <PresenceItem key={row.id} className="flex h-9 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-[12px] text-fg">
            <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', row.id.startsWith('n') ? 'bg-accent' : 'bg-line-strong')} />
            <span className="truncate">{row.text}</span>
          </PresenceItem>
        ))}
      </PresenceList>
    )
  }
  if (interaction === 'tabs') {
    return (
      <SegmentedControl key={run} value={segment} onValueChange={setSegment} aria-label={`Range, ${lane.toLowerCase()}`} sound={false}>
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="month">Month</SegmentedControlItem>
      </SegmentedControl>
    )
  }
  if (interaction === 'save') {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button size="sm" onClick={() => setSaved((s) => !s)}>
          {saved ? 'Edit again' : 'Save changes'}
        </Button>
        <span role="status" className="flex h-8 items-center">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={k.reduced ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={k.reduced ? { duration: 0 } : k.spring('settle')}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success-subtle px-3 text-[12.5px] font-medium text-success-text"
              >
                <CheckIcon size={14} strokeWidth={2.25} />
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
    )
  }
  return (
    <div className="relative h-40 w-full max-w-60">
      <Button size="sm" variant="outline" aria-pressed={open} onClick={() => setOpen((o) => !o)}>
        Share
      </Button>
      {menu.mounted && (
        <div ref={menu.ref} aria-hidden className="absolute inset-x-0 top-10">
          <div
            {...menu.attrs}
            className="yj-pop w-44 rounded-lg border border-line bg-overlay p-1 shadow-md [--transform-origin:1.5rem_-0.25rem] rtl:[--transform-origin:calc(100%-1.5rem)_-0.25rem]"
          >
            {['Copy link', 'Invite people', 'Publish'].map((item, i) => (
              <span key={item} className={cn('flex h-8 items-center rounded-md px-2 text-[12.5px] text-fg', i === 0 && 'bg-hover')}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
