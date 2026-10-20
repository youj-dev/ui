'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Security: keeping things shut and knowing who's there. A padlock with its
 * shackle springing, a key over the lock it fits, a print lifting off the
 * reader, a shield standing guard, and a safe left open with its gold. */

/** A padlock's shackle, side on: two legs `rise` tall from `v0` and the arch over them, `t` thick. */
const shackle = (cu: number, v0: number, half: number, t: number, rise: number): PlanePoint[] => [
  [cu - half - t / 2, v0],
  ...arc(cu, v0 + rise, half + t / 2, Math.PI, 0, 18),
  [cu + half + t / 2, v0],
  [cu + half - t / 2, v0],
  ...arc(cu, v0 + rise, half - t / 2, 0, Math.PI, 18),
  [cu - half + t / 2, v0],
]

/** A padlock with its keyhole, its shackle in the accent. Hovered, the shackle springs open. */
export function IllustrationPadlock(props: IllustrationProps) {
  const [x, y, z, w, h, d] = [2.4, 3.3, 0.55, 3.2, 2.5, 1.5]
  const top = z + h
  const cy = y + d / 2
  const face = [0, y + d, 0] as const
  return (
    <IllustrationStage id="padlock" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Prism plane="left" at={[0, y, 0]} points={rounded(x, z, w, h, 0.4)} depth={d} tone="raised" hue={1}>
        {[3.05, 4.95].map((u) => (
          <Mark key={u} plane="top" at={[0, 0, top]} points={circle(u, cy, 0.26, 16)} fill={INK.well} />
        ))}
        <Mark plane="left" at={face} points={[...arc(4, z + 1.35, 0.3, -Math.PI * 0.36, Math.PI * 1.36, 18), [3.8, z + 0.6], [4.2, z + 0.6]]} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={face} points={[[x + 0.3, top - 0.45], [x + w - 0.3, top - 0.45]]} stroke={INK.line} />
      </Prism>
      <Prism plane="left" at={[0, cy - 0.17, 0]} points={shackle(4, top, 0.95, 0.4, 0.75)} depth={0.34} tone="accent" float={bob(props, 0.08)} lift={0.8} />
    </IllustrationStage>
  )
}

/** A key, bow up, its blade down and its teeth to the right, in plane units from the tip's center. */
const KEY: PlanePoint[] = [
  [-0.22, 0],
  [-0.22, 2.2],
  ...arc(0, 3.18, 1, Math.PI * 1.43, -Math.PI * 0.43, 28),
  [0.22, 2.2],
  [0.22, 1.05],
  [0.6, 1.05],
  [0.6, 0.72],
  [0.22, 0.72],
  [0.22, 0.52],
  [0.72, 0.52],
  [0.72, 0],
]

/** A key in the accent hanging over the lock it fits, the slot cut in the plate below. Hovered, it drops toward it. */
export function IllustrationKey(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const tip = 1.65
  const plate = 0.72
  return (
    <IllustrationStage id="key" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={cx - 1.05} y={cy - 1.05} z={0.55} r={1.05} h={plate - 0.55} tone="raised" hue={1}>
        <Mark plane="top" at={[cx, cy, plate]} points={circle(0, 0, 0.8, 32)} stroke={INK.line} closed />
        <Mark plane="top" at={[cx, cy, plate]} points={rounded(-0.5, -0.13, 1, 0.26, 0.12)} fill={INK.well} />
      </IsoCylinder>
      <Link points={[[cx, cy, plate], [cx, cy, tip - 0.1]]} lit dashed />
      <Prism plane="left" at={[0, cy - 0.11, 0]} points={KEY.map(([u, v]) => [cx + u, tip + v] as const)} depth={0.22} tone="accent" float={bob(props, 0.12)} lift={-0.55}>
        <Mark plane="left" at={[cx, cy + 0.11, tip + 3.18]} points={circle(0, 0, 0.4, 24)} fill={INK.well} />
      </Prism>
    </IllustrationStage>
  )
}

/** The ridges of a print, round a core, in plane units: each an open loop. */
const RIDGES = [
  [0.22, -0.2, 3.5],
  [0.44, -0.5, 3.6],
  [0.66, -0.3, 3.9],
  [0.88, -0.15, 3.35],
] as const

/** A reader standing on its plinth, its glass lit, and a print in the accent lifting off it. Hovered, it's read. */
export function IllustrationFingerprint(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2, 3.3, 0.55, 3.8, 0.5, 3.9]
  const face = [0, y + d, 0] as const
  const tile = { u: x + 0.75, v: z + 1.1, s: 2.3 }
  const [cu, cv] = [tile.u + tile.s / 2, tile.v + tile.s / 2]
  const front = [0, y + d + 0.5, 0] as const
  return (
    <IllustrationStage id="fingerprint" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="left" at={[0, y, 0]} points={rounded(x, z, w, h, 0.45)} depth={d} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rounded(tile.u - 0.15, tile.v - 0.15, tile.s + 0.3, tile.s + 0.3, 0.5)} fill={INK.well} />
        {[0, 1, 2].map((i) => (
          <Mark key={i} plane="left" at={face} points={circle(x + w / 2 - 0.45 + i * 0.45, z + 0.5, 0.1, 12)} fill={i === 1 ? INK.success : INK.faint} />
        ))}
      </Prism>
      <Prism plane="left" at={[0, y + d + 0.36, 0]} points={rounded(tile.u, tile.v, tile.s, tile.s, 0.5)} depth={0.14} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        {RIDGES.map(([r, from, to]) => (
          <Mark key={r} plane="left" at={front} points={arc(cu, cv - 0.1, r, from, to, 20)} stroke={INK.onAccent} weight={1.5} />
        ))}
      </Prism>
    </IllustrationStage>
  )
}

/** One side of a shield, from the middle of its top edge round to its point. */
const HALF: PlanePoint[] = [
  [0, 3.1],
  [1.3, 3.1],
  [1.3, 1.95],
  ...Array.from({ length: 8 }, (_, i) => {
    const t = (i + 1) / 8
    return [(1 - t) ** 2 * 1.3 + 2 * t * (1 - t) * 1.3, (1 - t) ** 2 * 1.95 + 2 * t * (1 - t) * 0.55] as const
  }),
]
const SHIELD: PlanePoint[] = [...HALF, ...HALF.slice(1, -1).reverse().map(([u, v]) => [-u, v] as const)]

/** A shield in the accent standing guard over its plinth, a check on its face. Hovered, it rises. */
export function IllustrationShield(props: IllustrationProps) {
  const [cx, cy, z] = [4, 4, 1.25]
  const face = [0, cy + 0.2, 0] as const
  return (
    <IllustrationStage id="shield" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 1.6, 40)} fill={INK.accent} opacity={0.14} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 2.45, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Prism plane="left" at={[0, cy - 0.2, 0]} points={SHIELD.map(([u, v]) => [cx + u, z + v] as const)} depth={0.4} tone="accent" float={bob(props, 0.16)} lift={0.8}>
        <Mark plane="left" at={face} points={SHIELD.map(([u, v]) => [cx + u * 0.82, z + 0.3 + v * 0.84] as const)} stroke={INK.onAccent} opacity={0.35} closed />
        <Mark plane="left" at={face} points={[[cx - 0.62, z + 1.95], [cx - 0.15, z + 1.45], [cx + 0.7, z + 2.45]]} stroke={INK.onAccent} weight={3.5} />
      </Prism>
    </IllustrationStage>
  )
}

/** A gold bar, end on: wide at its foot, narrower on top. */
const BAR: PlanePoint[] = [
  [0, 0],
  [1.5, 0],
  [1.3, 0.5],
  [0.2, 0.5],
]

/** A safe on its feet with its door swung wide on its bolts, gold stacked inside, and one bar in the accent drawn out. Hovered, it lifts clear. */
export function IllustrationVault(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.4, 1.5, 0.8, 2.8, 2.7, 3]
  const front = y + d
  const face = [x, front, z] as const
  const door = { x, y: front, z: z + 0.12, w: 0.3, d: w - 0.3, h: h - 0.24 }
  const inner = [door.x + door.w, door.y, door.z] as const
  return (
    <IllustrationStage id="vault" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[
        [x + 0.2, y + 0.2],
        [x + w - 0.5, y + 0.2],
        [x + 0.2, front - 0.5],
        [x + w - 0.5, front - 0.5],
      ].map(([fx, fy]) => (
        <IsoCylinder key={`${fx}-${fy}`} x={fx!} y={fy!} z={0.55} r={0.15} h={0.25} tone="sunken" />
      ))}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(0.25, 0.25, w - 0.5, h - 0.5)} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={face} points={[[0.25, 1.3], [w - 0.25, 1.3]]} stroke={INK.line} weight={2} />
        {[0.45, 1.45].map((u) => (
          <Prism key={u} plane="left" at={[x, front - 0.85, z + 0.25]} points={BAR.map(([bu, bv]) => [u + bu * 0.62, bv * 0.62] as const)} depth={0.7} tone="neutral" hue={2} />
        ))}
      </IsoBox>
      <IsoBox {...door} tone="raised" hue={1}>
        <Mark plane="right" at={inner} points={rect(0.3, 0.3, door.d - 0.6, door.h - 0.6)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="right" at={inner} points={circle(door.d / 2, door.h / 2, 0.32, 24)} stroke={INK.line} closed />
      </IsoBox>
      {[0.7, 1.4, 2.1].map((v) => (
        <Lathe key={v} axis="y" cx={door.x + door.w / 2} cy={door.y + door.d} z={door.z + v} profile={[[0.1, 0], [0.1, 0.24]]} tone="neutral" />
      ))}
      <Prism plane="left" at={[x + 0.7, front + 0.35, z + 1.75]} points={BAR} depth={0.85} tone="accent" float={bob(props, 0.14)} lift={0.9} />
    </IllustrationStage>
  )
}
