'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circles, hairline, lod } from './sphere'

export const meta = {
  id: 'vesicle', title: 'Vesicle', category: 'orbs', technique: 'lines',
  tags: ['orb', 'glass', 'refraction', 'bubble', 'optics', 'lens'],
  description: 'A glass orb hangs in front of a ruled sheet that rocks to and fro. Around the orb the rulings run straight; through it they are traced by Snell’s law at both surfaces, so the sheet appears inverted, bowed and swept the other way, while a reflection slides across the glass.',
  order: 3,
  colors: [{ part: 'Lens', mono: 'ink' }],
} satisfies LoaderMeta

/* Backward ray tracing. The eye looks down the z axis at a glass ball
 * (n = 1.5) in front of a ruled card that turns about its vertical axis.
 * Outside the ball's outline each ruling is drawn exactly, as a straight
 * line clipped at the outline. Inside it, every sample of a polar grid
 * (rings out to the outline, so the traced lines reach the rim) follows its
 * ray through both surfaces of the ball to the card, and marching squares
 * traces the rulings through the card coordinates it lands on: the image
 * through a ball lens is inverted, so the lines inside sweep the opposite
 * way to the lines around it. The card rocks on a sine, so it never parks.
 *
 * Color: the rulings seen through the glass, traced by refraction, lean toward `c1`; the sheet around it stays the ink. */

const D = 260
const R = 21
const N = 1.5
const L = 50
const W = 44
const H = 33
const SPACING = [14.6, 8.8, 7.33]
const levels = [
  { rings: 7, spokes: 24 },
  { rings: 10, spokes: 30 },
  { rings: 11, spokes: 32 },
].map(({ rings, spokes }) => ({ rings, spokes, u: new Float64Array((rings + 1) * spokes), v: new Float64Array((rings + 1) * spokes), x: new Float64Array((rings + 1) * spokes), y: new Float64Array((rings + 1) * spokes) }))
const depth = new Depth()
const p = point()
const q = point()
const values = [0, 0, 0, 0]
const hits: number[] = []
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0]] as const

export const scene: Scene = {
  beats: 5, still: 0.32,
  draw(pen, t, view) {
    t %= 1
    const level = lod(view)
    const small = level === 0
    const hair = hairline(view)
    const { rings, spokes, u, v, x, y } = levels[level]!
    const cx = view.w / 2
    const cy = view.h / 2
    const project = camera({ distance: D, cx, cy })
    // The card: centred L behind the ball, turned θ about its vertical axis.
    const theta = 0.58 * Math.sin(TAU * t)
    const ct = Math.cos(theta)
    const st = Math.sin(theta)
    const rl = (R * D) / Math.sqrt(D * D - R * R)
    const spacing = SPACING[level]!
    const lineWidth = hair * (small ? 1.15 : 0.95)

    /** Where a ray from (ox, oy, oz) along (dx, dy, dz) meets the card, as card coordinates into u[i], v[i]. */
    const card = (i: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number) => {
      // Plane through (0, 0, −L) with normal (st, 0, ct); the card's axes are (ct, 0, −st) and (0, 1, 0).
      const den = dx * st + dz * ct
      const s = (-(ox * st) - (oz + L) * ct) / den
      const px = ox + s * dx
      const py = oy + s * dy
      const pz = oz + s * dz + L
      u[i] = px * ct - pz * st
      v[i] = py
    }

    // Through the ball: a polar grid of screen samples, each ray refracted in and out.
    for (let j = 0; j <= rings; j++) {
      const rho = rl * 0.9 * Math.sin((Math.PI / 2) * (j / rings)) ** 0.85
      for (let k = 0; k < spokes; k++) {
        const i = j * spokes + k
        const a = (TAU * k) / spokes
        const X = rho * Math.cos(a)
        const Y = rho * Math.sin(a)
        x[i] = cx + X
        y[i] = cy - Y
        const len = Math.hypot(X, Y, D)
        const dx = X / len
        const dy = Y / len
        const dz = -D / len
        // Entry.
        const b = D * dz
        const disc = b * b - (D * D - R * R)
        const s1 = -b - Math.sqrt(Math.max(0, disc))
        const ex = s1 * dx
        const ey = s1 * dy
        const ez = D + s1 * dz
        const nx = ex / R
        const ny = ey / R
        const nz = ez / R
        let cosi = -(dx * nx + dy * ny + dz * nz)
        let eta = 1 / N
        let k2 = 1 - eta * eta * (1 - cosi * cosi)
        let f = eta * cosi - Math.sqrt(Math.max(0, k2))
        const tx = eta * dx + f * nx
        const ty = eta * dy + f * ny
        const tz = eta * dz + f * nz
        // Across the ball to the far surface, and out.
        const s2 = -2 * (ex * tx + ey * ty + ez * tz)
        const fx = ex + s2 * tx
        const fy = ey + s2 * ty
        const fz = ez + s2 * tz
        const mx = -fx / R
        const my = -fy / R
        const mz = -fz / R
        cosi = -(tx * mx + ty * my + tz * mz)
        eta = N
        k2 = 1 - eta * eta * (1 - cosi * cosi)
        f = eta * cosi - Math.sqrt(Math.max(0, k2))
        card(i, fx, fy, fz, eta * tx + f * mx, eta * ty + f * my, eta * tz + f * mz)
      }
    }

    /** The rulings: every `spacing` across the card, its edges heavier, the centre line in the accent. */
    const rulings = (extent: number) => {
      const out: number[] = []
      for (let w = -Math.floor(extent / spacing) * spacing; w <= extent + 1e-6; w += spacing) out.push(w)
      if (out[0]! > -extent + 1) out.unshift(-extent)
      if (out[out.length - 1]! < extent - 1) out.push(extent)
      return out
    }
    const us = rulings(W)
    const vs = rulings(H)
    // One ruling right of centre wears the accent: around the orb it stays right, through it it shows up left.
    const marked = spacing * (small ? 1 : 2)
    const style = (w: number, extent: number): [number, number, 'ink' | 'accent'] =>
      extent === W && Math.abs(w - marked) < 1e-6 ? [lineWidth * 1.35, 1, 'accent'] : Math.abs(Math.abs(w) - extent) < 1e-6 ? [lineWidth * 1.25, 0.9, 'ink'] : [lineWidth, small ? 0.62 : 0.5, 'ink']

    // Inside: marching squares through the refracted card coordinates; a ruling exists only on the card.
    const trace = (field: Float64Array, other: Float64Array, targets: number[], extent: number, otherExtent: number) => {
      for (const target of targets) {
        const [width, alpha, tone] = style(target, extent)
        for (let j = 0; j < rings; j++) {
          for (let k = 0; k < spokes; k++) {
            const ids = [j * spokes + k, j * spokes + ((k + 1) % spokes), (j + 1) * spokes + ((k + 1) % spokes), (j + 1) * spokes + k]
            for (let m = 0; m < 4; m++) values[m] = field[ids[m]!]! - target
            hits.length = 0
            for (const [a, b] of EDGES) {
              const va = values[a]!
              const vb = values[b]!
              if ((va < 0) === (vb < 0)) continue
              const s = va / (va - vb)
              const ia = ids[a]!
              const ib = ids[b]!
              hits.push(mix(x[ia]!, x[ib]!, s), mix(y[ia]!, y[ib]!, s), mix(other[ia]!, other[ib]!, s))
            }
            for (let h = 0; h + 5 < hits.length; h += 6) {
              const o = (hits[h + 2]! + hits[h + 5]!) / 2
              if (Math.abs(o) > otherExtent) continue
              p.x = hits[h]!
              p.y = hits[h + 1]!
              p.z = -L
              p.k = 1
              q.x = hits[h + 3]!
              q.y = hits[h + 4]!
              q.z = -L
              q.k = 1
              // Seen through the glass, the rulings take the lens's color.
              depth.line(p, q, width, alpha * 0.92, tone === 'accent' ? tone : blend('ink', 'c1', 0.75))
            }
          }
        }
      }
    }
    trace(u, v, us, W, H)
    trace(v, u, vs, H, W)

    // Around the ball: each ruling straight across the card, clipped where it passes behind the outline.
    const straight = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, width: number, alpha: number, tone: 'ink' | 'accent') => {
      project(ax, ay, az, p)
      project(bx, by, bz, q)
      const fx = q.x - p.x
      const fy = q.y - p.y
      const gx = p.x - cx
      const gy = p.y - cy
      const A = fx * fx + fy * fy
      const B = 2 * (gx * fx + gy * fy)
      const C = gx * gx + gy * gy - rl * rl
      const disc = B * B - 4 * A * C
      const pieces: [number, number][] = []
      if (disc <= 0) pieces.push([0, 1])
      else {
        const s0 = (-B - Math.sqrt(disc)) / (2 * A)
        const s1 = (-B + Math.sqrt(disc)) / (2 * A)
        if (s0 > 0) pieces.push([0, Math.min(1, s0)])
        if (s1 < 1) pieces.push([Math.max(0, s1), 1])
      }
      const x0 = p.x
      const y0 = p.y
      for (const [s0, s1] of pieces) {
        if (s1 - s0 < 1e-3) continue
        p.x = x0 + fx * s0
        p.y = y0 + fy * s0
        q.x = x0 + fx * s1
        q.y = y0 + fy * s1
        p.z = q.z = -L
        depth.line(p, q, width, alpha, tone)
      }
    }
    for (const w of us) {
      const [width, alpha, tone] = style(w, W)
      straight(w * ct, -H, -L - w * st, w * ct, H, -L - w * st, width, alpha, tone)
    }
    for (const w of vs) {
      const [width, alpha, tone] = style(w, H)
      straight(-W * ct, w, -L + W * st, W * ct, w, -L - W * st, width, alpha, tone)
    }

    // The glass: its outline, a faint inner edge where the wall thickens, and a reflection that slides as the card turns.
    const circle = circles[level]!
    const ring = (radius: number, width: number, alpha: number) => {
      hits.length = 0
      for (let i = 0; i < circle.length - 1; i++) hits.push(cx + radius * circle[i]![0], cy - radius * circle[i]![1])
      depth.path(hits, R + 1, { width, alpha, closed: true, join: 'round' })
    }
    ring(rl, hair * (small ? 1.25 : 1.15), 0.92)
    if (!small) ring(rl * 0.94, hair * 0.75, 0.2)
    // The reflection rides the glass edge, sliding a little as the card swings.
    const glint = 2.2 + 0.18 * Math.sin(TAU * t + 0.6)
    hits.length = 0
    for (let i = 0; i <= 10; i++) {
      const a = glint + (0.6 * i) / 10
      hits.push(cx + rl * 0.95 * Math.cos(a), cy - rl * 0.95 * Math.sin(a))
    }
    depth.path(hits, R + 2, { width: hair * (small ? 1.3 : 2.1), alpha: 0.7, cap: 'round', join: 'round' })
    if (!small) {
      const a = glint + 0.82
      p.x = cx + rl * 0.95 * Math.cos(a)
      p.y = cy - rl * 0.95 * Math.sin(a)
      p.z = R + 2
      p.k = 1
      depth.dot(p, clamp(view.size * 0.006, 0.9, 1.6) / view.px, 0.6)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A glass orb inverts and bows a rocking ruled sheet seen through it. */
export function LoaderVesicle(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
