import type { CSSProperties, ReactNode } from 'react'
import { spring as motionSpring } from 'motion'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { ScrambleText } from '@youj/motion'
import { StarIcon } from '@youj/icons'
import type { Palette } from '@youj/core/lib/youj/theme'
import { mix, tween } from '../../lib/timing'
import { useFrame } from '../../sim/simulation'
import { PRESETS, TOKENS_BEATS as B, type PresetId } from '../beats'
import { Camera } from '../camera'
import { Keylines } from '../keylines'
import { mixTuning, tuningOf, type Scheme, type Tuning } from '../palette'

/* The tokens, as a type foundry would set a specimen: the contract a theme
 * is made of, on one sheet. Type (the sans at display size, and the UI
 * scale), colour (the neutral ramp and the four inks, with their OKLCH
 * lightness), form (radius across the control heights), motion (the five
 * durations running, the enter curve and the settle spring) and the icon
 * grid. The sheet then retunes, Basalt to Graphite to Brutal and home: every
 * value on it is read off the preset and moves to the next one's, and the
 * whole frame (the HUD included) is painted in the palette of the moment.
 * As it comes home the camera pushes into the icon grid, where the next
 * chapter picks it up. */

/* ── Route ─────────────────────────────────────────────────────────────── */

const scheme = (id: PresetId): Scheme => PRESETS.find((p) => p.id === id)!.scheme

export interface Stop {
  from: PresetId
  to: PresetId
  /** 0 → 1 across the retune. */
  t: number
}

/** Where the specimen is on its route at `frame` (its own frames). */
export function stopAt(frame: number): Stop {
  let from: PresetId = 'basalt'
  for (const leg of B.route) {
    if (frame < leg.at) return { from, to: from, t: 0 }
    const t = tween(frame, leg.at, B.retune, 'emphasized')
    if (t < 1) return { from, to: leg.to, t }
    from = leg.to
  }
  return { from, to: from, t: 0 }
}

const tunings = new Map<PresetId, Tuning>()
function tuning(id: PresetId) {
  let found = tunings.get(id)
  if (!found) tunings.set(id, (found = tuningOf(id, scheme(id))))
  return found
}

/** The tuning of the moment: the frame's whole palette, motion, radius and density. */
export function tuningAt(frame: number): Tuning {
  const { from, to, t } = stopAt(frame)
  return mixTuning(tuning(from), tuning(to), t)
}

/* ── Layout (stage px) ─────────────────────────────────────────────────── */

const LEFT = 72
const RIGHT = 1368
const TOP = 104
const RULE = 482
const LOW = 510
/** The icon block's drawing board: where the camera ends up, and what the icons chapter matches. */
export const ICON_BOX = { x: 1152, y: 544, size: 208 }
/** The size the icon board fills the frame at, as the icons chapter opens. */
export const MACRO_SIZE = 480

const oklch = (c: readonly number[]) => `oklch(${c[0]} ${c[1]} ${c[2]})`
const fixed = (n: number, digits: number) => n.toFixed(digits)

export function SpecimenScene({ leaveAt }: { leaveAt: number }) {
  const frame = useFrame()
  const stop = stopAt(frame)
  const tune = tuningAt(frame)
  const build = (i: number) => tween(frame, B.build + 6 + i * 7, 'slow', 'enter')

  // The push: toward the icon board until it fills the frame.
  const push = tween(frame, B.push, B.pushLength, 'emphasized')
  const scale = mix(1, MACRO_SIZE / ICON_BOX.size, push)
  const cx = ICON_BOX.x + ICON_BOX.size / 2
  const cy = ICON_BOX.y + ICON_BOX.size / 2
  const shot = { scale, x: (720 - cx) * push, y: (405 - cy) * push, originX: cx / 1440, originY: cy / 810 }
  // Everything but the icon board clears as the camera arrives.
  const rest = 1 - tween(frame, B.push + B.pushLength * 0.35, B.pushLength * 0.55, 'exit')
  const out = tween(frame, leaveAt, 'base', 'exit')

  return (
    <div className="absolute inset-0" style={{ opacity: 1 - out }}>
      <ThemeName stop={stop} frame={frame} rest={rest} />
      <Camera shot={shot}>
        <div style={{ opacity: rest }}>
          <TypeBlock stop={stop} build={build} />
          <ColourBlock palette={tune.palette} build={build} />
          <Rule build={build(3)} />
          <FormBlock tune={tune} build={build} />
          <MotionBlock tune={tune} frame={frame} build={build} personality={stop.t < 0.5 ? stop.from : stop.to} />
          <Header x={ICON_BOX.x} y={LOW} label="Icon" detail="24 · 1.5" show={build(7)} width={ICON_BOX.size} />
        </div>
      </Camera>
      {/* Drawn at its size on screen, outside the camera, so it lands on exactly the pixels the icons chapter opens on. */}
      <IconBoard show={build(8)} x={cx + shot.x} y={cy + shot.y} size={ICON_BOX.size * scale} />
    </div>
  )
}

/* ── Pieces ────────────────────────────────────────────────────────────── */

function Header({ x, y, label, detail, show, width }: { x: number; y: number; label: string; detail?: string; show: number; width?: number }) {
  return (
    <p
      className="absolute flex items-center gap-2 font-mono text-[10.5px] leading-none tracking-[0.14em] text-fg-muted uppercase"
      style={{ left: x, top: y, width, opacity: show, transform: `translateY(${(1 - show) * 6}px)` }}
    >
      <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
      {label}
      {detail && <span className="ms-auto tracking-[0.06em] text-fg-subtle normal-case">{detail}</span>}
    </p>
  )
}

function Rule({ build }: { build: number }) {
  return (
    <span
      aria-hidden
      className="absolute h-px origin-left bg-line"
      style={{ left: LEFT, top: RULE, width: RIGHT - LEFT, transform: `scaleX(${build})` }}
    />
  )
}

/** The theme on show, top right, where the HUD's caption sits on the left. */
function ThemeName({ stop, frame, rest }: { stop: Stop; frame: number; rest: number }) {
  const id = stop.t < 0.5 ? stop.from : stop.to
  const show = tween(frame, 20, 'slow', 'enter') * rest
  return (
    <p
      className="absolute flex items-center gap-2.5 font-mono text-[11px] leading-none tracking-[0.14em] text-fg-subtle uppercase"
      style={{ right: 32, top: 26, height: 16, opacity: show }}
    >
      <ScrambleText className="text-fg-muted" tick="fast">
        {`${internalPresetById(id).name} · ${scheme(id)}`}
      </ScrambleText>
    </p>
  )
}

/** Text in two fonts at once, crossfading from one theme's face to the next. */
function Faces({ stop, children, className, style }: { stop: Stop; children: ReactNode; className?: string; style?: CSSProperties }) {
  const a = internalPresetById(stop.from).fonts.sans
  const b = internalPresetById(stop.to).fonts.sans
  if (a === b) return <span className={className} style={{ ...style, fontFamily: a }}>{children}</span>
  const t = Math.min(1, Math.max(0, (stop.t - 0.25) / 0.5))
  return (
    <span className={`relative inline-grid ${className ?? ''}`} style={style}>
      <span className="col-start-1 row-start-1" style={{ fontFamily: a, opacity: 1 - t, filter: `blur(${t * 3}px)` }}>
        {children}
      </span>
      <span aria-hidden className="col-start-1 row-start-1" style={{ fontFamily: b, opacity: t, filter: `blur(${(1 - t) * 3}px)` }}>
        {children}
      </span>
    </span>
  )
}

function TypeBlock({ stop, build }: { stop: Stop; build: (i: number) => number }) {
  const id = stop.t < 0.5 ? stop.from : stop.to
  const face = internalPresetById(id).fonts.sans.split(',')[0]!.replace(/'/g, '')
  const scale = [
    { name: 'ui-lg', size: 14, line: 20 },
    { name: 'ui', size: 13, line: 20 },
    { name: 'ui-sm', size: 12, line: 16 },
    { name: 'ui-xs', size: 11, line: 16 },
  ]
  return (
    <>
      <Header x={LEFT} y={TOP} label="Type" detail={face} show={build(0)} width={500} />
      <div className="absolute text-fg" style={{ left: LEFT - 8, top: TOP + 18, opacity: build(1), transform: `translateY(${(1 - build(1)) * 16}px)` }}>
        <Faces stop={stop} className="text-[248px] leading-none font-medium tracking-[-0.045em]">
          Aa
        </Faces>
      </div>
      <div className="absolute flex flex-col gap-3.5" style={{ left: LEFT + 330, top: TOP + 92, opacity: build(2) }}>
        {scale.map((step) => (
          <div key={step.name} className="flex items-baseline gap-3">
            <span className="w-12 font-mono text-[10.5px] text-fg-subtle tabular-nums">
              {step.size}/{step.line}
            </span>
            <Faces stop={stop} className="text-fg" style={{ fontSize: step.size, lineHeight: `${step.line}px` }}>
              Designed as one
            </Faces>
          </div>
        ))}
      </div>
    </>
  )
}

/** The neutral ramp, from the page to the ink. */
const RAMP = ['canvas', 'surface', 'raised', 'line', 'line-strong', 'fg-subtle', 'fg-muted', 'fg'] as const
const CHIP_GAP = 6
const COLOUR_X = 632
const CHIP_W = (RIGHT - COLOUR_X - CHIP_GAP * (RAMP.length - 1)) / RAMP.length
const SHORT: Record<string, string> = { 'line-strong': 'strong', 'fg-muted': 'muted', 'fg-subtle': 'subtle' }

function ColourBlock({ palette, build }: { palette: Palette; build: (i: number) => number }) {
  const inks = ['accent', 'success', 'warning', 'danger'] as const
  return (
    <>
      <Header x={COLOUR_X} y={TOP} label="Colour" detail="oklch · derived from 5 inputs" show={build(0)} width={RIGHT - COLOUR_X} />
      {RAMP.map((step, i) => {
        const show = build(1 + i * 0.35)
        const [l] = palette[step]
        return (
          <div key={step} className="absolute flex flex-col gap-2" style={{ left: COLOUR_X + i * (CHIP_W + CHIP_GAP), top: TOP + 26, width: CHIP_W, opacity: show }}>
            <span
              className="block h-[196px] origin-bottom rounded-[3px]"
              style={{
                background: oklch(palette[step]),
                boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-fg) 12%, transparent)',
                transform: `scaleY(${mix(0.6, 1, show)})`,
              }}
            />
            <span className="font-mono text-[10.5px] leading-none text-fg-muted">{SHORT[step] ?? step}</span>
            <span className="font-mono text-[10.5px] leading-none text-fg-subtle tabular-nums">L {fixed(l, 3)}</span>
          </div>
        )
      })}
      <div className="absolute flex" style={{ left: COLOUR_X, top: TOP + 290, width: RIGHT - COLOUR_X, opacity: build(4) }}>
        {inks.map((ink) => {
          const [l, c, h] = palette[ink]
          return (
            <div key={ink} className="flex flex-1 items-center gap-2.5">
              <span className="size-[22px] shrink-0 rounded-full" style={{ background: oklch(palette[ink]) }} />
              <span className="flex flex-col gap-1.5 font-mono text-[10.5px] leading-none">
                <span className="text-fg-muted">{ink}</span>
                <span className="text-fg-subtle tabular-nums">
                  {fixed(l, 3)} {fixed(c, 3)} {Math.round(h)}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function FormBlock({ tune, build }: { tune: Tuning; build: (i: number) => number }) {
  const controls = [
    { name: 'sm', base: 28 },
    { name: 'md', base: 32 },
    { name: 'lg', base: 40 },
  ]
  // The ui bridge: control heights move 4px a density step, and md controls take --yj-radius.
  const height = (base: number) => base + tune.density * 4
  return (
    <>
      <Header x={LEFT} y={LOW} label="Form" detail={`radius ${fixed(tune.radius, 1)} · density ${tune.density >= 0 ? '+' : ''}${fixed(tune.density, 1)}`} show={build(5)} width={292} />
      <div className="absolute flex flex-col gap-3" style={{ left: LEFT, top: LOW + 34, opacity: build(6) }}>
        {controls.map((control) => {
          const h = height(control.base)
          return (
            <div key={control.name} className="flex items-center gap-4">
              <span
                className="flex w-[228px] items-center justify-between border border-line-strong bg-surface px-3.5 font-mono text-[10.5px]"
                style={{ height: h, borderRadius: Math.min(tune.radius * (control.name === 'lg' ? 4 / 3 : 1), h / 2) }}
              >
                <span className="text-fg-muted">control-{control.name}</span>
                <span className="text-fg-subtle tabular-nums">{fixed(h, 1)}</span>
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

const MOTION_X = 412
const TRACK = 196
/** The longest duration any personality has (calm's deliberate), which fills the track. */
const LONGEST = 760
const CYCLE = 96

function MotionBlock({ tune, frame, build, personality }: { tune: Tuning; frame: number; build: (i: number) => number; personality: PresetId }) {
  const { durations, easings, springs } = tune.motion
  const name = internalPresetById(personality).motionPersonality
  // Every duration runs from the same start, once a cycle, on the standard curve.
  const since = ((frame - B.build) % CYCLE + CYCLE) % CYCLE
  const [x1, y1, x2, y2] = easings.standard
  return (
    <>
      <Header x={MOTION_X} y={LOW} label="Motion" detail={name} show={build(5)} width={656} />
      <div className="absolute flex flex-col gap-[11px]" style={{ left: MOTION_X, top: LOW + 36, opacity: build(6) }}>
        {(Object.keys(durations) as (keyof typeof durations)[]).map((token) => {
          const ms = durations[token]
          const length = (ms / LONGEST) * TRACK
          const p = bezierAt(x1, y1, x2, y2, Math.min(1, (since / 60) * 1000 / ms))
          return (
            <div key={token} className="flex h-[15px] items-center gap-3">
              <span className="w-[72px] font-mono text-[10.5px] text-fg-muted">{token}</span>
              <span className="relative block h-px" style={{ width: TRACK }}>
                <span className="absolute inset-0 bg-line" />
                <span className="absolute inset-y-0 start-0 bg-fg-subtle" style={{ width: length }} />
                <span className="absolute top-1/2 size-[7px] -translate-1/2 rounded-full bg-accent" style={{ left: p * length }} />
              </span>
              <span className="w-12 text-end font-mono text-[10.5px] text-fg-subtle tabular-nums">{Math.round(ms)}ms</span>
            </div>
          )
        })}
      </div>
      <Plot x={MOTION_X + 400} label="enter" detail={easings.enter.map((n) => fixed(n, 2)).join(' ')} show={build(7)} path={bezierPath(easings.enter)} />
      <Plot
        x={MOTION_X + 540}
        label="settle"
        detail={`${fixed(springs.settle.visualDuration, 2)}s · ${fixed(springs.settle.bounce, 2)}`}
        show={build(7.5)}
        path={springPath(springs.settle.visualDuration, springs.settle.bounce)}
      />
    </>
  )
}

const PLOT = 116

function Plot({ x, label, detail, path, show }: { x: number; label: string; detail: string; path: string; show: number }) {
  return (
    <div className="absolute flex flex-col gap-2.5" style={{ left: x, top: LOW + 34, opacity: show }}>
      <svg viewBox={`-8 -24 ${PLOT + 16} ${PLOT + 32}`} width={PLOT + 16} height={PLOT + 32} className="-ms-2 -mt-6 overflow-visible" aria-hidden>
        <rect x={0} y={0} width={PLOT} height={PLOT} fill="none" stroke="var(--color-line)" />
        <line x1={0} y1={0} x2={PLOT} y2={0} stroke="var(--color-line-strong)" strokeDasharray="2 4" />
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
      <span className="flex flex-col gap-1.5 font-mono text-[10.5px] leading-none">
        <span className="text-fg-muted">{label}</span>
        <span className="text-fg-subtle tabular-nums">{detail}</span>
      </span>
    </div>
  )
}

/** The y of a cubic-bezier easing at time x (solved for its t by bisection). */
function bezierAt(x1: number, y1: number, x2: number, y2: number, x: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (at(x1, x2, mid) < x) lo = mid
    else hi = mid
  }
  return at(y1, y2, (lo + hi) / 2)
}

function bezierPath([x1, y1, x2, y2]: readonly number[]) {
  const P = (x: number, y: number) => `${(x * PLOT).toFixed(2)} ${((1 - y) * PLOT).toFixed(2)}`
  return `M ${P(0, 0)} C ${P(x1!, y1!)} ${P(x2!, y2!)} ${P(1, 1)}`
}

/** A spring's response over 1.2s, from Motion's own generator. */
function springPath(visualDuration: number, bounce: number) {
  const generator = motionSpring({ keyframes: [0, 1], visualDuration, bounce }) as unknown as { next: (ms: number) => { value: number } }
  const steps = 60
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return `${(t * PLOT).toFixed(2)} ${((1 - generator.next(t * 1200).value) * PLOT).toFixed(2)}`
  })
  return `M ${points.join(' L ')}`
}

/** The icon board: the 24 grid, and the star on it, centred on (x, y) at `size` on screen. The camera ends here. */
function IconBoard({ show, x, y, size }: { show: number; x: number; y: number; size: number }) {
  return (
    <div className="absolute text-fg" style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: show }}>
      <Keylines size={size} hairline={24 / size} grid={0.55} />
      <StarIcon size={size} strokeWidth={1.5} className="absolute inset-0" trigger="none" />
    </div>
  )
}
