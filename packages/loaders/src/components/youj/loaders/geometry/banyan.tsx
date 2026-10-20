'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, point, seeded, span, type Pen, type Scene, type Stroke, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'banyan', title: 'Banyan', category: 'geometry', technique: 'paths',
  tags: ['tree', 'canopy', 'hero', 'phyllotaxis', 'growth', 'sap', 'depth'],
  description: 'A great spatial canopy unfolds one generation at a time, breathes in a slow wind, and carries a single sap-light from its root to its finest tips before returning home. Its eighteen-beat cycle deliberately gives a pre-launch hero time to grow, hold and reward long viewing; reduced motion keeps the illuminated crown.',
  order: 21.5,
  colors: [{ part: 'Blossoms', mono: 'ink' }],
} satisfies LoaderMeta

/* Eighteen deliberate beats: about ten seconds with the precise personality. Growth
 * 0–.44, breathing .44–.50, sap .50–.67, illuminated hold .67–.78,
 * tip-first return .78–.98, root .98–1. Time remains entirely token-driven.
 *
 * A seeded monopodial tree: three scaffold limbs and, at hero sizes, an
 * upright leader, followed by unequal binary forks. Golden-angle azimuths keep successive forks out of one plane;
 * generation-dependent divergence, outward tropism and terminal gravity
 * form the crown. Cubic limbs start tangent to their parent. Their radii
 * are solved from the tips inward: parent end area = sum of child base
 * areas (the pipe model), with a little taper along each internode.
 *
 * field.Depth copies marks and allocates its sort on every draw. This hero
 * instead pools its marks, ribbons, pulse paths and stable merge-sort buffers
 * per detail level, using the same Pen, camera and painter's order. All
 * mutable buffers are scratch only: drawing still depends solely on t/view.
 * The shared pens retain their own implementation; the scene allocates
 * nothing in draw, including its camera (world yaw feeds a cached lens).
 *
 * Color: the finest tips bloom in `c1` and turn the accent as the
 * sap reaches them. */

type V3 = [number, number, number]
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const SAMPLES = 5
const TRUNK_CAP = 8
const FRONT_SAMPLES = 2048

const smooth = (u: number) => { const x = clamp(u); return x * x * (3 - 2 * x) }
// Integrate a short velocity ramp at the two phase boundaries; the long middle
// travels without the repeated ease-out / restart of individual generations.
function flow(u: number) {
  const edge = 0.04
  return (u < edge ? u * u / (2 * edge) : u > 1 - edge ? 1 - edge - (1 - u) ** 2 / (2 * edge) : u - edge / 2) / (1 - edge)
}

interface Paint {
  kind: 'poly' | 'path' | 'square' | 'dot'
  xy: number[]
  stroke: Stroke
  x: number; y: number; radius: number; z: number; alpha: number; tone: Tone
}
interface Limb {
  a: V3; c: V3; d: V3; b: V3; direction: V3
  parent: number; level: number; delay: number; length: number; route: number
  wave: number
  r0: number; r1: number; grown: number
  // World-space parent attachment, including wind and arrival settling.
  end: V3
  screen: Float64Array
  body: Paint; pulse: Paint; tip: Paint; halo: Paint; joint: Paint
}
interface Tree {
  limbs: Limb[]; last: number; scale: number; centerY: number; route: number
  reach: number; growth: Float64Array
  marks: Paint[]; order: Int32Array; merge: Int32Array; count: number
  ground: Paint[]; root: Paint
}

function paint(kind: Paint['kind'], coordinates = 0): Paint {
  return {
    kind, xy: new Array<number>(coordinates).fill(0),
    stroke: { width: 1, alpha: 1, cap: 'round', join: 'round' },
    x: 0, y: 0, radius: 0, z: 0, alpha: 0, tone: 'ink',
  }
}
function normalize(x: number, y: number, z: number): V3 {
  const k = 1 / Math.hypot(x, y, z)
  return [x * k, y * k, z * k]
}

function makeTree(last: number): Tree {
  const random = seeded(0xbaf1a)
  const limbs: Limb[] = []
  function branch(a: V3, direction: V3, parent: number, level: number, length: number) {
    const incoming = parent < 0 ? direction : limbs[parent]!.direction
    const b: V3 = [a[0] + direction[0] * length, a[1] + direction[1] * length, a[2] + direction[2] * length]
    const c: V3 = [a[0] + incoming[0] * length * 0.38, a[1] + incoming[1] * length * 0.38, a[2] + incoming[2] * length * 0.38]
    const d: V3 = [b[0] - direction[0] * length * 0.3, b[1] - direction[1] * length * 0.3 + length * 0.065, b[2] - direction[2] * length * 0.3]
    const index = limbs.length
    const limb: Limb = {
      a, b, c, d, direction, parent, level, length, delay: random() * 0.12,
      route: parent < 0 ? 0 : limbs[parent]!.route + limbs[parent]!.length,
      wave: parent < 0 ? 0 : limbs[parent]!.wave + limbs[parent]!.length * 0.42,
      r0: 0, r1: 0, grown: 0, end: [0, 0, 0], screen: new Float64Array(SAMPLES * 4),
      body: paint('poly', SAMPLES * 4 + (parent < 0 ? (TRUNK_CAP - 1) * 2 : 0)), pulse: paint('path', SAMPLES * 2),
      tip: paint('square'), halo: paint('dot'),
      // Reuse the trunk's joint mark for its lit side; no extra marks.
      joint: parent < 0 ? paint('poly', SAMPLES * 4 + TRUNK_CAP) : paint('dot'),
    }
    limbs.push(limb)
    if (level === last) return
    const count = level === 0 ? last >= 5 ? 4 : 3 : 2
    // A local orthonormal frame. Fork azimuth is independent of screen yaw.
    const u = normalize(direction[1], -direction[0], 0)
    const v: V3 = [direction[1] * u[2] - direction[2] * u[1], direction[2] * u[0] - direction[0] * u[2], direction[0] * u[1] - direction[1] * u[0]]
    for (let child = 0; child < count; child++) {
      const azimuth = level === 0 ? child * GOLDEN + 0.3 : index * GOLDEN + child * Math.PI + (random() - 0.5) * 0.55
      const divergence = level === 0 ? child === 3 ? 0.22 + random() * 0.14 : 0.76 + random() * 0.16 : 0.45 + level * 0.025 + random() * 0.21
      const s = Math.sin(divergence)
      const co = Math.cos(divergence)
      const radial = Math.hypot(b[0], b[2]) || 1
      const outward = level === 0 ? 0 : 0.08
      const dy = level < 4 ? 0.13 : -0.04 * (level - 3)
      const next = normalize(
        direction[0] * co + (u[0] * Math.cos(azimuth) + v[0] * Math.sin(azimuth)) * s + outward * b[0] / radial,
        direction[1] * co + (u[1] * Math.cos(azimuth) + v[1] * Math.sin(azimuth)) * s + dy,
        direction[2] * co + (u[2] * Math.cos(azimuth) + v[2] * Math.sin(azimuth)) * s + outward * b[2] / radial,
      )
      branch(b, next, index, level + 1, (level === 0 ? 21 : length * 0.76) * (0.86 + random() * 0.27))
    }
  }
  branch([0, -34, 0], normalize(0.035, 1, -0.025), -1, 0, 20)
  let top = -Infinity
  let route = 0
  // Accumulate child base areas in r1, then take their square root.
  for (let i = limbs.length - 1; i >= 0; i--) {
    const limb = limbs[i]!
    limb.r1 = limb.level === last ? 0.058 + limb.delay * 0.22 : Math.sqrt(limb.r1)
    limb.r0 = limb.r1 * 1.14
    if (limb.parent >= 0) limbs[limb.parent]!.r1 += limb.r0 ** 2
    top = Math.max(top, limb.a[1], limb.b[1], limb.d[1])
    route = Math.max(route, limb.route + limb.length)
  }
  const radiusScale = 1.35 / limbs[0]!.r0
  for (const limb of limbs) { limb.r0 *= radiusScale; limb.r1 *= radiusScale }
  const reach = Math.max(...limbs.map((limb) => limb.wave + limb.length))
  const growth = new Float64Array(FRONT_SAMPLES + 1)
  // As the front forks, more limbs share it. Account for that density once at
  // construction so the visible tree extends at an even aggregate rate.
  for (let i = 0; i <= FRONT_SAMPLES; i++) {
    const front = reach * i / FRONT_SAMPLES
    for (const limb of limbs) {
      const g = smooth((front - limb.wave) / limb.length)
      growth[i] = growth[i]! + limb.length * g * (limb.parent < 0 ? 0.915 : 1)
    }
  }
  const total = growth[FRONT_SAMPLES]!
  for (let i = 0; i <= FRONT_SAMPLES; i++) growth[i] = growth[i]! / total
  const centerY = (top - 34) / 2
  let scale = Math.min(1.4, 74 / (top + 34))
  let extent = 0
  const projected = point()
  // Fit the entire control hull across the camera's orbit, with room for wind
  // and pixel-sized twigs. Sampling is construction-time work, never a frame.
  for (let yaw = -0.82; yaw <= 0.08; yaw += 0.075) {
    const fit = camera({ yaw, pitch: -0.105, distance: 230, cx: 0, cy: 0 })
    for (const limb of limbs) {
      for (const vertex of [limb.a, limb.c, limb.d, limb.b]) {
        fit(vertex[0] * scale, (vertex[1] - centerY) * scale, vertex[2] * scale, projected)
        extent = Math.max(extent, Math.abs(projected.x))
      }
    }
  }
  if (extent > 43) scale *= 43 / extent
  const ground = [paint('poly', 64), paint('poly', 64), paint('poly', 64), paint('path', 66)]
  const root = paint('dot')
  const marks = [...ground, root]
  for (const limb of limbs) marks.push(limb.body, limb.pulse, limb.tip, limb.halo, limb.joint)
  return {
    limbs, last, scale, centerY,
    route, reach, growth, ground, root, marks, order: new Int32Array(marks.length), merge: new Int32Array(marks.length), count: 0,
  }
}

function growthFront(tree: Tree, progress: number) {
  if (progress <= 0) return 0
  if (progress >= 1) return tree.reach
  const mass = tree.growth
  let lo = 0; let hi = FRONT_SAMPLES
  while (hi - lo > 1) {
    const middle = (lo + hi) >>> 1
    if (mass[middle]! < progress) lo = middle
    else hi = middle
  }
  const width = mass[hi]! - mass[lo]!
  const u = (progress - mass[lo]!) / width
  // Monotone Hermite interpolation keeps position AND velocity continuous
  // between table entries. This is a spatial inverse, never a frame clock.
  const m0 = lo === 0 ? 1 : 2 * width / (mass[hi]! - mass[lo - 1]!)
  const m1 = hi === FRONT_SAMPLES ? 1 : 2 * width / (mass[hi + 1]! - mass[lo]!)
  const f = (u ** 3 - 2 * u * u + u) * m0 + (-2 * u ** 3 + 3 * u * u) + (u ** 3 - u * u) * m1
  return (lo + f) / FRONT_SAMPLES * tree.reach
}

// 10 / 22 / 46 / 125 / 253 limbs; 6 / 12 / 24 / 64 / 128 terminal buds.
const trees = [makeTree(2), makeTree(3), makeTree(4), makeTree(5), makeTree(6)]
const lens = camera({ pitch: -0.105, distance: 230, cx: 0, cy: 0 })
const p = point()
let yawC = 1
let yawS = 0
let windA = 0
let windB = 0
let phase = 0
let cx = 50
let scale = 1
let centerY = 0

function project(x: number, y: number, z: number) {
  // Continuous displacement: coincident joints see exactly the same wind.
  const height = clamp((y + 34) / 65)
  const flex = height * height
  x += flex * (windA + 0.23 * Math.sin(phase * 2 + y * 0.085 + z * 0.06))
  z += flex * (windB + 0.18 * Math.sin(phase + x * 0.06))
  lens((x * yawC + z * yawS) * scale, (y - centerY) * scale, (-x * yawS + z * yawC) * scale, p)
  p.x += cx
  p.y += 49
}

/** Stable far-to-near merge sort, with fixed storage (including equal-depth order). */
function flush(tree: Tree, pen: Pen) {
  let n = 0
  for (let i = 0; i < tree.marks.length; i++) if (tree.marks[i]!.alpha > 0.004) tree.order[n++] = i
  tree.count = n
  let from = tree.order
  let to = tree.merge
  for (let width = 1; width < n; width *= 2) {
    for (let start = 0; start < n; start += width * 2) {
      const middle = Math.min(start + width, n)
      const end = Math.min(start + width * 2, n)
      let a = start
      let b = middle
      for (let out = start; out < end; out++) {
        const left = from[a]!
        const right = from[b]!
        if (b >= end || (a < middle && tree.marks[left]!.z <= tree.marks[right]!.z)) to[out] = from[a++]!
        else to[out] = from[b++]!
      }
    }
    const swap = from; from = to; to = swap
  }
  for (let i = 0; i < n; i++) {
    const mark = tree.marks[from[i]!]!
    if (mark.kind === 'poly') pen.poly(mark.xy, mark.alpha, mark.tone)
    else if (mark.kind === 'path') {
      mark.stroke.alpha = mark.alpha
      mark.stroke.tone = mark.tone
      pen.path(mark.xy, mark.stroke)
    } else if (mark.kind === 'square') pen.square(mark.x, mark.y, mark.radius, mark.alpha, mark.tone)
    else pen.dot(mark.x, mark.y, mark.radius, mark.alpha, mark.tone)
  }
}

export const scene: Scene = {
  beats: 18, still: 0.705,
  draw(pen, t, view) {
    // Normalize the seam exactly; all drifting and wind harmonics are periodic.
    if (t === 1) t = 0
    const tree = trees[view.size < 32 ? 0 : view.size < 80 ? 1 : view.size < 240 ? 2 : view.size < 480 ? 3 : 4]!
    const small = view.size < 80
    phase = TAU * t
    const yaw = -0.38 + 0.32 * Math.sin(phase) + 0.07 * Math.sin(phase * 2)
    yawC = Math.cos(yaw); yawS = Math.sin(yaw)
    windA = 0.55 * Math.sin(phase)
    windB = 0.38 * Math.sin(phase * 2 + 0.8)
    cx = view.w / 2; scale = tree.scale; centerY = tree.centerY
    const step = 0.42 / (tree.last + 1)
    const growing = growthFront(tree, flow(span(t, 0.012, 0.44)))
    const returning = growthFront(tree, 1 - flow(span(t, 0.78, 0.98)))
    const minRadius = (small ? 0.52 : 0.38) / view.px
    const front = span(t, 0.5, 0.67) * (tree.route + 8)
    const sap = view.ease.standard(span(t, 0.5, 0.515)) * (1 - view.ease.standard(span(t, 0.665, 0.68)))
    const bloom = view.ease.standard(span(t, 0.4, 0.47)) * (1 - view.ease.standard(span(t, 0.755, 0.79)))

    for (const limb of tree.limbs) {
      const start = 0.012 + (limb.level + limb.delay) * step
      const up = smooth((growing - limb.wave) / limb.length)
      const down = 1 - smooth((returning - limb.wave) / limb.length)
      const g = limb.parent < 0 ? mix(0.085, 1, up * (1 - down)) : up * (1 - down)
      limb.grown = g
      limb.body.alpha = limb.pulse.alpha = limb.tip.alpha = limb.halo.alpha = limb.joint.alpha = 0
      if (g < 0.0001) continue

      const a = limb.a; const b = limb.b; const c = limb.c; const d = limb.d
      // A brief, damped angular arrival; the end displacement passes to the
      // children, so settling never tears a fork away from its parent.
      const arrival = span(t, start + step * 0.46, start + step * 1.6)
      const settle = 0.018 * Math.sin(TAU * arrival) * (1 - arrival) ** 2 * up * (1 - down)
      const parent = limb.parent < 0 ? null : tree.limbs[limb.parent]!
      const ox = parent ? parent.end[0] - a[0] : 0
      const oy = parent ? parent.end[1] - a[1] : 0
      const oz = parent ? parent.end[2] - a[2] : 0
      let depth = 0
      const screen = limb.screen
      for (let j = 0; j < SAMPLES; j++) {
        // Sample the partial limb itself, including its exact fractional tip.
        // No whole-segment clipping: even a sub-pixel advance changes the end.
        const u = g * j / (SAMPLES - 1)
        const v = 1 - u
        const x = v ** 3 * a[0] + 3 * v * v * u * c[0] + 3 * v * u * u * d[0] + u ** 3 * b[0] + ox + (b[1] - a[1]) * settle * u * u
        const y = v ** 3 * a[1] + 3 * v * v * u * c[1] + 3 * v * u * u * d[1] + u ** 3 * b[1] + oy
        const z = v ** 3 * a[2] + 3 * v * v * u * c[2] + 3 * v * u * u * d[2] + u ** 3 * b[2] + oz + limb.length * settle * u * u * 0.4
        if (j === SAMPLES - 1) { limb.end[0] = x; limb.end[1] = y; limb.end[2] = z }
        project(x, y, z)
        screen[j * 4] = p.x; screen[j * 4 + 1] = p.y; screen[j * 4 + 2] = p.z; screen[j * 4 + 3] = p.k
        depth += p.z / SAMPLES
      }
      const fog = 0.32 + 0.62 * clamp((depth + 30) / 65)
      const body = limb.body
      body.z = depth; body.alpha = fog * smooth(g / 0.05) * (limb.parent < 0 && !small ? 0.8 : 1)
      for (let j = 0; j < SAMPLES; j++) {
        const before = Math.max(0, j - 1) * 4
        const after = Math.min(SAMPLES - 1, j + 1) * 4
        const dx = screen[after]! - screen[before]!
        const dy = screen[after + 1]! - screen[before + 1]!
        const length = Math.hypot(dx, dy) || 1
        const u = g * j / (SAMPLES - 1)
        const flare = limb.parent < 0 ? 1 + 0.24 * (1 - u) ** 3 : 1
        // Interpolate trunk area into the child pipes, with the existing root
        // flare; the crown keeps its approved linear radius profile.
        const pipe = limb.parent < 0 ? Math.sqrt(mix(limb.r0 ** 2, limb.r1 ** 2, smooth(u))) : mix(limb.r0, limb.r1, u)
        const radius = Math.max(minRadius, pipe * scale * flare * (small ? 1.35 : 1)) * screen[j * 4 + 3]!
        const nx = -dy / length * radius
        const ny = dx / length * radius
        const opposite = (SAMPLES * 2 - 1 - j) * 2 + (limb.parent < 0 ? (TRUNK_CAP - 1) * 2 : 0)
        // Overlap the butt at a joint slightly so tapered ribbons meet as one
        // continuous limb, even when its daughters leave at different angles.
        const cap = (j === 0 && limb.parent >= 0 ? -radius * 0.45 : j === SAMPLES - 1 && limb.parent >= 0 ? radius * 0.18 : 0) * smooth(g / 0.05)
        const x = screen[j * 4]! + dx / length * cap
        const y = screen[j * 4 + 1]! + dy / length * cap
        body.xy[j * 2] = x + nx; body.xy[j * 2 + 1] = y + ny
        body.xy[opposite] = x - nx; body.xy[opposite + 1] = y - ny
        if (limb.parent < 0 && j === SAMPLES - 1) {
          // Fold the old circular fork joint into the trunk ribbon, so its
          // lit/shade sides round into the daughters instead of ending flat.
          for (let k = 1; k < TRUNK_CAP; k++) {
            const angle = Math.PI * k / TRUNK_CAP
            const at = SAMPLES * 2 + (k - 1) * 2
            body.xy[at] = x + nx * Math.cos(angle) + dx / length * radius * Math.sin(angle)
            body.xy[at + 1] = y + ny * Math.cos(angle) + dy / length * radius * Math.sin(angle)
          }
        }
        if (limb.parent < 0 && !small) {
          const lit = limb.joint
          lit.xy[j * 2] = x + nx; lit.xy[j * 2 + 1] = y + ny
          const inner = (SAMPLES * 2 - 1 - j) * 2 + TRUNK_CAP
          lit.xy[inner] = x; lit.xy[inner + 1] = y
          if (j === SAMPLES - 1) {
            for (let k = 1; k <= TRUNK_CAP / 2; k++) {
              const angle = Math.PI * k / TRUNK_CAP
              const at = SAMPLES * 2 + (k - 1) * 2
              lit.xy[at] = x + nx * Math.cos(angle) + dx / length * radius * Math.sin(angle)
              lit.xy[at + 1] = y + ny * Math.cos(angle) + dy / length * radius * Math.sin(angle)
            }
          }
          lit.z = depth + 0.01; lit.alpha = fog * smooth(g / 0.05) * 0.55
        }
      }

      // A finite packet, measured along root-to-tip internode distance. It
      // crosses each shared junction once, splitting into its daughter limbs.
      const lo = clamp((front - 6 - limb.route) / limb.length)
      const hi = clamp((front - limb.route) / limb.length)
      if (sap > 0.004 && hi > lo && g > 0.99) {
        const pulse = limb.pulse
        for (let j = 0; j < SAMPLES; j++) {
          const u = mix(lo, hi, j / (SAMPLES - 1)) * (SAMPLES - 1)
          const index = Math.min(SAMPLES - 2, Math.floor(u))
          const f = u - index
          pulse.xy[j * 2] = mix(screen[index * 4]!, screen[(index + 1) * 4]!, f)
          pulse.xy[j * 2 + 1] = mix(screen[index * 4 + 1]!, screen[(index + 1) * 4 + 1]!, f)
        }
        pulse.z = depth + 0.02; pulse.alpha = sap * Math.min(1, fog + 0.25); pulse.tone = 'accent'
        pulse.stroke.width = Math.max(0.8 / view.px, limb.r1 * scale * 0.85)
      }
      if (limb.level === tree.last && bloom > 0.004) {
        const tip = limb.tip
        const k = screen[19]!
        const reached = view.ease.standard(clamp((front - limb.route - limb.length) / 3))
        tip.x = screen[16]!; tip.y = screen[17]!; tip.z = screen[18]! + 0.03
        tip.radius = clamp(view.size * 0.0042, small ? 1.2 : 1.7, 3.2) / view.px * k * (0.5 + 0.5 * bloom)
        const arrived = smooth(span(g, 0.94, 1))
        tip.alpha = arrived * bloom * (fog * 0.7 + reached * 0.25)
        tip.tone = reached > 0.01 ? 'accent' : 'c1'
        const halo = limb.halo
        halo.x = tip.x; halo.y = tip.y; halo.z = tip.z - 0.01; halo.radius = tip.radius * 1.65
        halo.alpha = small ? 0 : arrived * reached * bloom * 0.055; halo.tone = 'accent'
      }
    }

    // Three low-opacity elliptical fills suggest a soft ground shadow without
    // expensive canvas blur or an extra color. At control sizes only the root remains.
    for (let layer = 0; layer < tree.ground.length; layer++) {
      const ground = tree.ground[layer]!
      ground.z = -1000 + layer; ground.alpha = small ? 0 : layer === 3 ? 0.11 : 0.018
      const radius = layer === 3 ? 21 : 15 - layer * 3
      for (let j = 0; j <= 32; j++) {
        if (j === 32 && layer < 3) break
        const angle = TAU * j / 32
        project(Math.cos(angle) * radius, -34, Math.sin(angle) * radius * 0.56)
        ground.xy[j * 2] = p.x; ground.xy[j * 2 + 1] = p.y
      }
      ground.stroke.width = 0.7 / view.px
    }
    project(0, -34, 0)
    tree.root.x = p.x; tree.root.y = p.y; tree.root.z = p.z + 0.1
    tree.root.radius = Math.max(0.26, 0.75 / view.px) * p.k
    tree.root.alpha = 0.95; tree.root.tone = 'accent'
    flush(tree, pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A great canopy grows, carries sap-light to its crown, and returns to its root. */
export function LoaderBanyan(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
