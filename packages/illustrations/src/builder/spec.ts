import { round2, type Base, type BuilderScene, type LathePart, type Part, type PipePart, type PrismPart, type SceneGroup } from './model'

/* The one description of what a scene draws, as the kit's elements and their
 * props, that both the canvas and the code are made from: the renderer turns
 * it into elements, the code generator prints it. Neither decides anything
 * of its own, so the code draws what the canvas draws. */

/** Kit helpers a prop can call, and the outlines the code writes as helpers of its own. */
export type Call = { call: 'rounded' | 'orb' | 'heart' | 'star' | 'bubble' | 'band' | 'rect' | 'circle'; args: number[] }
/** One of the kit's inks for marks. */
export type Ink = 'well'

export type List = readonly number[] | readonly (readonly number[])[]
export type Value = number | string | true | List | { bob: number } | { ink: Ink } | Call

/** A list of numbers or points (Array.isArray doesn't narrow readonly arrays). */
export const isList = (v: Value): v is List => Array.isArray(v)

export type Component = 'IsoBox' | 'IsoCylinder' | 'IsoPlatform' | 'IsoFloor' | 'Prism' | 'Lathe' | 'Group' | 'Mark' | 'Hollow'

export interface ElementSpec {
  component: Component
  props: [name: string, value: Value][]
  children?: ElementSpec[]
  /** The part it draws, so the canvas can find it. */
  part?: string
  /** The part's own name, which the code writes as a comment above it. */
  label?: string
}

/** Where each component comes from, as the registry installs it. */
export const MODULES: Record<Component | 'IllustrationStage' | 'bob' | 'rounded' | 'orb' | 'band' | 'rect' | 'circle' | 'INK' | 'PlanePoint', 'iso-box' | 'iso-cylinder' | 'iso-platform' | 'grids' | 'kit'> = {
  IsoBox: 'iso-box',
  IsoCylinder: 'iso-cylinder',
  IsoPlatform: 'iso-platform',
  IsoFloor: 'grids',
  Prism: 'kit',
  Lathe: 'kit',
  Group: 'kit',
  Mark: 'kit',
  Hollow: 'kit',
  IllustrationStage: 'kit',
  bob: 'kit',
  rounded: 'kit',
  orb: 'kit',
  band: 'kit',
  rect: 'kit',
  circle: 'kit',
  INK: 'kit',
  PlanePoint: 'kit',
}

/* ── Outlines ────────────────────────────────────────────────────────────── */

/** A prism's outline in its plane, U across and V up, filling the part's box. */
function outline(part: PrismPart, U: number, V: number): Value {
  const [u, v] = [round2(U), round2(V)]
  switch (part.preset) {
    case 'gable':
      return [[0, 0], [u, 0], [round2(u / 2), v]]
    case 'wedge':
      // High at the plane's origin, sloping away from it: an awning off a wall, a ramp up to the back.
      return [[0, 0], [u, 0], [0, v]]
    case 'tab':
      return { call: 'rounded', args: [0, 0, u, v, round2(Math.min(u, v) * 0.25)] }
    case 'heart':
      return { call: 'heart', args: [u, v] }
    case 'star':
      return { call: 'star', args: [u, v] }
    case 'arch': {
      // Round-topped: a semicircle across its width, or as much of one as it is tall.
      const ry = Math.min(v, u / 2)
      return [[0, 0], [u, 0], ...Array.from({ length: 13 }, (_, i) => [u / 2 + (u / 2) * Math.cos((i * Math.PI) / 12), v - ry + ry * Math.sin((i * Math.PI) / 12)])].map((p) => p.map(round2))
    }
    case 'ell': {
      const t = round2(Math.min(u, v) * 0.4)
      return [[0, 0], [u, 0], [u, t], [t, t], [t, v], [0, v]]
    }
    case 'cross': {
      const [a, b, c, d] = [u / 3, (u * 2) / 3, v / 3, (v * 2) / 3].map(round2) as [number, number, number, number]
      return [[a, 0], [b, 0], [b, c], [u, c], [u, d], [b, d], [b, v], [a, v], [a, d], [0, d], [0, c], [a, c]]
    }
    case 'arrow': {
      // Pointing along the plane's U.
      const [head, low, high] = [u * 0.55, v / 3, (v * 2) / 3].map(round2) as [number, number, number]
      return [[0, low], [head, low], [head, 0], [u, round2(v / 2)], [head, v], [head, high], [0, high]]
    }
    case 'hexagon': {
      const [a, b, mid] = [u / 4, (u * 3) / 4, v / 2].map(round2) as [number, number, number]
      return [[a, 0], [b, 0], [u, mid], [b, v], [a, v], [0, mid]]
    }
    case 'house': {
      const eaves = round2(v * 0.6)
      return [[0, 0], [u, 0], [u, eaves], [round2(u / 2), v], [0, eaves]]
    }
    case 'bubble':
      return { call: 'bubble', args: [u, v] }
    case 'stairs': {
      // Four steps, the tallest at the plane's origin.
      const [a, b, c, d] = [0.25, 0.5, 0.75, 1]
      return [[0, 0], [u, 0], [u, v * a], [u * c, v * a], [u * c, v * b], [u * b, v * b], [u * b, v * c], [u * a, v * c], [u * a, v * d], [0, v * d]].map((p) => p.map(round2))
    }
    case 'ring': {
      // A round band, cut open at its back where a seam is least seen; a full turn for the kit's band.
      const r = Math.min(u, v) / 2
      const from = part.facing === 'top' ? 3.93 : 1.57
      return { call: 'band', args: [u / 2, v / 2, r * 0.55, r, from, from + 6.28, 40].map(round2) }
    }
  }
}

/* The code's own outline helpers, written out beside the scene when it uses
 * them; the functions below are the same maths, and a test holds the two to
 * the same drawing. */

export const HELPER_SOURCES = {
  heart: `/** A heart filling w × h in plane units, from its corner. */
const heart = (w: number, h: number): PlanePoint[] =>
  Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2
    const v = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    return [w * (0.5 + Math.sin(t) ** 3 / 2), (h * (v + 17)) / 28.92] as const
  })`,
  star: `/** A five-point star filling w × h in plane units, from its corner. */
const star = (w: number, h: number): PlanePoint[] =>
  Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? 0.38 : 1
    return [w * (0.5 + (r * Math.cos(a)) / 1.902), (h * (r * Math.sin(a) + 0.809)) / 1.809] as const
  })`,
  bubble: `/** A speech bubble filling w × h in plane units, from its corner: a rounded body with a tail at the lower left. */
const bubble = (w: number, h: number): PlanePoint[] => {
  const floor = 0.28 * h
  const r = Math.min(w, h - floor) * 0.25
  const corner = (cu: number, cv: number, from: number) =>
    Array.from({ length: 5 }, (_, i) => [cu + r * Math.cos(from + (i * Math.PI) / 8), cv + r * Math.sin(from + (i * Math.PI) / 8)] as const)
  return [
    [0.3 * w, 0],
    [0.5 * w, floor],
    ...corner(w - r, floor + r, -Math.PI / 2),
    ...corner(w - r, h - r, 0),
    ...corner(r, h - r, Math.PI / 2),
    ...corner(r, floor + r, Math.PI),
    [0.3 * w, floor],
  ]
}`,
} as const

export const heart = (w: number, h: number) =>
  Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2
    const v = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    return [w * (0.5 + Math.sin(t) ** 3 / 2), (h * (v + 17)) / 28.92] as const
  })

export const star = (w: number, h: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? 0.38 : 1
    return [w * (0.5 + (r * Math.cos(a)) / 1.902), (h * (r * Math.sin(a) + 0.809)) / 1.809] as const
  })

export const bubble = (w: number, h: number) => {
  const floor = 0.28 * h
  const r = Math.min(w, h - floor) * 0.25
  const corner = (cu: number, cv: number, from: number) =>
    Array.from({ length: 5 }, (_, i) => [cu + r * Math.cos(from + (i * Math.PI) / 8), cv + r * Math.sin(from + (i * Math.PI) / 8)] as const)
  return [
    [0.3 * w, 0],
    [0.5 * w, floor],
    ...corner(w - r, floor + r, -Math.PI / 2),
    ...corner(w - r, h - r, 0),
    ...corner(r, h - r, Math.PI / 2),
    ...corner(r, floor + r, Math.PI),
    [0.3 * w, floor],
  ] as const
}

/* ── Profiles ────────────────────────────────────────────────────────────── */

/** Each lathe's outline, bottom up, as [radius, height] shares of the part's r and h, and whether it's outlined as a convex hull. */
const PROFILES: Record<Exclude<LathePart['preset'], 'ball' | 'capsule'>, { steps: readonly (readonly [number, number])[]; convex: boolean }> = {
  cup: { steps: [[0.69, 0], [0.78, 0.06], [0.86, 0.39], [0.95, 0.77], [1, 1]], convex: true },
  bell: { steps: [[1, 0], [0.8, 0.12], [0.63, 0.4], [0.55, 0.75], [0.42, 1]], convex: false },
  dome: { steps: [[1, 0], [0.92, 0.38], [0.71, 0.71], [0.38, 0.92], [0, 1]], convex: true },
  cone: { steps: [[1, 0], [0, 1]], convex: true },
  // A foot, a belly, a neck and a flared lip.
  vase: { steps: [[0.55, 0], [0.8, 0.1], [1, 0.32], [0.92, 0.52], [0.62, 0.72], [0.44, 0.85], [0.5, 0.94], [0.68, 1]], convex: false },
  // A body, its shoulder, a neck and a lip.
  bottle: { steps: [[0.9, 0], [1, 0.03], [1, 0.5], [0.94, 0.57], [0.7, 0.65], [0.42, 0.72], [0.3, 0.78], [0.3, 0.94], [0.38, 1]], convex: false },
  bowl: { steps: [[0.4, 0], [0.5, 0.08], [0.8, 0.4], [0.95, 0.75], [1, 1]], convex: true },
  // A stem, then a cone opening to the rim.
  funnel: { steps: [[0.14, 0], [0.14, 0.35], [0.4, 0.55], [0.7, 0.78], [1, 1]], convex: false },
}
/** A ball's outline, pole to pole, for one that isn't round (taller or flatter than it's wide). */
const BALL = Array.from({ length: 13 }, (_, i) => [Math.sin((i / 12) * Math.PI), (1 - Math.cos((i / 12) * Math.PI)) / 2] as const)
/** A capsule's two ends, each a quarter turn in six steps: the hull draws the straight side between them. */
const QUARTER = Array.from({ length: 7 }, (_, i) => (i / 6) * (Math.PI / 2))

function profile(preset: LathePart['preset'], r: number, h: number): { value: Value; convex: boolean } {
  // A true ball is the kit's own orb.
  if (preset === 'ball') return { value: round2(h) === round2(r * 2) ? { call: 'orb', args: [round2(r)] } : BALL.map(([a, b]) => [round2(a * r), round2(b * h)]), convex: true }
  if (preset === 'capsule') {
    // Round ends as wide as it is, shortened when it is squatter than a ball.
    const cap = Math.min(r, h / 2)
    const ends = [...QUARTER.map((t) => [r * Math.sin(t), cap * (1 - Math.cos(t))]), ...[...QUARTER].reverse().map((t) => [r * Math.sin(t), h - cap * (1 - Math.cos(t))])]
    return { value: ends.map(([a, b]) => [round2(a!), round2(b!)]), convex: true }
  }
  const { steps, convex } = PROFILES[preset]
  return { value: steps.map(([a, b]) => [round2(a * r), round2(b * h)]), convex }
}

/* ── Elements ────────────────────────────────────────────────────────────── */

/** The shade a part is drawn in: the accent when it's lit; a platform is sunken unless it says otherwise. */
function toneOf(part: Part): string | undefined {
  if (part.lit) return 'accent'
  const fallback = part.type === 'platform' ? 'sunken' : 'neutral'
  return part.tone === fallback ? undefined : part.tone
}

/** Props with the defaults left out, in the order a scene writes them. */
function props(entries: [string, Value | undefined][]): [string, Value][] {
  return entries.filter((e): e is [string, Value] => e[1] !== undefined)
}

function motion(lift: number, float: number): [string, Value | undefined][] {
  return [
    ['float', float > 0 ? { bob: round2(float) } : undefined],
    ['lift', lift > 0 ? round2(lift) : undefined],
  ]
}

export function partSpec(part: Part): ElementSpec {
  return { ...shapeSpec(part), label: part.name }
}

function shapeSpec(part: Part): ElementSpec {
  const { x, y, z } = part
  const at: [string, Value | undefined][] = [
    ['x', x],
    ['y', y],
    ['z', z || undefined],
  ]
  const look: [string, Value | undefined][] = [
    ['tone', toneOf(part)],
    ['variant', part.variant === 'solid' ? undefined : part.variant],
  ]
  switch (part.type) {
    case 'box':
      return { component: 'IsoBox', part: part.id, props: props([...at, ['w', part.w], ['d', part.d], ['h', part.h], ...look, ...motion(part.lift, part.float)]) }
    case 'cylinder':
      return { component: 'IsoCylinder', part: part.id, props: props([...at, ['r', part.r], ['h', part.h], ...look, ...motion(part.lift, part.float)]) }
    case 'platform':
      return {
        component: 'IsoPlatform',
        part: part.id,
        props: props([...at, ['w', part.w], ['d', part.d], ['h', part.h], ['shape', part.round ? 'round' : undefined], ['grid', part.grid && !part.round ? 1 : undefined], ...look, ...motion(part.lift, part.float)]),
      }
    case 'prism': {
      // The outline lies in its plane and is extruded toward you: across and up the plane, and how deep.
      const [U, V, depth] = part.facing === 'left' ? [part.w, part.h, part.d] : part.facing === 'right' ? [part.d, part.h, part.w] : [part.w, part.d, part.h]
      return {
        component: 'Prism',
        part: part.id,
        props: props([['plane', part.facing], ['at', [x, y, z]], ['points', outline(part, U, V)], ['depth', round2(depth)], ['tone', toneOf(part)], ...motion(part.lift, part.float)]),
      }
    }
    case 'lathe': {
      const shape = profile(part.preset, part.r, part.h)
      const [cx, cy] = [round2(x + part.r), round2(y + part.r)]
      // A bowl and a funnel are open: a dark well in the top.
      const well = part.preset === 'bowl' ? 0.82 : part.preset === 'funnel' ? 0.85 : 0
      return {
        component: 'Lathe',
        part: part.id,
        props: props([['cx', cx], ['cy', cy], ['z', z || undefined], ['profile', shape.value], ['convex', shape.convex || undefined], ['tone', toneOf(part)], ...motion(part.lift, part.float)]),
        children: well ? [mark('top', [cx, cy, round2(z + part.h)], { call: 'circle', args: [0, 0, round2(part.r * well), 32] })] : undefined,
      }
    }
    case 'pipe':
      return pipeSpec(part)
    case 'screen': {
      const [U, V] = part.facing === 'left' ? [part.w, part.h] : part.facing === 'right' ? [part.d, part.h] : [part.w, part.d]
      const m = round2(Math.min(0.2, Math.min(U, V) / 6))
      const on: [number, number, number] = part.facing === 'left' ? [x, round2(y + part.d), z] : part.facing === 'right' ? [round2(x + part.w), y, z] : [x, y, round2(z + part.h)]
      return {
        component: 'IsoBox',
        part: part.id,
        props: props([...boxProps(part, at), ['tone', toneOf(part)], ...motion(part.lift, part.float)]),
        children: [mark(part.facing, on, { call: 'rect', args: [m, m, round2(U - m * 2), round2(V - m * 2)] })],
      }
    }
    case 'crate': {
      // Walls a tenth thick, as far as the crate is wide enough to have them.
      const wall = round2(Math.min(0.1, part.w / 4, part.d / 4))
      const depth = round2(part.h - Math.min(0.15, part.h / 2))
      return {
        component: 'IsoBox',
        part: part.id,
        props: props([...boxProps(part, at), ['tone', toneOf(part)], ...motion(part.lift, part.float)]),
        children: [
          {
            component: 'Hollow',
            props: [['x', round2(x + wall)], ['y', round2(y + wall)], ['top', round2(z + part.h)], ['w', round2(part.w - wall * 2)], ['d', round2(part.d - wall * 2)], ['depth', depth]],
          },
        ],
      }
    }
  }
}

const boxProps = (part: { w: number; d: number; h: number }, at: [string, Value | undefined][]): [string, Value | undefined][] => [...at, ['w', part.w], ['d', part.d], ['h', part.h]]

/** A flat mark on a face of its shape, in the well's ink: a pane, an opening. */
const mark = (plane: 'top' | 'left' | 'right', at: readonly [number, number, number], points: Value): ElementSpec => ({
  component: 'Mark',
  props: [['plane', plane], ['at', at], ['points', points], ['fill', { ink: 'well' }]],
})

/** A lathe lying down: its end faces you, and an opening in it. */
function pipeSpec(part: PipePart): ElementSpec {
  const { x, y, z, w, d, h } = part
  const r = round2(h / 2)
  const along = part.axis === 'x' ? w : d
  const [cx, cy] = part.axis === 'x' ? [x, round2(y + d / 2)] : [round2(x + w / 2), y]
  const end = part.axis === 'x' ? mark('right', [round2(x + w), y, z], { call: 'circle', args: [round2(d / 2), r, round2(r * 0.7), 32] }) : mark('left', [x, round2(y + d), z], { call: 'circle', args: [round2(w / 2), r, round2(r * 0.7), 32] })
  return {
    component: 'Lathe',
    part: part.id,
    props: props([['cx', cx], ['cy', cy], ['z', round2(z + r)], ['profile', [[r, 0], [r, along]]], ['axis', part.axis], ['tone', toneOf(part)], ...motion(part.lift, part.float)]),
    children: [end],
  }
}

/** The base under everything: a plinth or turntable whose top stands at half a unit (so parts on it land on the grid), or the floor's own grid. */
export function baseSpec(base: Base): ElementSpec | null {
  switch (base) {
    case 'plinth':
      return { component: 'IsoPlatform', props: [['x', 0.7], ['y', 0.7], ['w', 6.6], ['d', 6.6], ['h', 0.35], ['lip', 0.15], ['inset', 0.3], ['grid', 1]] }
    case 'turntable':
      return { component: 'IsoPlatform', props: [['x', 1], ['y', 1], ['w', 6], ['d', 6], ['h', 0.35], ['lip', 0.15], ['inset', 0.4], ['shape', 'round']] }
    case 'grid':
      return { component: 'IsoFloor', props: [['w', 8], ['d', 8]] }
    case 'dots':
      return { component: 'IsoFloor', props: [['w', 8], ['d', 8], ['kind', 'dots']] }
    case 'none':
      return null
  }
}

function groupSpec(group: SceneGroup, members: Part[]): ElementSpec {
  return { component: 'Group', props: props(motion(group.lift, group.float)), children: members.map(partSpec) }
}

/** The scene as elements, base first, then its parts in order; a group stands where its first part does, holding the rest. */
export function sceneSpec(scene: BuilderScene): ElementSpec[] {
  const out: ElementSpec[] = []
  const base = baseSpec(scene.base)
  if (base) out.push(base)
  const placed = new Set<string>()
  for (const part of scene.parts) {
    const group = part.group ? scene.groups.find((g) => g.id === part.group) : undefined
    if (!group) {
      out.push(partSpec(part))
      continue
    }
    if (placed.has(group.id)) continue
    placed.add(group.id)
    out.push(groupSpec(group, scene.parts.filter((p) => p.group === group.id)))
  }
  return out
}
