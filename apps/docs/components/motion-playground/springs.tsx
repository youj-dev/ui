'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, spring as springGenerator, useTransform, type Transition } from 'motion/react'
import { springPhysics } from '@youj/core/internal'
import { motionPersonalities, useYouj } from '@youj/core'
import { BarChartIcon, LayoutDashboardIcon, RocketIcon, SettingsIcon } from '@youj/icons'
import { springParams } from '@youj/core/docs/lib/curves'
import { cn } from '@/lib/cn'
import { CurvePlot } from './plot'
import { nearestSpring, round, SPRING_RANGE, SPRING_TOKENS, springTokenFor, springValues, type SpringValues } from './state'
import { useDrive } from './use-drive'
import { Readouts, snap, Stage, TokenNudge, TokenSelect, ValueSlider, Workbench } from './workbench'
import type { ViewProps } from './views'

/* Springs: a sidebar's selection glides between items on the spring you
 * pick. The same number drives the highlight, the plot's trace and the frame
 * map beside the card (one dot per 60 fps frame of the move: close dots are
 * slow, far ones fast, and dots past the item are overshoot). */

const ITEMS = [
  { label: 'Overview', Icon: LayoutDashboardIcon },
  { label: 'Deployments', Icon: RocketIcon },
  { label: 'Analytics', Icon: BarChartIcon },
  { label: 'Settings', Icon: SettingsIcon },
]
const ITEM = 40
const FRAME = 1000 / 60

/** Motion's own spring, from rest to 1: the generator the animation runs. */
export function springCurve({ visualDuration, bounce }: SpringValues) {
  const gen = springGenerator({ keyframes: [0, 1], visualDuration, bounce })
  let settle = 0
  for (let t = 0; t <= 4000; t += 5) {
    if (gen.next(t).done) {
      settle = t
      break
    }
  }
  let peak = 0
  for (let t = 0; t <= settle; t += 5) peak = Math.max(peak, gen.next(t).value as number)
  return { at: (t: number) => gen.next(t).value as number, settle, overshoot: Math.max(0, peak - 1) }
}

const niceCeil = (ms: number) => Math.ceil(ms / 100) * 100

export function SpringsView({ state, update }: ViewProps) {
  const k = useYouj()
  const values = springValues(state, k.motionPersonality)
  const curve = useMemo(() => springCurve({ visualDuration: values.visualDuration, bounce: values.bounce }), [values.visualDuration, values.bounce])
  const transition: Transition = state.spring === 'custom' ? springPhysics(values, k.timeScale) : k.spring(state.spring)
  const [active, setActive] = useState(2)
  const [previous, setPrevious] = useState(0)
  const drive = useDrive(0)
  const y = useTransform(drive.value, (v) => `${v * 100}%`)

  // The latest settings, for the moves below: they run from events, not renders.
  const latest = useRef({ transition, k })
  latest.current = { transition, k }
  const move = useCallback(
    (to: number) => {
      const { transition, k } = latest.current
      drive.go(to, transition, { scale: k.timeScale, reduced: k.reduced })
    },
    [drive],
  )

  const select = (index: number) => {
    if (index === active && drive.value.get() === index) return
    setPrevious(active)
    setActive(index)
    move(index)
  }

  /** Plays the last move again, from where it started. */
  const replay = useCallback(() => {
    drive.jump(previous)
    move(active)
  }, [drive, move, previous, active])

  // The first visit and new settings play the last move again, a frame later so the stage has painted. A new
  // spring replays once it's chosen: from a menu at once, from a slider when the drag or key press lands.
  const replayRef = useRef(replay)
  replayRef.current = replay
  const pending = useRef(0)
  const replaySoon = useCallback(() => {
    cancelAnimationFrame(pending.current)
    pending.current = requestAnimationFrame(() => replayRef.current())
  }, [])
  useEffect(() => {
    replaySoon()
    return () => cancelAnimationFrame(pending.current)
  }, [replaySoon, k.timeScale, k.reduced])

  const token = state.spring === 'custom' ? null : state.spring
  const near = nearestSpring(values, k.motionPersonality)
  const table = motionPersonalities[k.motionPersonality].springs
  const { stiffness, damping } = springParams(values)
  const horizon = niceCeil(Math.max(600, curve.settle * 1.12))

  const choose = (patch: Partial<typeof state>) => {
    update(patch)
    replaySoon()
  }
  const setValues = (next: SpringValues) => {
    const snapped = springTokenFor(next, k.motionPersonality)
    update(snapped ? { spring: snapped } : { spring: 'custom', springCustom: next })
  }
  // Within two steps of a token's value, a slider moving toward it clicks onto it.
  const detent = (key: keyof SpringValues, v: number) =>
    round(snap(v, values[key], SPRING_TOKENS.map((t) => table[t][key]), 0.02))

  return (
    <Workbench
      stage={
        <Stage caption="Press an item, or replay the last move." onReplay={replay}>
          <div className="flex items-stretch gap-5">
            <div className="w-[13.5rem] rounded-xl border border-line bg-surface p-1.5 shadow-sm">
              <p className="flex items-center gap-2 px-2.5 pt-1.5 pb-2.5 text-[12px] text-fg-muted">
                <span aria-hidden className="grid size-5 place-items-center rounded-[5px] bg-fg text-[10px] font-semibold text-canvas">
                  K
                </span>
                acme / web
              </p>
              <nav aria-label="Demo sidebar" className="relative isolate flex flex-col">
                <motion.span aria-hidden className="absolute inset-x-0 top-0 -z-1 h-10 rounded-md bg-selected ring-1 ring-line" style={{ y }} />
                {ITEMS.map(({ label, Icon }, index) => (
                  <button
                    key={label}
                    type="button"
                    aria-current={index === active ? 'page' : undefined}
                    onClick={() => select(index)}
                    className={cn(
                      'flex h-10 items-center gap-2.5 rounded-md px-3 text-start text-[13px] transition-colors yj-duration-fast ease-standard focus-ring',
                      index === active ? 'font-medium text-fg' : 'text-fg-muted hover:text-fg',
                    )}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
            <FrameMap from={previous} to={active} at={curve.at} settle={curve.settle} reduced={k.reduced} />
          </div>
        </Stage>
      }
      strip={
        <CurvePlot
          ref={drive.plot}
          sample={curve.at}
          horizon={horizon}
          markers={[{ at: values.visualDuration * 1000, label: `feels done ${Math.round(values.visualDuration * 1000)}` }]}
          label={`The spring's progress over ${horizon} milliseconds: it feels done at ${Math.round(values.visualDuration * 1000)} ms${curve.overshoot > 0 ? `, overshoots by ${(curve.overshoot * 100).toFixed(1)}%` : ''} and settles at ${curve.settle} ms.`}
        />
      }
      controls={
        <>
          <TokenSelect
            label="Spring"
            value={state.spring}
            onChange={(spring) => choose({ spring })}
            options={[
              ...SPRING_TOKENS.map((t) => ({ value: t, label: t, detail: `${round(table[t].visualDuration)} s${table[t].bounce ? ` · ${round(table[t].bounce)}` : ''}` })),
              { value: 'custom' as const, label: 'custom', detail: `${round(state.springCustom.visualDuration)} s · ${round(state.springCustom.bounce)}` },
            ]}
          />
          <ValueSlider
            label="Felt duration"
            value={values.visualDuration}
            display={`${values.visualDuration.toFixed(2)} s`}
            min={SPRING_RANGE.visualDuration[0]}
            max={SPRING_RANGE.visualDuration[1]}
            step={0.01}
            detents={SPRING_TOKENS.map((t) => ({ value: table[t].visualDuration, label: t }))}
            onChange={(v) => setValues({ ...values, visualDuration: detent('visualDuration', v) })}
            onCommit={replaySoon}
          />
          <ValueSlider
            label="Bounce"
            value={values.bounce}
            display={values.bounce.toFixed(2)}
            min={SPRING_RANGE.bounce[0]}
            max={SPRING_RANGE.bounce[1]}
            step={0.01}
            detents={[...new Set(SPRING_TOKENS.map((t) => table[t].bounce))].map((b) => ({
              value: b,
              label: SPRING_TOKENS.filter((t) => table[t].bounce === b).join(' '),
            }))}
            onChange={(v) => setValues({ ...values, bounce: detent('bounce', v) })}
            onCommit={replaySoon}
          />
          <TokenNudge
            token={token}
            nearest={near}
            detail={`${round(table[near].visualDuration)} s, ${table[near].bounce ? `bounce ${round(table[near].bounce)}` : 'no bounce'}`}
            onUse={() => choose({ spring: near })}
          />
          <Readouts
            items={[
              { label: 'Overshoot', value: curve.overshoot > 0.0005 ? `+${(curve.overshoot * 100).toFixed(1)}%` : 'none' },
              { label: 'Settles at', value: `${curve.settle} ms` },
              { label: 'Stiffness', value: stiffness.toFixed(0) },
              { label: 'Damping', value: damping.toFixed(1) },
            ]}
          />
        </>
      }
    />
  )
}

/**
 * The move, frame by frame: where the highlight's center is on each 60 fps
 * frame, from rest. Dots crowd where it's slow and spread where it's fast;
 * past the target item they're overshoot.
 */
function FrameMap({ from, to, at, settle, reduced }: { from: number; to: number; at: (t: number) => number; settle: number; reduced: boolean }) {
  const top = 34 // the card's header, above the nav
  const height = top + ITEMS.length * ITEM + 12
  const frames = reduced || from === to ? [] : Array.from({ length: Math.floor(settle / FRAME) + 1 }, (_, i) => from + (to - from) * at(i * FRAME))
  const cy = (pos: number) => top + 6 + pos * ITEM + ITEM / 2
  return (
    <figure className="hidden w-16 flex-col items-center sm:flex" aria-hidden>
      <svg width={40} height={height} viewBox={`0 0 40 ${height}`} className="overflow-visible">
        <line x1={20} x2={20} y1={cy(0) - 8} y2={cy(ITEMS.length - 1) + 8} className="stroke-line-strong" />
        {ITEMS.map((_, i) => (
          <line key={i} x1={12} x2={28} y1={cy(i)} y2={cy(i)} className={i === to ? 'stroke-fg' : 'stroke-line-strong'} />
        ))}
        {frames.map((pos, i) => (
          <circle key={i} cx={20} cy={cy(pos)} r={i === frames.length - 1 ? 3 : 1.75} className={i === frames.length - 1 ? 'fill-accent' : 'fill-fg-muted'} />
        ))}
      </svg>
      <figcaption className="mt-1 text-center font-sans text-[9.5px] leading-tight text-fg-muted">
        {frames.length ? `${frames.length} frames` : 'no frames'}
      </figcaption>
    </figure>
  )
}
