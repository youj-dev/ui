'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { hump, blend, TAU, camera, clamp, lambert, mix, orient, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'band',
  title: 'Band',
  category: 'geometry',
  technique: 'planes',
  tags: ['ribbon', 'twist', 'loop', 'rim', 'squircle', 'roll', 'wave'],
  description:
    'A band stands round a rounded square, the youj o’s plan, and a full roll travels round it: the wall turns over and back as the wave passes, its top edge tracing the twist in the accent.',
  order: 14,
  colors: [{ part: 'Rail', mono: 'ink' }],
} satisfies LoaderMeta

/* The o's rounded square, as a plan, raised into a wall: a band standing on
 * edge, lit by where each stretch of it faces. A twist runs round it once a
 * loop: where it passes, the band rolls a full turn about its own path and
 * stands again, so the wave reads as a turning-over that travels. The band's
 * top edge is drawn in the accent through the twist, tracing the helix it
 * makes, and in ink elsewhere. Nearer stretches cover farther ones.
 *
 * Color: a hue of `c1` travels once a loop along the lower rail;
 * the faces stay lit ink and the twist’s top rail the accent. */

const L = 27
const B = 7.5
/** The plan's squareness (a superellipse exponent): the o's rounding. */
const ROUND = 4
/** The twist's length, as a share of the way round. */
const SPAN = 0.38
const PITCH = -0.62

const DETAIL = [
  { below: 32, n: 48 },
  { below: 80, n: 80 },
  { below: Infinity, n: 120 },
]

type V3 = [number, number, number]

/** The plan at s (0–1 round): a point, and its outward direction. */
function plan(s: number): { p: V3; out: V3 } {
  const a = TAU * s
  const c = Math.cos(a)
  const n = Math.sin(a)
  const e = 2 / ROUND
  const x = L * Math.sign(c) * Math.abs(c) ** e
  const z = L * Math.sign(n) * Math.abs(n) ** e
  // The superellipse's outward normal points along (sign(x)|x|^(ROUND-1), sign(z)|z|^(ROUND-1)).
  const ox = Math.sign(x) * Math.abs(x / L) ** (ROUND - 1)
  const oz = Math.sign(z) * Math.abs(z / L) ** (ROUND - 1)
  const len = Math.hypot(ox, oz) || 1
  return { p: [x, 0, z], out: [ox / len, 0, oz / len] }
}

const depth = new Depth()
const p0 = point()
const p1 = point()
const p2 = point()
const p3 = point()
/** Each stretch's depth, so its rails can sort over the overlap of the faces either side. */
const zs = new Float32Array(120)
const rails: number[][] = Array.from({ length: 120 }, () => [0, 0, 0, 0, 0, 0, 0, 0])

export const scene: Scene = {
  beats: 5,
  still: 0.12,
  draw(pen, t, view) {
    const { n } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const yaw = 0.42 + 0.16 * Math.sin(TAU * t)
    const project = camera({ yaw, pitch: PITCH, distance: 300, cx: view.w / 2, cy: view.h / 2 + 2 })
    const turn = orient({ yaw, pitch: PITCH })
    const hair = (small ? 1.1 : 1) / view.px
    const rail = (small ? 1.3 : 1.5) / view.px

    // The roll at s: a full turn across the twist, which is centered on t and travels once round a loop.
    /** How far through the twist s is: below 0 before it, above 1 past it (unclamped, for finding where the twist starts and ends). */
    const through = (s: number) => (((s - t + 1.5) % 1) - 0.5) / SPAN + 0.5
    const roll = (s: number) => {
      const u = Math.min(1, Math.max(0, through(s)))
      return { angle: TAU * u * u * u * (u * (u * 6 - 15) + 10) }
    }
    // The band's edges at s: the plan point plus or minus half its width across, turned by the roll.
    const edges = (s: number, top: (typeof p0), bottom: (typeof p0)) => {
      const { p, out } = plan(s)
      const { angle } = roll(s)
      const wx = Math.sin(angle) * out[0]
      const wy = Math.cos(angle)
      const wz = Math.sin(angle) * out[2]
      project(p[0] + B * wx, p[1] + B * wy, p[2] + B * wz, top)
      project(p[0] - B * wx, p[1] - B * wy, p[2] - B * wz, bottom)
      return [wx, wy, wz] as V3
    }

    for (let i = 0; i < n; i++) {
      const s0 = i / n
      // Each stretch reaches a little into the next, so neighboring faces meet without a seam of background between them.
      const s1 = (i + 1.35) / n
      const w0 = edges(s0, p0, p1)
      edges(s1, p3, p2)
      const sm = (i + 0.5) / n
      const { out } = plan(sm)
      // The face's normal: across the band (w) crossed with along it (the tangent), lit from whichever side we see.
      const tx = -out[2]
      const tz = out[0]
      const [wx, wy, wz] = w0
      let [vx, vy, vz] = turn(wy * tz, wz * tx - wx * tz, -wy * tx)
      if (vz < 0) [vx, vy, vz] = [-vx, -vy, -vz]
      const z = (p0.z + p1.z + p2.z + p3.z) / 4
      depth.face([p0.x, p0.y, p3.x, p3.y, p2.x, p2.y, p1.x, p1.y], z, lambert(vx, vy, vz))
      // The rails' ends, for the second pass.
      edges((i + 1) / n, p3, p2)
      zs[i] = z
      const r = rails[i]!
      r[0] = p0.x
      r[1] = p0.y
      r[2] = p3.x
      r[3] = p3.y
      r[4] = p1.x
      r[5] = p1.y
      r[6] = p2.x
      r[7] = p2.y
    }
    // The rails, a stretch at a time so nearer stretches cover them, each over the faces either side of it
    // (which reach a little into it): the top in the accent through the twist.
    for (let i = 0; i < n; i++) {
      const r = rails[i]!
      const z = Math.max(zs[i]!, zs[(i + n - 1) % n]!, zs[(i + 1) % n]!) + 0.001
      depth.path([r[0]!, r[1]!, r[2]!, r[3]!], z, { width: hair, alpha: 0.6 })
      // A hue runs once a loop along the lower rail.
      depth.path([r[4]!, r[5]!, r[6]!, r[7]!], z, { width: hair, alpha: 0.6, tone: blend('ink', 'c1', 0.9 * hump((((t - i / n) % 1) + 1) % 1)) })
      // The accent over the part of this stretch the twist covers, cut exactly where the twist starts and ends,
      // so its ends glide with the twist instead of stepping a stretch at a time.
      const ua = through(i / n)
      const ub = through((i + 1) / n)
      if (ub > 0 && ua < 1 && ub > ua) {
        const fa = clamp(-ua / (ub - ua))
        const fb = clamp((1 - ua) / (ub - ua))
        depth.path([mix(r[0]!, r[2]!, fa), mix(r[1]!, r[3]!, fa), mix(r[0]!, r[2]!, fb), mix(r[1]!, r[3]!, fb)], z + 0.001, { width: rail, alpha: 1, tone: 'accent', cap: 'round' })
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A band on the o's rounded-square plan rolls over and back as a twist travels round it, its top edge in the accent through the twist. */
export function LoaderBand(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
