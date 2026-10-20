'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { atom, partial, pens, set, stick, type V3 } from './matter'

export const meta = {
  id: 'catenate', title: 'Catenate', category: 'science', technique: 'lines',
  tags: ['polymer', 'monomer', 'chain growth', 'linking', 'repeat unit', '3d'],
  description: 'A monomer swings in and turns into alignment with a growing polymer tip, reaches for it with a partial bond and closes the link, and the active end, an accent mark, steps onto it. The zigzag chain flows back into depth by exactly one repeat unit a loop, its oldest unit dwindling as the next donor arrives.',
  order: 10,
  colors: [{ part: 'Reach', mono: 'ink' }],
} satisfies LoaderMeta

/* A zigzag backbone with a pendant group on every other atom, receding
 * into depth. The chain never stops: it flows back one repeat unit a loop,
 * slow while a donor comes in and quickest just after it joins (1 − k·cos).
 * The donor, a two-atom monomer, swings in on a curve from above, turning
 * into the chain's zigzag as it comes; a dashed partial bond reaches across
 * to the tip and grows solid out of it. The chain's active end, the accent
 * square, sits on the tip and steps onto the new unit as it joins, so it is
 * on the tip again at the seam. Far units dwindle into the distance, and a
 * fresh donor grows in where the last one started.
 *
 * Color: the partial bond the monomer reaches out with is `c1`, there only while the link is forming; the active end stays the accent. */

const U = 12.5
const H = 3.8
/** The unit numbers drawn: the tip is unit 0, the donor unit 1. */
const UNITS = [-5, -4, -3, -2, -1, 0, 1]
const atoms = UNITS.map(() => [[0, 0, 0], [0, 0, 0]] as [V3, V3])
const pendants: V3[] = UNITS.map(() => [0, 0, 0])
const next: [V3, V3] = [[0, 0, 0], [0, 0, 0]]
const nextPendant: V3 = [0, 0, 0]
const active: V3 = [0, 0, 0]
const depth = new Depth()
const p = point()
const q = point()

/** Where a unit's two backbone atoms and its pendant lie at chain position s (whole numbers apart per unit). */
function place(s: number, out: [V3, V3], hang: V3) {
  const x = U * (s + 1.15)
  set(out[0], x, H, 0)
  set(out[1], x + U / 2, -H, 0)
  set(hang, x - 1.4, H + 6.2, 2.6)
}

/** The donor off the chain: `away` 1 is its start, up and out, turned across; 0 is on the chain. */
function swing(at: [V3, V3], hang: V3, away: number) {
  const cx = (at[0][0] + at[1][0]) / 2
  const cy = (at[0][1] + at[1][1]) / 2
  const angle = away * 2.1
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  // A curve in: out to the right and up, coming down onto the tip.
  const dx = 6 * away + 6 * Math.sin(Math.PI * away)
  const dy = 25 * away ** 1.2
  const dz = 9 * away
  for (const v of [at[0], at[1], hang]) {
    const lx = v[0] - cx
    const ly = v[1] - cy
    set(v, cx + lx * c - ly * s + dx, cy + lx * s + ly * c + dy, v[2] + dz)
  }
}

export const scene: Scene = {
  beats: 5.25,
  still: 0.38,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { hair } = pens(view)
    const project = camera({ yaw: -0.42 + 0.06 * Math.sin(TAU * t), pitch: -0.3, roll: -0.3, distance: 210, cx: view.w / 2 - 1, cy: view.h / 2 + 7 })
    // One repeat unit a loop, never stopping: slowest as the donor comes in, quickest after it joins.
    const travel = t - (0.55 * Math.sin(TAU * t)) / TAU
    const come = view.ease.emphasized(span(t, 0, 0.47))
    const join = view.ease.standard(span(t, 0.4, 0.58))
    const step = view.ease.emphasized(span(t, 0.5, 0.7))
    const fresh = view.ease.standard(span(t, 0.78, 0.99))
    const bondR = small ? 1.2 : 1.1
    const atomR = small ? 4.2 : 3.5
    const hangR = small ? 0 : 2.3

    UNITS.forEach((n, i) => {
      const s = n - travel
      const unit = atoms[i]!
      const hang = pendants[i]!
      place(s, unit, hang)
      if (n === 1) swing(unit, hang, 1 - come)
      // Far units dwindle away into the depth.
      const size = span(s, -5.6, -4.3)
      if (!small) {
        stick(depth, project, unit[0], hang, bondR * 0.85 * size, view, 'ink', size)
        atom(depth, project, hang, hangR * size, view)
      }
      for (const v of unit) atom(depth, project, v, atomR * size, view)
      stick(depth, project, unit[0], unit[1], bondR * size, view, 'ink', size)
      if (i > 0) {
        const prev = atoms[i - 1]!
        if (n === 1) {
          if (!small) partial(depth, project, prev[1], unit[0], hair * 1.3, span(t, 0.18, 0.32) * (1 - span(t, 0.46, 0.58)), view, 'c1')
          stick(depth, project, prev[1], unit[0], bondR, view, 'ink', join)
        } else stick(depth, project, prev[1], unit[0], bondR * size, view, 'ink', size)
      }
    })

    // The active end: the accent square just off the tip, where the next link will form, stepping onto the new unit as it joins.
    const from = atoms[UNITS.indexOf(0)]![1]
    const to = atoms[UNITS.indexOf(1)]![1]
    set(active, mix(from[0], to[0], step), mix(from[1], to[1], step), mix(from[2], to[2], step))
    project(...active, p)
    // Along the next link's direction (down the zigzag to the next unit's first atom), on screen.
    project(active[0] + U / 2, active[1] + 2 * H, active[2], q)
    const off = (atomR + 2.2) * p.k
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
    p.x += ((q.x - p.x) / len) * off
    p.y += ((q.y - p.y) / len) * off
    p.z += atomR + 1
    depth.square(p, clamp(view.size * 0.034, 2.4, 6.5) / view.px, 1, 'accent')

    // The next donor grows in where this one started.
    if (fresh > 0.002) {
      place(2 - travel, next, nextPendant)
      swing(next, nextPendant, 1)
      if (!small) {
        stick(depth, project, next[0], nextPendant, bondR * 0.85, view, 'ink', fresh)
        atom(depth, project, nextPendant, hangR * fresh, view)
      }
      for (const v of next) atom(depth, project, v, atomR * fresh, view)
      stick(depth, project, next[0], next[1], bondR, view, 'ink', fresh)
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A turning donor links to a polymer that advances one repeat unit each loop. */
export function LoaderCatenate(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
