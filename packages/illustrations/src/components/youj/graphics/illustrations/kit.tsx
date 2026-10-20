'use client'

import { Children, isValidElement, useId, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { isoEllipse, isoSort, project, toPoints, type IsoBounds, type ScreenPoint } from '../iso'
import { IsoPiece, IsoScene, useIsoScene, type IsoSceneProps, type IsoShape } from '../iso-scene'
import { DASH, faceClass, type IsoHue, type IsoTone } from '../tones'

/* What every illustration is built from: one stage (the same volume for all
 * of them, so any scene swaps for any other without the layout moving), a
 * group that moves as one object, marks drawn flat on a face, and links
 * between points. Scenes are compositions of these and the kit's shapes;
 * none of them carries logic of its own. */

export interface IllustrationProps {
  /** Names the drawing for assistive tech; without it the scene is decorative (aria-hidden). */
  title?: string
  /** A longer description, read after the title. */
  description?: string
  /** Parts drop in, far ones first, the first time the scene comes into view. Default true. */
  assemble?: boolean
  /** The scene's hero part bobs gently. Default true. */
  float?: boolean
  /** Take it apart: a number from 0 to 1, a boolean, or 'hover' (stacks part and the lit part rises while the pointer is over it). Default 0. */
  explode?: IsoSceneProps['explode']
  /** CSS px per grid unit at the drawing's natural size. Default 22. */
  unit?: number
  /** Scale up past the natural size to fill a wider box. Default false. */
  grow?: boolean
  /** Colour for the scene's parts: 'theme' for the theme's pair (derived from the accent), or any CSS colours, its main colour first (an empty entry takes the theme's). Default off: gray, with the accent the only colour. */
  colors?: IsoSceneProps['colors']
  className?: string
  style?: CSSProperties
}

/** The volume every scene frames, in grid units: an 8 × 8 floor and room above it. */
export const VOLUME = [8, 8, 3] as const

/** The stage: an IsoScene framed to the shared volume, decorative unless titled. */
export function IllustrationStage({ id, assemble = true, explode = 0, unit = 22, children, ...rest }: IllustrationProps & { id: string; children: ReactNode }) {
  // `float` is for the scene's own parts (see bob), not the stage.
  const scene = { ...rest }
  delete scene.float
  return (
    <IsoScene size={VOLUME} unit={unit} pad={10} rail={false} assemble={assemble} explode={explode} data-illustration={id} {...scene}>
      {children}
    </IsoScene>
  )
}

/** The bob a scene's floating part gets: `height` unless the scene was asked to hold still. */
export const bob = (props: IllustrationProps, height: number | true = true) => (props.float === false ? false : height)

const statics = (child: ReactNode) => (isValidElement(child) ? (child.type as Partial<IsoShape<unknown>>) : undefined)
const boundsOf = (child: ReactNode) => statics(child)?.isoBounds?.((child as ReactElement).props)

/** Shapes into painter's order in the slots shapes held; anything else keeps its place. */
function sortShapes(children: ReactNode) {
  const list = Children.toArray(children)
  const slots: number[] = []
  const shapes: { el: ReactNode; b: IsoBounds }[] = []
  list.forEach((child, i) => {
    const b = boundsOf(child)
    if (b) {
      slots.push(i)
      shapes.push({ el: child, b })
    }
  })
  const sorted = isoSort(shapes, (s) => s.b)
  const ordered = [...list]
  slots.forEach((slot, i) => (ordered[slot] = sorted[i]!.el as ReactElement))
  return ordered
}

export interface GroupProps {
  children: ReactNode
  /** Bob as one object: true, or the bob's height in grid units. */
  float?: boolean | number
  /** Rise this far (grid units) at the scene's full separation. */
  lift?: number
  /** Extra delay in the assemble, in stagger steps. */
  delay?: number
}

function groupBounds({ children }: GroupProps): IsoBounds {
  const all = Children.toArray(children).map(boundsOf).filter((b): b is IsoBounds => !!b)
  if (!all.length) return { x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 }
  const x = Math.min(...all.map((b) => b.x))
  const y = Math.min(...all.map((b) => b.y))
  const z = Math.min(...all.map((b) => b.z))
  return { x, y, z, w: Math.max(...all.map((b) => b.x + b.w)) - x, d: Math.max(...all.map((b) => b.y + b.d)) - y, h: Math.max(...all.map((b) => b.z + b.h)) - z }
}

/** Several shapes that drop, bob and rise as one object (a rocket, a figure), painted far to near among themselves. */
function GroupImpl({ children, float, lift, delay }: GroupProps) {
  return (
    <IsoPiece float={float} lift={lift} delay={delay}>
      {sortShapes(children)}
    </IsoPiece>
  )
}

export const Group = Object.assign(GroupImpl, { isoBounds: groupBounds }) as IsoShape<GroupProps>

export type Axis = 'x' | 'y' | 'z'

export interface LatheProps {
  /** The center of its footprint, grid units. Laid down, where its axis starts. */
  cx: number
  cy: number
  /** Height of its base. Default 0. Laid down, the height of its axis. */
  z?: number
  /** Its outline, bottom up: [radius, height above the base] at each step, heights rising. Laid down, the heights run along the axis. */
  profile: readonly (readonly [r: number, h: number])[]
  /** The axis it's turned about: 'z' stands it up (the default); 'x' or 'y' lays it down along +x or +y, its end facing you. */
  axis?: Axis
  /** Outline it as the hull of its rings: exact for a convex solid (a globe, a dome, a cup), and always so when it's laid down. */
  convex?: boolean
  tone?: IsoTone
  /** One of the scene's colours (see IsoBox's `hue`). */
  hue?: IsoHue
  float?: boolean | number
  lift?: number
  children?: ReactNode
}

function latheBounds({ cx, cy, z = 0, profile, axis = 'z' }: LatheProps): IsoBounds {
  const r = Math.max(...profile.map(([pr]) => pr))
  const length = profile.at(-1)![1]
  if (axis === 'x') return { x: cx, y: cy - r, z: z - r, w: length, d: r * 2, h: r * 2 }
  if (axis === 'y') return { x: cx - r, y: cy, z: z - r, w: r * 2, d: length, h: r * 2 }
  return { x: cx - r, y: cy - r, z, w: r * 2, d: r * 2, h: length }
}

/** A ring round an axis, `r` out from it and `at` along it from (cx, cy, z), as screen points. */
function ringOf(axis: Axis, cx: number, cy: number, z: number, r: number, at: number, unit: number, n = 48): ScreenPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const [p, q] = [r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2)]
    if (axis === 'x') return project(cx + at, cy + p, z + q, unit)
    if (axis === 'y') return project(cx + p, cy + at, z + q, unit)
    return project(cx + p, cy + q, z + at, unit)
  })
}

/** The convex hull of screen points (monotone chain). */
function hullOf(points: readonly ScreenPoint[]): ScreenPoint[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: ScreenPoint, a: ScreenPoint, b: ScreenPoint) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: readonly ScreenPoint[]) => {
    const out: ScreenPoint[] = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop()
      out.push(p)
    }
    return out.slice(0, -1)
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

/** Which way is up across a laid-down solid on screen, and the face its far side turns to. */
const ACROSS = { x: { up: [0.5, -Math.cos(Math.PI / 6)], side: 'var(--kg-left)', end: 'var(--kg-right)' }, y: { up: [-0.5, -Math.cos(Math.PI / 6)], side: 'var(--kg-right)', end: 'var(--kg-left)' } } as const

/** A convex solid of revolution about any axis: the hull of its rings, shaded across, its end (or top) on it. */
function Turned({ cx, cy, z, profile, axis, shade, children }: Required<Pick<LatheProps, 'cx' | 'cy' | 'z' | 'profile' | 'axis'>> & { shade: string; children?: ReactNode }) {
  const { unit } = useIsoScene()
  const rings = profile.map(([r, h]) => ringOf(axis, cx, cy, z, r, h, unit))
  const outline = hullOf(rings.flat())
  const rMax = Math.max(...profile.map(([r]) => r))
  const [rEnd] = profile.at(-1)!
  let gradient: ReactNode
  if (axis === 'z') {
    gradient = (
      <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" style={{ stopColor: 'var(--kg-left)' }} />
        <stop offset="0.55" style={{ stopColor: 'var(--kg-left)' }} />
        <stop offset="1" style={{ stopColor: 'var(--kg-right)' }} />
      </linearGradient>
    )
  } else {
    // From the top of its side to the bottom, across the axis as it lies on screen.
    const { up, side } = ACROSS[axis]
    const along = outline.map(([x, y]) => x * up[0] + y * up[1])
    const [hi, lo] = [Math.max(...along), Math.min(...along)]
    const [mx, my] = outline.reduce(([ax, ay], [x, y]) => [ax + x / outline.length, ay + y / outline.length], [0, 0])
    const mid = mx * up[0] + my * up[1]
    const at = (s: number) => [mx + up[0] * (s - mid), my + up[1] * (s - mid)] as const
    const [a, b] = [at(hi), at(lo)]
    gradient = (
      <linearGradient id={shade} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
        <stop offset="0" style={{ stopColor: 'var(--kg-top)' }} />
        <stop offset="0.15" style={{ stopColor: 'var(--kg-top)' }} />
        <stop offset="0.85" style={{ stopColor: side }} />
        <stop offset="1" style={{ stopColor: side }} />
      </linearGradient>
    )
  }
  // A rounded top (a globe, a dome) catches the light from above.
  const domed = axis === 'z' && rEnd < rMax * 0.5
  return (
    <>
      <defs>
        {gradient}
        {domed && (
          <linearGradient id={`${shade}-sky`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--kg-top)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--kg-top)', stopOpacity: 0 }} />
          </linearGradient>
        )}
      </defs>
      <polygon points={toPoints(outline)} className="kg-edge" style={{ fill: `url(#${shade})` }} />
      {domed && <polygon points={toPoints(outline)} style={{ fill: `url(#${shade}-sky)` }} />}
      {rEnd > 0.02 && <polygon points={toPoints(rings.at(-1)!)} className="kg-edge" style={{ fill: axis === 'z' ? 'var(--kg-top)' : ACROSS[axis].end }} />}
      {children}
    </>
  )
}

/**
 * A solid turned on a lathe (a bell, a nose cone): its outline through each
 * step's widest points, shaded across like a cylinder, with its top face on
 * it. Keep the upper steps narrowing gently, so no step's rim rises above
 * the top face. `convex` outlines it exactly for a convex solid instead (a
 * globe, a dome), and `axis` lays it down: a bar, a lens, a megaphone.
 */
function LatheImpl({ cx, cy, z = 0, profile, axis = 'z', convex, tone = 'neutral', hue, float, lift, children }: LatheProps) {
  const { unit } = useIsoScene()
  const shade = `kg-${useId().replace(/[^\w-]/g, '')}`
  if (axis !== 'z' || convex) {
  return (
      <IsoPiece float={float} lift={lift}>
        <g {...faceClass(tone, 'solid', undefined, hue)}>
          <Turned cx={cx} cy={cy} z={z} profile={profile} axis={axis} shade={shade}>
            {children}
          </Turned>
        </g>
      </IsoPiece>
    )
  }
  const rings = profile.map(([r, h]) => isoEllipse(cx, cy, z + h, r, unit))
  const base = rings[0]!
  const top = rings.at(-1)!
  const edge = (e: (typeof rings)[number], side: 1 | -1) => `${Math.round((e.cx + side * e.rx) * 100) / 100},${e.cy}`
  const side =
    `M${[...rings].reverse().map((e) => edge(e, -1)).join(' L')} ` +
    `A${base.rx},${base.ry} 0 0 0 ${edge(base, 1)} L${rings.map((e) => edge(e, 1)).join(' L')} ` +
    `A${top.rx},${top.ry} 0 0 1 ${edge(top, -1)} Z`
    return (
    <IsoPiece float={float} lift={lift}>
      <g {...faceClass(tone, 'solid', undefined, hue)}>
        <defs>
          <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--kg-left)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--kg-left)' }} />
            <stop offset="1" style={{ stopColor: 'var(--kg-right)' }} />
          </linearGradient>
        </defs>
        <path d={side} className="kg-edge" style={{ fill: `url(#${shade})` }} />
        <ellipse cx={top.cx} cy={top.cy} rx={top.rx} ry={top.ry} className="kg-edge" style={{ fill: 'var(--kg-top)' }} />
        {children}
      </g>
    </IsoPiece>
  )
}

export const Lathe = Object.assign(LatheImpl, { isoBounds: latheBounds }) as IsoShape<LatheProps>

export type Plane = 'top' | 'left' | 'right'
export type PlanePoint = readonly [u: number, v: number]

/**
 * A point on a plane through `at`, in grid units along the plane's axes:
 * the top plane runs (x, y); the left (+y) face runs x along and z up; the
 * right (+x) face runs y along and z up.
 */
function onPlane(plane: Plane, [x, y, z]: readonly [number, number, number], [u, v]: PlanePoint, unit: number): ScreenPoint {
  if (plane === 'top') return project(x + u, y + v, z, unit)
  if (plane === 'left') return project(x + u, y, z + v, unit)
  return project(x, y + u, z + v, unit)
}

/** A rectangle in plane units, from its corner. */
export const rect = (u: number, v: number, w: number, h: number): PlanePoint[] => [
  [u, v],
  [u + w, v],
  [u + w, v + h],
  [u, v + h],
]

/** A circle in plane units, as a polygon fine enough to read round at any size. */
export const circle = (cu: number, cv: number, r: number, n = 32): PlanePoint[] =>
  Array.from({ length: n }, (_, i) => [cu + r * Math.cos((i / n) * Math.PI * 2), cv + r * Math.sin((i / n) * Math.PI * 2)] as const)

/** A point on a top face, given as it should look on screen (x right, y down, grid units): for glyphs that must read upright, such as a check. */
export const flat = (sx: number, sy: number): PlanePoint => {
  const across = sx / Math.cos(Math.PI / 6)
  return [(across + 2 * sy) / 2, (2 * sy - across) / 2]
}

/** Inks for marks, from the tokens: they read on any face in either scheme. */
export const INK = {
  accent: 'var(--color-accent)',
  onAccent: 'var(--color-on-accent)',
  line: 'color-mix(in oklab, var(--color-fg) 30%, transparent)',
  text: 'color-mix(in oklab, var(--color-fg) 16%, transparent)',
  faint: 'color-mix(in oklab, var(--color-fg) 9%, transparent)',
  well: 'color-mix(in oklab, var(--color-fg) 22%, var(--color-canvas))',
  success: 'var(--color-success)',
} as const

export interface MarkProps {
  plane: Plane
  /** The plane's origin, in grid units. */
  at: readonly [number, number, number]
  /** The outline, in plane units. */
  points: readonly PlanePoint[]
  fill?: string
  stroke?: string
  dashed?: boolean
  /** Join the last point to the first. Default: true when filled. */
  closed?: boolean
  /** Stroke width in CSS px at any scale. Default 1, a hairline. */
  weight?: number
  opacity?: number
}

/** A flat mark on a face or the floor: a label, a door, a glyph. Draw it as a shape's child so it moves with the shape. */
export function Mark({ plane, at, points, fill, stroke, dashed, closed, weight = 1, opacity }: MarkProps) {
  const { unit } = useIsoScene()
  const pts = toPoints(points.map((p) => onPlane(plane, at, p, unit)))
  // The hairline's look from the kit's class; only what differs from it is inline.
  const style: CSSProperties = { strokeWidth: weight === 1 ? undefined : weight, fill: fill ?? 'none', stroke: stroke ?? 'none', opacity, ...(dashed ? { strokeDasharray: DASH } : null) }
  return (closed ?? !!fill) ? <polygon points={pts} className="kg-line" style={style} /> : <polyline points={pts} className="kg-line" style={style} />
}

export interface LinkProps {
  /** The path's corners, in grid units. */
  points: readonly (readonly [number, number, number])[]
  lit?: boolean
  dashed?: boolean
}

/** A hairline through points in the scene: a cable, a route, a drop line. */
export function Link({ points, lit, dashed }: LinkProps) {
  const { unit } = useIsoScene()
  return (
    <polyline
      points={toPoints(points.map(([x, y, z]) => project(x, y, z, unit)))}
      className="kg-line"
      style={{
        fill: 'none',
        stroke: lit ? 'color-mix(in oklab, var(--color-accent) 80%, transparent)' : INK.line,
        ...(dashed ? { strokeDasharray: DASH } : null),
      }}
    />
  )
}

/** Points along an arc in plane units, from one angle to another (radians, counter-clockwise from +u). */
export const arc = (cu: number, cv: number, r: number, from: number, to: number, n = 16): PlanePoint[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n
    return [cu + r * Math.cos(a), cv + r * Math.sin(a)] as const
  })

/** A curved band between two radii, as one outline: a handle, a loop, an arch. */
export const band = (cu: number, cv: number, inner: number, outer: number, from: number, to: number, n = 16): PlanePoint[] => [
  ...arc(cu, cv, outer, from, to, n),
  ...arc(cu, cv, inner, to, from, n),
]

/** A rectangle with rounded corners in plane units, from its corner. */
export const rounded = (u: number, v: number, w: number, h: number, r: number, n = 5): PlanePoint[] => {
  const q = Math.PI / 2
  return [
    ...arc(u + w - r, v + r, r, -q, 0, n),
    ...arc(u + w - r, v + h - r, r, 0, q, n),
    ...arc(u + r, v + h - r, r, q, 2 * q, n),
    ...arc(u + r, v + r, r, 2 * q, 3 * q, n),
  ]
}

export interface PrismProps {
  /** The plane its profile lies in. It's extruded toward you along the plane's normal: up from the top plane, +y from the left, +x from the right. */
  plane: Plane
  /** The plane's origin, grid units: the back of the solid. */
  at: readonly [number, number, number]
  /** Its profile, in plane units, as a Mark's points. Curves are fine: fine steps shade smoothly, and only corners and the silhouette get a line. */
  points: readonly PlanePoint[]
  /** How far it's extruded, grid units. */
  depth: number
  tone?: IsoTone
  /** One of the scene's colours (see IsoBox's `hue`). */
  hue?: IsoHue
  float?: boolean | number
  lift?: number
  /** Drawn on its front face, moving with it: marks on the plane `depth` in front of `at`. */
  children?: ReactNode
}

type Vec = readonly [number, number, number]

function onSolid(plane: Plane, [x, y, z]: Vec, [u, v]: PlanePoint, w: number): Vec {
  if (plane === 'top') return [x + u, y + v, z + w]
  if (plane === 'left') return [x + u, y + w, z + v]
  return [x + w, y + u, z + v]
}

const FACE_OF: Record<Plane, string> = { top: '--kg-top', left: '--kg-left', right: '--kg-right' }

/** A side's color from where it faces: the two faces it's nearest, mixed. */
function shadeOf([nx, ny, nz]: Vec) {
  const weights = [
    ['--kg-top', Math.max(nz, 0) ** 2],
    ['--kg-left', Math.max(ny, 0) ** 2],
    ['--kg-right', Math.max(nx, 0) ** 2],
  ] as const
  const sorted = [...weights].sort((p, q) => q[1] - p[1])
  const [a, wa] = sorted[0]!
  const [b, wb] = sorted[1]!
  const pct = Math.round((wa / (wa + wb)) * 100)
  return pct >= 99 ? `var(${a})` : `color-mix(in oklab, var(${a}) ${pct}%, var(${b}))`
}

function prismBounds({ plane, at: [x, y, z], points, depth }: PrismProps): IsoBounds {
  const us = points.map(([u]) => u)
  const vs = points.map(([, v]) => v)
  const [u0, v0] = [Math.min(...us), Math.min(...vs)]
  const [w, h] = [Math.max(...us) - u0, Math.max(...vs) - v0]
  if (plane === 'top') return { x: x + u0, y: y + v0, z, w, d: h, h: depth }
  if (plane === 'left') return { x: x + u0, y, z: z + v0, w, d: depth, h }
  return { x, y: y + u0, z: z + v0, w: depth, d: w, h }
}

/** Sides meeting at more than this angle get a line along the crease; gentler steps read as one curve. */
const CREASE = Math.cos(Math.PI / 6)

/**
 * A profile extruded into a solid (a heart, a speech bubble, a roof, a
 * plane seen from above): its front face in the plane's shade, and its sides
 * shaded by where each one faces, far to near. Hairlines trace its outline
 * and its corners; a curve's fine steps shade smoothly without lines.
 */
function PrismImpl({ plane, at, points, depth, tone = 'neutral', hue, float, lift, children }: PrismProps) {
  const { unit } = useIsoScene()
  const n = points.length
  const area = points.reduce((s, [u, v], i) => {
    const [u2, v2] = points[(i + 1) % n]!
    return s + u * v2 - u2 * v
  }, 0)
  const turn = area > 0 ? 1 : -1
  const screen = (p: Vec) => project(p[0], p[1], p[2], unit)
  const sides = points.map((p, i) => {
    const q = points[(i + 1) % n]!
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
    const [nu, nv] = [(turn * (q[1] - p[1])) / len, (-turn * (q[0] - p[0])) / len]
    const normal: Vec = plane === 'top' ? [nu, nv, 0] : plane === 'left' ? [nu, 0, nv] : [0, nu, nv]
    const corners = [onSolid(plane, at, p, 0), onSolid(plane, at, q, 0), onSolid(plane, at, q, depth), onSolid(plane, at, p, depth)]
    return { normal, corners, visible: normal[0] + normal[1] + normal[2] > 1e-6, near: corners.reduce((s, c) => s + c[0] + c[1] + c[2], 0) }
  })
  const order = sides
    .map((_, i) => i)
    .filter((i) => sides[i]!.visible)
    .sort((a, b) => sides[a]!.near - sides[b]!.near)
  const drawn = new Map(order.map((i, k) => [i, k]))
  // The line along the extrusion at a corner, where the silhouette turns or the sides crease: drawn with the later of its two sides.
  const ridges = new Map<number, number[]>()
  points.forEach((_, i) => {
    const prev = (i - 1 + n) % n
    const [a, b] = [sides[prev]!, sides[i]!]
    const bent = a.normal[0] * b.normal[0] + a.normal[1] * b.normal[1] + a.normal[2] * b.normal[2] < CREASE
    if (a.visible !== b.visible || (a.visible && bent)) {
      const owner = [prev, i].filter((s) => drawn.has(s)).sort((s, t) => drawn.get(t)! - drawn.get(s)!)[0]!
      ridges.set(owner, [...(ridges.get(owner) ?? []), i])
    }
  })
  const segment = (a: Vec, b: Vec, key: string) => {
    const [p, q] = [screen(a), screen(b)]
    return <line key={key} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} className="kg-edge" />
  }
  return (
    <IsoPiece float={float} lift={lift}>
      <g {...faceClass(tone, 'solid', undefined, hue)}>
        {order.map((i) => {
          const { corners, normal } = sides[i]!
          const fill = shadeOf(normal)
          return (
            <g key={i}>
              <polygon points={toPoints(corners.map(screen))} className="kg-line" style={{ fill, stroke: fill }} />
              {segment(corners[0]!, corners[1]!, 'back')}
              {(ridges.get(i) ?? []).map((v) => segment(onSolid(plane, at, points[v]!, 0), onSolid(plane, at, points[v]!, depth), `r${v}`))}
            </g>
          )
        })}
        <polygon points={toPoints(points.map((p) => screen(onSolid(plane, at, p, depth))))} className="kg-edge" style={{ fill: `var(${FACE_OF[plane]})` }} />
        {children}
      </g>
    </IsoPiece>
  )
}

export const Prism = Object.assign(PrismImpl, { isoBounds: prismBounds }) as IsoShape<PrismProps>

/** The inside of an open box, seen through its opening: the two far walls and the floor, clipped to the rim. Draw it as the box's child. */
export function Hollow({ x, y, top, w, d, depth }: { x: number; y: number; top: number; w: number; d: number; depth: number }) {
  const { unit } = useIsoScene()
  const clip = `kg-${useId().replace(/[^\w-]/g, '')}`
  const p = (a: number, b: number, c: number) => project(a, b, c, unit)
  const opening = toPoints([p(x, y, top), p(x + w, y, top), p(x + w, y + d, top), p(x, y + d, top)])
  const floor = top - depth
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <polygon points={opening} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <polygon points={opening} style={{ fill: INK.well }} />
        <polygon points={toPoints([p(x, y, top), p(x, y + d, top), p(x, y + d, floor), p(x, y, floor)])} style={{ fill: 'var(--kg-right)' }} />
        <polygon points={toPoints([p(x, y, top), p(x + w, y, top), p(x + w, y, floor), p(x, y, floor)])} style={{ fill: 'var(--kg-left)' }} />
      </g>
      <polygon points={opening} style={{ fill: 'none', stroke: 'var(--kg-edge)', vectorEffect: 'non-scaling-stroke', strokeWidth: 1 }} />
    </g>
  )
}

// batch F helpers

/** A cubic curve in plane units, from `a` to `d`, pulled toward `b` and `c`: a hose, a pen's stroke. */
export const curve = (a: PlanePoint, b: PlanePoint, c: PlanePoint, d: PlanePoint, n = 16): PlanePoint[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const [t, s] = [i / n, 1 - i / n]
    const f = (k: 0 | 1) => s * s * s * a[k] + 3 * s * s * t * b[k] + 3 * s * t * t * c[k] + t * t * t * d[k]
    return [f(0), f(1)] as const
  })

/** A smooth closed outline through points in plane units (a Catmull-Rom curve), `n` steps between each pair: a tooth, a guitar's body. */
export const smooth = (points: readonly PlanePoint[], n = 6): PlanePoint[] =>
  points.flatMap((_, i) => {
    const at = (k: number) => points[(i + k + points.length) % points.length]!
    const [a, b, c, d] = [at(-1), at(0), at(1), at(2)]
    return Array.from({ length: n }, (_, j) => {
      const t = j / n
      const f = (p: number, q: number, r: number, s: number) => 0.5 * (2 * q + (r - p) * t + (2 * p - 5 * q + 4 * r - s) * t * t + (3 * q - p - 3 * r + s) * t * t * t)
      return [f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])] as const
    })
  })

// batch B helpers

/** A ball's outline for a Lathe, bottom up: `r` round, pole to pole in `n` steps. Turn it `convex`. */
export const orb = (r: number, n = 12) =>
  Array.from({ length: n + 1 }, (_, i) => [r * Math.sin((i / n) * Math.PI), r * (1 - Math.cos((i / n) * Math.PI))] as const)
