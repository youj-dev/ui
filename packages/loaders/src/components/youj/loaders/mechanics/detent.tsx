'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, lambert, orient, Depth, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { circle, disc, part, pin, type Turn, type V3 } from './machine'

export const meta = {
  id: 'detent', title: 'Detent', category: 'mechanics', technique: 'mixed',
  tags: ['geneva', 'index', 'slot', 'drive', 'intermittent', 'kinematics'],
  description: 'A crank turning steadily drives its pin into a radial slot and indexes a fourfold Geneva wheel through one precise quarter turn. Between indexes the driver’s locking disc turns inside the wheel’s concave flank and holds it still.',
  order: 11,
  colors: [{ part: 'Wheel', mono: 'ink' }],
} satisfies LoaderMeta

/* A Geneva drive, built to its geometry: four slots, the crank radius
 * D/√2 so the pin enters and leaves each slot radially (the wheel starts
 * and stops without a jolt), and between the slots four concave flanks the
 * locking disc on the driver turns inside, holding the wheel through its
 * dwell. The crank turns at a constant speed, as a motor drives it: the
 * intermittent motion is all the mechanism's. Its relief notch lets the
 * wheel's points pass while the pin is in a slot. One index a loop; the
 * wheel repeats every quarter turn, so the loop has no seam.
 *
 * Color: the Geneva wheel’s edges warm toward `c1` through each quarter turn the pin drives, and settle to the ink while it dwells, locked. */

const D = 35
const R = D / Math.SQRT2
const W: [number, number] = [16, -2] // the wheel's centre
const C: [number, number] = [-19, -2] // the crank's centre
const SLOT = 2.25 // the slot's half width, the pin's radius and a little play
const BOTTOM = D - R - 1.4 // the slot's floor, from the wheel's centre
const FLANK = 17.8 // the wheel's concave flanks, centred D away on each bisector
const LOCK = 17.2 // the locking disc's radius
const RIM = 25.6 // the wheel's points
const depth = new Depth()
const wheel: V3[] = []
const holes = Array.from({ length: 4 }, (): V3[] => [])
const lock: V3[] = []
const boss: V3[] = []
const arm: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []

/** The wheel's outline at rotation psi: four radial slots, the rim between them cut by a concave flank. */
function geneva(psi: number, z: number, small: boolean) {
  wheel.length = 0
  const push = (x: number, y: number) => wheel.push([W[0] + x, W[1] + y, z])
  const rim = (a: number) => push(RIM * Math.cos(a), RIM * Math.sin(a))
  // The slot's mouth on the rim, as an angle off its axis; where the flank cuts the rim, off the bisector.
  const mouth = Math.asin(SLOT / RIM)
  const x0 = (D * D + RIM * RIM - FLANK * FLANK) / (2 * D)
  const cutAt = Math.atan2(Math.sqrt(RIM * RIM - x0 * x0), x0)
  const floor = small ? 3 : 6
  const flank = small ? 5 : 12
  const s = Math.sqrt(RIM * RIM - SLOT * SLOT)
  for (let k = 0; k < 4; k++) {
    const a = psi + Math.PI / 4 + (k * Math.PI) / 2
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    // In along the slot's right edge, round its floor, out along the left edge.
    push(s * ca + SLOT * sa, s * sa - SLOT * ca)
    for (let i = 0; i <= floor; i++) {
      const u = -Math.PI / 2 + (Math.PI * i) / floor
      push(BOTTOM * ca + SLOT * (-Math.sin(u) * sa - Math.cos(u) * ca), BOTTOM * sa + SLOT * (Math.sin(u) * ca - Math.cos(u) * sa))
    }
    push(s * ca - SLOT * sa, s * sa + SLOT * ca)
    // The rim to the flank, the concave flank (the locking disc's seat), the rim on to the next slot.
    const b = a + Math.PI / 4
    rim((a + mouth + b - cutAt) / 2)
    const lx = D * Math.cos(b)
    const ly = D * Math.sin(b)
    const g0 = Math.atan2(RIM * Math.sin(b - cutAt) - ly, RIM * Math.cos(b - cutAt) - lx)
    let g1 = Math.atan2(RIM * Math.sin(b + cutAt) - ly, RIM * Math.cos(b + cutAt) - lx)
    while (g1 > g0) g1 -= TAU
    for (let i = 0; i <= flank; i++) {
      const g = g0 + ((g1 - g0) * i) / flank
      push(lx + FLANK * Math.cos(g), ly + FLANK * Math.sin(g))
    }
    rim((b + cutAt + a + Math.PI / 2 - mouth) / 2)
  }
  return wheel
}

/** The locking disc at crank angle theta, with its relief notch centred on the crank. */
function locking(theta: number, z: number, small: boolean) {
  lock.length = 0
  const d = LOCK + 1.6
  const b = 8.2
  const x0 = (d * d + LOCK * LOCK - b * b) / (2 * d)
  const h = Math.sqrt(LOCK * LOCK - x0 * x0)
  const delta = Math.atan2(h, x0)
  const eps = Math.atan2(h, d - x0)
  const steps = small ? 20 : 40
  for (let i = 0; i <= steps; i++) {
    const g = theta + delta + ((TAU - 2 * delta) * i) / steps
    lock.push([C[0] + LOCK * Math.cos(g), C[1] + LOCK * Math.sin(g), z])
  }
  const nx = C[0] + d * Math.cos(theta)
  const ny = C[1] + d * Math.sin(theta)
  for (let i = 1; i < (small ? 4 : 8); i++) {
    const m = theta + Math.PI + eps - (2 * eps * i) / (small ? 4 : 8)
    lock.push([nx + b * Math.cos(m), ny + b * Math.sin(m), z])
  }
  return lock
}

/** The crank arm: a lit bar from the hub to the pin. */
function crank(project: Project, turn: Turn, theta: number, z: number, hair: number) {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const put = (k: number, r: number, w: number, h: number) => {
    arm[k]![0] = C[0] + r * c - w * s
    arm[k]![1] = C[1] + r * s + w * c
    arm[k]![2] = h
  }
  for (const side of [-1, 1]) {
    const n = turn(-s * side, c * side, 0)
    if (n[2] <= 0) continue
    put(0, 0, side * 2.6, z)
    put(1, R, side * 2.2, z)
    put(2, R, side * 2.2, z - 1.6)
    put(3, 0, side * 2.6, z - 1.6)
    const f = projectPath(arm, project, xy)
    depth.face(f.xy, 30, lambert(...n))
  }
  put(0, 0, -2.6, z)
  put(1, R, -2.2, z)
  put(2, R, 2.2, z)
  put(3, 0, 2.6, z)
  const f = projectPath(arm, project, xy)
  depth.face(f.xy, 30.5, lambert(...turn(0, 0, 1)))
  depth.path(f.xy, 30.51, { width: hair, alpha: 0.85, closed: true, join: 'round' })
}

export const scene: Scene = {
  beats: 5.5, still: 0.38,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const large = view.size >= 64
    const hair = (small ? 1.05 : 1.1) / view.px
    const pose = { yaw: -0.22 + (small ? 0 : 0.05) * Math.sin(TAU * t), pitch: -0.32 }
    const project = camera({ ...pose, distance: 420, cx: 50, cy: 51 })
    const turn = orient(pose)
    // The crank turns steadily, one turn a loop; the pin is in a slot while |theta| < π/4.
    const theta = TAU * t - 0.75 * Math.PI
    const px = C[0] + R * Math.cos(theta)
    const py = C[1] + R * Math.sin(theta)
    // The Geneva law: engaged, the slot points at the pin; otherwise the wheel dwells, locked.
    const wrapped = Math.atan2(Math.sin(theta), Math.cos(theta))
    const engaged = Math.abs(wrapped) < Math.PI / 4
    const psi = engaged
      ? Math.atan2(py - W[1], px - W[0]) - 1.25 * Math.PI
      : wrapped >= Math.PI / 4
        ? -Math.PI / 2
        : 0

    if (!small) {
      // The pin's circle and the line of centres, drawn as construction.
      circle(depth, project, C[0], C[1], -4, R, hair * 0.7, 0.26, 'ink', 64, -200, [2.2 * hair, 2.6 * hair])
      if (large) {
        const line = projectPath([[C[0] - 6, C[1], -4], [W[0] + 30, W[1], -4]], project, xy)
        depth.path(line.xy, -199, { width: hair * 0.7, alpha: 0.32, dash: [7 * hair, 2 * hair, 1.5 * hair, 2 * hair] })
      }
    }
    // The wheel, its four holes (it repeats every quarter turn) and its hub.
    const cut = large ? holes.map((h, k) => disc(W[0] + 11.8 * Math.cos(psi + (k * Math.PI) / 2), W[1] + 11.8 * Math.sin(psi + (k * Math.PI) / 2), 1, 2.3, 16, h)) : []
    // The wheel's edges warm toward its color while the pin drives it, and settle to the ink as it locks.
    const index = blend('ink', 'c1', 0.85 * Math.max(0, 1 - Math.abs(wrapped) / (Math.PI / 4)))
    const layer = part(depth, project, turn, geneva(psi, 1, small), cut, 4, hair, large ? 0.8 : 0, 0.8, undefined, false, index)
    const top = part(depth, project, turn, disc(W[0], W[1], 2.4, small ? 4.6 : 5, 24, boss), [], 1.4, hair * 0.9, 0, 0.85)
    pin(depth, project, turn, W[0], W[1], 2.5, small ? 2.2 : 1.8, hair * 0.85, 'ink', Math.max(top, layer) + 0.01)
    // The driver: the locking disc with its relief, the crank, and the pin's roller in the accent.
    part(depth, project, turn, locking(theta, 1, small), [], 4, hair, large ? 0.8 : 0)
    crank(project, turn, theta, 3.6, hair)
    pin(depth, project, turn, C[0], C[1], 3.7, small ? 2.6 : 2.4, hair * 0.85, 'ink', 31)
    pin(depth, project, turn, px, py, 3.7, small ? 2.4 : 2, hair, 'accent', 31.5)
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A radial slot converts one steady crank revolution into a locked quarter-turn index. */
export function LoaderDetent(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
