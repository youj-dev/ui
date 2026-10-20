'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cubicBezier, motion, useTransform, type Transition } from 'motion/react'
import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import { useYouj } from '@youj/core'
import { CheckIcon, XIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { CurvePlot } from './plot'
import {
  BEZIER_Y_RANGE,
  DURATION_RANGE,
  DURATION_TOKENS,
  durationTokenFor,
  EASE_TOKENS,
  easeTokenFor,
  nearestDuration,
  round,
  tweenValues,
  type Bezier,
} from './state'
import { useDrive } from './use-drive'
import { ControlField, Readouts, snap, Stage, TokenSelect, ValueSlider, Workbench } from './workbench'
import type { ViewProps } from './views'

/* Tweens: a toast comes and goes on the duration and curve you pick, both
 * ways, so an arrival curve on a departure shows why exits have their own.
 * One number (0 hidden, 1 shown) drives its rise and fade, and the plot. */

const TRAVEL = 48

const EASE_HINT = {
  standard: 'Between two resting states: the default.',
  enter: 'Arrivals: at full speed at once, then a long, precise landing.',
  exit: 'Departures: slow to start, then gone. On an arrival it slams into place.',
  emphasized: 'Hero moments: a wind-up, a fast middle and a long landing.',
  linear: 'A constant rate, for loops. Between two states it reads as mechanical.',
  custom: 'Set the two control points below; the plot draws their handles.',
} as const

/** Where the curve moves fastest, and when it's 90% of the way, in milliseconds. */
function feel(ease: (p: number) => number, ms: number) {
  let peak = 0
  let peakAt = 0
  let ninety = ms
  let overshoot = 0
  const steps = 200
  for (let i = 1; i <= steps; i++) {
    const p = i / steps
    const v = ease(p)
    const speed = v - ease((i - 1) / steps)
    if (speed > peak) {
      peak = speed
      peakAt = p
    }
    if (ninety === ms && v >= 0.9) ninety = Math.round(p * ms)
    overshoot = Math.max(overshoot, v - 1)
  }
  return { peakAt: Math.round(peakAt * ms), ninety, overshoot }
}

export function TweensView({ state, update }: ViewProps) {
  const k = useYouj()
  const { ms, curve } = tweenValues(state, k.motionPersonality)
  const curveKey = curve.join(',')
  const ease = useMemo(() => cubicBezier(...(curveKey.split(',').map(Number) as Bezier)), [curveKey])
  const transition: Transition =
    state.duration !== 'custom' && state.ease !== 'custom'
      ? k.tween(state.duration, state.ease)
      : { duration: state.duration === 'custom' ? (ms / 1000) * k.timeScale : k.duration(state.duration), ease: state.ease === 'custom' ? curve : k.ease(state.ease) }

  const [open, setOpen] = useState(true)
  const drive = useDrive(0)
  const y = useTransform(drive.value, (p) => (1 - p) * TRAVEL)

  const latest = useRef({ transition, k })
  latest.current = { transition, k }
  const move = useCallback(
    (to: number) => {
      const { transition, k } = latest.current
      drive.go(to, transition, { scale: k.timeScale, reduced: k.reduced })
    },
    [drive],
  )
  const toggle = (next: boolean) => {
    setOpen(next)
    move(next ? 1 : 0)
  }
  const replay = useCallback(() => {
    drive.jump(open ? 0 : 1)
    move(open ? 1 : 0)
  }, [drive, move, open])

  // The first visit and new settings replay the last move; a new tween replays once it's chosen (a slider: when it lands).
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

  const tokens = motionPersonalities[k.motionPersonality]
  const { peakAt, ninety, overshoot } = feel(ease, ms)
  const horizon = Math.ceil(Math.max(400, ms * 1.25) / 100) * 100
  const choose = (patch: Partial<typeof state>) => {
    update(patch)
    replaySoon()
  }
  const setMs = (v: number) => {
    // Within a step of a token, a slider moving toward it clicks onto it.
    const next = Math.round(snap(v, ms, DURATION_TOKENS.map((t) => tokens.durations[t]), 10))
    const token = durationTokenFor(next, k.motionPersonality)
    update(token ? { duration: token } : { duration: 'custom', durationCustom: next })
  }
  const setPoint = (i: number, v: number) => {
    const next = [...curve] as Bezier
    next[i] = round(v)
    const token = easeTokenFor(next, k.motionPersonality)
    update(token ? { ease: token } : { ease: 'custom', easeCustom: next })
  }
  const near = nearestDuration(ms, k.motionPersonality)
  const isToken = state.duration !== 'custom' && state.ease !== 'custom'

  return (
    <Workbench
      stage={
        <Stage caption="Show and hide the toast, or replay the last move." onReplay={replay}>
          <div className="relative h-60 w-full max-w-[28rem] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <div className="flex h-11 items-center gap-2.5 border-b border-line ps-3.5 pe-2">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2 rounded-full bg-line-strong" />
                <span className="size-2 rounded-full bg-line-strong" />
                <span className="size-2 rounded-full bg-line-strong" />
              </span>
              <span className="truncate text-[12px] text-fg-muted">youj-web / deployments</span>
              <Button size="xs" variant="outline" className="ms-auto" onClick={() => toggle(!open)}>
                {open ? 'Hide toast' : 'Show toast'}
              </Button>
            </div>
            <div aria-hidden className="flex flex-col gap-2.5 p-4">
              <span className="h-2.5 w-2/5 rounded-full bg-well" />
              <span className="h-2.5 w-3/5 rounded-full bg-well" />
              <span className="h-2.5 w-1/2 rounded-full bg-well" />
            </div>
            <motion.div
              style={{ y, opacity: drive.value }}
              inert={!open}
              className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-lg border border-line bg-surface py-2.5 ps-3 pe-1.5 shadow-md sm:inset-x-auto sm:end-3 sm:w-[18.5rem]"
            >
              <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-success text-canvas">
                <CheckIcon size={12} strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">Deployed to production</span>
                <span className="block truncate font-mono text-[11px] text-fg-muted">youj-web · 4f2a91c · 38s</span>
              </span>
              <Button size="icon-xs" variant="ghost" aria-label="Dismiss" onClick={() => toggle(false)}>
                <XIcon />
              </Button>
            </motion.div>
          </div>
        </Stage>
      }
      strip={
        <CurvePlot
          ref={drive.plot}
          sample={(t) => (t >= ms ? 1 : ease(t / ms))}
          horizon={horizon}
          bezier={{ curve, ms }}
          markers={[{ at: ms, label: `ends ${ms}` }]}
          label={`The tween's progress over ${horizon} milliseconds: ${ms} ms on cubic-bezier(${curve.map((v) => round(v)).join(', ')}).`}
        />
      }
      controls={
        <>
          <TokenSelect
            label="Duration"
            value={state.duration}
            onChange={(duration) => choose({ duration })}
            options={[
              ...DURATION_TOKENS.map((t) => ({ value: t, label: t, detail: `${tokens.durations[t]} ms` })),
              { value: 'custom' as const, label: 'custom', detail: `${state.durationCustom} ms` },
            ]}
          />
          <ValueSlider
            label="Milliseconds"
            value={ms}
            display={`${ms} ms`}
            min={DURATION_RANGE[0]}
            max={DURATION_RANGE[1]}
            step={10}
            detents={DURATION_TOKENS.map((t) => ({ value: tokens.durations[t], label: t }))}
            onChange={setMs}
            onCommit={replaySoon}
          />
          <TokenSelect
            label="Curve"
            value={state.ease}
            onChange={(ease) => choose({ ease })}
            hint={EASE_HINT[state.ease]}
            options={[
              ...EASE_TOKENS.map((t) => ({ value: t, label: t, detail: tokens.easings[t].map((v) => round(v)).join(', ') })),
              { value: 'custom' as const, label: 'custom', detail: state.easeCustom.join(', ') },
            ]}
          />
          {state.ease === 'custom' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {(['x1', 'y1', 'x2', 'y2'] as const).map((name, i) => (
                <ValueSlider
                  key={name}
                  label={name}
                  value={curve[i]!}
                  display={curve[i]!.toFixed(2)}
                  min={i % 2 === 0 ? 0 : BEZIER_Y_RANGE[0]}
                  max={i % 2 === 0 ? 1 : BEZIER_Y_RANGE[1]}
                  step={0.01}
                  onChange={(v) => setPoint(i, v)}
                  onCommit={replaySoon}
                />
              ))}
            </div>
          )}
          {isToken ? (
            <p className="flex items-center gap-2 text-[12px] text-fg-muted">
              <span aria-hidden className="particle size-[5px]" />
              <span>Both tokens: they follow the theme’s personality, Speed and reduced motion.</span>
            </p>
          ) : (
            <ControlField label="Custom, not a token">
              <p className="text-[12px] leading-snug text-pretty text-fg-muted">
                Custom values stay the same in every theme. Closest duration: <code className="code-inline">{near}</code>{' '}
                ({tokens.durations[near]} ms).
              </p>
              <Button
                size="xs"
                variant="secondary"
                className="self-start"
                onClick={() => choose({ duration: state.duration === 'custom' ? near : state.duration, ease: state.ease === 'custom' ? 'standard' : state.ease })}
              >
                Use {state.duration === 'custom' ? near : state.duration} · {state.ease === 'custom' ? 'standard' : state.ease}
              </Button>
            </ControlField>
          )}
          <Readouts
            items={[
              { label: '90% there at', value: `${ninety} ms` },
              { label: 'Fastest at', value: `${peakAt} ms` },
              { label: 'Overshoot', value: overshoot > 0.0005 ? `+${(overshoot * 100).toFixed(1)}%` : 'none' },
              { label: 'Travel', value: `${TRAVEL} px` },
            ]}
          />
        </>
      }
    />
  )
}
