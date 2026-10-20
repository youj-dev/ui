'use client'

import { project, toPoints, type IsoBounds } from '../iso'
import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPiece, useIsoScene, type IsoShape } from '../iso-scene'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, Group, Hollow, IllustrationStage, INK, Lathe, Link, Mark, orb, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Nature: the world outside. An apple tree with its apple about to fall, a
 * peak with a flag on it, an island with a gull over it, a flower in a vase,
 * a recycling bin, a greenhouse airing, and one drop of water. */

type Point = readonly [number, number, number]

/** A leaf in plane units from its base, `len` long toward `dir` (1 or -1 along u), arching up and then drooping `droop`, `width` across. */
const frond = ([bu, bv]: PlanePoint, dir: number, len: number, droop: number, width: number): PlanePoint[] => {
  const spine = (t: number) => [bu + dir * len * t, bv + len * 0.5 * t - droop * t * t] as const
  const edge = (side: 1 | -1) =>
    Array.from({ length: 11 }, (_, i) => {
      const t = side === 1 ? i / 10 : 1 - i / 10
      const [u, v] = spine(t)
      const [du, dv] = [dir * len, len * 0.5 - 2 * droop * t]
      const n = Math.hypot(du, dv)
      const out = Math.sin(Math.PI * t) ** 0.8 * width * 0.5 * side
      return [u - (dv / n) * out, v + (du / n) * out] as const
    })
  return [...edge(1), ...edge(-1).slice(1, -1)]
}

/** An apple tree, its crown four puffs, and an apple in the accent hanging under it. Hovered, it falls. */
export function IllustrationTree(props: IllustrationProps) {
  const [cx, cy] = [3.9, 3.9]
  const apple = [cx + 0.1, cy + 1.25, 2.3] as const
  const puffs = [
    [-0.5, -0.5, 2.75, 0.95],
    [0, 0, 2.75, 1.1],
    [0.65, -0.55, 2.2, 0.9],
    [-0.55, 0.65, 2.2, 0.9],
  ] as const
  return (
    <IllustrationStage id="tree" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx + 0.2, cy + 0.3, 1.9, 40)} fill={INK.faint} />
      </IsoPlatform>
      <IsoCylinder x={cx - 0.26} y={cy - 0.26} z={0.55} r={0.26} h={1.9} tone="sunken" hue={2} />
      {puffs.map(([dx, dy, z, r]) => (
        <Lathe key={`${dx}-${dy}`} cx={cx + dx} cy={cy + dy} z={z} profile={orb(r)} convex tone="raised" hue={1} />
      ))}
      <Lathe cx={apple[0]} cy={apple[1]} z={apple[2]} profile={orb(0.3)} convex tone="accent" float={bob(props, 0.1)} lift={-1.7}>
        <Link points={[[apple[0], apple[1], apple[2] + 0.55], [apple[0] + 0.05, apple[1] - 0.05, apple[2] + 0.78]]} />
      </Lathe>
    </IllustrationStage>
  )
}

interface PeakProps {
  /** The near-origin corner of its square base, grid units. */
  x: number
  y: number
  z?: number
  w: number
  h: number
  /** How far down from the summit the snow reaches, as a share of the slope. */
  snow: number
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** A peak of rock on a square base, its two faces toward you shaded as a box's are, capped with snow down to a ragged line. */
function PeakImpl({ x, y, z = 0, w, h, snow }: PeakProps) {
  const { unit } = useIsoScene()
  const pts = (list: readonly Point[]) => toPoints(list.map(([a, b, c]) => project(a, b, c, unit)))
  const top: Point = [x + w / 2, y + w / 2, z + h]
  const faces = [
    { base: [[x, y + w, z], [x + w, y + w, z]] as const, rock: 'var(--kg-left)', white: 'var(--kg-top)' },
    { base: [[x + w, y + w, z], [x + w, y, z]] as const, rock: 'var(--kg-right)', white: 'var(--kg-left)' },
  ]
  return (
    <IsoPiece>
      {faces.map(({ base: [a, b], rock, white }) => (
        <g key={rock}>
          <polygon points={pts([a, b, top])} className="kg-edge kg-solid kg-neutral kg-hue kg-h1" style={{ fill: rock }} />
          <polygon
            points={pts([top, ...[0, 1, 2, 3, 4, 5, 6].map((i) => lerp(top, lerp(a, b, i / 6), snow * (i % 2 ? 1.3 : 0.9)))])}
            className="kg-edge kg-solid kg-raised" style={{ fill: white }}
          />
        </g>
      ))}
    </IsoPiece>
  )
}

const Peak = Object.assign(PeakImpl, { isoBounds: ({ x, y, z = 0, w, h }: PeakProps): IsoBounds => ({ x, y, z, w, d: w, h }) }) as IsoShape<PeakProps>

/** Two snow-capped peaks, and a flag in the accent on the taller one's summit. Hovered, it's run up the pole. */
export function IllustrationMountain(props: IllustrationProps) {
  const [x, y, w, h] = [3.3, 1.6, 3.6, 3.5]
  const [cx, cy, top] = [x + w / 2, y + w / 2, 0.55 + h]
  const flag = top + 0.4
  return (
    <IllustrationStage id="mountain" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Peak x={0.95} y={3.9} z={0.55} w={2.35} h={2.3} snow={0.34} />
      <Peak x={x} y={y} z={0.55} w={w} h={h} snow={0.3} />
      <IsoCylinder x={cx - 0.05} y={cy - 0.05} z={top - 0.05} r={0.05} h={1.4} tone="raised" />
      <Prism plane="left" at={[0, cy - 0.03, 0]} points={[[cx + 0.03, flag], [cx + 1, flag + 0.3], [cx + 0.03, flag + 0.6]]} depth={0.06} tone="accent" float={bob(props, 0.05)} lift={0.35} />
    </IllustrationStage>
  )
}

/** A hull seen from above, bow along +u: a flat stern and a pointed bow. */
const HULL: PlanePoint[] = [
  [0, -0.38],
  [1.05, -0.38],
  [1.6, 0],
  [1.05, 0.38],
  [0, 0.38],
]

/** An island of sand in the sea, a palm leaning over it, and a boat offshore, its sail in the accent. Hovered, a swell lifts it. */
export function IllustrationIsland(props: IllustrationProps) {
  const [cx, cy] = [3.35, 3.55]
  const sand = 1.18
  // The trunk leans out as it rises: each ring a little further along x than the last.
  const lean = (i: number) => [cx + 0.07 * i + 0.014 * i * i, cy - 0.03 * i, sand - 0.08 + i * 0.33] as const
  const [px, py, pz] = lean(7)
  const [bx, by] = [4.5, 5.6]
  return (
    <IllustrationStage id="island" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 1.95, 48)} fill={INK.faint} />
        <Link points={[[bx - 0.15, by, 0.56], [bx - 0.9, by + 0.15, 0.56], [bx - 1.6, by + 0.45, 0.56]]} dashed />
      </IsoPlatform>
      <Lathe cx={cx} cy={cy} z={0.55} profile={[[1.7, 0], [1.55, 0.24], [1.2, 0.46], [0.66, 0.6], [0, 0.63]]} convex tone="raised" hue={2} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const [x, y, z] = lean(i)
        return <IsoCylinder key={i} x={x - 0.14} y={y - 0.14} z={z} r={0.14} h={0.29} tone="sunken" />
      })}
      <Group>
        <Prism plane="right" at={[px - 0.03, 0, 0]} points={frond([py, pz], -1, 1.7, 1.5, 0.38)} depth={0.05} tone="raised" hue={1} />
        <Prism plane="left" at={[0, py - 0.03, 0]} points={frond([px, pz], -1, 1.9, 1.6, 0.4)} depth={0.05} tone="raised" hue={1} />
        <Lathe cx={px - 0.08} cy={py + 0.1} z={pz - 0.36} profile={orb(0.18)} convex tone="sunken" />
        <Prism plane="left" at={[0, py - 0.03, 0]} points={frond([px, pz], 1, 1.8, 1.55, 0.4)} depth={0.05} tone="raised" hue={1} />
        <Prism plane="right" at={[px - 0.03, 0, 0]} points={frond([py, pz], 1, 1.9, 1.6, 0.4)} depth={0.05} tone="raised" hue={1} />
      </Group>
      <Group float={bob(props, 0.1)} lift={0.55}>
        <Prism plane="top" at={[bx, by, 0.58]} points={HULL} depth={0.3} tone="raised" />
        <IsoCylinder x={bx + 0.62} y={by - 0.04} z={0.88} r={0.04} h={1.85} tone="raised" />
        <Prism plane="left" at={[0, by - 0.03, 0]} points={[[bx + 0.6, 1.02], [bx + 0.6, 2.7], [bx - 0.4, 1.02]]} depth={0.06} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** A daisy's head in plane units round (cu, cv): `n` rounded petals out to `r`. */
const daisy = (cu: number, cv: number, r: number, n = 9): PlanePoint[] =>
  Array.from({ length: 90 }, (_, i) => {
    const a = (i / 90) * Math.PI * 2
    const out = r * (0.58 + 0.42 * Math.abs(Math.cos((n * a) / 2)) ** 0.6)
    return [cu + Math.cos(a) * out, cv + Math.sin(a) * out] as const
  })

/** A daisy in the accent standing in a glass vase, two leaves on its stem. Hovered, it's lifted out. */
export function IllustrationFlower(props: IllustrationProps) {
  const [cx, cy, z] = [4, 4, 0.55]
  const head = 3.95
  return (
    <IllustrationStage id="flower" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, z]} points={circle(cx, cy, 1.25, 40)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.12)} lift={0.8}>
        <IsoCylinder x={cx - 0.06} y={cy - 0.06} z={z + 0.12} r={0.06} h={head - z - 0.12} tone="raised" hue={1} />
        <Prism plane="right" at={[cx - 0.03, 0, 0]} points={frond([cy, 2.55], 1, 0.95, 0.35, 0.4)} depth={0.06} tone="raised" hue={1} />
        <Prism plane="left" at={[0, cy - 0.03, 0]} points={frond([cx, 2.85], 1, 0.9, 0.3, 0.38)} depth={0.06} tone="raised" hue={1} />
        <Prism plane="left" at={[0, cy + 0.02, 0]} points={daisy(cx, head, 0.95)} depth={0.12} tone="accent">
          <Mark plane="left" at={[0, cy + 0.14, 0]} points={circle(cx, head, 0.3, 24)} fill={INK.onAccent} opacity={0.75} />
        </Prism>
      </Group>
      <IsoCylinder x={cx - 0.7} y={cy - 0.7} z={z} r={0.7} h={1.65} variant="wire" />
    </IllustrationStage>
  )
}

/** Three arrows chasing round a circle in plane units: the recycling mark, `r` round and `t` either side of it. */
const arrows = (cu: number, cv: number, r: number, t: number) =>
  [0, 1, 2].map((i) => {
    const [a0, a1] = [(i * 2 * Math.PI) / 3 + 0.3, (i * 2 * Math.PI) / 3 + 1.75]
    const at = (d: number, a: number) => [cu + d * Math.cos(a), cv + d * Math.sin(a)] as const
    return [...arc(cu, cv, r + t, a0, a1, 10), at(r + t * 2.4, a1), at(r, a1 + 0.55), at(r - t * 2.4, a1), ...arc(cu, cv, r - t, a1, a0, 10)]
  })

/** A bottle, bottom up. */
const BOTTLE = [
  [0.4, 0],
  [0.42, 1.05],
  [0.33, 1.28],
  [0.18, 1.46],
  [0.17, 1.72],
] as const

/** A recycling bin with its mark, and a bottle in the accent over the opening. Hovered, it drops in. */
export function IllustrationRecycling(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.3, 2.6, 0.55, 3.3, 2.7, 2.4]
  const top = z + h
  const [bx, by] = [x + w / 2 + 0.15, y + d / 2 + 0.1]
  const face = [x, y + d, z] as const
  return (
    <IllustrationStage id="recycling" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Hollow x={x + 0.1} y={y + 0.1} top={top} w={w - 0.2} d={d - 0.2} depth={h - 0.3} />
      </IsoBox>
      <Group float={bob(props, 0.14)} lift={-1.45}>
        <Lathe cx={bx} cy={by} z={top + 0.3} profile={BOTTLE} tone="accent" />
        <IsoCylinder x={bx - 0.19} y={by - 0.19} z={top + 2.02} r={0.19} h={0.22} tone="accent" />
      </Group>
      {/* The bin's front walls again, over whatever drops into it. */}
      <IsoBox x={x} y={y + d - 0.02} z={z} w={w} d={0.02} h={h} tone="raised" hue={1}>
        {arrows(w / 2, h / 2 - 0.1, 0.72, 0.12).map((points, i) => (
          <Mark key={i} plane="left" at={face} points={points} fill={INK.line} />
        ))}
      </IsoBox>
      <IsoBox x={x + w - 0.02} y={y} z={z} w={0.02} d={d - 0.02} h={h} tone="raised" hue={1}>
        <Mark plane="right" at={[x + w, y, z]} points={rect(0.4, h - 0.55, d - 0.8, 0.14)} fill={INK.faint} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** A flat face through points in the scene, off the three planes: a sloped roof's glass. */
function Pane({ points, fill }: { points: readonly Point[]; fill: string }) {
  const { unit } = useIsoScene()
  return <polygon points={toPoints(points.map(([a, b, c]) => project(a, b, c, unit)))} className="kg-line" style={{ fill, stroke: INK.line }} />
}

/** A seedling standing at (x, y, z): a stem and a leaf either way, `s` to scale. */
const seedling = (x: number, y: number, z: number, s: number, tone: 'raised' | 'accent') => [
  <IsoCylinder key="stem" x={x - 0.04} y={y - 0.04} z={z} r={0.04} h={0.45 * s} tone={tone} hue={1} />,
  <Prism key="left" plane="left" at={[0, y - 0.02, 0]} points={frond([x, z + 0.42 * s], -1, 0.55 * s, 0.22 * s, 0.34 * s)} depth={0.04} tone={tone} hue={1} />,
  <Prism key="right" plane="right" at={[x - 0.02, 0, 0]} points={frond([y, z + 0.42 * s], 1, 0.55 * s, 0.22 * s, 0.34 * s)} depth={0.04} tone={tone} hue={1} />,
]

/** A greenhouse, glass on a low wall, seedlings in pots in rows, and one of them in the accent. Hovered, it shoots up. */
export function IllustrationGreenhouse(props: IllustrationProps) {
  const [x, y, w, d] = [1.7, 2.3, 4.6, 3.2]
  const [sill, eave, ridge] = [0.95, 2.45, 3.45]
  const mid = y + d / 2
  // A point on the front slope, `s` of the way down from the ridge.
  const slope = (u: number, s: number): Point => [u, mid + (d / 2) * s, ridge - (ridge - eave) * s]
  const pots = [0, 1].flatMap((r) => [0, 1, 2].map((c) => [x + 0.9 + c * 1.4, y + 0.95 + r * 1.3] as const))
  const soil = sill + 0.28
  return (
    <IllustrationStage id="greenhouse" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={0.55} w={w} d={d} h={sill - 0.55} tone="raised" />
      {pots.map(([px, py]) => (
        <IsoCylinder key={`${px}-${py}`} x={px - 0.26} y={py - 0.26} z={sill} r={0.26} h={0.28} tone="sunken" hue={2} />
      ))}
      {pots.map(([px, py], i) => (i === 4 ? null : <Group key={`${px}-${py}`}>{seedling(px, py, soil, 1.1, 'raised')}</Group>))}
      <IsoBox x={x} y={y} z={sill} w={w} d={d} h={eave - sill} variant="wire" hue={1}>
        {[w / 3, (w * 2) / 3].map((u) => (
          <Mark key={u} plane="left" at={[x, y + d, sill]} points={[[u, 0], [u, eave - sill]]} stroke={INK.line} />
        ))}
        {[1.07, 2.13].map((u) => (
          <Mark key={u} plane="right" at={[x + w, y, sill]} points={[[u, 0], [u, eave - sill]]} stroke={INK.line} />
        ))}
        <Pane points={[[x, y, eave], [x + w, y, eave], [x + w, mid, ridge], [x, mid, ridge]]} fill={INK.faint} />
        <Mark plane="right" at={[x + w, y, eave]} points={[[0, 0], [d, 0], [d / 2, ridge - eave]]} fill={INK.faint} stroke={INK.line} />
        <Pane points={[slope(x, 0), slope(x + w, 0), slope(x + w, 1), slope(x, 1)]} fill={INK.faint} />
        {[w / 3, (w * 2) / 3].map((u) => (
          <Link key={u} points={[slope(x + u, 0), slope(x + u, 1)]} />
        ))}
      </IsoBox>
      {/* The lit seedling over the glass, so it reads crisp through it. */}
      <Group float={bob(props, 0.08)} lift={0.6}>
        {seedling(pots[4]![0], pots[4]![1], soil, 1.85, 'accent')}
      </Group>
    </IllustrationStage>
  )
}

/** A drop of water, bottom up: a ball `r` round, drawn up to a point three times as high, its sides meeting at 60°. */
const droplet = (r: number) => [
  ...Array.from({ length: 11 }, (_, i) => {
    const a = (i / 10) * (Math.PI * 2) / 3
    return [r * Math.sin(a), r * (1 - Math.cos(a))] as const
  }),
  [0, r * 3] as const,
]

/** One drop of water in the accent over the rings it's about to make. Hovered, it falls. */
export function IllustrationWaterDrop(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  return (
    <IllustrationStage id="water-drop" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 0.95, 36)} fill={INK.accent} opacity={0.16} />
        {[1.5, 2.2].map((r) => (
          <Mark key={r} plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, r, 48)} stroke={INK.line} dashed={r > 2} closed />
        ))}
      </IsoPlatform>
      <Lathe cx={cx} cy={cy} z={1.3} profile={droplet(0.95)} convex tone="accent" float={bob(props, 0.16)} lift={-0.55} />
    </IllustrationStage>
  )
}
