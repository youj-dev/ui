/* The loop is a rounded rectangle walked clockwise from just right of its top-left corner: a position is a share of the way round, 0 to 1 (and past 1 wraps). */

export const LOOP = { width: 270, height: 124, radius: 38 } as const

const { width: W, height: H, radius: R } = LOOP
const straightX = W - 2 * R
const straightY = H - 2 * R
const arc = (Math.PI * R) / 2

/** The loop's length in user units. */
export const LOOP_LENGTH = 2 * straightX + 2 * straightY + 4 * arc

/** The loop as an SVG path, starting where position 0 is. */
export const LOOP_PATH = `M${R} 0H${W - R}A${R} ${R} 0 0 1 ${W} ${R}V${H - R}A${R} ${R} 0 0 1 ${W - R} ${H}H${R}A${R} ${R} 0 0 1 0 ${H - R}V${R}A${R} ${R} 0 0 1 ${R} 0Z`

type Segment = { length: number; at: (d: number) => [number, number]; normal: (d: number) => [number, number] }

const corner = (cx: number, cy: number, from: number): Segment => ({
  length: arc,
  at: (d) => {
    const angle = from + d / R
    return [cx + R * Math.cos(angle), cy + R * Math.sin(angle)]
  },
  normal: (d) => [Math.cos(from + d / R), Math.sin(from + d / R)],
})
const straight = (length: number, at: Segment['at'], normal: [number, number]): Segment => ({ length, at, normal: () => normal })

const SEGMENTS: Segment[] = [
  straight(straightX, (d) => [R + d, 0], [0, -1]),
  corner(W - R, R, -Math.PI / 2),
  straight(straightY, (d) => [W, R + d], [1, 0]),
  corner(W - R, H - R, 0),
  straight(straightX, (d) => [W - R - d, H], [0, 1]),
  corner(R, H - R, Math.PI / 2),
  straight(straightY, (d) => [0, H - R - d], [-1, 0]),
  corner(R, R, Math.PI),
]

const round = (n: number) => Math.round(n * 100) / 100

/** The point a share `t` of the way round the loop, and the direction that points out of the loop there. */
export function pointAt(t: number): { x: number; y: number; nx: number; ny: number } {
  let rest = (((t % 1) + 1) % 1) * LOOP_LENGTH
  for (const segment of SEGMENTS) {
    if (rest <= segment.length) {
      const [x, y] = segment.at(rest)
      const [nx, ny] = segment.normal(rest)
      return { x: round(x), y: round(y), nx: round(nx), ny: round(ny) }
    }
    rest -= segment.length
  }
  return { x: R, y: 0, nx: 0, ny: -1 }
}

export interface LoopRouteStop {
  id: string
  name: string
  /** Where it sits on the loop, 0–1 from the start (the top edge, left). */
  position: number
  /** What is dropped there (a count). */
  cargo: number
  /** Time until the vehicle arrives, in minutes unless `format.time` says otherwise. */
  eta: number
  /** Where the vehicle loads: drawn as a square, with nothing to drop. */
  depot?: boolean
}

export type LoopRouteStopState = 'done' | 'next' | 'upcoming' | 'skipped'

/** Each stop's state for a tugger at `progress`: behind it is done, the first ahead is next, the rest upcoming; a skipped stop is skipped wherever it is. */
export function stopStates(stops: readonly LoopRouteStop[], progress: number, skipped: ReadonlySet<string>): Map<string, LoopRouteStopState> {
  const states = new Map<string, LoopRouteStopState>()
  let next = true
  for (const stop of [...stops].sort((a, b) => a.position - b.position)) {
    if (skipped.has(stop.id)) states.set(stop.id, 'skipped')
    else if (stop.position <= progress) states.set(stop.id, 'done')
    else {
      states.set(stop.id, next ? 'next' : 'upcoming')
      next = false
    }
  }
  return states
}
