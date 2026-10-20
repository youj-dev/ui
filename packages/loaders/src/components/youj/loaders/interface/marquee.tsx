'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, roundedRect, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'marquee',
  title: 'Marquee',
  category: 'interface',
  technique: 'lines',
  tags: ['cursor', 'selection', 'drag', 'marching ants', 'design tool', 'canvas', 'select'],
  description: 'A cursor crosses an artboard, drags a selection marquee whose marching ants run round it, and the shapes it closes round take their handles; it lets go, clicks away, and goes back.',
  order: 1,
  colors: [{ part: 'Artwork', mono: 'ink' }],
} satisfies LoaderMeta

/* The artboard lies in perspective under the cursor, a hairline frame with
 * its name tab at the corner, its shapes in hairline outlines over a faint
 * fill. The cursor, inked on a paper halo so it reads over anything, moves
 * on the `emphasized` curve, presses (it gives a little, and a ring goes out
 * from the tip), drags a dashed rectangle whose dashes march, and each shape
 * inside it takes the selection as the marquee closes round it: its outline
 * warms to the accent and four handles grow at its corners. Released, the
 * marquee fades; a click on empty board clears the selection, and the
 * cursor returns to where it began.
 *
 * Color: the artwork, each shape’s fill and the board’s tag, is a tint of `c1`; the outlines, the board and the cursor keep the ink, the selection the accent. */

interface Shape {
  x: number
  z: number
  w: number
  d: number
}

const SHAPES: Shape[] = [
  { x: -36, z: -24, w: 16, d: 11 },
  { x: -11, z: -21, w: 13, d: 13 },
  { x: 7, z: -16, w: 15, d: 10 },
  { x: -32, z: 2, w: 14, d: 15 },
  { x: -4, z: 3, w: 19, d: 12 },
  { x: 25, z: 6, w: 11, d: 11 },
]
/** The artboard the shapes sit on. */
const BOARD = { x: -39.5, z: -29.5, w: 78, d: 58 }
const START: [number, number] = [34, 26]
const FROM: [number, number] = [-15, -26]
const TO: [number, number] = [25, 21]
const AWAY: [number, number] = [-30, 26]
/** The pointer, tip at the origin, in screen units at 100px, and the paper halo round it. */
const ARROW = [0, 0, 0, 15.5, 3.8, 12, 6.6, 18.2, 9.2, 17.1, 6.5, 11, 11.4, 11]
const HALO = ARROW.map((v, i) => (v - (i % 2 ? 10.6 : 4.4)) * 1.17 + (i % 2 ? 10.6 : 4.4))
/** How far past a shape's far corner the marquee has to reach for the selection to take, in board units. */
const TAKE = 3

const depth = new Depth()
const p = point()
const xy: number[] = []

/** A flat outline on the board, projected. */
function outline(project: Project, x: number, z: number, w: number, d: number, r: number) {
  return projectPath(
    roundedRect(x, z, w, d, r, 3).map(([a, b]) => [a, 0, b] as const),
    project,
    xy,
  )
}

/** A soft bump: 0 away from `at`, rising to 1 at it over `width` either side. */
const bump = (t: number, at: number, width: number) => 0.5 + 0.5 * Math.cos(Math.PI * clamp((t - at) / width, -1, 1))

export const scene: Scene = {
  beats: 6.5,
  still: 0.4,
  draw(pen, t, view) {
    const project = camera({ yaw: -0.32, pitch: -0.62, distance: 260, cx: view.w / 2, cy: view.h / 2 + 2 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.02, 1, 1.6) / view.px
    const small = view.size < 32

    // The cursor's path: to the corner, drag across, off to empty board, and home.
    const reach = view.ease.emphasized(span(t, 0.02, 0.18))
    const drag = view.ease.emphasized(span(t, 0.22, 0.5))
    const away = view.ease.emphasized(span(t, 0.6, 0.72))
    const home = view.ease.emphasized(span(t, 0.8, 0.98))
    let [cx, cz] = START
    cx = mix(cx, FROM[0], reach)
    cz = mix(cz, FROM[1], reach)
    cx = mix(cx, TO[0], drag)
    cz = mix(cz, TO[1], drag)
    cx = mix(cx, AWAY[0], away)
    cz = mix(cz, AWAY[1], away)
    cx = mix(cx, START[0], home)
    cz = mix(cz, START[1], home)

    // The artboard: a faint sheet, its frame, and its name tab off the top-left corner.
    const board = outline(project, BOARD.x, BOARD.z, BOARD.w, BOARD.d, 0)
    depth.poly(board.xy, -1000, 0.03, 'ink', true)
    depth.path(board.xy, -999, { width: hair, alpha: 0.32, closed: true })
    if (!small) {
      const tab = projectPath(
        [
          [BOARD.x, 0, BOARD.z - 3.2],
          [BOARD.x + 13, 0, BOARD.z - 3.2],
        ],
        project,
        xy,
      )
      depth.path(tab.xy, -999, { width: stroke * 1.2, alpha: 0.42 })
      const mark = outline(project, BOARD.x, BOARD.z - 4.6, 2.8, 2.8, 0)
      depth.poly(mark.xy, -998, 0.55, 'c1')
    }

    // The marquee, from where the drag began to the cursor; its ants march.
    const held = view.ease.standard(span(t, 0.2, 0.25)) * (1 - view.ease.standard(span(t, 0.5, 0.58)))
    const x0 = Math.min(FROM[0], cx)
    const x1 = Math.max(FROM[0], cx)
    const z0 = Math.min(FROM[1], cz)
    const z1 = Math.max(FROM[1], cz)
    if (held > 0.01) {
      const m = outline(project, x0, z0, x1 - x0, z1 - z0, 0)
      depth.poly(m.xy, m.z, 0.05 * held, 'accent')
      depth.path(m.xy, m.z + 0.5, { width: hair, alpha: 0.85 * held, closed: true, dash: [3 * hair, 2 * hair], offset: -t * 120 * hair, tone: 'accent' })
    }

    // The shapes: each takes the selection as the marquee reaches past its far corner, and the click on empty board clears it.
    const clear = view.ease.standard(span(t, 0.74, 0.8))
    for (const s of SHAPES) {
      const inside = FROM[0] <= s.x && FROM[1] <= s.z && s.x + s.w <= TO[0] && s.z + s.d <= TO[1]
      const reached = t < 0.22 ? 0 : t >= 0.5 ? 1 : clamp((cx - s.x - s.w) / TAKE) * clamp((cz - s.z - s.d) / TAKE)
      const selected = inside ? view.ease.standard(reached) * (1 - clear) : 0
      const o = outline(project, s.x, s.z, s.w, s.d, 2)
      depth.poly(o.xy, o.z - 0.1, 0.06, 'c1')
      depth.path(o.xy, o.z, { width: stroke, alpha: mix(0.55, 0, selected), closed: true, join: 'round' })
      if (selected > 0.004) {
        depth.path(o.xy, o.z + 0.2, { width: stroke, alpha: 0.95 * selected, closed: true, join: 'round', tone: 'accent' })
        // The handles grow at the corners, solid, so the outline never runs through them.
        const r = 1.3 * (0.35 + 0.65 * selected)
        for (const [hx, hz] of [
          [s.x, s.z],
          [s.x + s.w, s.z],
          [s.x + s.w, s.z + s.d],
          [s.x, s.z + s.d],
        ] as const) {
          const h = outline(project, hx - r, hz - r, 2 * r, 2 * r, 0)
          depth.poly(h.xy, h.z + 0.3, selected, 'accent', true)
        }
      }
    }

    // The cursor, upright on screen at its point on the board, on a paper halo, giving a little while pressed.
    project(cx, 0, cz, p)
    const press = Math.max(bump(t, 0.2, 0.03), bump(t, 0.77, 0.03))
    const k = (small ? 1.35 : 1.15) * (1 - 0.12 * press)
    for (const [shape, alpha, z] of [
      [HALO, 0, 1000],
      [ARROW, 1, 1001],
    ] as const) {
      const arrow: number[] = []
      for (let i = 0; i < shape.length; i += 2) arrow.push(p.x + shape[i]! * k, p.y + shape[i + 1]! * k)
      depth.poly(arrow, z, alpha, 'ink', true)
    }
    // A ring from the tip at each press.
    for (const at of [0.2, 0.77]) {
      const ring = span(t, at, at + 0.08)
      if (ring > 0 && ring < 1) {
        const r = mix(1, 9, view.ease.enter(ring))
        const pts: number[] = []
        for (let i = 0; i <= 24; i++) pts.push(p.x + Math.cos((i / 24) * Math.PI * 2) * r, p.y + Math.sin((i / 24) * Math.PI * 2) * r)
        depth.path(pts, 999, { width: hair, alpha: 0.7 * (1 - ring), tone: 'accent' })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A cursor drags a marching-ants marquee over an artboard in perspective and selects what it closes round. */
export function LoaderMarquee(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
