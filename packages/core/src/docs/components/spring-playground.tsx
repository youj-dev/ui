import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'motion/react'
import { springs, type SpringToken } from '../../lib/youj/tokens'
import { useYouj } from '../../lib/youj/provider'
import { springAt, springOvershoot, springParams } from '../lib/curves'
import { Mono, Panel, ReducedNote, Toolbar, useWidth } from './kit'

/* snappy / smooth / settle side by side. The plot is the analytic response
 * (the same maths Motion runs); the dot rides it in sync with the real Motion
 * animation driving the box. Press "Fire" mid-flight to see springs retarget
 * with their current velocity instead of restarting. */

const USAGE: Record<SpringToken, string> = {
  snappy: 'Presses, toggles, icon state flips',
  smooth: 'Layout and position changes',
  settle: 'Success and arrival. The only overshoot.',
}

const names = Object.keys(springs) as SpringToken[]
const W = 240
const H = 132
const PAD = { l: 10, r: 10, t: 18, b: 16 }
const Y_MAX = 1.12
const BOX = 22

function SpringLane({ name, target, horizon }: { name: SpringToken; target: 0 | 1; horizon: number }) {
  const k = useYouj()
  const shape = { ...springs[name], visualDuration: springs[name].visualDuration * k.timeScale }
  const { stiffness, damping, zeta } = springParams(shape)
  const overshoot = springOvershoot(shape)
  const progress = useMotionValue(target)
  const [track, trackWidth] = useWidth<HTMLDivElement>()
  const x = useTransform(progress, (v) => v * Math.max(0, trackWidth - 12 - BOX))
  const dot = useRef<SVGGElement>(null)
  const flight = useRef<{ from: number; start: number; controls?: AnimationPlaybackControls }>({ from: target, start: 0 })

  const sx = (t: number) => PAD.l + (t / horizon) * (W - PAD.l - PAD.r)
  const sy = (v: number) => H - PAD.b - (v / Y_MAX) * (H - PAD.t - PAD.b)

  useEffect(() => {
    const f = flight.current
    f.controls?.stop()
    if (k.reduced) {
      progress.jump(target)
      return
    }
    f.from = progress.get()
    f.start = performance.now()
    f.controls = animate(progress, target, k.spring(name))
    return () => f.controls?.stop()
  }, [target, k, name, progress])

  useEffect(
    () =>
      progress.on('change', (v) => {
        const f = flight.current
        const span = target - f.from
        if (!dot.current || Math.abs(span) < 1e-6) return
        const t = Math.min(horizon, (performance.now() - f.start) / 1000)
        dot.current.style.transform = `translate(${sx(t)}px, ${sy((v - f.from) / span)}px)`
      }),
    [progress, target, horizon],
  )

  const samples = 96
  const d = Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i / samples) * horizon
    return `${i ? 'L' : 'M'}${sx(t).toFixed(2)} ${sy(springAt(shape, t)).toFixed(2)}`
  }).join('')

  return (
    <Panel className="flex flex-col overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-4">
        <span className="text-[14px] font-semibold tracking-tight text-fg">{name}</span>
        <Mono className="text-[11px] text-fg-muted">k.spring('{name}')</Mono>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
        <line x1={PAD.l} x2={W - PAD.r} y1={sy(1)} y2={sy(1)} className="stroke-line-strong" strokeDasharray="3 3" />
        <line x1={PAD.l} x2={W - PAD.r} y1={sy(0)} y2={sy(0)} className="stroke-line" />
        <line
          x1={sx(shape.visualDuration)}
          x2={sx(shape.visualDuration)}
          y1={PAD.t - 6}
          y2={sy(0)}
          className="stroke-fg-subtle"
          strokeDasharray="2 3"
        />
        <text x={sx(shape.visualDuration) + 4} y={PAD.t - 1} className="fill-fg-muted font-mono text-[9px]">
          {Math.round(shape.visualDuration * 1000)}ms
        </text>
        {overshoot > 0 && (
          <text x={W - PAD.r} y={sy(1 + overshoot) - 5} textAnchor="end" className="fill-accent font-mono text-[9px]">
            +{(overshoot * 100).toFixed(1)}%
          </text>
        )}
        <path d={d} className="fill-none stroke-fg" strokeWidth={2} strokeLinejoin="round" />
        <g ref={dot} style={{ transform: `translate(${sx(horizon)}px, ${sy(1)}px)` }}>
          <circle r={8} className="fill-accent-subtle" />
          <circle r={4} className="fill-accent stroke-surface" strokeWidth={1.5} />
        </g>
      </svg>
      <div className="px-4 pb-4 pt-1">
        <div ref={track} className="relative h-9 rounded-lg border border-line bg-well px-[6px]">
          <div className="absolute inset-y-0 left-[6px] right-[6px]">
            <motion.div
              aria-hidden
              style={{ x }}
              className="absolute top-1/2 -mt-[11px] size-[22px] rounded-[6px] bg-fg shadow-[0_1px_2px_rgb(0_0_0/0.2)]"
            />
          </div>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 border-t border-line text-center">
        {[
          ['stiffness', stiffness.toFixed(0)],
          ['damping', damping.toFixed(1)],
          ['ζ', zeta.toFixed(2)],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 py-2.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-line">
            <Mono className="text-[13px] text-fg">{value}</Mono>
            <span className="text-[11px] text-fg-muted">{label}</span>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-4 py-3 text-[12.5px] text-fg-muted">{USAGE[name]}</p>
    </Panel>
  )
}

export function SpringPlayground() {
  const k = useYouj()
  const [target, setTarget] = useState<0 | 1>(0)
  const horizon = Math.max(...names.map((n) => springs[n].visualDuration)) * 2.2 * k.timeScale

  useEffect(() => {
    const id = requestAnimationFrame(() => setTarget(1))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <button
          type="button"
          onClick={() => setTarget((t) => (t ? 0 : 1))}
          className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-3.5 text-[13px] font-semibold text-on-accent transition-[filter,transform] duration-(--yj-duration-instant) ease-standard hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Fire {target ? '←' : '→'}
        </button>
        <span className="text-[12.5px] text-fg-muted">Fire again mid-flight: springs retarget and keep their velocity.</span>
        <ReducedNote />
      </Toolbar>
      <div className="grid gap-3 md:grid-cols-3">
        {names.map((n) => (
          <SpringLane key={n} name={n} target={target} horizon={horizon} />
        ))}
      </div>
    </div>
  )
}
