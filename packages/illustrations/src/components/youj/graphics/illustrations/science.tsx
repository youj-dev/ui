'use client'

import { useId, type ReactNode } from 'react'
import { project, toPoints, type IsoBounds, type ScreenPoint } from '../iso'
import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { IsoPiece, useIsoScene, type IsoShape } from '../iso-scene'
import { faceClass, type IsoHue, type IsoTone } from '../tones'
import { arc, bob, circle, Group, IllustrationStage, INK, Lathe, Mark, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Science: looking closer and looking further. A microscope racking up to
 * focus, a flask bubbling over, an atom inside its orbits, a telescope
 * trained on a star, and a double helix coming unzipped. */

type Vec = readonly [number, number, number]

const unitOf = (v: Vec): Vec => {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}
const cross = ([a, b, c]: Vec, [d, e, f]: Vec): Vec => [b * f - c * e, c * d - a * f, a * e - b * d]

/** The convex hull of screen points (monotone chain). */
function hull(points: readonly ScreenPoint[]): ScreenPoint[] {
  const turn = (o: ScreenPoint, a: ScreenPoint, b: ScreenPoint) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: readonly ScreenPoint[]) => {
    const out: ScreenPoint[] = []
    for (const p of list) {
      while (out.length > 1 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop()
      out.push(p)
    }
    return out.slice(0, -1)
  }
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return [...half(sorted), ...half([...sorted].reverse())]
}

interface TubeProps {
  /** Its axis, end to end, in grid units. */
  from: Vec
  to: Vec
  r: number
  tone?: IsoTone
  hue?: IsoHue
  float?: boolean | number
  lift?: number
  children?: ReactNode
}

function tubeBounds({ from, to, r }: TubeProps): IsoBounds {
  const n = unitOf([to[0] - from[0], to[1] - from[1], to[2] - from[2]])
  const [lo, hi] = [0, 1].map((side) => [0, 1, 2].map((i) => (side ? Math.max : Math.min)(from[i]!, to[i]!) + (side ? 1 : -1) * r * Math.sqrt(1 - n[i]! ** 2)))
  return { x: lo![0]!, y: lo![1]!, z: lo![2]!, w: hi![0]! - lo![0]!, d: hi![1]! - lo![1]!, h: hi![2]! - lo![2]! }
}

/** A tube on any line (a telescope's barrel, a tripod's leg): the hull of its end rings, lit along its upper edge, the end that faces you capped. */
function TubeImpl({ from, to, r, tone = 'neutral', hue, float, lift, children }: TubeProps) {
  const { unit } = useIsoScene()
  const shade = `kg-${useId().replace(/[^\w-]/g, '')}`
  const n = unitOf([to[0] - from[0], to[1] - from[1], to[2] - from[2]])
  const a = unitOf(cross(n, Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]))
  const b = cross(n, a)
  const ring = ([x, y, z]: Vec) =>
    Array.from({ length: 36 }, (_, i) => {
      const [c, s] = [Math.cos((i / 18) * Math.PI) * r, Math.sin((i / 18) * Math.PI) * r]
      return project(x + a[0] * c + b[0] * s, y + a[1] * c + b[1] * s, z + a[2] * c + b[2] * s, unit)
    })
  const [start, end] = [ring(from), ring(to)]
  const outline = hull([...start, ...end])
  // Across the tube on screen, from its upper edge to its lower one.
  const [p, q] = [project(...from, unit), project(...to, unit)]
  const flip = p[0] - q[0] > 0 || (p[0] === q[0] && p[1] < q[1]) ? -1 : 1
  const [ux, uy] = [(flip * (q[1] - p[1])) / Math.hypot(q[0] - p[0], q[1] - p[1]), (flip * (p[0] - q[0])) / Math.hypot(q[0] - p[0], q[1] - p[1])]
  const along = outline.map(([x, y]) => x * ux + y * uy)
  const [mx, my] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  const at = (s: number) => [mx + ux * (s - (mx * ux + my * uy)), my + uy * (s - (mx * ux + my * uy))] as const
  const [g1, g2] = [at(Math.min(...along)), at(Math.max(...along))]
  return (
    <IsoPiece float={float} lift={lift}>
      <g {...faceClass(tone, 'solid', undefined, hue)}>
        <defs>
          <linearGradient id={shade} gradientUnits="userSpaceOnUse" x1={g1[0]} y1={g1[1]} x2={g2[0]} y2={g2[1]}>
            <stop offset="0" style={{ stopColor: 'var(--kg-top)' }} />
            <stop offset="0.15" style={{ stopColor: 'var(--kg-top)' }} />
            <stop offset="0.85" style={{ stopColor: 'var(--kg-left)' }} />
            <stop offset="1" style={{ stopColor: 'var(--kg-left)' }} />
          </linearGradient>
        </defs>
        <polygon points={toPoints(outline)} className="kg-edge" style={{ fill: `url(#${shade})` }} />
        <polygon points={toPoints(n[0] + n[1] + n[2] > 0 ? end : start)} className="kg-edge" style={{ fill: 'var(--kg-top)' }} />
        {children}
      </g>
    </IsoPiece>
  )
}

const Tube = Object.assign(TubeImpl, { isoBounds: tubeBounds }) as IsoShape<TubeProps>

/** A ball of radius `r`, bottom up, for a Lathe. */
const ball = (r: number) =>
  Array.from({ length: 11 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 10
    return [Math.max(Math.cos(a) * r, 0.01), r + Math.sin(a) * r] as const
  })

/** The microscope's arm, side on: a pillar off its foot, curving up and over to hold the head. */
const ARM: PlanePoint[] = [
  ...arc(3.6, 3.3, 1.25, Math.PI / 2, Math.PI * 1.22, 10),
  [2.55, 0.87],
  [3.3, 0.87],
  ...arc(3.6, 3.3, 0.62, Math.PI * 1.22, Math.PI / 2, 10),
  [4.15, 3.92],
  [4.15, 4.55],
]

/** A microscope on its foot, a slide on the stage, its tube in the accent. Hovered, it racks up to focus. */
export function IllustrationMicroscope(props: IllustrationProps) {
  const cy = 4
  const stage = { x: 3.2, y: 3.1, z: 2.15, w: 1.9, d: 1.8, h: 0.14 }
  const top = stage.z + stage.h
  return (
    <IllustrationStage id="microscope" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Prism plane="top" at={[0, 0, 0.55]} points={rounded(2.3, 2.95, 3.2, 2.1, 0.5)} depth={0.32} tone="raised" hue={1} />
      <Prism plane="left" at={[0, cy - 0.28, 0]} points={ARM} depth={0.56} tone="raised" hue={1} />
      <Lathe axis="y" cx={2.95} cy={cy + 0.28} z={1.6} profile={[[0.34, 0], [0.34, 0.16]]} tone="neutral" />
      <IsoBox {...stage} tone="neutral">
        <Mark plane="top" at={[4.3, cy, top]} points={circle(0, 0, 0.28, 24)} fill={INK.well} />
        <Mark plane="top" at={[stage.x, stage.y, top]} points={rect(0.3, 0.55, 1.5, 0.7)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <Group float={bob(props, 0.05)} lift={0.55}>
        <Lathe cx={4.3} cy={cy} z={2.45} profile={[[0.16, 0], [0.24, 0.28], [0.3, 0.5]]} tone="raised" />
        <IsoCylinder x={3.86} y={cy - 0.44} z={2.95} r={0.44} h={0.18} tone="raised" />
        <Tube from={[4.3, cy, 3.13]} to={[4.98, cy, 4.62]} r={0.4} tone="accent" />
        <Tube from={[4.98, cy, 4.62]} to={[5.16, cy, 5.02]} r={0.24} tone="raised" />
      </Group>
    </IllustrationStage>
  )
}

/** An Erlenmeyer flask, bottom up: a wide foot narrowing to its neck and lip. */
const FLASK = [
  [1.3, 0],
  [1.36, 0.14],
  [0.5, 2.3],
  [0.44, 2.44],
  [0.44, 3.05],
  [0.53, 3.12],
  [0.53, 3.22],
] as const

/** A flask hovering over its plinth, the liquid in it lit in the accent, bubbles rising off it. Hovered, it lifts and they float away. */
export function IllustrationLabFlask(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const base = 0.9
  const neck = base + 3.22
  const bubbles = [
    [0.1, -0.05, 0.28, 0.15],
    [-0.18, 0.14, 0.68, 0.19],
    [0.14, -0.12, 1.12, 0.11],
  ] as const
  return (
    <IllustrationStage id="lab-flask" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 1.6, 40)} fill={INK.accent} opacity={0.16} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 2.4, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Group float={bob(props, 0.16)} lift={0.8}>
        <Lathe cx={cx} cy={cy} z={base} profile={FLASK} tone="raised" hue={1} />
        <Lathe cx={cx} cy={cy} z={base + 0.02} profile={[[1.27, 0], [1.32, 0.12], [1.1, 0.72]]} tone="accent" />
      </Group>
      <IsoPiece float={bob(props, 0.12)} lift={1.5} delay={6}>
        {bubbles.map(([dx, dy, dz, r]) => (
          <Lathe key={dz} cx={cx + dx} cy={cy + dy} z={neck + dz} profile={ball(r)} convex tone="raised" hue={1} />
        ))}
      </IsoPiece>
    </IllustrationStage>
  )
}

/** An atom over its plinth: its nucleus in the accent inside three orbits, one electron on each. Hovered, it lifts. */
export function IllustrationAtom(props: IllustrationProps) {
  const c: Vec = [4, 4, 3.05]
  const R = 2.05
  const planes = ['top', 'left', 'right'] as const
  const electrons = [
    ['top', -Math.PI * 0.15],
    ['left', Math.PI * 0.6],
    ['right', -Math.PI * 0.1],
  ] as const
  const near = (t: number) => Math.cos(t) + Math.sin(t) > 0
  const place = (plane: (typeof planes)[number], t: number): Vec => {
    const [u, v] = [Math.cos(t) * R, Math.sin(t) * R]
    return plane === 'top' ? [c[0] + u, c[1] + v, c[2]] : plane === 'left' ? [c[0] + u, c[1], c[2] + v] : [c[0], c[1] + u, c[2] + v]
  }
  const orbits = (front: boolean) =>
    planes.map((plane) => <Mark key={`${plane}-${front}`} plane={plane} at={c} points={front ? arc(0, 0, R, -Math.PI / 4, (3 * Math.PI) / 4, 24) : arc(0, 0, R, (3 * Math.PI) / 4, (7 * Math.PI) / 4, 24)} stroke={INK.line} weight={1.5} />)
  const electron = (front: boolean) =>
    electrons
      .filter(([, t]) => near(t) === front)
      .map(([plane, t]) => {
        const [x, y, z] = place(plane, t)
        return <Lathe key={plane} cx={x} cy={y} z={z - 0.24} profile={ball(0.24)} convex tone="raised" hue={1} />
      })
  return (
    <IllustrationStage id="atom" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 2.4, 48)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 1.2, 36)} fill={INK.faint} />
      </IsoPlatform>
      <IsoPiece float={bob(props, 0.16)} lift={0.9}>
        {orbits(false)}
        {electron(false)}
        <Lathe cx={c[0]} cy={c[1]} z={c[2] - 0.62} profile={ball(0.62)} convex tone="accent" />
        {orbits(true)}
        {electron(true)}
      </IsoPiece>
    </IllustrationStage>
  )
}

/** A five-pointed star standing on the left plane, pre-sheared so it reads upright on screen. */
const star = (cu: number, cv: number, s: number): PlanePoint[] =>
  Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const [px, py] = [Math.cos(a) * s * (i % 2 ? 0.42 : 1), Math.sin(a) * s * (i % 2 ? 0.42 : 1)]
    return [cu + px / Math.cos(Math.PI / 6), cv + px * Math.tan(Math.PI / 6) + py] as const
  })

/** A telescope on its tripod, trained on a star in the accent. Hovered, the star rises. */
export function IllustrationTelescope(props: IllustrationProps) {
  const head: Vec = [3.7, 4.3, 2.62]
  const feet = [
    [2.3, 3.1],
    [5.5, 3.7],
    [3.4, 6],
  ] as const
  const dir = unitOf([0.54, -0.54, 0.65])
  const along = (s: number, up = 0): Vec => [head[0] + dir[0] * s, head[1] + dir[1] * s, head[2] + 0.62 + up + dir[2] * s]
  return (
    <IllustrationStage id="telescope" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      {feet.map(([x, y]) => (
        <Tube key={x} from={[x, y, 0.55]} to={head} r={0.08} tone="neutral" />
      ))}
      <IsoCylinder x={head[0] - 0.32} y={head[1] - 0.32} z={head[2]} r={0.32} h={0.3} tone="neutral" />
      <Tube from={along(-1.8)} to={along(1.3)} r={0.42} tone="raised" hue={1} />
      <Tube from={along(1.2)} to={along(2.05)} r={0.5} tone="neutral" />
      <IsoCylinder x={along(-1.45)[0] - 0.14} y={along(-1.45)[1] - 0.14} z={along(-1.45)[2] + 0.2} r={0.14} h={0.4} tone="neutral" />
      <Prism plane="left" at={[0, 2.2, 0]} points={star(5.7, 5.35, 0.62)} depth={0.24} tone="accent" float={bob(props, 0.14)} lift={0.8} />
    </IllustrationStage>
  )
}

/** Up the screen, across it, and toward you, in grid units: a helix turned in these is seen side on, as the icon draws it. */
const UP: Vec = [-1 / Math.sqrt(6), -1 / Math.sqrt(6), 2 / Math.sqrt(6)]
const ACROSS: Vec = [Math.SQRT1_2, -Math.SQRT1_2, 0]
const NEAR: Vec = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]

/** A length of backbone: a round-ended band `r` either side of its path, in its tone's side color (the far side's when it runs behind). */
function Backbone({ points, r, tone, hue, far }: { points: readonly Vec[]; r: number; tone: IsoTone; hue?: IsoHue; far: boolean }) {
  const { unit } = useIsoScene()
  const path = points.map(([x, y, z]) => project(x, y, z, unit))
  const w = r * 1.2247 * unit
  // The screen angle square to the path at each point.
  const normal = (i: number) => {
    const [a, b] = [path[Math.max(i - 1, 0)]!, path[Math.min(i + 1, path.length - 1)]!]
    return Math.atan2(b[0] - a[0], a[1] - b[1])
  }
  const around = (i: number, from: number) =>
    Array.from({ length: 7 }, (_, j) => [path[i]![0] + Math.cos(from - (j / 6) * Math.PI) * w, path[i]![1] + Math.sin(from - (j / 6) * Math.PI) * w] as const)
  const side = (k: 1 | -1) => path.map(([x, y], i) => [x + Math.cos(normal(i)) * w * k, y + Math.sin(normal(i)) * w * k] as const)
  const last = path.length - 1
  const outline = [...side(1), ...around(last, normal(last)), ...side(-1).reverse(), ...around(0, normal(0) + Math.PI)]
  return (
    <g {...faceClass(tone, 'solid', undefined, hue)}>
      <polygon points={toPoints(outline)} className="kg-edge" style={{ fill: far ? 'var(--kg-right)' : 'var(--kg-left)' }} />
    </g>
  )
}

/** A double helix on its stand, seen side on: two backbones twisting round each other, one lit in the accent, paired by their rungs. Hovered, the lit strand lifts away: it unzips. */
export function IllustrationDna(props: IllustrationProps) {
  const foot: Vec = [4.8, 4.8, 2.1]
  const [R, H] = [1.1, 3.4]
  const turn = (s: number) => 0.4 + s * 2.2
  const at = (s: number, side = 0): Vec => {
    const [u, w] = [Math.cos(turn(s)) * R * side, Math.sin(turn(s)) * R * side]
    return [0, 1, 2].map((i) => foot[i]! + UP[i]! * s + ACROSS[i]! * u + NEAR[i]! * w) as unknown as Vec
  }
  // Each strand in lengths, cut where it turns from running behind to running in front.
  const cuts = [0, ...[1, 2, 3].map((k) => (k * Math.PI - 0.4) / 2.2).filter((s) => s < H), H]
  const lengths = cuts.slice(1).flatMap((end, i) => {
    const start = cuts[i]!
    const behind = Math.sin(turn((start + end) / 2)) < 0
    const points = (side: 1 | -1) => Array.from({ length: 14 }, (_, j) => at(start + ((end - start) * j) / 13, side))
    return [
      { lit: true, far: behind, node: <Backbone points={points(1)} r={0.15} tone="accent" far={behind} /> },
      { lit: false, far: !behind, node: <Backbone points={points(-1)} r={0.15} tone="raised" hue={1} far={!behind} /> },
    ]
  })
  const rungs = [0, 1, 2, 3, 4, 5]
    .flatMap((i) => {
      const s = 0.05 + i * 0.6
      const near = Math.sin(turn(s))
      return [
        { lit: true, depth: near, node: <Tube from={at(s, 1)} to={at(s)} r={0.07} tone="raised" hue={2} /> },
        { lit: false, depth: -near, node: <Tube from={at(s)} to={at(s, -1)} r={0.07} tone="neutral" hue={2} /> },
      ]
    })
    .sort((p, q) => p.depth - q.depth)
  const parts = [...lengths.filter((l) => l.far), ...rungs, ...lengths.filter((l) => !l.far)]
  return (
    <IllustrationStage id="dna" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={3.45} y={3.45} z={0.55} r={0.75} h={0.18} tone="raised" />
      <IsoCylinder x={4.1} y={4.1} z={0.73} r={0.1} h={0.83} tone="neutral" />
      <IsoPiece>
        {parts.map(({ lit, node }, i) =>
          lit ? (
            <IsoPiece key={i} float={bob(props, 0.06)} lift={0.6}>
              {node}
            </IsoPiece>
          ) : (
            <g key={i}>{node}</g>
          ),
        )}
      </IsoPiece>
    </IllustrationStage>
  )
}
