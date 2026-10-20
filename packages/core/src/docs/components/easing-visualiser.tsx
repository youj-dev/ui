import { useEffect, useRef, useState } from 'react'
import { easings, type DurationToken, type EasingToken } from '../../lib/youj/tokens'
import { useYouj } from '../../lib/youj/provider'
import { ease, type Bezier } from '../lib/curves'
import { Eyebrow, Mono, Panel, PlayPauseButton, ReducedNote, Segmented, Toolbar, useInView } from './kit'

/* Every easing token plotted as progress over time. One shared clock drives
 * a dot along each curve and a box along a track, so the curves can be read
 * against each other. Tick marks under each track sit at equal time steps:
 * their spacing is the curve's rhythm. */

const USAGE: Record<EasingToken, string> = {
  standard: 'Between two resting states. The default.',
  enter: 'Arrivals. Full speed at once, long precise landing.',
  exit: 'Departures. Accelerates away, commits.',
  emphasized: 'Hero moves. Wind-up, whip, long landing.',
  linear: 'Constant rate: spinners, marquees, progress.',
}

const SIZE = 200
const PAD = 18
const PLOT = SIZE - PAD * 2
const TICKS = 12
const BOX = 18

const px = (x: number) => PAD + x * PLOT
const py = (y: number) => SIZE - PAD - y * PLOT

function curvePath(c: Bezier) {
  const [x1, y1, x2, y2] = c
  return `M${px(0)} ${py(0)} C${px(x1)} ${py(y1)} ${px(x2)} ${py(y2)} ${px(1)} ${py(1)}`
}

const names = Object.keys(easings) as EasingToken[]
const DURATIONS = ['fast', 'base', 'slow', 'deliberate'] as const satisfies readonly DurationToken[]

export function EasingVisualiser() {
  const k = useYouj()
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>('deliberate')
  const [playing, setPlaying] = useState(true)
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const dots = [...el.querySelectorAll<SVGGElement>('[data-dot]')]
    const heads = [...el.querySelectorAll<SVGLineElement>('[data-head]')]
    const boxes = [...el.querySelectorAll<HTMLElement>('[data-box]')]
    const paint = (x: number) => {
      names.forEach((name, i) => {
        const y = ease(easings[name], x)
        dots[i]!.style.transform = `translate(${px(x)}px, ${py(y)}px)`
        heads[i]!.style.transform = `translateX(${px(x)}px)`
        boxes[i]!.style.transform = `translateX(calc(${y} * (100cqw - ${BOX}px)))`
      })
    }
    if (k.reduced || !playing || !inView) {
      paint(k.reduced ? 1 : 0)
      return
    }
    const run = k.ms(duration)
    const hold = k.ms('deliberate')
    const cycle = hold + run + hold
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const t = (now - start) % cycle
      paint(Math.min(1, Math.max(0, (t - hold) / run)))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [k, duration, playing, inView])

  return (
    <div ref={root} className="flex flex-col gap-4">
      <Toolbar>
        <Segmented
          label="Duration"
          options={DURATIONS}
          value={duration}
          onChange={setDuration}
          format={(d) => (
            <>
              {d} <span className="font-mono text-fg-muted">{Math.round(k.ms(d))}</span>
            </>
          )}
        />
        {!k.reduced && <PlayPauseButton playing={playing} onToggle={() => setPlaying((p) => !p)} />}
        <ReducedNote />
      </Toolbar>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {names.map((name) => {
          const c = easings[name]
          return (
            <Panel key={name} className="flex flex-col overflow-hidden">
              <div className="flex items-baseline justify-between gap-2 px-3.5 pt-3.5">
                <span className="text-[14px] font-semibold tracking-tight text-fg">{name}</span>
              </div>
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[220px]" aria-hidden>
                {[0.25, 0.5, 0.75].map((g) => (
                  <g key={g} className="stroke-line" strokeWidth={1}>
                    <line x1={px(g)} x2={px(g)} y1={py(0)} y2={py(1)} strokeDasharray="2 3" />
                    <line x1={px(0)} x2={px(1)} y1={py(g)} y2={py(g)} strokeDasharray="2 3" />
                  </g>
                ))}
                <rect x={px(0)} y={py(1)} width={PLOT} height={PLOT} className="fill-none stroke-line-strong" strokeWidth={1} />
                {/* control handles */}
                <g className="stroke-fg-subtle" strokeWidth={1}>
                  <line x1={px(0)} y1={py(0)} x2={px(c[0])} y2={py(c[1])} />
                  <line x1={px(1)} y1={py(1)} x2={px(c[2])} y2={py(c[3])} />
                </g>
                <g className="fill-surface stroke-fg-muted" strokeWidth={1.25}>
                  <circle cx={px(c[0])} cy={py(c[1])} r={3} />
                  <circle cx={px(c[2])} cy={py(c[3])} r={3} />
                </g>
                {/* equal-time samples on the curve */}
                <g className="fill-fg-subtle">
                  {Array.from({ length: TICKS + 1 }, (_, i) => {
                    const x = i / TICKS
                    return <circle key={i} cx={px(x)} cy={py(ease(c, x))} r={1.1} />
                  })}
                </g>
                <path d={curvePath(c)} className="fill-none stroke-fg" strokeWidth={2} />
                <line data-head x1={0} x2={0} y1={py(0)} y2={py(1)} className="stroke-accent-line" strokeWidth={1} />
                <g data-dot>
                  <circle r={9} className="fill-accent-subtle" />
                  <circle r={4.5} className="fill-accent stroke-surface" strokeWidth={1.5} />
                </g>
              </svg>
              <div className="px-3.5 pb-1">
                <div className="relative h-10 [container-type:inline-size]">
                  <div className="absolute inset-x-0 top-[calc(50%+12px)] h-px bg-line" />
                  {Array.from({ length: TICKS + 1 }, (_, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="absolute top-[calc(50%+13px)] h-1.5 w-px bg-fg-subtle"
                      style={{ left: `calc(${ease(c, i / TICKS)} * (100% - ${BOX}px) + ${BOX / 2}px)` }}
                    />
                  ))}
                  <div
                    data-box
                    aria-hidden
                    className="absolute top-1/2 -mt-[8px] size-[18px] rounded-[5px] bg-fg shadow-[0_0_0_1px_var(--color-canvas)] will-change-transform"
                  />
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-1.5 border-t border-line px-3.5 py-3">
                <Mono className="text-[10.5px]">[{c.join(', ')}]</Mono>
                <p className="text-[12.5px] leading-snug text-fg-muted">{USAGE[name]}</p>
              </div>
            </Panel>
          )
        })}
      </div>
      <Eyebrow>Dots and ticks mark equal slices of time. Tight spacing is slow, wide spacing is fast.</Eyebrow>
    </div>
  )
}
