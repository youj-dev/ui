'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, orient, point, span, Depth, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { around, block, cylinder, detail, edge, hairline, packet, wire, wrap, type V3 } from './propagation'

export const meta = {
  id: 'chirp',
  title: 'Chirp',
  category: 'waves',
  technique: 'lines',
  tags: ['sonar', 'echo', 'ping', 'reflector', 'time-of-flight', 'pulse', '3d'],
  description: 'A sonar head sends a chirped front across its beam toward three solid reflectors, each casting a shadow in it. Each face answers only after the ping reaches it; narrow echo trains travel back at different times and light the head’s receiver as they arrive.',
  order: 4,
  colors: [{ part: 'Ping', mono: 'ink' }],
} satisfies LoaderMeta

/* A sonar head on the left of a shallow bed pings once a loop. The ping is
 * a chirp: three arcs whose spacing tightens, spreading across the beam at
 * a constant speed and fading with range, and each reflector cuts a shadow
 * out of it. A reflector's face brightens as the front reaches it and sends
 * back a short echo train, which shrinks toward the head and lights the
 * accent receiver as it lands, nearest first. The last echo lands just
 * before the head charges for the next ping, so something is always in
 * flight; the view sways a little throughout. Range arcs and the beam's
 * edges are drawn dashed on the bed, as a sonar plot marks them.
 *
 * Color: the outgoing chirped front is `c1`; the echoes come back in the ink and the head listens in the accent. */

const HEAD: V3 = [-31, 0, 0]
/** Reflectors: where each stands, its half-extents, and its range and bearing from the head (filled in below). */
const TARGETS = [
  { at: [-9, 0, -6.5] as V3, half: [2.8, 7, 2.8] as V3, range: 0, bearing: 0, width: 0 },
  { at: [1.5, 0, 10] as V3, half: [3.8, 3.8, 3.8] as V3, range: 0, bearing: 0, width: 0 },
  { at: [16, 0, -2] as V3, half: [3.2, 5, 5.6] as V3, range: 0, bearing: 0, width: 0 },
]
for (const r of TARGETS) {
  const dx = r.at[0] - HEAD[0]
  const dz = r.at[2] - HEAD[2]
  r.range = Math.hypot(dx, dz) - r.half[0]
  r.bearing = Math.atan2(dz, dx)
  // The angle the face subtends from the head: the shadow it casts in the front.
  r.width = Math.atan2(r.half[0] * 1.2, r.range)
}
/** Front speed, units per loop: the farthest echo lands at 0.9. */
const SPEED = (2 * Math.max(...TARGETS.map((r) => r.range))) / 0.9
const BEAM = 0.5
const REACH = 56
/** The chirp: three arcs behind the front, closing up as the frequency rises. */
const TRAIN = [0, 2.6, 4.6]
const ECHO = [0, 2.2]
const PLANE = 2.2
const arc: V3[] = Array.from({ length: 65 }, () => [0, 0, 0])
const depth = new Depth()
const p = point()

/** Whether a point on the front at range `r`, bearing `a`, is in a reflector's shadow. */
const shadowed = (r: number, a: number) => TARGETS.some((t) => r > t.range + 1 && Math.abs(a - t.bearing) < t.width)

export const scene: Scene = {
  beats: 5.5,
  still: 0.43,
  draw(pen, t, view) {
    const u = wrap(t)
    const lod = detail(view)
    const hair = hairline(view)
    const yaw = -0.24 + 0.06 * Math.sin(TAU * u)
    const pitch = -0.64
    const lens = camera({ yaw, pitch, distance: 260, cx: view.w / 2 + 7.5, cy: 50 })
    const project: Project = (x, y, z, out) => lens(x * 1.36, y * 1.36, z * 1.36, out)
    const turn = orient({ yaw, pitch })

    // The bed: range arcs and the beam's edges, dashed, from the head.
    if (lod > 0) {
      const dash = [2.4 * hair, 2.2 * hair]
      for (const r of lod === 1 ? [20, 40] : [15, 30, 45]) {
        for (let i = 0; i <= 32; i++) {
          const a = -BEAM + (2 * BEAM * i) / 32
          const v = arc[i]!
          v[0] = HEAD[0] + r * Math.cos(a)
          v[1] = 0
          v[2] = HEAD[2] + r * Math.sin(a)
        }
        wire(depth, project, arc.slice(0, 33), hair * 0.7, 0.3, 'ink', 32, dash)
      }
      for (const s of [-1, 1]) {
        edge(depth, project, [HEAD[0] + 5 * Math.cos(s * BEAM), 0, HEAD[2] + 5 * Math.sin(s * BEAM)], [HEAD[0] + (REACH - 8) * Math.cos(s * BEAM), 0, HEAD[2] + (REACH - 8) * Math.sin(s * BEAM)], hair * 0.7, 0.3)
      }
    }

    // The ping: a constant-speed front, fading as it spreads, shadowed behind each reflector.
    const front = SPEED * u
    if (lod > 0) {
      // The bed's backscatter: a polar field of grains that glints as the front sweeps over it.
      const grain = clamp(view.size * 0.011, 0.9, 2.2) / view.px
      for (let r = 9; r <= REACH - 4; r += lod === 1 ? 6 : 4) {
        const n = Math.round((r * 2 * BEAM) / (lod === 1 ? 6 : 4.2))
        for (let i = 0; i <= n; i++) {
          const a = -BEAM * 0.92 + (1.84 * BEAM * i) / n
          if (shadowed(r, a)) continue
          project(HEAD[0] + r * Math.cos(a), 0, HEAD[2] + r * Math.sin(a), p)
          const glint = packet(r - front + 1.5, 4.5) * (1 - span(front, REACH - 16, REACH))
          depth.square(p, grain, 0.16 + 0.6 * glint)
        }
      }
    }
    const launch = view.ease.enter(span(u, 0, 0.05))
    for (let k = 0; k < (lod === 0 ? 1 : TRAIN.length); k++) {
      const r = front - TRAIN[k]!
      if (r <= 0.5) continue
      const fade = launch * (1 - span(r, REACH - 16, REACH)) * (1 - 0.25 * k) * (0.55 + 0.45 * (1 - r / REACH))
      if (fade <= 0.004) continue
      // Split where it's shadowed: each lit run is its own path.
      let run = 0
      for (let i = 0; i <= 64; i++) {
        const a = -BEAM + (2 * BEAM * i) / 64
        const lit = !shadowed(r, a)
        if (lit) {
          const v = arc[run++]!
          v[0] = HEAD[0] + r * Math.cos(a)
          v[1] = PLANE
          v[2] = HEAD[2] + r * Math.sin(a)
        }
        if ((!lit || i === 64) && run > 1) {
          wire(depth, project, arc.slice(0, run), hair * (k === 0 ? 1.55 : 1.1), fade, 'c1', 8)
          run = 0
        } else if (!lit) run = 0
      }
    }

    // Each reflector: lit, brightening as the front reaches it, then its echo train heading home.
    let received = 0
    TARGETS.forEach((target) => {
      const hit = target.range / SPEED
      const struck = packet(u - hit - 0.02, 0.06)
      block(depth, project, turn, [target.at[0], target.half[1], target.at[2]], target.half, hair * 0.85, 'ink', { bevel: lod === 2 ? 0.9 : 0, lift: 1 + 0.35 * struck })
      const since = u - hit
      const back = since * SPEED
      if (since > 0 && back < target.range + 3) {
        const fade = view.ease.enter(span(since, 0, 0.04)) * (1 - span(back, target.range - 6, target.range + 3))
        const toward = target.bearing + Math.PI
        const spread = lod === 0 ? 0.2 : 0.3
        for (let k = 0; k < (lod === 0 ? 1 : ECHO.length); k++) {
          const r = back - ECHO[k]!
          if (r <= 0.3) continue
          for (let i = 0; i <= 16; i++) {
            const a = toward - spread + (2 * spread * i) / 16
            const v = arc[i]!
            v[0] = target.at[0] + target.half[0] * Math.cos(target.bearing + Math.PI) + r * Math.cos(a)
            v[1] = PLANE + 0.2
            v[2] = target.at[2] + target.half[0] * Math.sin(target.bearing + Math.PI) + r * Math.sin(a)
          }
          wire(depth, project, arc.slice(0, 17), hair * (k === 0 ? 1.4 : 1), fade * (k === 0 ? 0.95 : 0.6), 'ink', 16)
        }
      }
      received += packet(u - (2 * target.range) / SPEED, 0.045)
    })

    // The head: a lit housing on its plinth, its transducer face toward the beam, the receiver in the accent.
    const charge = packet(around(u, 0), 0.07)
    block(depth, project, turn, [HEAD[0] - 2.6, 2.9, HEAD[2]], [3.6, 2.6, 4.4], hair * 0.85, 'ink', { bevel: lod === 2 ? 0.8 : 0 })
    block(depth, project, turn, [HEAD[0] - 2.6, 0.15, HEAD[2]], [4.8, 0.15, 5.6], hair * 0.7, 'ink')
    const cap = cylinder(depth, project, turn, [HEAD[0] + 1, PLANE + 0.6, HEAD[2]], 'x', 3.2, 1.5, lod === 0 ? 10 : 18, hair * 0.85, { lift: 1 + 0.3 * charge })
    for (let i = 0; i <= 24; i++) {
      const a = (TAU * i) / 24
      const v = arc[i]!
      v[0] = HEAD[0] + 2.55
      v[1] = PLANE + 0.6 + 1.8 * Math.cos(a)
      v[2] = HEAD[2] + 1.8 * Math.sin(a)
    }
    const listen = clamp(received)
    wire(depth, project, arc.slice(0, 25), hair * (1.1 + 0.5 * listen), 0.45 + 0.55 * Math.max(listen, charge * 0.6), 'accent', 24)
    project(HEAD[0] + 2.6, PLANE + 0.6, HEAD[2], p)
    p.z = cap + 0.05
    depth.dot(p, clamp(view.size * 0.012, 0.9, 2.6) / view.px, 0.6 + 0.4 * listen, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A sonar ping reaches three solid faces and brings back three delayed echoes. */
export function LoaderChirp(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
