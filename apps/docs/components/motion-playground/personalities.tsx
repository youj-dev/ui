'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, cubicBezier, motion } from 'motion/react'
import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import { ThemeScope, useYouj } from '@youj/core'
import { CheckIcon } from '@youj/icons'
import { SegmentedControl, SegmentedControlItem } from '@youj/react'
import { MOMENT_TOKEN } from './code'
import { CurvePlot, type PlotHandle } from './plot'
import { springCurve } from './springs'
import { MOMENTS, round, type Moment } from './state'
import { useClock } from './use-clock'
import { Stage, TokenSelect, Workbench } from './workbench'
import type { ViewProps } from './views'

/* Personalities: one moment played three times at once, each lane inside a
 * ThemeScope with its own motion personality. The lanes run the same code;
 * `useYouj()` and the CSS tokens resolve differently in each. The glide is
 * Youj UI's own SegmentedControl, so the real component follows too. */

const LANES: { motion: MotionPersonality; theme: { motionPersonality: MotionPersonality }; feel: string }[] = [
  { motion: 'precise', theme: { motionPersonality: 'precise' }, feel: 'Fast, confident, lands exactly. The default.' },
  { motion: 'calm', theme: { motionPersonality: 'calm' }, feel: 'About 1.4× longer and soft at both ends. No overshoot.' },
  { motion: 'lively', theme: { motionPersonality: 'lively' }, feel: 'About 15% quicker. Arrivals overshoot a touch.' },
]

const MOMENT_HINT: Record<Moment, string> = {
  glide: 'Youj UI’s SegmentedControl, gliding on `smooth`.',
  arrival: 'A save confirmation landing on `settle`.',
  enter: 'A card arriving on `base` · `enter`.',
  exit: 'A card leaving on `fast` · `exit`.',
}

/** The moment's token in one personality: its curve from rest, how long it runs and how it reads. */
function momentCurve(moment: Moment, personality: MotionPersonality) {
  const tokens = motionPersonalities[personality]
  if (moment === 'glide' || moment === 'arrival') {
    const spring = tokens.springs[moment === 'glide' ? 'smooth' : 'settle']
    const curve = springCurve(spring)
    return { sample: curve.at, span: curve.settle, text: `${round(spring.visualDuration)} s · ${spring.bounce ? `bounce ${round(spring.bounce)}` : 'no bounce'}` }
  }
  const [duration, ease] = moment === 'enter' ? (['base', 'enter'] as const) : (['fast', 'exit'] as const)
  const ms = tokens.durations[duration]
  const curve = tokens.easings[ease]
  const fn = cubicBezier(...(curve as unknown as [number, number, number, number]))
  return { sample: (t: number) => (t >= ms ? 1 : fn(t / ms)), span: ms, text: `${ms} ms · ${curve.map((v) => round(v)).join(', ')}` }
}

export function PersonalitiesView({ state, update }: ViewProps) {
  const k = useYouj()
  const [run, setRun] = useState(0)
  const spans = LANES.map((l) => momentCurve(state.moment, l.motion).span)
  const horizon = Math.ceil((Math.max(...spans) * 1.1) / 100) * 100

  return (
    <Workbench
      stage={
        <Stage caption="The same code in three themes. Replay to run them together." onReplay={() => setRun((r) => r + 1)} minHeight={420}>
          <div className="grid w-full max-w-4xl gap-3 md:grid-cols-3">
            {LANES.map((lane) => (
              <ThemeScope key={lane.motion} theme={lane.theme}>
                <Lane moment={state.moment} run={run} horizon={horizon} feel={lane.feel} />
              </ThemeScope>
            ))}
          </div>
        </Stage>
      }
      controls={
        <>
          <TokenSelect
            label="Moment"
            value={state.moment}
            onChange={(moment) => update({ moment })}
            hint={MOMENT_HINT[state.moment]}
            options={MOMENTS.map((m) => ({ value: m, label: MOMENT_TOKEN[m].label.toLowerCase(), detail: MOMENT_TOKEN[m].call.replace(/^k\./, '') }))}
          />
          <p className="text-[12px] leading-snug text-pretty text-fg-muted">
            A theme picks its personality with one word, <code className="code-inline">motion</code>, and every
            duration, curve, spring and stagger is re-valued. Components keep asking for tokens by name.
          </p>
          <p className="text-[12px] leading-snug text-pretty text-fg-muted">
            This site is on <span className="font-medium text-fg">{k.motionPersonality}</span>, from Graphite and Basalt alike. Pick another preset in a preview’s Theme menu to feel its
            personality there.
          </p>
        </>
      }
    />
  )
}

function Lane({ moment, run, horizon, feel }: { moment: Moment; run: number; horizon: number; feel: string }) {
  const k = useYouj()
  const plot = useRef<PlotHandle>(null)
  const curve = useMemo(() => momentCurve(moment, k.motionPersonality), [moment, k.motionPersonality])
  const clock = useClock((t) => plot.current?.point(t, curve.sample(t)))
  // The glide needs the control mounted on its first segment before it can move.
  const [segment, setSegment] = useState('day')
  const [shown, setShown] = useState(true)

  useEffect(() => {
    setSegment('day')
    setShown(true)
    plot.current?.begin()
    if (k.reduced) {
      plot.current?.rest()
      if (moment === 'glide') setSegment('month')
      if (moment === 'exit') setShown(false)
      return
    }
    // Two frames: the control places its key on Day, then the change reads as a glide.
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (moment === 'glide') setSegment('month')
        if (moment === 'exit') setShown(false)
        clock.start(k.timeScale, curve.span)
      })
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
      clock.stop()
    }
  }, [run, moment, k.motionPersonality, k.timeScale, k.reduced, curve, clock])

  const enter = k.reduced ? { duration: 0 } : k.tween('base', 'enter')

  return (
    <section aria-label={`${k.motionPersonality} personality`} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex flex-col gap-0.5 border-b border-line px-3.5 py-2.5">
        <p className="font-mono text-[12.5px] font-medium text-fg">{k.motionPersonality}</p>
        <p className="text-[11.5px] leading-snug text-fg-muted">{feel}</p>
      </header>
      <div className="relative grid h-28 place-items-center px-3.5">
        {moment === 'glide' && (
          <SegmentedControl key={`${run}`} value={segment} onValueChange={setSegment} aria-label={`Range, ${k.motionPersonality}`} sound={false}>
            <SegmentedControlItem value="day">Day</SegmentedControlItem>
            <SegmentedControlItem value="week">Week</SegmentedControlItem>
            <SegmentedControlItem value="month">Month</SegmentedControlItem>
          </SegmentedControl>
        )}
        {moment === 'arrival' && (
          <motion.span
            key={run}
            initial={k.reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={k.reduced ? { duration: 0 } : k.spring('settle')}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success-subtle px-3 text-[12.5px] font-medium text-success-text"
          >
            <CheckIcon size={14} strokeWidth={2.25} />
            Saved
          </motion.span>
        )}
        {moment === 'enter' && (
          <motion.div
            key={run}
            initial={k.reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enter}
            className="w-full max-w-48 rounded-lg border border-line bg-canvas p-3 shadow-sm"
          >
            <span className="block h-2 w-3/5 rounded-full bg-fg-subtle" />
            <span className="mt-2 block h-2 w-4/5 rounded-full bg-line-strong" />
          </motion.div>
        )}
        {moment === 'exit' && (
          <AnimatePresence>
            {shown && (
              <motion.div
                exit={{ opacity: 0, y: 16 }}
                transition={k.reduced ? { duration: 0 } : k.tween('fast', 'exit')}
                className="w-full max-w-48 rounded-lg border border-line bg-canvas p-3 shadow-sm"
              >
                <span className="block h-2 w-3/5 rounded-full bg-fg-subtle" />
                <span className="mt-2 block h-2 w-4/5 rounded-full bg-line-strong" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      <div className="border-t border-line bg-canvas px-2 pt-1">
        <CurvePlot
          ref={plot}
          sample={curve.sample}
          horizon={horizon}
          height={104}
          label={`${k.motionPersonality}: ${curve.text}, done at ${Math.round(curve.span)} ms.`}
        />
      </div>
      <p className="border-t border-line px-3.5 py-2 font-mono text-[11px] text-fg-muted tabular-nums">{curve.text}</p>
    </section>
  )
}
