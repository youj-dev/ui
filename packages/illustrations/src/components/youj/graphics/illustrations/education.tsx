'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import type { IsoHue } from '../tones'
import { arc, band, bob, circle, Group, IllustrationStage, INK, Lathe, Link, Mark, orb, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Education: learning and what comes of it. A stack of books with the
 * next one lifting off, a cap over the diploma, and the bulb of an idea.
 * Then a globe tilted in its stand, a school backpack, a bookcase with one
 * book pulled out, and an abacus with two beads being counted. */

/** A book lying flat: its spine on the left face, its page edges on the right. */
function book(key: string, x: number, y: number, z: number, w: number, d: number, h: number, tone: 'neutral' | 'raised' | 'accent', extra?: { float?: number | boolean; lift?: number; hue?: IsoHue }) {
  const ink = tone === 'accent' ? INK.onAccent : INK.text
  return (
    <IsoBox key={key} x={x} y={y} z={z} w={w} d={d} h={h} tone={tone} {...extra}>
      <Mark plane="left" at={[x, y + d, z]} points={rect(0.45, h * 0.35, 1.3, h * 0.3)} fill={ink} opacity={tone === 'accent' ? 0.6 : 1} />
      {[0.3, 0.5, 0.7].map((v) => (
        <Mark key={v} plane="right" at={[x + w, y, z]} points={[[0.12, h * v], [d - 0.06, h * v]]} stroke={INK.line} />
      ))}
    </IsoBox>
  )
}

/** A stack of books, the top one in the accent lifting off it, and a pencil in front. */
export function IllustrationBooks(props: IllustrationProps) {
  return (
    <IllustrationStage id="books" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round" />
      {book('a', 2, 2.3, 0.55, 4, 3, 0.62, 'neutral', { hue: 1 })}
      {book('b', 2.4, 2.1, 1.17, 3.5, 2.9, 0.5, 'raised', { hue: 1 })}
      {book('c', 2.15, 2.45, 1.85, 3.8, 2.6, 0.55, 'accent', { float: bob(props, 0.12), lift: 0.9 })}
      <Lathe axis="x" cx={2.1} cy={5.62} z={0.71} profile={[[0.16, 0], [0.16, 0.28]]} tone="neutral" />
      <Lathe axis="x" cx={2.38} cy={5.62} z={0.71} profile={[[0.16, 0], [0.16, 2.4]]} tone="raised" hue={2} />
      <Lathe axis="x" cx={4.78} cy={5.62} z={0.71} profile={[[0.16, 0], [0.04, 0.5]]} tone="sunken" />
    </IllustrationStage>
  )
}

/** A mortarboard in the accent over the rolled diploma, its tassel hanging off one corner. */
export function IllustrationGraduation(props: IllustrationProps) {
  const [cx, cy] = [4, 3.6]
  const board = 3.15
  return (
    <IllustrationStage id="graduation" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Lathe axis="x" cx={2.1} cy={5.3} z={0.87} profile={[[0.32, 0], [0.32, 1.5]]} tone="raised" hue={1} />
      <Lathe axis="x" cx={3.6} cy={5.3} z={0.87} profile={[[0.35, 0], [0.35, 0.3]]} tone="sunken" />
      <Lathe axis="x" cx={3.9} cy={5.3} z={0.87} profile={[[0.32, 0], [0.32, 1.5]]} tone="raised" hue={1}>
        <Mark plane="right" at={[5.4, 5.3, 0.87]} points={circle(0, 0, 0.16, 20)} stroke={INK.line} closed />
      </Lathe>
      <Group float={bob(props, 0.2)} lift={0.9}>
        <IsoCylinder x={cx - 1.15} y={cy - 1.15} z={board - 1} r={1.15} h={1} tone="accent" />
        <IsoBox x={cx - 1.6} y={cy - 1.6} z={board} w={3.2} d={3.2} h={0.12} tone="accent">
          <IsoCylinder x={cx - 0.16} y={cy - 0.16} z={board + 0.12} r={0.16} h={0.08} tone="accent" />
          <Link points={[[cx, cy, board + 0.2], [cx + 1.5, cy - 1.5, board + 0.13], [cx + 1.5, cy - 1.5, board - 0.7]]} lit />
        </IsoBox>
        <IsoBox x={cx + 1.4} y={cy - 1.6} z={board - 1.15} w={0.2} d={0.2} h={0.45} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** The bulb's glass, bottom up: a neck opening into a globe. */
const GLOBE = [
  [0.5, 0],
  [0.62, 0.3],
  [0.9, 0.65],
  [1.12, 1],
  [1.2, 1.3],
  [1.15, 1.62],
  [0.98, 1.95],
  [0.68, 2.22],
  [0.3, 2.38],
  [0, 2.42],
] as const

/** A bulb hovering over its plinth, lit in the accent, its light on the floor and rays round it. */
export function IllustrationIdea(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const base = 1.05
  const glass = base + 0.74
  const centre = glass + 1.3
  const rays = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const a = Math.PI * (i / 6)
    const at = (s: number) => [cx + (Math.cos(a) * s) / 1.732, cy - (Math.cos(a) * s) / 1.732, centre + Math.sin(a) * s] as const
    return [at(1.6), at(2.05)]
  })
  return (
    <IllustrationStage id="idea" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 1.7, 40)} fill={INK.accent} opacity={0.16} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 2.5, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Group float={bob(props, 0.2)} lift={0.8}>
        <IsoCylinder x={cx - 0.26} y={cy - 0.26} z={base} r={0.26} h={0.14} tone="sunken" />
        {[0, 1, 2].map((i) => (
          <IsoCylinder key={i} x={cx - 0.48} y={cy - 0.48} z={base + 0.14 + i * 0.2} r={0.48} h={0.2} tone={i % 2 ? 'neutral' : 'raised'} hue={1} />
        ))}
        <Lathe cx={cx} cy={cy} z={glass} profile={GLOBE} convex tone="accent" />
        {rays.map(([a, b], i) => (
          <Link key={i} points={[a!, b!]} lit />
        ))}
      </Group>
    </IllustrationStage>
  )
}

type Vec = readonly [number, number, number]

/** The runs of a closed loop on a sphere round `c` that face you, to draw as lines. */
const nearRuns = (loop: readonly Vec[], [cx, cy, cz]: Vec): Vec[][] => {
  const near = loop.map(([x, y, z]) => x - cx + (y - cy) + (z - cz) > 0)
  const from = near.findIndex((v, i) => v && !near[(i + loop.length - 1) % loop.length])
  if (from < 0) return near[0] ? [[...loop, loop[0]!]] : []
  const runs: Vec[][] = [[]]
  for (let k = 0; k < loop.length; k++) {
    const i = (from + k) % loop.length
    if (near[i]) runs.at(-1)!.push(loop[i]!)
    else if (runs.at(-1)!.length) runs.push([])
  }
  return runs.filter((run) => run.length > 1)
}

/** A desk globe: the sphere in the accent, tilted on its axis in a half ring over its stand, its lines of latitude and longitude on it. Hovered, it lifts out. */
export function IllustrationGlobe(props: IllustrationProps) {
  const [cx, cy, r, t] = [4.3, 4, 1.45, 0.4]
  // Wide enough to clear the sphere's outline, so the half ring shows round its far side.
  const ring = r * 1.33
  const cz = 1.2 + ring * Math.cos(t)
  const [sx, sz] = [cx - ring * Math.sin(t), cz - ring * Math.cos(t)]
  const c: Vec = [cx, cy, cz]
  // Along the tilted axis (a), and across it (b toward +x, c toward +y).
  const on = (a: number, b: number, s: number): Vec => [cx + a * Math.sin(t) + b * Math.cos(t), cy + s, cz + a * Math.cos(t) - b * Math.sin(t)]
  const loop = (f: (s: number) => Vec) => Array.from({ length: 48 }, (_, i) => f((i / 48) * Math.PI * 2))
  const lines = [
    ...[-0.55, 0, 0.55].map((p) => loop((s) => on(r * Math.sin(p), r * Math.cos(p) * Math.cos(s), r * Math.cos(p) * Math.sin(s)))),
    ...[0, Math.PI / 3, (2 * Math.PI) / 3].map((l) => loop((s) => on(r * Math.cos(s), r * Math.sin(s) * Math.cos(l), r * Math.sin(s) * Math.sin(l)))),
  ].flatMap((l) => nearRuns(l, c))
  return (
    <IllustrationStage id="globe" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={sx - 1.1} y={cy - 1.1} z={0.55} r={1.1} h={0.2} tone="raised" hue={1} />
      <IsoCylinder x={sx - 0.1} y={cy - 0.1} z={0.75} r={0.1} h={sz - 0.75} tone="neutral" />
      <Prism plane="left" at={[0, cy - 0.07, 0]} points={band(cx, cz, ring - 0.08, ring + 0.08, Math.PI * 1.5 - t, Math.PI * 0.5 - t, 24)} depth={0.14} tone="neutral" />
      <IsoCylinder x={cx + ring * Math.sin(t) - 0.12} y={cy - 0.12} z={cz + ring * Math.cos(t) - 0.06} r={0.12} h={0.14} tone="neutral" />
      <Lathe cx={cx} cy={cy} z={cz - r} profile={orb(r, 16)} convex tone="accent" float={bob(props, 0.06)} lift={0.8}>
        {lines.map((run, i) => (
          <Link key={i} points={run} />
        ))}
      </Lathe>
    </IllustrationStage>
  )
}

/** A backpack's outline from the front, in plane units from its bottom-left corner: square at the foot, round over the top. */
const pack = (w: number, h: number): PlanePoint[] => [
  ...arc(w - 0.35, 0.35, 0.35, -Math.PI / 2, 0, 4),
  ...arc(w - 1.05, h - 1.05, 1.05, 0, Math.PI / 2, 8),
  ...arc(1.05, h - 1.05, 1.05, Math.PI / 2, Math.PI, 8),
  ...arc(0.35, 0.35, 0.35, Math.PI, Math.PI * 1.5, 4),
]

/** A school backpack in the accent, zipped, its front pocket and handle, a pencil on the floor in front. Hovered, it's picked up. */
export function IllustrationBackpack(props: IllustrationProps) {
  const [x, y, z, w, h, d] = [2.45, 2.6, 0.95, 3.1, 3.3, 1.5]
  const front = [0, y + d, 0] as const
  const pocket = [0, y + d + 0.42, 0] as const
  return (
    <IllustrationStage id="school-backpack" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Mark plane="top" at={[x, y, 0.56]} points={rounded(0.1, 0.1, w - 0.2, d - 0.2, 0.3)} fill={INK.faint} />
      </IsoPlatform>
      <Lathe axis="x" cx={2.6} cy={5.75} z={0.71} profile={[[0.16, 0], [0.16, 0.28]]} tone="neutral" />
      <Lathe axis="x" cx={2.88} cy={5.75} z={0.71} profile={[[0.16, 0], [0.16, 2.3]]} tone="raised" hue={1} />
      <Lathe axis="x" cx={5.18} cy={5.75} z={0.71} profile={[[0.16, 0], [0.04, 0.5]]} tone="sunken" />
      <Group float={bob(props, 0.16)} lift={0.8}>
        <Prism plane="left" at={[0, y + d / 2 - 0.09, 0]} points={band(x + w / 2, z + h - 0.05, 0.3, 0.44, 0, Math.PI, 12)} depth={0.18} tone="raised" />
        <Prism plane="left" at={[0, y, 0]} points={pack(w, h).map(([u, v]) => [x + u, z + v] as const)} depth={d} tone="accent">
          <Mark plane="left" at={front} points={[...arc(x + w - 1.05, z + h - 1.05, 0.8, 0, Math.PI / 2, 8), ...arc(x + 1.05, z + h - 1.05, 0.8, Math.PI / 2, Math.PI, 8)]} stroke={INK.onAccent} opacity={0.55} />
        </Prism>
        <Prism plane="left" at={front} points={rounded(x + 0.4, z + 0.3, w - 0.8, 1.45, 0.35)} depth={0.42} tone="accent">
          <Mark plane="left" at={pocket} points={[[x + 0.65, z + 1.45], [x + w - 0.65, z + 1.45]]} stroke={INK.onAccent} opacity={0.55} />
          <Mark plane="left" at={pocket} points={rect(x + w - 0.95, z + 1.02, 0.14, 0.36)} fill={INK.onAccent} opacity={0.75} />
        </Prism>
      </Group>
    </IllustrationStage>
  )
}

/** The bookcase's rows, bottom up: each book's thickness, height and tone. */
const SHELF = [
  [[0.36, 1.4, 'raised'], [0.28, 1.25, 'neutral'], [0.42, 1.5, 'sunken'], [0.3, 1.3, 'raised'], [0.26, 1.2, 'neutral'], [0.44, 1.55, 'raised'], [0.3, 1.35, 'sunken'], [0.34, 1.45, 'neutral'], [0.28, 1.2, 'raised'], [0.38, 1.5, 'sunken'], [0.3, 1.3, 'neutral']],
  [[0.3, 1.3, 'neutral'], [0.4, 1.5, 'raised'], [0.28, 1.2, 'sunken'], [0.34, 1.4, 'raised'], [0.3, 1.35, 'neutral'], [0.42, 1.45, 'accent'], [0.36, 1.5, 'raised'], [0.26, 1.25, 'sunken'], [0.34, 1.4, 'neutral'], [0.3, 1.3, 'raised']],
] as const

/** A bookcase of two shelves, books standing in rows, a stack lying flat and a plant at the ends, and one book in the accent taken out, hovering by its gap. Hovered, it rises. */
export function IllustrationLibrary(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.3, 2.9, 0.55, 5.4, 1.6, 3.95]
  const floors = [z, z + 1.85]
  const books = SHELF.flatMap((row, s) =>
    row.map(([t, bh, tone], i) => ({ x: x + 0.22 + row.slice(0, i).reduce((at, [bt]) => at + bt + 0.03, 0), z: floors[s]! + 0.16, t, h: bh, tone })),
  )
  const plain = (b: (typeof books)[number]) => (
    <IsoBox key={`${b.x}-${b.z}`} x={b.x} y={y + 0.2} z={b.z} w={b.t} d={1.25} h={b.h} tone={b.tone} hue={b.tone === 'sunken' ? 2 : 1}>
      <Mark plane="left" at={[b.x, y + 1.45, b.z]} points={rect(0.06, b.h * 0.72, b.t - 0.12, 0.12)} fill={INK.text} />
    </IsoBox>
  )
  return (
    <IllustrationStage id="library" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={0.12} h={h} tone="sunken" />
      <IsoBox x={x} y={y} z={z} w={0.18} d={d} h={h} tone="neutral" />
      {[...floors, z + h - 0.16].map((fz) => (
        <IsoBox key={fz} x={x + 0.18} y={y + 0.12} z={fz} w={w - 0.36} d={d - 0.12} h={0.16} tone="neutral" />
      ))}
      {(['raised', 'sunken', 'neutral'] as const).map((tone, k) => (
        <IsoBox key={tone} x={5.62 - k * 0.05} y={y + 0.3} z={z + 0.16 + k * 0.2} w={0.82} d={1.1} h={0.2} tone={tone} hue={1} />
      ))}
      <IsoCylinder x={5.72} y={y + 0.62} z={floors[1]! + 0.16} r={0.3} h={0.42} tone="sunken" />
      <Lathe cx={6.02} cy={y + 0.92} z={floors[1]! + 0.5} profile={orb(0.44, 10)} convex tone="neutral" />
      {books.filter((b) => b.tone !== 'accent').map(plain)}
      {books.filter((b) => b.tone === 'accent').map((b) => (
        <IsoBox key="out" x={b.x} y={y + d + 0.1} z={b.z + 0.3} w={b.t} d={1.25} h={b.h} tone="accent" float={bob(props, 0.12)} lift={0.8}>
          <Mark plane="left" at={[b.x, y + d + 1.35, b.z + 0.3]} points={rect(0.06, b.h * 0.72, b.t - 0.12, 0.12)} fill={INK.onAccent} opacity={0.6} />
        </IsoBox>
      ))}
      <IsoBox x={x + w - 0.18} y={y} z={z} w={0.18} d={d} h={h} tone="neutral" />
    </IllustrationStage>
  )
}

/** A bead, bottom up: two cones back to back. */
const BEAD = [
  [0.1, 0],
  [0.45, 0.16],
  [0.1, 0.32],
] as const

/** An abacus standing on its feet, beads on its rods, and two in the accent on their way up to the beam. Hovered, they're counted. */
export function IllustrationAbacus(props: IllustrationProps) {
  const [x0, x1, cy] = [1.3, 6.7, 4]
  const [low, beam, top] = [0.95, 2.95, 3.85]
  const rods = [2.2, 3.4, 4.6, 5.8]
  const counted = [1, 3, -1, 2]
  const bead = (x: number, z: number) => <Lathe key={`${x}-${z}`} cx={x} cy={cy} z={z} profile={BEAD} convex tone="raised" hue={1} />
  return (
    <IllustrationStage id="abacus" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {rods.map((rx) => (
        <Link key={rx} points={[[rx, cy, low], [rx, cy, top]]} />
      ))}
      {[x0, x1 - 0.3].map((fx) => (
        <IsoBox key={fx} x={fx} y={cy - 0.8} z={0.55} w={0.3} d={1.6} h={0.14} tone="neutral" />
      ))}
      <IsoBox x={x0} y={cy - 0.22} z={0.69} w={x1 - x0} d={0.44} h={low - 0.69} tone="neutral" />
      {[x0, x1 - 0.3].map((ux) => (
        <IsoBox key={ux} x={ux} y={cy - 0.22} z={low} w={0.3} d={0.44} h={top - low} tone="neutral" />
      ))}
      <IsoBox x={x0 + 0.3} y={cy - 0.15} z={beam} w={x1 - x0 - 0.6} d={0.3} h={0.14} tone="neutral" />
      <IsoBox x={x0} y={cy - 0.22} z={top} w={x1 - x0} d={0.44} h={0.26} tone="neutral" />
      {rods.flatMap((rx, i) => {
        const n = counted[i]!
        const lower = n < 0 ? [0, 1] : [0, 1, 2, 3]
        return [
          ...lower.map((k) => bead(rx, k >= 4 - n && n > 0 ? beam - (4 - k) * 0.32 : low + k * 0.32)),
          bead(rx, i === 1 ? beam + 0.14 : top - 0.32),
        ]
      })}
      <Group float={bob(props, 0.08)} lift={0.52}>
        {[0, 1].map((k) => (
          <Lathe key={k} cx={rods[2]!} cy={cy} z={low + 0.76 + k * 0.32} profile={BEAD} convex tone="accent" />
        ))}
      </Group>
    </IllustrationStage>
  )
}
