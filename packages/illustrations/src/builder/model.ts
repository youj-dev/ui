/* The builder's scene: plain data, so it can live in a link, in storage and
 * on the clipboard as JSON, and be drawn by the kit or written out as code.
 * Everything is in grid units on the illustrations' shared volume (an 8 × 8
 * floor with room above it), placed by its corner nearest the origin, as the
 * kit's shapes are. Moves and sizes snap to half units. */

/** The volume every illustration frames: the kit's VOLUME. */
export const FLOOR = 8
export const CEILING = 3
/** Moves and sizes land on half units. */
export const STEP = 0.5
/** Shift moves this far per arrow press. */
export const BIG_STEP = 2
export const MAX_PARTS = 60

export type PartType = 'box' | 'cylinder' | 'platform' | 'prism' | 'lathe' | 'pipe' | 'screen' | 'crate'
export type Variant = 'solid' | 'wire' | 'ghost'
export type Shade = 'neutral' | 'raised' | 'sunken'
/** The plane a prism's outline lies in: its front faces left (+y), right (+x) or up. */
export type Facing = 'left' | 'right' | 'top'
export type PrismPreset = 'gable' | 'wedge' | 'tab' | 'heart' | 'star' | 'arch' | 'ell' | 'cross' | 'arrow' | 'hexagon' | 'house' | 'bubble' | 'stairs' | 'ring'
export type LathePreset = 'cup' | 'bell' | 'dome' | 'ball' | 'cone' | 'vase' | 'bottle' | 'bowl' | 'capsule' | 'funnel'
/** The way a pipe lies: along x or along y. */
export type Axis = 'x' | 'y'
/** What the scene stands on: a plinth, a turntable, the floor's grid or dots, or nothing. */
export type Base = 'plinth' | 'turntable' | 'grid' | 'dots' | 'none'

interface PartCommon {
  id: string
  /** A name of its own, given in the layers ("Monitor"); written into the code as a comment above the part. */
  name?: string
  x: number
  y: number
  z: number
  variant: Variant
  tone: Shade
  /** The accent part: the one the scene is about. */
  lit: boolean
  /** How far it rises when the scene comes apart, grid units. */
  lift: number
  /** The height of its bob, grid units; 0 holds it still. */
  float: number
  group?: string
}

export interface BoxPart extends PartCommon {
  type: 'box'
  w: number
  d: number
  h: number
}
export interface CylinderPart extends PartCommon {
  type: 'cylinder'
  r: number
  h: number
}
export interface PlatformPart extends PartCommon {
  type: 'platform'
  w: number
  d: number
  /** The base slab; the plate adds PLATFORM_LIP on top. */
  h: number
  round: boolean
  grid: boolean
}
export interface PrismPart extends PartCommon {
  type: 'prism'
  w: number
  d: number
  h: number
  preset: PrismPreset
  facing: Facing
}
export interface LathePart extends PartCommon {
  type: 'lathe'
  r: number
  h: number
  preset: LathePreset
}

/** A lathe lying down: its length runs along its axis, and its cross-section is round, so the other two sizes match. */
export interface PipePart extends PartCommon {
  type: 'pipe'
  w: number
  d: number
  h: number
  axis: Axis
}
/** A thin panel with a pane inset in the face it looks out of. */
export interface ScreenPart extends PartCommon {
  type: 'screen'
  w: number
  d: number
  h: number
  facing: Facing
}
/** An open box: its opening shows the inside. */
export interface CratePart extends PartCommon {
  type: 'crate'
  w: number
  d: number
  h: number
}

export type Part = BoxPart | CylinderPart | PlatformPart | PrismPart | LathePart | PipePart | ScreenPart | CratePart

export interface SceneGroup {
  id: string
  lift: number
  float: number
}

export interface BuilderScene {
  version: 1
  name: string
  base: Base
  parts: Part[]
  groups: SceneGroup[]
}

/** IsoPlatform's own plate on top of its slab. */
export const PLATFORM_LIP = 0.2

export const PART_TYPES: readonly PartType[] = ['box', 'cylinder', 'platform', 'prism', 'lathe', 'pipe', 'screen', 'crate']
export const VARIANTS: readonly Variant[] = ['solid', 'wire', 'ghost']
export const SHADES: readonly Shade[] = ['neutral', 'raised', 'sunken']
export const FACINGS: readonly Facing[] = ['left', 'right', 'top']
export const PRISM_PRESETS: readonly PrismPreset[] = ['gable', 'wedge', 'tab', 'heart', 'star', 'arch', 'ell', 'cross', 'arrow', 'hexagon', 'house', 'bubble', 'stairs', 'ring']
export const LATHE_PRESETS: readonly LathePreset[] = ['cup', 'bell', 'dome', 'ball', 'cone', 'vase', 'bottle', 'bowl', 'capsule', 'funnel']
export const AXES: readonly Axis[] = ['x', 'y']
export const BASES: readonly Base[] = ['plinth', 'turntable', 'grid', 'dots', 'none']

export const TYPE_LABELS: Record<PartType, string> = { box: 'Box', cylinder: 'Cylinder', platform: 'Platform', prism: 'Prism', lathe: 'Lathe', pipe: 'Pipe', screen: 'Screen', crate: 'Crate' }
export const PRISM_LABELS: Record<PrismPreset, string> = {
  gable: 'Gable',
  wedge: 'Wedge',
  tab: 'Tab',
  heart: 'Heart',
  star: 'Star',
  arch: 'Arch',
  ell: 'L-shape',
  cross: 'Cross',
  arrow: 'Arrow',
  hexagon: 'Hexagon',
  house: 'House',
  bubble: 'Bubble',
  stairs: 'Stairs',
  ring: 'Ring',
}
export const LATHE_LABELS: Record<LathePreset, string> = { cup: 'Cup', bell: 'Bell', dome: 'Dome', ball: 'Ball', cone: 'Cone', vase: 'Vase', bottle: 'Bottle', bowl: 'Bowl', capsule: 'Capsule', funnel: 'Funnel' }
export const BASE_LABELS: Record<Base, string> = { plinth: 'Plinth', turntable: 'Turntable', grid: 'Floor grid', dots: 'Floor dots', none: 'None' }

/** Variants the shape draws: the turned and extruded solids are solid only. */
export const hasVariants = (type: PartType) => type === 'box' || type === 'cylinder' || type === 'platform'
/** Sized by a radius (a square footprint 2r on a side) rather than w and d. */
export const isRound = (part: Part): part is CylinderPart | LathePart => part.type === 'cylinder' || part.type === 'lathe'

/** The height the base's top stands at: where parts dropped on it land. */
export const baseTop = (base: Base) => (base === 'plinth' || base === 'turntable' ? 0.5 : 0)

/* ── Numbers ─────────────────────────────────────────────────────────────── */

/** Two decimals, no float dust: every number the builder stores or prints. */
export const round2 = (v: number) => {
  const r = Math.round(v * 100) / 100
  return Object.is(r, -0) ? 0 : r
}
export const snap = (v: number, step = STEP) => round2(Math.round(v / step) * step)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The thinnest a part can be across (a screen, a door); a box or cylinder of no height is a tile or a disc. */
const MIN_SIZE = 0.1
const MIN_RADIUS = 0.25
const MIN_PIPE = 0.25
const minHeight = (type: PartType) => (type === 'box' || type === 'cylinder' ? 0 : MIN_SIZE)

/* ── Geometry ────────────────────────────────────────────────────────────── */

export interface Bounds {
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
}

/** A part's box at rest, in grid units: what the scene sorts it by and what the canvas outlines. */
export function boundsOf(part: Part): Bounds {
  const { x, y, z } = part
  if (isRound(part)) return { x, y, z, w: part.r * 2, d: part.r * 2, h: part.h }
  if (part.type === 'platform') return { x, y, z, w: part.w, d: part.d, h: round2(part.h + PLATFORM_LIP) }
  return { x, y, z, w: part.w, d: part.d, h: part.h }
}

/**
 * Keeps a part in the volume: its footprint on the floor, its size in range,
 * and its top under the ceiling. Given the part it was, a taller part is held
 * to the room above it rather than pushed down, and anything else that
 * would poke out of the top comes down to fit.
 */
export function clampPart<P extends Part>(part: P, was?: Part): P {
  if (part.type !== 'pipe') return clampBody(part, was)
  // A pipe is as wide as it is high: whichever of the two was pulled sets both.
  const pipe: PipePart = part
  const across = pipe.axis === 'x' ? 'd' : 'w'
  const same = was?.type === 'pipe' && was.axis === pipe.axis
  const pulled = same && pipe[across] !== was[across] ? pipe[across] : same && pipe.h !== was.h ? pipe.h : Math.min(pipe[across], pipe.h)
  const size = clamp(round2(pulled), MIN_PIPE, CEILING)
  const round = clampBody<PipePart>({ ...pipe, [across]: size, h: size }, was)
  // The ceiling may have held it lower than asked: the width follows.
  return clampBody<PipePart>({ ...round, [across]: round.h }, round) as P
}

function clampBody<P extends Part>(part: P, was?: Part): P {
  const out = { ...part }
  if (isRound(out)) {
    const r = clamp(round2(out.r), MIN_RADIUS, FLOOR / 2)
    Object.assign(out, { r, x: clamp(round2(out.x), 0, FLOOR - r * 2), y: clamp(round2(out.y), 0, FLOOR - r * 2) })
  } else {
    const w = clamp(round2(out.w), MIN_SIZE, FLOOR)
    const d = clamp(round2(out.d), MIN_SIZE, FLOOR)
    Object.assign(out, { w, d, x: clamp(round2(out.x), 0, FLOOR - w), y: clamp(round2(out.y), 0, FLOOR - d) })
  }
  // A platform's plate sits on its slab: the room its h has is the ceiling less both.
  const lip = out.type === 'platform' ? PLATFORM_LIP : 0
  const min = minHeight(out.type)
  const grew = was !== undefined && was.h !== out.h
  out.z = clamp(round2(out.z), 0, CEILING - min - lip)
  if (grew) out.h = clamp(round2(out.h), min, CEILING - out.z - lip)
  else {
    out.h = clamp(round2(out.h), min, CEILING - lip)
    out.z = Math.min(out.z, round2(CEILING - out.h - lip))
  }
  out.lift = clamp(round2(out.lift), 0, CEILING)
  out.float = clamp(round2(out.float), 0, 1)
  return out
}

const overlaps = (a: Bounds, b: Bounds) => a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.d - 1e-6 && b.y < a.y + a.d - 1e-6

/** Where something dropped on this footprint comes to rest: on the base, or on top of the highest part under it. */
export function restingZ(scene: BuilderScene, footprint: Pick<Bounds, 'x' | 'y' | 'w' | 'd'>, exclude: readonly string[] = []): number {
  const area = { ...footprint, z: 0, h: 0 }
  let top = baseTop(scene.base)
  for (const part of scene.parts) {
    if (exclude.includes(part.id)) continue
    const b = boundsOf(part)
    if (overlaps(area, b)) top = Math.max(top, b.z + b.h)
  }
  return Math.min(round2(top), CEILING)
}

/**
 * Moves parts together by a delta, held back as one so none leaves the floor
 * or the volume: a group at the edge stops there rather than bunching up.
 */
export function moveParts(scene: BuilderScene, ids: readonly string[], dx: number, dy: number, dz: number): BuilderScene {
  const moving = scene.parts.filter((p) => ids.includes(p.id))
  if (!moving.length) return scene
  const boxes = moving.map(boundsOf)
  const lo = (key: 'x' | 'y' | 'z') => Math.min(...boxes.map((b) => b[key]))
  const hi = (key: 'x' | 'y', size: 'w' | 'd') => Math.max(...boxes.map((b) => b[key] + b[size]))
  const ddx = clamp(dx, -lo('x'), FLOOR - hi('x', 'w'))
  const ddy = clamp(dy, -lo('y'), FLOOR - hi('y', 'd'))
  const ddz = clamp(dz, -lo('z'), CEILING - Math.max(...boxes.map((b) => b.z + b.h)))
  if (!ddx && !ddy && !ddz) return scene
  return {
    ...scene,
    parts: scene.parts.map((p) => (ids.includes(p.id) ? { ...p, x: round2(p.x + ddx), y: round2(p.y + ddy), z: round2(p.z + ddz) } : p)),
  }
}

/** The grid delta an arrow or page key asks for: → ← along x, ↓ ↑ along y (as the axes run on screen), Page Up and Down along z. */
export function nudgeDelta(key: string, big: boolean): [number, number, number] | null {
  const s = big ? BIG_STEP : STEP
  const zs = big ? 1 : STEP
  switch (key) {
    case 'ArrowRight':
      return [s, 0, 0]
    case 'ArrowLeft':
      return [-s, 0, 0]
    case 'ArrowDown':
      return [0, s, 0]
    case 'ArrowUp':
      return [0, -s, 0]
    case 'PageUp':
      return [0, 0, zs]
    case 'PageDown':
      return [0, 0, -zs]
    default:
      return null
  }
}

/** A key's nudge applied to the selection; null when the key isn't one, or nothing can move that way. */
export function nudge(scene: BuilderScene, ids: readonly string[], key: string, big = false): BuilderScene | null {
  const delta = nudgeDelta(key, big)
  if (!delta || !ids.length) return null
  const next = moveParts(scene, ids, ...delta)
  return next === scene ? null : next
}

/* ── Parts ───────────────────────────────────────────────────────────────── */

/** The next free id with a prefix: p1, p2… */
export function nextId(taken: readonly string[], prefix: string) {
  let n = 1
  const set = new Set(taken)
  while (set.has(`${prefix}${n}`)) n++
  return `${prefix}${n}`
}

const common = (id: string): PartCommon => ({ id, x: 0, y: 0, z: 0, variant: 'solid', tone: 'neutral', lit: false, lift: 0, float: 0 })

/** How each outline arrives: the plane it lies in, and its box (w along x, d along y, h up). */
const PRISM_DEFAULTS: Record<PrismPreset, { facing: Facing; w: number; d: number; h: number }> = {
  gable: { facing: 'right', w: 3, d: 2, h: 1 },
  wedge: { facing: 'right', w: 2, d: 2, h: 1 },
  tab: { facing: 'left', w: 2, d: 0.5, h: 1.5 },
  heart: { facing: 'left', w: 2, d: 0.5, h: 2 },
  star: { facing: 'left', w: 2, d: 0.5, h: 2 },
  arch: { facing: 'left', w: 2, d: 0.5, h: 2 },
  ell: { facing: 'top', w: 3, d: 3, h: 0.5 },
  cross: { facing: 'left', w: 2, d: 0.5, h: 2 },
  arrow: { facing: 'top', w: 3, d: 2, h: 0.5 },
  hexagon: { facing: 'top', w: 2, d: 1.75, h: 0.5 },
  house: { facing: 'left', w: 2, d: 0.5, h: 2 },
  bubble: { facing: 'left', w: 3, d: 0.4, h: 2 },
  stairs: { facing: 'right', w: 1.5, d: 3, h: 1.5 },
  ring: { facing: 'top', w: 3, d: 3, h: 0.5 },
}
const LATHE_DEFAULTS: Record<LathePreset, { r: number; h: number }> = {
  cup: { r: 1, h: 1.5 },
  bell: { r: 1, h: 1.5 },
  dome: { r: 1.5, h: 1.5 },
  ball: { r: 1, h: 2 },
  cone: { r: 1, h: 2 },
  vase: { r: 0.75, h: 1.75 },
  bottle: { r: 0.6, h: 2.25 },
  bowl: { r: 1.25, h: 0.75 },
  capsule: { r: 0.6, h: 2 },
  funnel: { r: 1, h: 1.25 },
}

/** What each item on the palette adds: a part at a sensible size, before it's placed. */
export type PaletteKind = 'box' | 'tile' | 'cylinder' | 'platform' | 'pipe' | 'screen' | 'crate' | `prism:${PrismPreset}` | `lathe:${LathePreset}`

export function createPart(kind: PaletteKind, id: string): Part {
  const base = common(id)
  if (kind === 'box') return { ...base, type: 'box', w: 2, d: 2, h: 1 }
  if (kind === 'tile') return { ...base, type: 'box', w: 2, d: 2, h: 0, tone: 'raised' }
  if (kind === 'cylinder') return { ...base, type: 'cylinder', r: 1, h: 1 }
  if (kind === 'platform') return { ...base, type: 'platform', w: 4, d: 4, h: 0.3, round: false, grid: false, tone: 'sunken' }
  if (kind === 'pipe') return { ...base, type: 'pipe', axis: 'x', w: 3, d: 1, h: 1 }
  if (kind === 'screen') return { ...base, type: 'screen', facing: 'left', w: 2.5, d: 0.2, h: 1.5 }
  if (kind === 'crate') return { ...base, type: 'crate', w: 2, d: 2, h: 1 }
  if (kind.startsWith('prism:')) {
    const preset = kind.slice(6) as PrismPreset
    return { ...base, type: 'prism', preset, ...PRISM_DEFAULTS[preset] }
  }
  const preset = kind.slice(6) as LathePreset
  return { ...base, type: 'lathe', preset, ...LATHE_DEFAULTS[preset] }
}

/** Characters a part's name keeps: letters, digits, spaces and a little punctuation, so it's safe in a link and in a code comment. */
const NAME_CHARS = /[^\p{L}\p{N} '’.,()&-]/gu
export const MAX_NAME = 32

/** A part's own name, cleaned: undefined when nothing is left. */
export function cleanName(name: unknown): string | undefined {
  if (typeof name !== 'string') return undefined
  const clean = name.replace(NAME_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim()
  return clean || undefined
}

/** A part as a person would name it: its preset for a prism or lathe ("Heart"), else its type. */
export const partLabel = (part: Part) => (part.type === 'prism' ? PRISM_LABELS[part.preset] : part.type === 'lathe' ? LATHE_LABELS[part.preset] : part.type === 'box' && part.h === 0 ? 'Tile' : TYPE_LABELS[part.type])

/** Every part's name in the layers list: its label, numbered when the scene has more than one of it. */
export function partNames(scene: BuilderScene): Map<string, string> {
  const counts = new Map<string, number>()
  for (const p of scene.parts) counts.set(partLabel(p), (counts.get(partLabel(p)) ?? 0) + 1)
  const seen = new Map<string, number>()
  const out = new Map<string, string>()
  for (const p of scene.parts) {
    const label = partLabel(p)
    const n = (seen.get(label) ?? 0) + 1
    seen.set(label, n)
    out.set(p.id, p.name ?? ((counts.get(label) ?? 0) > 1 ? `${label} ${n}` : label))
  }
  return out
}

/** Where a new part goes when it isn't dropped anywhere: the middle of the floor, on whatever is there. */
export function placeNew(scene: BuilderScene, part: Part, at?: { x: number; y: number }): Part {
  const b = boundsOf(part)
  const x = snap((at?.x ?? FLOOR / 2) - b.w / 2)
  const y = snap((at?.y ?? FLOOR / 2) - b.d / 2)
  const placed = clampPart({ ...part, x, y })
  const pb = boundsOf(placed)
  return clampPart({ ...placed, z: restingZ(scene, pb) })
}

/** The scene with parts replaced by id. */
export const updateParts = (scene: BuilderScene, ids: readonly string[], patch: (part: Part) => Part): BuilderScene => ({
  ...scene,
  parts: scene.parts.map((p) => (ids.includes(p.id) ? clampPart(patch(p), p) : p)),
})

export function removeParts(scene: BuilderScene, ids: readonly string[]): BuilderScene {
  return tidyGroups({ ...scene, parts: scene.parts.filter((p) => !ids.includes(p.id)) })
}

/** Copies of the parts, a step along x and y from the originals (held on the floor), each after its original; a group's copies share a new group. */
export function duplicateParts(scene: BuilderScene, ids: readonly string[]): { scene: BuilderScene; ids: string[] } {
  const taken = scene.parts.map((p) => p.id)
  const groupIds = scene.groups.map((g) => g.id)
  const regroup = new Map<string, string>()
  const groups = [...scene.groups]
  const fresh: string[] = []
  const parts: Part[] = []
  for (const p of scene.parts) {
    parts.push(p)
    if (!ids.includes(p.id)) continue
    const id = nextId([...taken, ...fresh], 'p')
    fresh.push(id)
    let group = p.group
    if (group) {
      if (!regroup.has(group)) {
        const g = scene.groups.find((x) => x.id === group)!
        const gid = nextId([...groupIds, ...regroup.values()], 'g')
        regroup.set(group, gid)
        groups.push({ ...g, id: gid })
      }
      group = regroup.get(group)
    }
    parts.push({ ...p, id, group })
  }
  let next: BuilderScene = { ...scene, parts, groups }
  const offset = moveParts(next, fresh, 1, 1, 0)
  next = offset === next ? moveParts(next, fresh, -1, -1, 0) : offset
  return { scene: next, ids: fresh }
}

/** The parts put in a group of their own (out of any they were in). */
export function groupParts(scene: BuilderScene, ids: readonly string[]): { scene: BuilderScene; group: string | null } {
  if (ids.length < 2) return { scene, group: null }
  const id = nextId(scene.groups.map((g) => g.id), 'g')
  return {
    scene: tidyGroups({ ...scene, groups: [...scene.groups, { id, lift: 0, float: 0 }], parts: scene.parts.map((p) => (ids.includes(p.id) ? { ...p, group: id } : p)) }),
    group: id,
  }
}

export function ungroupParts(scene: BuilderScene, ids: readonly string[]): BuilderScene {
  return tidyGroups({ ...scene, parts: scene.parts.map((p) => (ids.includes(p.id) ? { ...p, group: undefined } : p)) })
}

/** Groups keep two parts or more; a part in a group that's gone is on its own. */
export function tidyGroups(scene: BuilderScene): BuilderScene {
  const counts = new Map<string, number>()
  for (const p of scene.parts) if (p.group) counts.set(p.group, (counts.get(p.group) ?? 0) + 1)
  const groups = scene.groups.filter((g) => (counts.get(g.id) ?? 0) >= 2)
  const live = new Set(groups.map((g) => g.id))
  const parts = scene.parts.map((p) => (p.group && !live.has(p.group) ? { ...p, group: undefined } : p))
  return { ...scene, groups, parts }
}

/* ── Validation ──────────────────────────────────────────────────────────── */

const ID = /^[a-z][a-z0-9-]{0,15}$/
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback)

/** A part from anything (JSON someone pasted, an old link): known fields kept and brought into range, anything else dropped; null when it isn't a part. */
export function sanitizePart(input: unknown, id: string): Part | null {
  if (!input || typeof input !== 'object') return null
  const o = input as Record<string, unknown>
  const type = oneOf(o.type, PART_TYPES, 'box')
  if (o.type !== type) return null
  const base: PartCommon = {
    id,
    name: cleanName(o.name),
    x: num(o.x, 0),
    y: num(o.y, 0),
    z: num(o.z, 0),
    variant: hasVariants(type) ? oneOf(o.variant, VARIANTS, 'solid') : 'solid',
    tone: oneOf(o.tone, SHADES, type === 'platform' ? 'sunken' : 'neutral'),
    lit: o.lit === true,
    lift: num(o.lift, 0),
    float: num(o.float, 0),
    group: typeof o.group === 'string' && ID.test(o.group) ? o.group : undefined,
  }
  let part: Part
  if (type === 'cylinder') part = { ...base, type, r: num(o.r, 1), h: num(o.h, 1) }
  else if (type === 'lathe') part = { ...base, type, r: num(o.r, 1), h: num(o.h, 1.5), preset: oneOf(o.preset, LATHE_PRESETS, 'cup') }
  else if (type === 'platform') part = { ...base, type, w: num(o.w, 4), d: num(o.d, 4), h: num(o.h, 0.3), round: o.round === true, grid: o.grid === true }
  else if (type === 'prism') part = { ...base, type, w: num(o.w, 2), d: num(o.d, 2), h: num(o.h, 1), preset: oneOf(o.preset, PRISM_PRESETS, 'gable'), facing: oneOf(o.facing, FACINGS, 'right') }
  else if (type === 'pipe') part = { ...base, type, w: num(o.w, 3), d: num(o.d, 1), h: num(o.h, 1), axis: oneOf(o.axis, AXES, 'x') }
  else if (type === 'screen') part = { ...base, type, w: num(o.w, 2.5), d: num(o.d, 0.2), h: num(o.h, 1.5), facing: oneOf(o.facing, FACINGS, 'left') }
  else part = { ...base, type: type === 'crate' ? 'crate' : 'box', w: num(o.w, 2), d: num(o.d, 2), h: num(o.h, 1) } as BoxPart | CratePart
  return clampPart(part)
}

export const EMPTY_SCENE: BuilderScene = { version: 1, name: 'Untitled', base: 'plinth', parts: [], groups: [] }

/** A scene from anything: null when it isn't one; otherwise every part checked, ids made unique, empty groups dropped. */
export function sanitizeScene(input: unknown): BuilderScene | null {
  if (!input || typeof input !== 'object') return null
  const o = input as Record<string, unknown>
  if (!Array.isArray(o.parts)) return null
  const taken: string[] = []
  const parts: Part[] = []
  for (const raw of o.parts.slice(0, MAX_PARTS)) {
    const wanted = raw && typeof raw === 'object' && typeof (raw as { id?: unknown }).id === 'string' ? (raw as { id: string }).id : ''
    const id = ID.test(wanted) && !taken.includes(wanted) ? wanted : nextId(taken, 'p')
    const part = sanitizePart(raw, id)
    if (!part) continue
    taken.push(id)
    parts.push(part)
  }
  const groups: SceneGroup[] = []
  if (Array.isArray(o.groups)) {
    for (const raw of o.groups) {
      if (!raw || typeof raw !== 'object') continue
      const g = raw as Record<string, unknown>
      if (typeof g.id !== 'string' || !ID.test(g.id) || groups.some((x) => x.id === g.id)) continue
      groups.push({ id: g.id, lift: clamp(round2(num(g.lift, 0)), 0, CEILING), float: clamp(round2(num(g.float, 0)), 0, 1) })
    }
  }
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 40) : EMPTY_SCENE.name
  return tidyGroups({ version: 1, name, base: oneOf(o.base, BASES, 'plinth'), parts, groups })
}

/* ── JSON ────────────────────────────────────────────────────────────────── */

/** The scene as JSON, every field spelled out, for the clipboard. */
export const toJson = (scene: BuilderScene) => JSON.stringify(scene, null, 2)

export function fromJson(text: string): BuilderScene | null {
  try {
    return sanitizeScene(JSON.parse(text))
  } catch {
    return null
  }
}

/* ── The link ────────────────────────────────────────────────────────────── */

/*
 * A scene in a link, compact and in characters a URL carries as they are
 * (letters, digits, `.`, `_`, `~` and `!`):
 *
 *   1!P!b_2_2_0.5_2_2_1_sr~c_5_5_0.5_1_1_sna_0.6_0.2_1!0.5_0
 *   │ │ └ parts, joined by ~                           └ groups: lift_float
 *   │ └ base: P plinth, T turntable, G grid, D dots, N none
 *   └ format version
 *
 * A part is its code, its corner, its size (w d h, or r h), its look (variant
 * s/w/g, shade n/r/k, then a for lit, o for round, x for a grid), and then
 * lift, float and its group's number, trailing zeros left off. A prism's
 * code names its outline and facing (rgr: a gable facing right), a lathe's
 * its profile (lc: a cup). The name travels in its own parameter.
 */

const BASE_CODES: Record<Base, string> = { plinth: 'P', turntable: 'T', grid: 'G', dots: 'D', none: 'N' }
const PRISM_CODES: Record<PrismPreset, string> = { gable: 'g', wedge: 'w', tab: 't', heart: 'h', star: 's', arch: 'a', ell: 'l', cross: 'c', arrow: 'r', hexagon: 'x', house: 'u', bubble: 'b', stairs: 'z', ring: 'i' }
const FACING_CODES: Record<Facing, string> = { left: 'l', right: 'r', top: 't' }
const LATHE_CODES: Record<LathePreset, string> = { cup: 'c', bell: 'b', dome: 'd', ball: 'o', cone: 'k', vase: 'v', bottle: 't', bowl: 'w', capsule: 'p', funnel: 'f' }
const VARIANT_CODES: Record<Variant, string> = { solid: 's', wire: 'w', ghost: 'g' }
const SHADE_CODES: Record<Shade, string> = { neutral: 'n', raised: 'r', sunken: 'k' }
const invert = <K extends string>(map: Record<K, string>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<string, K>

const fmt = (v: number) => String(round2(v))

/** A part's code: b box, p platform, c cylinder, k crate, r + outline + facing, l + profile, e + axis (a pipe), s + facing (a screen). */
function codeOf(part: Part): string {
  switch (part.type) {
    case 'prism':
      return `r${PRISM_CODES[part.preset]}${FACING_CODES[part.facing]}`
    case 'lathe':
      return `l${LATHE_CODES[part.preset]}`
    case 'pipe':
      return `e${part.axis}`
    case 'screen':
      return `s${FACING_CODES[part.facing]}`
    case 'crate':
      return 'k'
    default:
      return part.type[0]!
  }
}

function encodePart(part: Part, groups: readonly SceneGroup[]): string {
  const code = codeOf(part)
  const size = isRound(part) ? [part.r, part.h] : [part.w, part.d, part.h]
  const look = VARIANT_CODES[part.variant] + SHADE_CODES[part.tone] + (part.lit ? 'a' : '') + (part.type === 'platform' ? (part.round ? 'o' : '') + (part.grid ? 'x' : '') : '')
  const tail = [part.lift, part.float, part.group ? groups.findIndex((g) => g.id === part.group) + 1 : 0].map(fmt)
  // Its name last, percent-encoded (it has no _, ~ or !, so it never splits a field).
  if (part.name) tail.push(encodeURIComponent(part.name))
  else while (tail.length && tail.at(-1) === '0') tail.pop()
  return [code, ...[part.x, part.y, part.z, ...size].map(fmt), look, ...tail].join('_')
}

export function encodeScene(scene: BuilderScene): string {
  return ['1', BASE_CODES[scene.base], scene.parts.map((p) => encodePart(p, scene.groups)).join('~'), scene.groups.map((g) => `${fmt(g.lift)}_${fmt(g.float)}`).join('~')].join('!')
}

/** A name from a link: percent-decoded when it still is (from storage), as it is when the address was decoded already. */
function safeDecode(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const decodeNum = (s: string | undefined) => (s !== undefined && /^\d{1,2}(\.\d{1,2})?$/.test(s) ? Number(s) : NaN)

function decodePart(token: string): Record<string, unknown> | null {
  const [code = '', ...fields] = token.split('_')
  let raw: Record<string, unknown>
  let sizes: string[]
  if (code === 'b' || code === 'p') raw = { type: code === 'b' ? 'box' : 'platform' }
  else if (code === 'c') raw = { type: 'cylinder' }
  else if (/^r[a-z][a-z]$/.test(code)) raw = { type: 'prism', preset: invert(PRISM_CODES)[code[1]!], facing: invert(FACING_CODES)[code[2]!] }
  else if (/^l[a-z]$/.test(code)) raw = { type: 'lathe', preset: invert(LATHE_CODES)[code[1]!] }
  else if (/^e[xy]$/.test(code)) raw = { type: 'pipe', axis: code[1] }
  else if (/^s[lrt]$/.test(code)) raw = { type: 'screen', facing: invert(FACING_CODES)[code[1]!] }
  else if (code === 'k') raw = { type: 'crate' }
  else return null
  const round = raw.type === 'cylinder' || raw.type === 'lathe'
  const [x, y, z, ...rest] = fields
  if (round) {
    sizes = rest.slice(0, 2)
    Object.assign(raw, { r: decodeNum(sizes[0]), h: decodeNum(sizes[1]) })
  } else {
    sizes = rest.slice(0, 3)
    Object.assign(raw, { w: decodeNum(sizes[0]), d: decodeNum(sizes[1]), h: decodeNum(sizes[2]) })
  }
  const [look = '', lift, float, group, name] = rest.slice(sizes.length)
  Object.assign(raw, { x: decodeNum(x), y: decodeNum(y), z: decodeNum(z) })
  if (Object.values(raw).some((v) => typeof v === 'number' && Number.isNaN(v))) return null
  Object.assign(raw, {
    variant: invert(VARIANT_CODES)[look[0] ?? 's'],
    tone: invert(SHADE_CODES)[look[1] ?? 'n'],
    lit: look.includes('a'),
    round: look.includes('o'),
    grid: look.includes('x'),
    lift: lift ? decodeNum(lift) : 0,
    float: float ? decodeNum(float) : 0,
    groupIndex: group ? decodeNum(group) : 0,
    name: name ? safeDecode(name) : undefined,
  })
  return raw
}

/** A scene from its link; null for anything that isn't one (another format, a hand-edited typo). */
export function decodeScene(text: string, name?: string | null): BuilderScene | null {
  if (text.length > 4000) return null
  const [version, base, parts = '', groups = ''] = text.split('!')
  if (version !== '1' || !base) return null
  const groupList = groups ? groups.split('~').map((g, i) => {
    const [lift, float] = g.split('_')
    return { id: `g${i + 1}`, lift: decodeNum(lift) || 0, float: decodeNum(float) || 0 }
  }) : []
  const rawParts = parts
    ? parts.split('~').flatMap((token) => {
        const raw = decodePart(token)
        if (!raw) return []
        const index = raw.groupIndex as number
        delete raw.groupIndex
        return [{ ...raw, group: index > 0 && index <= groupList.length ? `g${index}` : undefined }]
      })
    : []
  return sanitizeScene({ name: name ?? undefined, base: invert(BASE_CODES)[base], parts: rawParts, groups: groupList })
}

/** A name as an id and a component name: "Front desk" → front-desk, IllustrationFrontDesk. */
export function sceneSlug(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, 'scene-$1')
  return slug || 'untitled'
}

export const componentNameOf = (name: string) => `Illustration${sceneSlug(name).replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())}`
