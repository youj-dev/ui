'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { cubicBezier } from 'motion/react'
import { motionPersonalities, type DurationToken, type EasingToken, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import { useYouj } from '@youj/core'
import { CheckIcon, LinkIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { cn } from '@/lib/cn'
import { PRESET_TIMING } from './code'
import { CurvePlot, type PlotHandle } from './plot'
import { PRESETS, type Preset } from './state'
import { useClock } from './use-clock'
import { useLifecycle } from './use-lifecycle'
import { Readouts, Stage, TokenSelect, Workbench } from './workbench'
import type { ViewProps } from './views'

/* Presence: the overlay presets on an app window, wearing the real preset
 * classes through Base UI's own lifecycle attributes. In and out are plotted
 * on one scale, so the way out reads as the shorter bar it is. Toggle
 * mid-flight and the CSS transition turns back from where it is. */

const TRIGGER: Record<Preset, string> = { 'yj-pop': 'Share', 'yj-dialog': 'Rename', 'yj-sheet-end': 'Activity', 'yj-toast': 'Deploy' }

/** One phase of a preset in this personality: its tokens, milliseconds and curve. */
function phaseOf([duration, ease]: [string, string], personality: MotionPersonality) {
  const tokens = motionPersonalities[personality]
  const ms = tokens.durations[duration as DurationToken]
  const curve = tokens.easings[ease as EasingToken]
  const fn = cubicBezier(...(curve as unknown as [number, number, number, number]))
  return { ms, label: `${duration} · ${ease}`, sample: (t: number) => (t >= ms ? 1 : fn(t / ms)) }
}

export function PresenceView({ state, update }: ViewProps) {
  const k = useYouj()
  const preset = state.preset
  const timing = PRESET_TIMING[preset]
  const enter = useMemo(() => phaseOf(timing.enter, k.motionPersonality), [timing, k.motionPersonality])
  const exit = useMemo(() => phaseOf(timing.exit, k.motionPersonality), [timing, k.motionPersonality])
  const horizon = Math.ceil((Math.max(enter.ms, exit.ms) * 1.15) / 50) * 50

  const [open, setOpen] = useState(false)
  const life = useLifecycle(open)
  const inPlot = useRef<PlotHandle>(null)
  const outPlot = useRef<PlotHandle>(null)
  const inClock = useClock((t) => inPlot.current?.point(t, enter.sample(t)))
  const outClock = useClock((t) => outPlot.current?.point(t, exit.sample(t)))
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => timers.current.splice(0).forEach(clearTimeout)

  // The plots follow the phases as the lifecycle enters them: In as it mounts, Out as it starts to leave.
  const phase = life.phase
  useEffect(() => {
    if (k.reduced) {
      inPlot.current?.rest()
      outPlot.current?.rest()
      return
    }
    if (phase === 'starting') {
      inPlot.current?.begin()
      inClock.start(k.timeScale, enter.ms)
    } else if (phase === 'ending') {
      outPlot.current?.begin()
      outClock.start(k.timeScale, exit.ms)
    }
  }, [phase, k.reduced, k.timeScale, enter.ms, exit.ms, inClock, outClock])

  const toggle = useCallback((next: boolean) => {
    timers.current.splice(0).forEach(clearTimeout)
    setOpen(next)
  }, [])

  /** Open from closed, hold, and close: the whole preset once. */
  const { reset } = life
  const replay = useCallback(() => {
    timers.current.splice(0).forEach(clearTimeout)
    reset()
    setOpen(false)
    const scale = k.timeScale
    timers.current.push(
      setTimeout(() => setOpen(true), 60),
      setTimeout(() => setOpen(false), 60 + (enter.ms + 900) * scale),
    )
  }, [reset, k.timeScale, enter.ms])

  const replayRef = useRef(replay)
  replayRef.current = replay
  useEffect(() => {
    replayRef.current()
    return clearTimers
  }, [preset, k.timeScale, k.reduced, k.motionPersonality])

  // Escape closes, as it would the real thing.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggle(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, toggle])

  return (
    <Workbench
      stage={
        <Stage caption={`Open and close it, or replay the whole ${preset}.`} onReplay={replay} minHeight={340}>
          <div className="relative h-64 w-full max-w-[30rem] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <div className="flex h-11 items-center gap-2.5 border-b border-line ps-3.5 pe-2">
              <span aria-hidden className="grid size-5 place-items-center rounded-[5px] bg-fg text-[10px] font-semibold text-canvas">
                K
              </span>
              <span className="truncate text-[12px] text-fg-muted">youj-web</span>
              <Button size="xs" variant="outline" className="ms-auto" aria-pressed={open} onClick={() => toggle(!open)}>
                {TRIGGER[preset]}
              </Button>
            </div>
            <div aria-hidden className="grid grid-cols-3 gap-2.5 p-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="flex h-16 flex-col justify-end gap-1.5 rounded-lg border border-line bg-canvas p-2.5">
                  <span className="h-1.5 w-3/5 rounded-full bg-line-strong" />
                  <span className="h-1.5 w-4/5 rounded-full bg-well" />
                </span>
              ))}
              <span className="col-span-3 h-2 w-2/5 rounded-full bg-well" />
              <span className="col-span-3 h-2 w-3/5 rounded-full bg-well" />
            </div>
            {life.mounted && (
              <div ref={life.ref} aria-hidden className="absolute inset-0 top-11">
                <Specimen preset={preset} attrs={life.attrs} />
              </div>
            )}
          </div>
        </Stage>
      }
      strip={
        <div className="grid gap-x-4 sm:grid-cols-2">
          <PhasePlot title="In" phase={enter} horizon={horizon} plot={inPlot} />
          <PhasePlot title="Out" phase={exit} horizon={horizon} plot={outPlot} />
        </div>
      }
      controls={
        <>
          <TokenSelect
            label="Preset"
            value={preset}
            onChange={(p) => update({ preset: p })}
            hint={`On ${timing.part}.`}
            options={PRESETS.map((p) => ({ value: p, label: p, detail: `${PRESET_TIMING[p].enter[0]} → ${PRESET_TIMING[p].exit[0]}` }))}
          />
          <p className="text-[12px] leading-snug text-pretty text-fg-muted">
            It {timing.moves}. Every Youj UI overlay already wears one; on your own Base UI parts, the class is all it takes.
          </p>
          <Readouts
            items={[
              { label: 'In', value: `${enter.ms} ms` },
              { label: 'Out', value: `${exit.ms} ms` },
              { label: 'In curve', value: timing.enter[1] },
              { label: 'Out curve', value: timing.exit[1] },
            ]}
          />
        </>
      }
    />
  )
}

function PhasePlot({ title, phase, horizon, plot }: { title: string; phase: ReturnType<typeof phaseOf>; horizon: number; plot: RefObject<PlotHandle | null> }) {
  return (
    <div className="min-w-0">
      <p className="flex items-baseline justify-between gap-3 pt-1 text-[12px]">
        <span className="font-medium text-fg">{title}</span>
        <span className="font-mono text-[11px] text-fg-muted">
          {phase.label} · {phase.ms} ms
        </span>
      </p>
      <CurvePlot ref={plot} sample={phase.sample} horizon={horizon} height={120} markers={[{ at: phase.ms, label: `${phase.ms}` }]} label={`${title}: ${phase.label}, ${phase.ms} ms.`} />
    </div>
  )
}

/** The overlay itself, in the preset's classes, sized to the window. */
function Specimen({ preset, attrs }: { preset: Preset; attrs: Record<string, string | undefined> }) {
  if (preset === 'yj-pop') {
    return (
      <div
        {...attrs}
        className={cn(
          'yj-pop absolute end-2 top-1.5 w-56 rounded-lg border border-line bg-overlay p-3 shadow-md',
          '[--transform-origin:calc(100%-1.75rem)_-0.25rem] rtl:[--transform-origin:1.75rem_-0.25rem]',
        )}
      >
        <p className="text-[12.5px] font-medium text-fg">Share preview</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-fg-muted">Anyone with the link can view this deployment.</p>
        <span className="mt-2.5 flex h-7 items-center gap-1.5 rounded-md border border-line bg-canvas px-2 font-mono text-[10.5px] text-fg-muted">
          <LinkIcon size={12} />
          youj-web.vercel.app
        </span>
      </div>
    )
  }
  if (preset === 'yj-toast') {
    // The variables Base UI's toast manager writes, for one toast at the front of the stack.
    const vars = {
      '--toast-index': 0,
      '--toast-offset-y': '0px',
      '--toast-height': '3.5rem',
      '--toast-frontmost-height': '3.5rem',
      '--toast-swipe-movement-x': '0px',
      '--toast-swipe-movement-y': '0px',
    } as CSSProperties
    return (
      <div className="absolute end-3 bottom-3 w-[min(17rem,calc(100%-1.5rem))]">
        <div {...attrs} style={vars} className="yj-toast rounded-xl border border-line bg-overlay shadow-lg">
          <div className="flex h-full items-center gap-2.5 px-3">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success text-canvas">
              <CheckIcon size={12} strokeWidth={2.5} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium text-fg">Deployed to production</span>
              <span className="block truncate font-mono text-[10.5px] text-fg-muted">youj-web · 38s</span>
            </span>
          </div>
        </div>
      </div>
    )
  }
  const sheet = preset === 'yj-sheet-end'
  return (
    <>
      <div {...attrs} className="yj-backdrop absolute inset-0 bg-scrim" />
      {sheet ? (
        <div {...attrs} className="yj-sheet-end absolute inset-y-0 end-0 flex w-[min(15rem,75%)] flex-col gap-2 border-s border-line bg-overlay p-4 shadow-lg">
          <p className="text-[13px] font-medium text-fg">Activity</p>
          {['Priya promoted a41f9e2', 'Build passed in 38s', 'Sam opened a preview'].map((line) => (
            <span key={line} className="flex items-center gap-2 text-[11.5px] text-fg-muted">
              <span className="size-1.5 shrink-0 rounded-full bg-line-strong" />
              {line}
            </span>
          ))}
        </div>
      ) : (
        <div {...attrs} className="yj-dialog absolute inset-x-0 top-6 mx-auto w-[min(18rem,calc(100%-2rem))] rounded-xl border border-line bg-overlay p-4 shadow-lg">
          <p className="text-[13px] font-medium text-fg">Rename project</p>
          <p className="mt-0.5 text-[11.5px] text-fg-muted">The new name shows in every URL.</p>
          <span className="mt-3 flex h-8 items-center rounded-md border border-line-control bg-canvas px-2.5 text-[12px] text-fg">youj-web</span>
          <span className="mt-3 flex justify-end gap-1.5">
            <span className="rounded-md border border-line px-2.5 py-1 text-[11.5px] text-fg">Cancel</span>
            <span className="rounded-md bg-accent px-2.5 py-1 text-[11.5px] text-on-accent">Rename</span>
          </span>
        </div>
      )}
    </>
  )
}
