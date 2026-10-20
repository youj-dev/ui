import type { CSSProperties } from 'react'
import { easings, springs } from '@youj/core'
import { TextSplit } from '@youj/motion'
import { mark as LOGO } from '@youj/core/docs/brand/logo'
import { ease, mix, spring, tween } from '../../lib/timing'
import { Seq, useFrame } from '../../sim/simulation'
import { BRAND, splitAfterComma } from '../../brand'
import { ORIGIN_BEATS as B } from '../beats'
import type { MarkHandover } from '../brand'
import { useFormat } from '../format'

/* The cold open: motion as the origin of everything.
 *
 * A graph editor on its keylines. The emphasized curve draws itself from one
 * keyframe to the other in linear time, while a marker on the value rail
 * shows what the curve does to a value: time runs evenly, the value eases.
 * Then the settle spring plots over it in the accent: past the target, and
 * back to rest. Then the graph resolves: the curves fold into the value axis,
 * the axis condenses into the mark's stem, the end keyframe flies in and docks
 * beside it exactly as the logo docks its own keyframe (a quarter turn on the
 * settle spring), and the accent tile blooms behind them. The mark is whole,
 * and the film's lockup takes it from here (brand.tsx). Every curve is the
 * library's own token; every shape of the mark is the logo's own geometry. */

/** Where the mark is whole, and how big, when the lockup takes it over (on the wide stage). */
const MARK_HANDOVER: MarkHandover = { at: { x: 720, y: 356 }, size: 96 }

/* The drawing is laid out on the wide stage (1440 × 810) and centred on
 * whatever stage it is shown on: the square and the loop see its middle. */
const offset = (width: number, height: number) => ({ x: (width - 1440) / 2, y: (height - 810) / 2 })

/** Where the lockup takes the mark over, on a stage of this size. */
export function markHandover(width: number, height: number): MarkHandover {
  const o = offset(width, height)
  return { at: { x: MARK_HANDOVER.at.x + o.x, y: MARK_HANDOVER.at.y + o.y }, size: MARK_HANDOVER.size }
}

/** The plot, in stage px: a square with the value axis on its start edge. */
const PLOT = { x: 548, y: 190, size: 300 }
const RAIL_X = PLOT.x + PLOT.size + 44
/** Plot coordinates (time 0–1 across, value 0–1 up) to stage px. */
const px = (t: number) => PLOT.x + t * PLOT.size
const py = (v: number) => PLOT.y + (1 - v) * PLOT.size

const [X1, Y1, X2, Y2] = easings.emphasized
const EASE_PATH = `M ${px(0)} ${py(0)} C ${px(X1)} ${py(Y1)} ${px(X2)} ${py(Y2)} ${px(1)} ${py(1)}`

/** The settle spring's response across the plot (0.8s of it), sampled from Motion's own generator. */
const SPRING_SECONDS = 0.8
const springAt = (t: number) => spring(t * SPRING_SECONDS * 60, 0, 'settle')
const SPRING_PATH = (() => {
  const steps = 160
  const points = Array.from({ length: steps + 1 }, (_, i) => `${px(i / steps).toFixed(2)} ${py(springAt(i / steps)).toFixed(2)}`)
  return `M ${points.join(' L ')}`
})()

/* The retired stem-and-keyframe mark this cold open was choreographed for.
 * The logo is now the Stepped trail K, but the rendered film still draws this
 * one and is not re-rendered yet, so its geometry lives here until the cold
 * open is redesigned around the new mark. */
const MARK = { tile: LOGO.tile, stem: { x: 4, y: 4, width: 3, height: 16 }, keyframe: 'M8 14.29L14.01 8.27L20.03 14.29L14.01 20.3Z' }

/** The mark, in stage px, as the lockup will draw it. */
const U = MARK_HANDOVER.size / 24
const MARK_X = MARK_HANDOVER.at.x - MARK_HANDOVER.size / 2
const MARK_Y = MARK_HANDOVER.at.y - MARK_HANDOVER.size / 2
const STEM = { x: MARK_X + MARK.stem.x * U, y: MARK_Y + MARK.stem.y * U, w: MARK.stem.width * U, h: MARK.stem.height * U }
/** The keyframe's centre and half-diagonal, read off its path (a square turned 45°). */
const KEY = (() => {
  const n = MARK.keyframe.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const xs = [n[0]!, n[2]!, n[4]!, n[6]!]
  const ys = [n[1]!, n[3]!, n[5]!, n[7]!]
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return { x: MARK_X + cx * U, y: MARK_Y + cy * U, r: ((Math.max(...xs) - Math.min(...xs)) / 2) * U }
})()

const [LEAD, KICKER] = splitAfterComma(BRAND.tagline)

export function OriginScene() {
  const frame = useFrame()
  const { width, height } = useFormat()
  const o = offset(width, height)

  // Keylines and keys arrive; the ease draws; the spring plots; then everything resolves.
  const grid = tween(frame, B.grid, 40, 'enter')
  const keys = tween(frame, B.keys, 'slow', 'enter')
  const drawn = Math.min(1, Math.max(0, (frame - B.ease) / B.draw))
  const sprung = Math.min(1, Math.max(0, (frame - B.spring) / B.draw))
  const gone = tween(frame, B.resolve, 26, 'exit')
  const fold = tween(frame, B.resolve, 30, 'emphasized')
  const condense = tween(frame, B.resolve + 4, 46, 'emphasized')
  /** The value axis, as it condenses into the stem. */
  const axisX = mix(PLOT.x - 0.75, STEM.x, condense)

  // The end keyframe: flies to one side of its dock, turning square, then docks on settle like the logo's.
  const approach = tween(frame, B.resolve + 12, 38, 'emphasized')
  const dock = spring(frame, B.resolve + 44, 'settle')
  const keyX = mix(px(1), KEY.x + 5 * U, approach) - 5 * U * dock
  const keyY = mix(py(1), KEY.y, approach)
  const keyR = mix(6.5, KEY.r, approach)
  const keyTurn = 45 * approach * (1 - dock)
  const bloom = tween(frame, B.tile, 'slow', 'enter')

  // The value the rail shows: the ease while it draws, then the spring.
  const onSpring = frame >= B.spring
  const value = onSpring ? springAt(sprung) : ease('emphasized')(drawn)
  const rail = Math.min(keys, 1 - gone)

  if (frame >= B.word) return <Tagline frame={frame} offset={o} />

  const ink = `color-mix(in oklab, var(--color-on-accent) ${bloom * 100}%, var(--color-fg))`
  const faint: CSSProperties = { opacity: grid * (1 - gone) }
  return (
    <div className="absolute" style={{ left: o.x, top: o.y, width: 1440, height: 810 }}>
      <svg aria-hidden width={1440} height={810} className="absolute inset-0 overflow-visible" viewBox="0 0 1440 810">
        <defs>
          <clipPath id="origin-ease">
            <rect x={PLOT.x - 4} y={0} width={drawn * PLOT.size + 4} height={810} />
          </clipPath>
          <clipPath id="origin-spring">
            <rect x={PLOT.x - 4} y={0} width={sprung * PLOT.size + 4} height={810} />
          </clipPath>
        </defs>

        {/* Keylines: the frame, its quarters, and the target line running out to the rail. */}
        <g style={faint} fill="none" strokeWidth={1}>
          {[0.25, 0.5, 0.75].map((q) => (
            <g key={q} stroke="var(--color-line)" strokeDasharray="2 5">
              <Grown x1={px(q)} y1={py(0)} x2={px(q)} y2={py(1)} p={grid} />
              <Grown x1={px(0)} y1={py(q)} x2={px(1)} y2={py(q)} p={grid} />
            </g>
          ))}
          <g stroke="var(--color-line-strong)">
            <Grown x1={px(0)} y1={py(0)} x2={px(1)} y2={py(0)} p={grid} />
            <Grown x1={px(1)} y1={py(0)} x2={px(1)} y2={py(1)} p={grid} />
          </g>
          <line x1={px(1)} y1={py(1)} x2={RAIL_X + 14} y2={py(1)} stroke="var(--color-line-strong)" strokeDasharray="3 4" opacity={keys} />
          <Grown x1={px(0)} y1={py(1)} x2={px(1)} y2={py(1)} p={grid} stroke="var(--color-line-strong)" />
        </g>

        {/* The value rail, its ticks and its marker. */}
        <g opacity={rail}>
          <line x1={RAIL_X} y1={py(0)} x2={RAIL_X} y2={py(1) - 60} stroke="var(--color-line-strong)" />
          {[0, 0.25, 0.5, 0.75, 1].map((q) => (
            <line key={q} x1={RAIL_X - 4} y1={py(q)} x2={RAIL_X + 4} y2={py(q)} stroke="var(--color-line-strong)" />
          ))}
          <Diamond x={RAIL_X} y={py(value)} r={5.5} fill="var(--color-accent)" />
        </g>

        {/* Bezier handles, while the ease is the curve on show. */}
        <g opacity={keys * (1 - tween(frame, B.spring - 10, 30, 'exit'))} stroke="var(--color-fg-subtle)" fill="var(--color-canvas)" strokeWidth={1}>
          <line x1={px(0)} y1={py(0)} x2={px(X1)} y2={py(Y1)} />
          <line x1={px(1)} y1={py(1)} x2={px(X2)} y2={py(Y2)} />
          <circle cx={px(X1)} cy={py(Y1)} r={3.5} />
          <circle cx={px(X2)} cy={py(Y2)} r={3.5} />
        </g>

        {/* The curves: folded into the value axis as the graph resolves. */}
        <g style={{ transformOrigin: `${axisX}px 0px`, transform: `scaleX(${1 - fold})`, opacity: 1 - tween(frame, B.resolve + 4, 22, 'exit') }} fill="none" strokeLinecap="round">
          <path
            d={EASE_PATH}
            clipPath="url(#origin-ease)"
            stroke="var(--color-fg)"
            strokeWidth={2}
            opacity={onSpring ? mix(1, 0.32, tween(frame, B.spring, 30)) : 1}
          />
          <path d={SPRING_PATH} clipPath="url(#origin-spring)" stroke="var(--color-accent)" strokeWidth={2} />
          {drawn > 0 && drawn < 1 && <circle cx={px(drawn)} cy={py(ease('emphasized')(drawn))} r={3.5} fill="var(--color-fg)" />}
          {sprung > 0 && sprung < 1 && <circle cx={px(sprung)} cy={py(springAt(sprung))} r={3.5} fill="var(--color-accent)" />}
        </g>

        {/* The accent tile blooms behind the stem and the keyframe. */}
        {bloom > 0 && (
          <g
            opacity={bloom}
            style={{ transformOrigin: `${MARK_HANDOVER.at.x}px ${MARK_HANDOVER.at.y}px`, transform: `scale(${mix(0.9, 1, bloom)})` }}
          >
            <path d={MARK.tile} fill="var(--color-accent)" transform={`translate(${MARK_X} ${MARK_Y}) scale(${U})`} />
          </g>
        )}

        {/* The value axis, condensing into the stem. */}
        <rect
          x={axisX}
          y={mix(py(1), STEM.y, condense)}
          width={mix(1.5, STEM.w, condense)}
          height={mix(PLOT.size, STEM.h, condense)}
          fill={ink}
          opacity={Math.max(grid, condense)}
        />

        {/* The keyframes: the first merges into the stem's foot, the last becomes the mark's keyframe. */}
        <Diamond x={mix(px(0), STEM.x + STEM.w / 2, condense)} y={mix(py(0), STEM.y + STEM.h, condense)} r={6.5 * keys} fill="var(--color-fg-muted)" opacity={1 - gone} />
        <Diamond x={keyX} y={keyY} r={keyR * keys} turn={keyTurn} fill={ink} />
      </svg>

      <Readout frame={frame} gone={gone} />
    </div>
  )
}

/** A line drawn out from its middle, `p` of the way. */
function Grown({ x1, y1, x2, y2, p, stroke }: { x1: number; y1: number; x2: number; y2: number; p: number; stroke?: string }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return <line x1={mix(mx, x1, p)} y1={mix(my, y1, p)} x2={mix(mx, x2, p)} y2={mix(my, y2, p)} stroke={stroke} />
}

/** A keyframe: a square turned 45°, centred on (x, y), `r` from centre to corner. */
function Diamond({ x, y, r, turn = 0, fill, opacity = 1 }: { x: number; y: number; r: number; turn?: number; fill: string; opacity?: number }) {
  if (r <= 0) return null
  return (
    <path
      d={`M ${x - r} ${y} L ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} Z`}
      fill={fill}
      opacity={opacity}
      style={{ transformOrigin: `${x}px ${y}px`, transform: `rotate(${turn}deg)` }}
    />
  )
}

/** Under the plot: which curve is on show, and its values, from the tokens. */
function Readout({ frame, gone }: { frame: number; gone: number }) {
  const lines = [
    { from: B.keys + 10, to: B.spring - 4, name: 'ease · emphasized', value: `cubic-bezier(${easings.emphasized.join(', ')})` },
    { from: B.spring + 4, to: Infinity, name: 'spring · settle', value: `${springs.settle.visualDuration}s · bounce ${springs.settle.bounce}` },
  ]
  return (
    <div className="absolute flex h-10 flex-col" style={{ left: PLOT.x, top: py(0) + 30, width: PLOT.size + 60 }}>
      {lines.map((line) => {
        const shown = tween(frame, line.from, 'slow', 'enter') * (1 - tween(frame, line.to, 'fast', 'exit')) * (1 - gone)
        if (shown <= 0) return null
        return (
          <p
            key={line.name}
            className="absolute inset-x-0 top-0 flex flex-col gap-1.5 font-mono text-[11px] leading-none"
            style={{ opacity: shown, transform: `translateY(${(1 - shown) * 6}px)` }}
          >
            <span className="flex items-center gap-2 tracking-[0.14em] text-fg-muted uppercase">
              <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
              {line.name}
            </span>
            <span className="ps-3.5 tracking-[0.02em] text-fg-subtle">{line.value}</span>
          </p>
        )
      })}
    </div>
  )
}

/** Under the lockup: the tagline rises in, word by word; the promise in full ink. */
function Tagline({ frame, offset: o }: { frame: number; offset: { x: number; y: number } }) {
  const { square } = useFormat()
  const out = tween(frame, B.toHud, 'base', 'exit')
  if (frame < B.tagline) return null
  return (
    <div
      className="absolute inset-x-0 flex justify-center"
      style={{ top: MARK_HANDOVER.at.y + o.y + 32 + 38, opacity: 1 - out, transform: `translateY(${-out * 8}px)` }}
    >
      <Seq from={B.tagline}>
        <p
          className={`flex leading-snug font-medium tracking-[-0.015em] ${square ? 'flex-col items-center text-[20px]' : 'gap-[0.3em] text-[21px]'}`}
          aria-label={BRAND.tagline}
        >
          <TextSplit inView={false} mask className="text-fg-muted">
            {LEAD}
          </TextSplit>
          <TextSplit inView={false} mask delay={3} className="text-fg">
            {KICKER}
          </TextSplit>
        </p>
      </Seq>
    </div>
  )
}
