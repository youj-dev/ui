'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { hump, blend, TAU, camera, clamp, span, Depth, point, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'curl',
  title: 'Curl',
  category: 'geometry',
  technique: 'lines',
  tags: ['sheet', 'roll', 'scroll', 'paper', 'document', 'spiral', 'ruled'],
  description:
    'A ruled sheet curls up from its far edge into a roll that travels toward you and stops on the accent line, then unrolls flat again; drawn only in its edges and rulings.',
  order: 15,
  colors: [{ part: 'Rulings', mono: 'ink' }],
} satisfies LoaderMeta

/* A sheet of ruled paper lying flat, drawn only in lines: its two long edges
 * and the rulings across it. Its far edge curls up into a roll that travels
 * toward the eye, gathering the sheet (the roll thickens as it goes, a turn
 * of a spiral at a time), and stops exactly on the accent line ruled across
 * the sheet (`emphasized`: a long, precise landing). It unrolls back the way
 * it came, flat at both ends of the loop. The roll reads as a solid: its
 * near end shows the spiral, its outline is drawn where it turns away, and
 * a ruling fades as it goes round the back or under the next turn, so
 * nothing on it blinks on or off. The view sways a little throughout.
 *
 * Color: a hue of `c1` runs once a loop across the sheet’s
 * rulings; the line the roll stops on stays the accent. */

const W = 25
const L = 66
const CORE = 3
const LAYER = 2.9
const REACH = 0.66
const MARK = 0.71
const YAW = 0.55
const PITCH = -0.55
const ZOOM = 1.1

const DETAIL = [
  { below: 32, rulings: 9, samples: 40 },
  { below: 80, rulings: 14, samples: 64 },
  { below: Infinity, rulings: 20, samples: 96 },
]

const depth = new Depth()
const a = point()
const b = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6,
  still: 0.36,
  draw(pen, t, view) {
    const { rulings, samples } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const yaw = YAW + 0.07 * Math.sin(TAU * t)
    const lens = camera({ yaw, pitch: PITCH, distance: 280, cx: view.w / 2 + 2, cy: view.h / 2 + 3 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    // The eye's direction in the sheet's (z, y) plane, for which side of the roll faces it.
    const ez = Math.cos(PITCH) * Math.cos(yaw)
    const ey = -Math.sin(PITCH)
    const hair = (small ? 1.1 : 1) / view.px
    const edge = (small ? 1.3 : view.size < 80 ? 1.25 : 1.45) / view.px

    // How much of the sheet is rolled: out to just short of the accent line, and back.
    const rolled = L * REACH * (view.ease.emphasized(span(t, 0.04, 0.5)) - view.ease.emphasized(span(t, 0.58, 0.97)))
    const contact = -L / 2 + rolled
    const outer = Math.sqrt(CORE * CORE + (LAYER * rolled) / Math.PI)
    const k = LAYER / TAU
    /** How far round the roll the sheet's far edge has gone. */
    const reach = (outer - Math.sqrt(Math.max(0, outer * outer - 2 * k * rolled))) / k

    /**
     * Where the sheet is at arc length s from its far edge: (z, y), and how much of it shows, 0–1:
     * all of it on the floor; on the roll, less as it turns away from the eye or goes under the next turn.
     */
    const at = (s: number): [number, number, number] => {
      if (s >= rolled) return [-L / 2 + s, 0, 1]
      // Into the roll from where it leaves the floor: a spiral whose radius shrinks a layer a turn.
      const into = rolled - s
      const phi = (outer - Math.sqrt(Math.max(0, outer * outer - 2 * k * into))) / k
      const r = outer - k * phi
      const facing = -Math.sin(phi) * ez - Math.cos(phi) * ey
      const hidden = 1 - view.ease.standard(clamp((facing + 0.04) / 0.3)) * clamp((TAU - 0.2 - phi) / 0.7)
      // A curl just starting is all in view: the hiding grows with the roll, so the far edge lifts away rather than blinks out.
      return [contact - r * Math.sin(phi), outer - r * Math.cos(phi), 1 - hidden * clamp(rolled / 6)]
    }

    // The two long edges: the near one shows the spiral, the far one is faint where the roll hides it.
    for (const x of [-W, W]) {
      xy.length = 0
      let zs = 0
      for (let i = 0; i <= samples; i++) {
        const [z, y] = at(rolled > 0 ? (rolled * i) / samples : 0)
        project(x, y, z, a)
        xy.push(a.x, a.y)
        zs += a.z
      }
      project(x, 0, L / 2, a)
      xy.push(a.x, a.y)
      const near = x > 0
      depth.path(xy, zs / (samples + 1) + (near ? 40 : -40), { width: near ? edge : hair, alpha: near ? 0.95 : 0.55, join: 'round' })
    }

    // The roll's outline: where its outer turn is seen edge-on, top and bottom, once the sheet has gone that far round.
    if (rolled > 0.01) {
      const base = Math.atan2(-ey, ez)
      for (const phi of [((base % TAU) + TAU) % TAU, (((base + Math.PI) % TAU) + TAU) % TAU]) {
        const there = clamp((reach - phi) / 0.5)
        if (there <= 0) continue
        const r = outer - k * phi
        const z = contact - r * Math.sin(phi)
        const y = outer - r * Math.cos(phi)
        project(-W, y, z, a)
        project(W, y, z, b)
        depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2, { width: edge, alpha: 0.9 * there, cap: 'butt' })
      }
    }

    // The rulings: straight across wherever the sheet is, fading round the back of the roll and under its turns.
    for (let i = 0; i <= rulings; i++) {
      const s = (L * i) / rulings
      const [z, y, shows] = at(s)
      const ends = i === 0 || i === rulings
      // Spinning on a small roll, close rulings would shimmer: there they stay faint, and the roll's outline carries it.
      const alpha = (ends ? 0.95 : s < rolled ? (view.size < 80 ? 0.3 : 0.7) : 0.45) * shows
      if (alpha <= 0.005) continue
      project(-W, y, z, a)
      project(W, y, z, b)
      depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2, { width: ends ? edge : hair, alpha, tone: blend('ink', 'c1', 0.85 * hump((((t - i / rulings) % 1) + 1) % 1)) })
    }

    // The accent line the roll stops on.
    const [z, y] = at(L * MARK)
    project(-W, y, z, a)
    project(W, y, z, b)
    depth.path([a.x, a.y, b.x, b.y], (a.z + b.z) / 2 + 0.01, { width: edge * 1.1, alpha: 1, tone: 'accent' })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A ruled sheet curls into a roll that travels to the accent line and unrolls again, drawn in lines alone. */
export function LoaderCurl(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
