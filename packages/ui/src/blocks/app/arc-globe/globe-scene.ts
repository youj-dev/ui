import { cubicBezier } from 'motion/react'
import type { Youj } from '@youj/core'
import type { ArcGlobePlace, ArcGlobeVisit } from './data'
import {
  arcPoints,
  drawArc,
  drawGlobe,
  drawMarker,
  drawPing,
  drawSight,
  place,
  turner,
  type Land,
  type Palette,
  type Size,
  type Tint,
  type Vec,
  type View,
} from './globe-draw'

/* One frame of the globe, apart from React: how the view moves (cruise,
 * coast, glide to an aim) and what's drawn (land, markers, the visits in
 * flight, the sight on the active country). The component owns the loop and
 * the observers; this is what each tick runs. */

export const TILT = 18
/** Degrees a second the globe turns on its own, and at its first spin. */
const CRUISE = 4.5
const SPIN_UP = 70
/** Latitudes the view keeps between, so the poles never face you. */
const LAT_RANGE = [-28, 58] as const
export const clampLat = (lat: number) => Math.max(LAT_RANGE[0], Math.min(LAT_RANGE[1], lat))

export interface Placed {
  place: ArcGlobePlace
  at: Vec
  tone: number
}

export interface Flight {
  points: Float32Array | null
  from: Vec
  to: Vec
  tone: number
  born: number
}

/** What a frame reads from the component's latest props. */
export interface SceneInputs {
  placed: Placed[]
  tint: Tint
  shares: Record<string, number>
  turning: boolean
  active: string | null
  aim: { lon: number; lat: number } | null
  focus: number
  recent: ArcGlobeVisit[]
}

export interface GlobeState {
  view: View
  velocity: { lon: number; lat: number }
  spin: number
  /** Motion time, ms: real time over the time scale. */
  clock: number
  /** Motion time the globe has been drawn for. */
  shown: number
  size: Size
  palette: Palette | null
  flights: Map<number, Flight>
  pointer: null | { x: number; y: number; lastX: number; lastY: number; t: number; dragged: boolean }
  hovering: boolean
  running: boolean
  redraw: () => void
}

const TOKENS = ['--color-fg-muted', '--color-line-strong', '--color-fg', '--color-accent', '--color-fg']

/** Token colors in the probe's cascade, as strings the canvas takes; `tones` are the regions' chart tones. */
export function readPalette(probe: HTMLElement, tones: string[]): Palette {
  const ctx = document.createElement('canvas').getContext('2d')
  const colors = [...TOKENS, ...tones.map((tone) => `--color-${tone}`)].map((token) => {
    probe.style.color = `var(${token})`
    const computed = getComputedStyle(probe).color
    if (!ctx) return computed
    ctx.fillStyle = computed
    return ctx.fillStyle
  })
  return { land: colors[0]!, line: colors[1]!, ink: colors[2]!, accent: colors[3]!, halo: colors[4]!, tones: colors.slice(5) }
}

/** The globe's timings, in motion ms (before the time scale), from the theme's tokens. */
export function timingOf(k: Youj) {
  const base = (t: Parameters<Youj['ms']>[0]) => k.ms(t) / k.timeScale
  return {
    flight: base('deliberate') * 2.8,
    reel: base('deliberate') * 1.3,
    ping: base('deliberate') * 1.6,
    appear: base('slow'),
    // Critically damped: settles in about the deliberate token, twice over for a globe's worth of turn.
    stiffness: 4.6 / ((base('deliberate') * 1.7) / 1000),
    throw: cubicBezier(...k.ease('emphasized')),
    reelIn: cubicBezier(...k.ease('standard')),
    land: cubicBezier(...k.ease('enter')),
  }
}
export type Timing = ReturnType<typeof timingOf>

const shortest = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180

/** Draws the frame; `tag` (the active place's label) is moved to its spot. */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  s: GlobeState,
  input: SceneInputs,
  land: Land,
  timing: Timing,
  reduced: boolean,
  ratio: number,
  tag: HTMLElement | null,
) {
  const { placed, tint, shares, active, focus, recent } = input
  const palette = s.palette
  if (!palette || !s.size.width) return
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  const turn = turner(s.view)
  drawGlobe(ctx, s.size, land, tint, turn, palette, focus, reduced ? 1 : Math.min(1, s.shown / timing.appear))
  const at = (v: Vec) => place(v, s.size, turn)
  for (const p of placed) {
    const spot = at(p.at)
    drawMarker(ctx, spot.x, spot.y, spot.depth, shares[p.place.id] ?? 0, palette.tones[p.tone]!, focus < 0 || focus === p.tone ? 1 : 0.3)
  }
  const dim = (tone: number) => (focus < 0 || focus === tone ? 1 : 0.22)
  if (reduced) {
    for (const visit of recent) {
      const from = placed.find((p) => p.place.id === visit.from)
      const to = placed.find((p) => p.place.id === visit.to)
      if (!from || !to || from === to) continue
      drawArc(ctx, arcPoints(from.at, to.at), 0, 1, s.size, turn, palette.tones[from.tone]!, 0.7 * dim(from.tone), false)
    }
  } else {
    for (const [id, f] of s.flights) {
      const age = s.clock - f.born
      const alpha = dim(f.tone)
      const color = palette.tones[f.tone]!
      if (f.points) {
        const head = timing.throw(Math.min(1, age / timing.flight))
        const tail = timing.reelIn(Math.max(0, Math.min(1, (age - timing.flight * 0.72) / timing.reel)))
        drawArc(ctx, f.points, tail, head, s.size, turn, color, alpha, true)
      }
      const landed = f.points ? age - timing.flight : age
      if (landed >= 0) {
        const spot = at(f.to)
        drawPing(ctx, spot.x, spot.y, spot.depth, timing.land(Math.min(1, landed / timing.ping)), color, alpha)
        if (!f.points)
          drawPing(
            ctx,
            spot.x,
            spot.y,
            spot.depth,
            timing.land(Math.max(0, Math.min(1, (landed - timing.ping * 0.35) / timing.ping))),
            color,
            alpha * 0.7,
          )
      }
      if (age > (f.points ? timing.flight : 0) + timing.ping * 1.4 && age > timing.flight * 0.72 + timing.reel) s.flights.delete(id)
    }
  }
  const current = placed.find((p) => p.place.id === active)
  const tagEl = tag
  if (current) {
    const spot = at(current.at)
    drawSight(ctx, spot.x, spot.y, spot.depth, palette.accent)
    if (tagEl) {
      tagEl.style.transform = `translate3d(${spot.x}px, ${spot.y}px, 0)`
      tagEl.style.opacity = spot.depth > 0.05 ? '1' : '0'
    }
  } else if (tagEl) tagEl.style.opacity = '0'
}

/** Moves the view by `dt` motion ms: a glide to the aim, or a coast into the cruise. */
export function stepView(s: GlobeState, dt: number, input: SceneInputs, timing: Timing) {
  const seconds = dt / 1000
  const { aim } = input
  s.shown += dt
  if (s.pointer?.dragged) return
  if (aim) {
    const lat = clampLat(aim.lat)
    const w = timing.stiffness
    const dLon = shortest(s.view.lon, aim.lon)
    s.velocity.lon += (w * w * dLon - 2 * w * s.velocity.lon) * seconds
    s.velocity.lat += (w * w * (lat - s.view.lat) - 2 * w * s.velocity.lat) * seconds
    s.view.lon += s.velocity.lon * seconds
    s.view.lat += s.velocity.lat * seconds
    s.spin = 0
    return
  }
  // Coast off a throw or a glide, then ease into the cruise (or to a stop under the pointer).
  const friction = Math.exp(-seconds * 3.2)
  s.velocity.lon *= friction
  s.velocity.lat *= friction
  const cruise = s.hovering || !input.turning ? 0 : CRUISE + SPIN_UP * Math.exp(-s.shown / (timing.appear * 3))
  s.spin += (cruise - s.spin) * Math.min(1, seconds * 2.5)
  s.view.lon += (s.velocity.lon - s.spin) * seconds
  s.view.lat += s.velocity.lat * seconds + (TILT - s.view.lat) * Math.min(1, seconds * 0.8)
  s.view.lat = clampLat(s.view.lat)
}
