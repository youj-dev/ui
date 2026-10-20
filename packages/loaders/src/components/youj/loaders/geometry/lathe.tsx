'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, orient, span, Depth, point, type Projected, type Scene, type Stroke } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'lathe',
  title: 'Lathe',
  category: 'geometry',
  technique: 'paths',
  tags: ['revolve', 'cad', 'turned', 'wireframe', 'hidden line', 'axis', 'meridian'],
  description:
    'A part is turned on a lathe: its profile, in the accent, revolves once about a chain-line axis and leaves the circles and meridians of a turned shape behind it, then revolves again and clears them.',
  order: 9,
  colors: [{ part: 'Sweep', mono: 'ink' }],
} satisfies LoaderMeta

/* A revolve, as a CAD tool draws one. The profile of a turned part (a base,
 * a step, a shaft, a collar and a cone, square-shouldered) stands beside
 * its axis, drawn as a chain line with a centre mark at each end. It
 * revolves a full turn (`emphasized`: a wind-up, a fast sweep, a long
 * landing), drawing a circle from each of its corners as it goes and leaving
 * a meridian every eighth of a turn, each fading in just behind it; the
 * halves of the circles and the meridians round the back are dashed, the
 * hidden-line convention, split exactly where the part turns away (so the
 * split never jitters) and dashed from that point (so the dashes never
 * crawl). It lands, the part complete, its diameter dimensioned at the
 * base, then turns again and takes the drawing away behind it, back to the
 * profile alone. The view sways a little the whole time.
 *
 * Color: the swept profiles facing us lean toward `c1`, set apart
 * from the ink rings; the generating profile stays the accent. */

/** The profile, (radius, height) from the base up. */
const PROFILE: [number, number][] = [
  [0, -27],
  [17, -27],
  [17, -21],
  [10.5, -17],
  [10.5, 8],
  [14, 11],
  [14, 16],
  [5, 27],
  [0, 27],
]
const RINGS = PROFILE.filter(([r]) => r > 0)
/** Below 32px, every other circle. */
const FEW = RINGS.filter((_, i) => i % 2 === 0)
const START = -0.35
const PITCH = -0.42
const ZOOM = 1.16

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6.5,
  still: 0.27,
  draw(pen, t, view) {
    const small = view.size < 32
    const yaw = 0.12 * Math.sin(TAU * t)
    const lens = camera({ yaw, pitch: PITCH, distance: 320, cx: view.w / 2 + 3, cy: view.h / 2 + 1 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * ZOOM, y * ZOOM, z * ZOOM, out)
    const turn = orient({ yaw, pitch: PITCH })
    const hair = (small ? 1.1 : 1) / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.2 : 1.35) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px

    const built = TAU * view.ease.emphasized(span(t, 0.04, 0.46))
    const cleared = TAU * view.ease.emphasized(span(t, 0.54, 0.96))
    /** How squarely a point of the surface at angle a faces the eye: above 0 in front, below behind. */
    const facing = (a: number) => turn(Math.cos(a), 0, Math.sin(a))[2]
    // Where the surface turns away: facing is a sine of (a - yaw), so it crosses zero every half turn from yaw.
    const edge0 = yaw

    // A run of a circle, solid in front and dashed behind, its dashes counted from the edge it starts behind.
    const front: Stroke = { width: line, alpha: 0.9, join: 'round' }
    const arc = (r: number, y: number, a0: number, a1: number) => {
      if (a1 - a0 < 1e-4) return
      const mid = (a0 + a1) / 2
      const ahead = facing(mid) > 0
      const steps = Math.max(2, Math.ceil(((a1 - a0) / TAU) * (small ? 40 : 72)))
      xy.length = 0
      for (let i = 0; i <= steps; i++) {
        const a = a0 + ((a1 - a0) * i) / steps
        project(r * Math.cos(a), y, r * Math.sin(a), p)
        xy.push(p.x, p.y)
      }
      if (ahead) {
        depth.path(xy, 10, front)
        return
      }
      if (small) {
        depth.path(xy, -10, { width: hair, alpha: 0.3 })
        return
      }
      // The dashes start at the edge behind which this run begins, wherever the run's own end has got to.
      const from = edge0 + Math.floor((a0 - edge0) / Math.PI) * Math.PI
      let lead = 0
      if (a0 - from > 1e-4) {
        const n = Math.max(2, Math.ceil(((a0 - from) / TAU) * 72))
        project(r * Math.cos(from), y, r * Math.sin(from), q)
        for (let i = 1; i <= n; i++) {
          const a = from + ((a0 - from) * i) / n
          const x0 = q.x
          const y0 = q.y
          project(r * Math.cos(a), y, r * Math.sin(a), q)
          lead += Math.hypot(q.x - x0, q.y - y0)
        }
      }
      depth.path(xy, -10, { width: hair, alpha: 0.4, dash: [dash, dash * 0.8], offset: lead })
    }

    // The circles from the profile's corners, over the part of the turn that's drawn, split where the part turns away.
    const lo = START + cleared
    const hi = START + built
    if (hi - lo > 0.001) {
      for (const [r, y] of small ? FEW : RINGS) {
        let a = lo
        let k = Math.floor((lo - edge0) / Math.PI) + 1
        while (a < hi) {
          const next = Math.min(hi, edge0 + k * Math.PI)
          arc(r, y, a, next)
          a = next
          k++
        }
      }
      // A meridian every eighth of a turn (every quarter, small): it fades in as the profile leaves it and out as the second turn takes it.
      const every = small ? 2 : 1
      for (let k = every; k <= 8; k += every) {
        const at = (TAU * k) / 8
        const shows = clamp((built - at) / 0.35) * clamp((at - cleared) / 0.35)
        if (shows <= 0.004) continue
        const a = START + at
        xy.length = 0
        for (const [r, y] of RINGS) {
          project(r * Math.cos(a), y, r * Math.sin(a), p)
          xy.push(p.x, p.y)
        }
        const f = facing(a)
        if (f > 0) depth.path(xy, 9, { width: line, alpha: 0.55 * shows, join: 'round', tone: blend('ink', 'c1', 0.6) })
        else depth.path(xy, -11, { width: hair, alpha: (small ? 0.2 : 0.28) * shows, dash: small ? undefined : [dash, dash * 0.8] })
      }
    }

    // The axis: a chain line, long and short dashes, past both ends, with a centre mark at each.
    if (!small) {
      project(0, 33, 0, p)
      const top = [p.x, p.y]
      project(0, -33, 0, p)
      const length = Math.hypot(p.y - top[1]!, p.x - top[0]!)
      depth.path([top[0]!, top[1]!, p.x, p.y], 0, { width: hair, alpha: 0.5, dash: [dash * 2.6, dash * 0.7, dash * 0.5, dash * 0.7], offset: -(length % (dash * 4.5)) / 2 })
      if (view.size >= 64) {
        for (const y of [-27, 27]) {
          for (const [dx, dz] of [[1, 0], [0, 1]] as const) {
            project(-3 * dx, y, -3 * dz, p)
            project(3 * dx, y, 3 * dz, q)
            depth.line(p, q, hair, 0.45)
          }
        }
      }
    }

    // The part's height, dimensioned beside it while it stands complete: drawn out from its middle.
    if (view.size >= 40) {
      const shown = view.ease.standard(span(t, 0.38, 0.5)) * (1 - view.ease.standard(span(t, 0.54, 0.64)))
      if (shown > 0.004) {
        // Square to the eye as the view sways: along the screen's own horizontal.
        const ux = Math.cos(yaw)
        const uz = Math.sin(yaw)
        const x = -24
        const reach = 27 * mix(0.4, 1, shown)
        project(x * ux, -reach, x * uz, p)
        project(x * ux, reach, x * uz, q)
        depth.line(p, q, hair, 0.55 * shown)
        for (const [r, y] of [[17, -27], [5, 27]] as const) {
          project(-(r + 1.5) * ux, y, -(r + 1.5) * uz, p)
          project((x - 2) * ux, y, (x - 2) * uz, q)
          depth.line(p, q, hair, 0.4 * shown)
        }
        for (const y of [-reach, reach]) {
          project((x - 1.3) * ux, y - 1.3, (x - 1.3) * uz, p)
          project((x + 1.3) * ux, y + 1.3, (x + 1.3) * uz, q)
          depth.line(p, q, line, 0.7 * shown)
        }
      }
    }

    // The profile, in the accent, where the turning has brought it: fully bright in front, dimmer round the back.
    const a = START + built + cleared
    xy.length = 0
    for (const [r, y] of PROFILE) {
      project(r * Math.cos(a), y, r * Math.sin(a), p)
      xy.push(p.x, p.y)
    }
    const f = facing(a)
    depth.path(xy, 5 + 14.5 * f, { width: line * 1.15, alpha: mix(0.6, 1, view.ease.standard(clamp(f / 0.3 + 0.5))), tone: 'accent', join: 'miter', cap: 'square' })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** The accent profile revolves about a chain-line axis, drawing a turned part's circles and meridians, then clearing them. */
export function LoaderLathe(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
