'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'nacre',
  title: 'Nacre',
  category: 'geometry',
  technique: 'planes',
  tags: ['shell', 'scales', 'articulated', 'choreography', 'facets', 'perspective', 'hinges', '3d'],
  description: 'A nacreous shell opens its overlapping, ridged scales in a wave from rim to throat. Articulated ribs follow the lift, a single accent seam slips around the revealed bore, and the scales settle back into their nested courses.',
  order: 1,
  colors: [{ part: 'Scale edges', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]

/* Three courses of folded scales share a radial skeleton. Each scale has
 * four broad facets and a cut lip, rather than an alpha-filled wireframe.
 * Hinges lift first; their tips follow with a small, windowed arrival
 * oscillation. The courses have separate delays, as do the sectors: the
 * whole shell never simply scales or spins as one object.
 *
 * Geometry and scratch buffers are allocated once for each detail level.
 * All envelopes come to rest before the seam. Normalizing t also makes
 * the frame at exactly 1 identical, including depth order, to frame 0.
 *
 * Color: the scales’ lips warm toward `c1` as the shell opens and
 * cool as it closes; the travelling seam stays the accent. */
const COURSES = [
  { inner: 10, outer: 20, tip: 3, hinge: 11, lift: 0.94 },
  { inner: 19, outer: 28, tip: 10.8, hinge: 5, lift: 0.6 },
  { inner: 27, outer: 35, tip: 4.8, hinge: -6, lift: 0.36 },
] as const
const SMALL_COURSES = [
  { inner: 10, outer: 23, tip: 3, hinge: 9, lift: 0.72 },
  { inner: 22, outer: 35, tip: 8.8, hinge: -6, lift: 0.36 },
] as const

const LEVELS = [
  { sectors: 8, courses: 2 },
  { sectors: 12, courses: 3 },
  { sectors: 18, courses: 3 },
].map(({ sectors, courses }) => ({
  sectors,
  courses,
  scales: Array.from({ length: sectors * courses }, (_, i) => {
    const row = Math.floor(i / sectors)
    const sector = i % sectors
    const theta = TAU * (sector + row * 0.28) / sectors
    return {
      row, theta,
      lag: 0.05 * (courses - 1 - row) + 0.1 * (1 + Math.sin(theta - 0.8)) / 2,
      corners: Array.from({ length: 12 }, () => [0, 0, 0] as V3),
      screen: Array.from({ length: 12 }, point),
    }
  }),
  nodes: Array.from({ length: sectors }, (_, i) => {
    const theta = TAU * i / sectors
    return { theta, c: Math.cos(theta), s: Math.sin(theta) }
  }),
}))

const depth = new Depth()
const xy = new Array<number>(8).fill(0)
const rib = new Array<number>(6).fill(0)
const edge = new Array<number>(6).fill(0)
const crease = new Array<number>(6).fill(0)
const bond = new Array<number>(12).fill(0)
const shadow = new Array<number>(96).fill(0)
const p = point(), q = point()
const FACETS = [[0, 1, 4, 3], [1, 2, 5, 4], [3, 4, 7, 6], [4, 5, 8, 7]] as const
const SIMPLE_FACETS = [[0, 1, 7, 6], [1, 2, 8, 7]] as const
const LIP = [8, 7, 6, 9, 10, 11] as const

/** A rest-to-rest envelope, using the active theme's curves. */
function open(view: View, t: number, lag: number) {
  return clamp(view.ease.emphasized(span(t, 0.055 + lag, 0.32 + lag)))
    * (1 - clamp(view.ease.standard(span(t, 0.68 - lag * 0.25, 0.945 - lag * 0.25))))
}

/** Follow-through is a small arrival response, with zero value and slope at both ends. */
function follow(t: number, lag: number) {
  const u = span(t, 0.24 + lag, 0.55 + lag)
  return 0.2 * Math.sin(TAU * 1.5 * u) * Math.exp(-3 * u) * Math.sin(Math.PI * u) ** 2
}

/** A point on a hinged scale, inward from its outer hinge. */
function place(out: V3, theta: number, offset: number, radius: number, y: number, dr: number, dy: number, angle: number, ridge: number) {
  const ca = Math.cos(angle), sa = Math.sin(angle)
  const rr = radius + dr * ca + dy * sa + ridge * sa
  const yy = y - dr * sa + dy * ca + ridge * ca
  const a = theta + offset
  out[0] = rr * Math.cos(a)
  out[1] = yy
  out[2] = rr * Math.sin(a)
}

/** Projected facets keep their own depth and a two-sided, view-space normal. */
function facet(vertices: V3[], projected: ReturnType<typeof point>[], indices: readonly number[], turn: ReturnType<typeof orient>, lip: boolean) {
  const a = vertices[indices[0]!]!, b = vertices[indices[lip ? 2 : 1]!]!, c = vertices[indices[lip ? 3 : 2]!]!
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
  const n = turn(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
  // The cut lip is a wall; the broad sheet has a lit underside too.
  if (lip && n[2] <= 0) return -Infinity
  const sign = n[2] < 0 ? -1 : 1
  let z = 0
  xy.length = indices.length * 2
  for (let i = 0; i < indices.length; i++) {
    const v = projected[indices[i]!]!
    xy[2 * i] = v.x; xy[2 * i + 1] = v.y
    z += v.z / indices.length
  }
  const fog = 0.86 + 0.14 * clamp((z + 36) / 72)
  depth.face(xy, z, lambert(n[0] * sign, n[1] * sign, n[2] * sign, lip ? 0.18 : 0.24) * fog)
  return z
}

export const scene: Scene = {
  beats: 6.25,
  still: 0.54,
  draw(pen, t, view) {
    t %= 1
    const level = view.size < 32 ? 0 : view.size < 80 ? 1 : 2
    const { scales, nodes, sectors, courses } = LEVELS[level]!
    const small = level === 0
    const hair = clamp(view.size * 0.004, small ? 1.05 : 0.8, 1.3) / view.px
    const opened = open(view, t, 0.04)
    const azimuth = 0.12 * Math.sin(TAU * t) + 0.12 * opened
    const pose = { yaw: 0.24 + 0.09 * Math.sin(TAU * t), pitch: -0.76 - 0.12 * opened, roll: 0.035 * Math.sin(TAU * t) }
    const project = camera({ ...pose, distance: 240, cx: view.w / 2, cy: view.h / 2 + 4 })
    const turn = orient(pose)
    const reveal = clamp(view.ease.enter(span(t, 0.425, 0.485))) * (1 - clamp(view.ease.exit(span(t, 0.65, 0.72))))
    const head = 1.3 + TAU * span(t, 0.425, 0.725)

    // Soft contact shadow: nested low-alpha footprints, painted on the
    // ground before the depth buffer. No blur filter or extra canvas.
    if (level === 2) {
      for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < 48; i++) {
          const a = TAU * i / 48
          project((33 + layer * 1.8) * Math.cos(a), -14, (33 + layer * 1.8) * Math.sin(a), p)
          shadow[2 * i] = p.x; shadow[2 * i + 1] = p.y
        }
        pen.poly(shadow, 0.018 * (1 - 0.3 * opened))
      }
    }

    for (const scale of scales) {
      // At 24px two broader courses cover the full profile. At larger
      // sizes each shingle has two spans of compound curvature.
      const row = scale.row
      const course = (small ? SMALL_COURSES : COURSES)[row]!
      const k = open(view, t, scale.lag)
      const angle = course.lift * k + follow(t, scale.lag)
      const theta = scale.theta + azimuth
      const half = TAU / sectors * 0.46
      const twist = 0.09 + 0.13 * k + 0.025 * row
      const radius = course.outer + (1.5 + row * 0.4) * k
      const y = course.hinge + (2 - row * 0.7) * k
      const dr = course.inner - course.outer
      const dy = course.tip - course.hinge
      const ridge = small ? 2 : 1.35
      const v = scale.corners, s = scale.screen
      for (let band = 0; band < 3; band++) {
        const u = band / 2
        // A bowed spine and a twisting cross-section make each shingle a
        // folded, doubly curved surface rather than a flat radial wedge.
        const bow = 1.8 * Math.sin(Math.PI * u)
        const width = half * (1 - 0.16 * u)
        const skew = twist * u * u
        const delayed = angle + follow(t, scale.lag + 0.04 * u) * u
        for (let side = 0; side < 3; side++) {
          place(v[band * 3 + side]!, theta, skew + (side - 1) * width, radius, y, dr * u, dy * u,
            delayed, bow + (side === 1 ? ridge : 0))
        }
      }
      // A bevel under the inward lip gives every scale real thickness.
      for (let j = 9; j < 12; j++) {
        const top = v[j - 3]!, out = v[j]!
        out[0] = top[0]; out[1] = top[1] - (small ? 1.3 : 0.85); out[2] = top[2]
      }
      for (let j = 0; j < v.length; j++) project(v[j]![0], v[j]![1], v[j]![2], s[j]!)
      let tipDepth = -Infinity
      const facets = small ? SIMPLE_FACETS : FACETS
      for (let j = 0; j < facets.length; j++) {
        const z = facet(v, s, facets[j]!, turn, false)
        if (small || j > 1) tipDepth = Math.max(tipDepth, z)
      }
      const lipDepth = facet(v, s, LIP, turn, true)
      tipDepth = Math.max(tipDepth, lipDepth)

      // The inward cut edge is heavier near the eye. One hairline along
      // the fold catches light only as the scale reaches its arrival.
      const near = clamp((s[7]!.z + 34) / 68)
      for (let j = 0; j < 3; j++) { edge[2 * j] = s[j + 6]!.x; edge[2 * j + 1] = s[j + 6]!.y }
      // Paint the lip over its own two facets, while preserving the
      // shell's inter-scale depth order. Centroid sorting alone can bury
      // a far edge in the very facet it belongs to.
      const edgeDepth = Math.max(tipDepth, (s[6]!.z + s[7]!.z + s[8]!.z) / 3) + 0.02
      depth.path(edge, edgeDepth,
        { width: hair * (0.65 + 0.35 * near), alpha: small ? 0.55 : 0.25 + 0.36 * near, tone: blend('ink', 'c1', 0.7 * opened) })
      if (row === 0 && reveal > 0.004) {
        // One traveling bond rides the actual cut edges. Its short tail
        // passes from scale to scale; nothing floats above the geometry.
        const behind = ((head - scale.theta) % TAU + TAU) % TAU
        const tail = 1.12 + half
        const lead = clamp(behind / (half * 1.4))
        const strength = lead * lead * (3 - 2 * lead) * (1 - span(behind, half * 0.7, tail)) ** 1.3 * reveal
        if (Number.isFinite(lipDepth)) {
          for (let j = 0; j < LIP.length; j++) { bond[2 * j] = s[LIP[j]!]!.x; bond[2 * j + 1] = s[LIP[j]!]!.y }
          depth.poly(bond, edgeDepth + 0.01, strength * 0.85, 'accent')
        }
        depth.path(edge, edgeDepth + 0.02, { width: clamp(view.size * 0.007, 1.4, 2.4) / view.px,
          alpha: strength, tone: 'accent', join: 'round' })
      }
      if (level === 2 && scale.row === courses - 1) {
        const catchLight = Math.sin(Math.PI * span(t, 0.26 + scale.lag, 0.59 + scale.lag)) ** 4
        for (let j = 0; j < 3; j++) { crease[2 * j] = s[j * 3 + 1]!.x; crease[2 * j + 1] = s[j * 3 + 1]!.y }
        depth.path(crease, (s[1]!.z + s[4]!.z + s[7]!.z) / 3 + 0.03, { width: hair * 0.65, alpha: 0.28 * catchLight * near })
      }
    }

    // Links terminate at the actual moving hinges, so every course
    // pulls its neighbours' skeleton with it. They sort behind the sheet
    // above them, appearing only where the courses have peeled apart.
    for (let i = 0; i < sectors; i++) {
      const node = nodes[i]!, next = nodes[(i + 1) % sectors]!
      project(35 * node.c, -11, 35 * node.s, p)
      project(35 * next.c, -11, 35 * next.s, q)
      depth.line(p, q, hair * 0.7, small ? 0.32 : 0.24 + 0.12 * clamp((p.z + 30) / 60))
      if (small) continue
      const outer = scales[2 * sectors + i]!.screen[1]!
      const middle = scales[sectors + i]!.screen[1]!
      const inner = scales[i]!.screen[1]!
      const near = clamp((middle.z + 34) / 68)
      depth.line(p, outer, hair * 0.65, 0.2 + 0.18 * near)
      rib[0] = outer.x; rib[1] = outer.y; rib[2] = middle.x; rib[3] = middle.y; rib[4] = inner.x; rib[5] = inner.y
      depth.path(rib, (outer.z + middle.z + inner.z) / 3 - 0.05, { width: hair * 0.65, alpha: 0.22 + 0.22 * near })
      if (level === 2) {
        depth.dot(middle, 0.65 / view.px, 0.3 + 0.28 * near)
        if (i % 6 === 0) {
          project(37 * node.c, -11, 37 * node.s, q)
          depth.line(p, q, hair * 0.65, 0.32)
        }
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A faceted shell opens in delayed courses, revealing one moving accent seam. */
export function LoaderNacre(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
