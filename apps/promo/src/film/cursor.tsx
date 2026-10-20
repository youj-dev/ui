import { useRef, useState } from 'react'
import { mix, tween } from '../lib/timing'
import { useEachFrame, useFrame } from '../sim/simulation'
import { moveTo, pressAt, releaseAt } from './user'

/* The pointer: a person's hand in the film. It glides between points on a
 * slight arc (hands don't move in straight lines), and every frame it moves
 * it sends the page the pointer and mouse events a real one would, so
 * hovers, drags and tooltips are the components' own. A press dips it and
 * rings the spot. It lives in the page's space, outside the camera: scenes
 * hold the camera at rest while it works. */

export type Point = { x: number; y: number }
/** A fixed point, or one read off the page when the move starts (an element's centre, nudged). */
export type Target = Point | (() => Point | null)

export interface Move {
  /** Frame the move starts, relative to the cursor's Seq. */
  at: number
  to: Target
  /** Frames the glide takes. Default 36. */
  frames?: number
  /** At arrival: a click, the button going down (a drag starts), or up (it drops). */
  press?: 'click' | 'down' | 'up'
  /** Frames to wait after arriving before the press. Default 0. */
  after?: number
  /** How it glides: a reach (emphasized, the default) or an even sweep (a scrub along a chart). */
  sweep?: boolean
}

const resolve = (target: Target): Point | null => (typeof target === 'function' ? target() : target)

/** The macOS-style arrow, hotspot at its tip (0, 0), 20px tall. */
function Arrow() {
  return (
    <svg width="17" height="24" viewBox="0 0 17 24" className="overflow-visible" aria-hidden>
      <path
        d="M1.5 1.2 L1.5 18.6 L5.6 14.7 L8.4 21.3 L11.4 20 L8.7 13.6 L14.4 13.6 Z"
        fill="white"
        stroke="black"
        strokeWidth={1.1}
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 1.5px 2px rgb(0 0 0 / 0.35))' }}
      />
    </svg>
  )
}

export function Cursor({
  start,
  moves,
  show = [0, Infinity],
  size,
  events = true,
}: {
  start: Point
  moves: Move[]
  /** When it is on screen: one window, or several. */
  show?: [number, number] | [number, number][]
  /** How big the pointer is drawn at a frame: a lens magnifying the screen magnifies its pointer too. Default 1. */
  size?: (frame: number) => number
  /** Whether it sends the page its events. Off when a scene works the app itself and the pointer only shows the hand. */
  events?: boolean
}) {
  const frame = useFrame()
  // Where each move ends, read when it starts (the page's layout at that moment).
  const [ends, setEnds] = useState<(Point | null)[]>(() => moves.map((m) => (typeof m.to === 'function' ? null : m.to)))
  const pressed = useRef<Element | null>(null)
  const down = useRef(false)

  const position = (f: number) => {
    let from = start
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]!
      const end = ends[i] ?? from
      const length = move.frames ?? 36
      if (f < move.at) return from
      if (f < move.at + length) {
        const t = tween(f, move.at, length, move.sweep ? 'standard' : 'emphasized')
        // A slight arc, bowed to the right of travel (a sweep keeps its line).
        const dx = end.x - from.x
        const dy = end.y - from.y
        const bow = move.sweep ? 0 : Math.sin(Math.PI * t) * Math.min(28, Math.hypot(dx, dy) * 0.08)
        const n = Math.hypot(dx, dy) || 1
        return { x: mix(from.x, end.x, t) + (dy / n) * bow, y: mix(from.y, end.y, t) - (dx / n) * bow }
      }
      from = end
    }
    return from
  }

  useEachFrame((f) => {
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]!
      if (f === move.at && ends[i] === null) {
        const point = resolve(move.to)
        if (point) setEnds((all) => all.map((p, j) => (j === i ? point : p)))
      }
    }
    if (!events) return
    const moving = moves.some((m) => f >= m.at && f <= m.at + (m.frames ?? 36))
    const here = position(f)
    if (moving) moveTo(here.x, here.y, down.current ? 1 : 0)
    for (const move of moves) {
      const arrive = move.at + (move.frames ?? 36) + (move.after ?? 0)
      if (f === arrive && move.press === 'click') {
        pressed.current = pressAt(here.x, here.y)
      }
      if (f === arrive + 5 && move.press === 'click') releaseAt(here.x, here.y, pressed.current)
      if (f === arrive && move.press === 'down') {
        down.current = true
        pressed.current = pressAt(here.x, here.y)
      }
      if (f === arrive && move.press === 'up') {
        down.current = false
        releaseAt(here.x, here.y, pressed.current)
      }
    }
  })

  const here = position(frame)
  const windows = (typeof show[0] === 'number' ? [show] : show) as [number, number][]
  const visible = Math.max(...windows.map(([from, to]) => tween(frame, from, 'base', 'enter') * (1 - tween(frame, to, 'base', 'exit'))))
  const scale = size?.(frame) ?? 1
  // A press dips the pointer and rings the spot.
  const pressedAt = (m: Move) => m.at + (m.frames ?? 36) + (m.after ?? 0)
  const presses = moves.filter((m) => m.press === 'click' || m.press === 'down').map(pressedAt)
  const last = presses.filter((at) => frame >= at).at(-1)
  const since = last === undefined ? Infinity : frame - last
  const holding = moves.some((m, i) => m.press === 'down' && frame >= pressedAt(m) && !moves.slice(i + 1).some((n) => n.press === 'up' && frame >= pressedAt(n)))
  const dip = holding ? 0.92 : since < 10 ? mix(0.9, 1, tween(since, 4, 6)) : 1
  const ring = since < 26 ? tween(since, 0, 26, 'enter') : 1

  if (visible <= 0) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1000]" style={{ opacity: visible }}>
      {ring < 1 && last !== undefined && (
        <span
          className="absolute size-9 rounded-full border border-line-strong"
          style={{
            left: position(last).x - 18,
            top: position(last).y - 18,
            opacity: (1 - ring) * 0.8,
            transform: `scale(${mix(0.35, 1, ring) * scale})`,
          }}
        />
      )}
      <div className="absolute origin-top-left" style={{ left: here.x - 1.5 * scale, top: here.y - 1.2 * scale, transform: `scale(${dip * scale})` }}>
        <Arrow />
      </div>
    </div>
  )
}
