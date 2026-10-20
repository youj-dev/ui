import type { CSSProperties } from 'react'
import { CUTS, FLASHES, cutAt, type ShotKey } from './beats'

/* The teaser's glitch, as a pure function of the frame. Nothing here is
 * noise: every tear, slip and channel split comes from a seeded generator
 * keyed to the cut it belongs to and to the frame pair it falls in, so a
 * frame renders the same in any tab, and each state holds for two frames
 * (a platform's 30 fps re-encode keeps all of them).
 *
 * A glitch is three things on the one frame:
 *   - bands of the other shot showing through (a CSS mask on that copy),
 *   - those bands, and a few hairline slips, displaced sideways (an SVG
 *     displacement filter on the whole frame, the bands as flood regions,
 *     so it needs no image and is ready the instant it's drawn), and
 *   - the channels pulled apart by a few pixels, red one way, blue the other.
 * Outside a glitch the frame carries no filter at all, so the UI is as crisp
 * as the components draw it. */

export const STAGE = { width: 1440, height: 810 }

/** mulberry32: a small, fast, seeded generator. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Band {
  /** Top and height, as fractions of the frame. */
  y: number
  h: number
  /** Sideways and vertical displacement, in stage px. */
  dx: number
  dy: number
}

export interface GlitchState {
  /** The shot underneath. */
  base: ShotKey
  /** The other shot, showing through `bands`. */
  over?: ShotKey
  bands: Band[]
  /** Hairline slips: thin bands displaced but not torn. */
  slips: Band[]
  /** 0 (clean) to 1. */
  power: number
}

/** A tear's window around its cut: it starts a few frames early (the incoming shot breaking through) and decays after. */
const LEAD = 4
const TAIL = 6

/** Bands that cover about `coverage` of the frame, seeded. */
function bandsFor(rand: () => number, coverage: number, shift: number): Band[] {
  if (coverage <= 0) return []
  const bands: Band[] = []
  const count = 2 + Math.floor(rand() * 4)
  const weights = Array.from({ length: count }, () => 0.35 + rand())
  const total = weights.reduce((a, b) => a + b, 0)
  for (const w of weights) {
    const h = Math.min(0.6, (coverage * w) / total)
    const y = rand() * (1 - h)
    const dx = (rand() * 2 - 1) * shift
    // Now and then a block drops a few px as well as sliding.
    const dy = rand() < 0.25 ? (rand() * 2 - 1) * shift * 0.12 : 0
    bands.push({ y, h, dx, dy })
  }
  return bands.sort((a, b) => a.y - b.y)
}

function slipsFor(rand: () => number, power: number): Band[] {
  const count = Math.round(power * 4)
  return Array.from({ length: count }, () => ({
    y: rand(),
    h: (2 + rand() * 7) / STAGE.height,
    dx: (rand() * 2 - 1) * 90 * power,
    dy: 0,
  }))
}

export function glitchAt(frame: number): GlitchState {
  const pair = Math.floor(frame / 2)
  const cut = cutAt(frame)
  let state: GlitchState = { base: cut.shot, bands: [], slips: [], power: 0 }

  // A tear: the next cut breaking in just before it lands, the last one torn away just after.
  const i = CUTS.indexOf(cut)
  const next = CUTS[i + 1]
  const prev = CUTS[i - 1]
  if (next && next.kind === 'tear' && frame >= next.at - LEAD) {
    const u = (frame - (next.at - LEAD)) / LEAD
    const rand = seeded(next.at * 977 + pair)
    const power = next.power * (0.45 + 0.4 * u)
    state = { base: cut.shot, over: next.shot, bands: bandsFor(rand, 0.1 + 0.3 * u, 70 * power), slips: slipsFor(rand, power), power }
  } else if (prev && cut.kind === 'tear' && frame < cut.at + TAIL) {
    const u = (frame - cut.at) / TAIL
    const rand = seeded(cut.at * 977 + pair)
    const power = cut.power * (1 - u) ** 1.4
    state = { base: cut.shot, over: prev.shot, bands: bandsFor(rand, 0.42 * (1 - u), 80 * power), slips: slipsFor(rand, power), power }
  }

  // A flash: a glimpse of another shot in bands, or a whole frame of it.
  for (const flash of FLASHES) {
    if (frame < flash.at || frame >= flash.at + flash.length) continue
    const rand = seeded(flash.at * 131 + pair)
    if (flash.coverage >= 1) {
      state = { base: flash.shot, over: state.base, bands: bandsFor(rand, 0.12, 60 * flash.power), slips: slipsFor(rand, flash.power), power: flash.power }
    } else {
      state = { base: state.base, over: flash.shot, bands: bandsFor(rand, flash.coverage, 70 * flash.power), slips: slipsFor(rand, flash.power), power: Math.max(state.power, flash.power) }
    }
  }
  return state
}

/** The mask that shows a copy only in `bands`. */
export function bandMask(bands: Band[]): CSSProperties {
  const stops = ['transparent 0%']
  for (const b of bands) {
    const top = (b.y * 100).toFixed(3)
    const bottom = ((b.y + b.h) * 100).toFixed(3)
    stops.push(`transparent ${top}%`, `black ${top}%`, `black ${bottom}%`, `transparent ${bottom}%`)
  }
  stops.push('transparent 100%')
  const image = `linear-gradient(to bottom, ${stops.join(', ')})`
  return { maskImage: image, WebkitMaskImage: image }
}

const FILTER_ID = 'teaser-glitch'

/**
 * The filter for a glitched frame: the bands and slips displaced, the
 * channels split. Mount it once; point the frame at it with `glitchStyle`.
 */
export function GlitchFilter({ state }: { state: GlitchState }) {
  const { width, height } = STAGE
  const moved = [...state.bands, ...state.slips].filter((b) => Math.abs(b.dx) > 0.5 || Math.abs(b.dy) > 0.5)
  const reach = Math.max(1, ...moved.map((b) => Math.max(Math.abs(b.dx), Math.abs(b.dy))))
  // The map's scale: a channel value of 0 or 255 is a full `reach` either way.
  const scale = reach * 2
  const channel = (d: number) => Math.round(Math.min(255, Math.max(0, 127.5 + (d / scale) * 255)))
  const split = 1 + 5 * state.power
  const region = { x: 0, y: 0, width, height }
  return (
    <svg aria-hidden width={0} height={0} className="absolute">
      <filter id={FILTER_ID} {...region} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        {moved.map((b, i) => (
          <feFlood key={i} floodColor={`rgb(${channel(b.dx)}, ${channel(b.dy)}, 0)`} x={0} y={b.y * height} width={width} height={Math.max(1, b.h * height)} result={`band${i}`} />
        ))}
        <feMerge result="map">
          {moved.map((_, i) => (
            <feMergeNode key={i} in={`band${i}`} />
          ))}
        </feMerge>
        <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="shifted" />
        {/* Only the bands move: the rest of the frame stays where it is, untouched by the map's rounding. */}
        <feComposite in="shifted" in2="map" operator="in" result="slid" />
        <feMerge result="torn">
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="slid" />
        </feMerge>
        <feColorMatrix in="torn" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
        <feOffset in="red" dx={split} dy={0} result="redOut" />
        <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
        <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
        <feOffset in="blue" dx={-split} dy={0} result="blueOut" />
        <feBlend in="redOut" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blueOut" mode="screen" />
      </filter>
    </svg>
  )
}

/** The frame's style for a glitch state: the filter while it's glitching, nothing otherwise. */
export function glitchStyle(state: GlitchState): CSSProperties {
  return state.power > 0.04 ? { filter: `url(#${FILTER_ID})` } : {}
}

/** Fine scanlines over a glitched frame, as strong as the glitch. */
export function Scanlines({ power }: { power: number }) {
  if (power <= 0.04) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: Math.min(0.5, power * 0.5),
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2.25px, rgb(0 0 0 / 0.55) 2.25px 3px)',
      }}
    />
  )
}
