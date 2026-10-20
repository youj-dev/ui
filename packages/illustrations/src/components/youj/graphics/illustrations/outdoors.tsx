'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, band, bob, circle, flat, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Outdoors: getting out there. A tent with its campfire going, a compass
 * finding north, binoculars raised to look, a balloon going up and a day at
 * the beach under the umbrella. */

/** A flame in plane units, standing on (cu, v): round at its foot, drawn to a point that leans a little. */
const flame = (cu: number, v: number, w: number, h: number): PlanePoint[] =>
  Array.from({ length: 28 }, (_, i) => {
    const t = (i / 28) * Math.PI * 2
    const up = (1 + Math.cos(t)) / 2
    return [cu + (w / 1.54) * Math.sin(t) * Math.sin(t / 2) + up ** 2 * 0.18, v + h * up] as const
  })

/** A tent pitched on its patch, guyed out, door open, and the campfire in front with its flame in the accent. Hovered, the fire flares up. */
export function IllustrationTent(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.3, 1.6, 0.55, 3.3, 3, 2.25]
  const front = [x, y + d, z] as const
  const [fx, fy] = [5.85, 5.5]
  const pegs = [
    [[x + w / 2, y + d, z + h], [x + w / 2, y + d + 0.9, z]],
    [[x + w * 0.78, y + 0.55, z + h * 0.44], [x + w + 0.75, y + 0.55, z]],
    [[x + w * 0.78, y + d - 0.55, z + h * 0.44], [x + w + 0.75, y + d - 0.55, z]],
  ] as const
  return (
    <IllustrationStage id="tent" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Mark plane="top" at={[x - 0.2, y - 0.2, z]} points={rect(0, 0, w + 0.4, d + 0.5)} fill={INK.faint} />
      </IsoPlatform>
      <Prism plane="left" at={[x, y, z]} points={[[0, 0], [w, 0], [w / 2, h]]} depth={d} tone="raised" hue={1}>
        <Mark plane="left" at={front} points={[[w / 2 - 0.7, 0], [w / 2 + 0.7, 0], [w / 2, 1.5]]} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={front} points={[[w / 2, 1.5], [w / 2, h - 0.12]]} stroke={INK.line} />
      </Prism>
      {pegs.map(([a, b], i) => (
        <Link key={i} points={[a, b]} />
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2
        return <IsoCylinder key={i} x={fx + Math.cos(a) * 0.72 - 0.16} y={fy + Math.sin(a) * 0.72 - 0.16} z={z} r={0.16} h={0.14} tone="neutral" hue={2} />
      })}
      <Lathe axis="x" cx={fx - 0.6} cy={fy + 0.12} z={z + 0.12} profile={[[0.12, 0], [0.12, 1.2]]} tone="sunken" hue={2} />
      <Lathe axis="y" cx={fx - 0.1} cy={fy - 0.6} z={z + 0.34} profile={[[0.12, 0], [0.12, 1.2]]} tone="sunken" hue={2} />
      <Group float={bob(props, 0.1)} lift={0.85}>
        <Prism plane="left" at={[0, fy - 0.04, 0]} points={flame(fx, z + 0.38, 0.95, 1.7)} depth={0.08} tone="accent">
          <Mark plane="left" at={[0, fy + 0.04, 0]} points={flame(fx + 0.03, z + 0.44, 0.5, 0.85)} fill={INK.onAccent} opacity={0.4} />
        </Prism>
        <Prism plane="right" at={[fx - 0.04, 0, 0]} points={flame(fy, z + 0.38, 0.8, 1.3)} depth={0.08} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** A compass with its dial and bail, and over the dial its needle, the north half in the accent. Hovered, it lifts to find north. */
export function IllustrationCompass(props: IllustrationProps) {
  const [cx, cy, z] = [4, 4, 0.55]
  const top = z + 0.5
  const r = 2.3
  const ticks = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2)
  // The needle, drawn upright on the screen: north to the top, leaning a touch east.
  const [nx, ny] = [0.38, -1.42]
  const [px, py] = [(-ny / Math.hypot(nx, ny)) * 0.38, (nx / Math.hypot(nx, ny)) * 0.38]
  const north = [flat(nx, ny), flat(px, py), flat(-px, -py)]
  const south = [flat(-nx, -ny), flat(-px, -py), flat(px, py)]
  const needle = top + 0.45
  const bail = [cx - r * Math.SQRT1_2, cy - r * Math.SQRT1_2] as const
  return (
    <IllustrationStage id="compass" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Prism plane="left" at={[0, bail[1] + 0.05, 0]} points={band(bail[0] - 0.08, top + 0.1, 0.2, 0.34, 0, Math.PI * 2, 20)} depth={0.1} tone="neutral" />
      <IsoCylinder x={bail[0] - 0.24} y={bail[1] - 0.24} z={z + 0.05} r={0.24} h={0.3} tone="neutral" />
      <IsoCylinder x={cx - r} y={cy - r} z={z} r={r} h={top - z} tone="raised" hue={1}>
        <Mark plane="top" at={[cx, cy, top]} points={circle(0, 0, 2.02, 48)} fill={INK.faint} stroke={INK.line} />
        {ticks.map((a, i) => (
          <Mark key={i} plane="top" at={[cx, cy, top]} points={[[Math.cos(a) * (i % 4 ? 1.78 : 1.55), Math.sin(a) * (i % 4 ? 1.78 : 1.55)], [Math.cos(a) * 1.93, Math.sin(a) * 1.93]]} stroke={INK.line} weight={i % 4 ? 1 : 2} />
        ))}
        <Mark plane="top" at={[cx, cy, top]} points={[flat(0, -1.2), flat(0.18, -0.93), flat(-0.18, -0.93)]} fill={INK.text} />
      </IsoCylinder>
      <Group float={bob(props, 0.12)} lift={0.9}>
        <Prism plane="top" at={[cx, cy, needle]} points={south} depth={0.08} tone="sunken" />
        <Prism plane="top" at={[cx, cy, needle]} points={north} depth={0.08} tone="accent" />
        <IsoCylinder x={cx - 0.14} y={cy - 0.14} z={needle + 0.08} r={0.14} h={0.08} tone="neutral" />
      </Group>
    </IllustrationStage>
  )
}

/** Binoculars hovering over their shadow, the lens barrels facing you in the accent. Hovered, they're raised to take a look. */
export function IllustrationBinoculars(props: IllustrationProps) {
  const [z, back] = [1.62, 2.1]
  const sides = [2.95, 5.05]
  return (
    <IllustrationStage id="binoculars" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        {sides.map((sx) => (
          <Mark key={sx} plane="top" at={[0, 0, 0.55]} points={rounded(sx - 0.55, back + 0.15, 1.1, 2.75, 0.5)} fill={INK.faint} />
        ))}
      </IsoPlatform>
      <Group float={bob(props, 0.16)} lift={0.9}>
        {sides.map((sx) => (
          <Group key={sx}>
            <Lathe axis="y" cx={sx} cy={back} z={z} profile={[[0.3, 0], [0.34, 0.4]]} tone="sunken" />
            <Lathe axis="y" cx={sx} cy={back + 0.4} z={z} profile={[[0.42, 0], [0.5, 0.25], [0.5, 1.1]]} tone="raised" hue={1} />
            <Lathe axis="y" cx={sx} cy={back + 1.5} z={z} profile={[[0.52, 0], [0.62, 0.3], [0.62, 1.2]]} tone="accent">
              <Mark plane="left" at={[sx, back + 2.7, z]} points={circle(0, 0, 0.47, 32)} fill={INK.well} />
              <Mark plane="left" at={[sx, back + 2.7, z]} points={circle(-0.16, 0.16, 0.12, 12)} fill={INK.faint} />
            </Lathe>
          </Group>
        ))}
        <IsoBox x={sides[0]! + 0.5} y={back + 0.55} z={z - 0.14} w={sides[1]! - sides[0]! - 1} d={0.85} h={0.28} tone="neutral">
          <Lathe axis="x" cx={3.75} cy={back + 0.97} z={z + 0.3} profile={[[0.16, 0], [0.16, 0.5]]} tone="sunken" />
        </IsoBox>
      </Group>
    </IllustrationStage>
  )
}

/** A balloon's envelope, bottom up: from the mouth over the burner out to its crown. */
const ENVELOPE = [
  [0.3, 0],
  [0.55, 0.28],
  [0.95, 0.74],
  [1.28, 1.24],
  [1.52, 1.76],
  [1.6, 2.16],
  [1.54, 2.54],
  [1.3, 2.88],
  [0.9, 3.12],
  [0.45, 3.24],
  [0, 3.27],
] as const

/** A hot-air balloon going up over its landing field, the envelope in the accent, the basket hanging under it. Hovered, it climbs. */
export function IllustrationHotAirBalloon(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const basket = 1.15
  const mouth = basket + 1.15
  const s = 0.36
  const gores = [-1, -0.5, 0, 0.5, 1].map((k) => Math.PI / 4 + k)
  return (
    <IllustrationStage id="hot-air-balloon" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 1.05, 36)} fill={INK.faint} />
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 2.1, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Group float={bob(props, 0.2)} lift={0.9}>
        <IsoBox x={cx - s} y={cy - s} z={basket} w={s * 2} d={s * 2} h={0.5} tone="raised" hue={2}>
          <Mark plane="left" at={[cx - s, cy + s, basket]} points={[[0, 0.25], [s * 2, 0.25]]} stroke={INK.line} />
          <Mark plane="right" at={[cx + s, cy - s, basket]} points={[[0, 0.25], [s * 2, 0.25]]} stroke={INK.line} />
        </IsoBox>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, j]) => (
          <Link key={`${i}${j}`} points={[[cx + i! * s, cy + j! * s, basket + 0.5], [cx + i! * 0.22, cy + j! * 0.22, mouth + 0.02]]} />
        ))}
        <IsoCylinder x={cx - 0.13} y={cy - 0.13} z={basket + 0.62} r={0.13} h={0.22} tone="sunken" />
        <Lathe cx={cx} cy={cy} z={mouth} profile={ENVELOPE} convex tone="accent">
          {gores.map((a) => (
            <Link key={a} points={ENVELOPE.map(([r, h]) => [cx + r * Math.cos(a), cy + r * Math.sin(a), mouth + h] as const)} />
          ))}
        </Lathe>
      </Group>
    </IllustrationStage>
  )
}

/** The umbrella's canopy, from its rim up to the tip. */
const CANOPY = [
  [1.75, 0],
  [1.5, 0.24],
  [1.06, 0.46],
  [0.54, 0.6],
  [0, 0.66],
] as const

/** A day at the beach: the sea lapping at the sand, a striped towel laid out, and the umbrella in the accent over it. Hovered, a gust lifts it. */
export function IllustrationBeach(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const [ux, uy] = [3.35, 3.45]
  const canopy = 3.05
  // The sea: the far side of the sand, its shore a gentle wave.
  const [a0, a1] = [Math.PI * 1.25 - 1.15, Math.PI * 1.25 + 1.15]
  const edge = arc(cx, cy, 2.55, a0, a1, 24)
  const [e0, e1] = [edge[0]!, edge.at(-1)!]
  const shore = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16
    const [u, v] = [e1[0] + (e0[0] - e1[0]) * t, e1[1] + (e0[1] - e1[1]) * t]
    const lap = Math.sin(t * Math.PI * 3) * 0.14
    return [u + lap, v + lap] as const
  })
  const towel = { x: 4.05, y: 3.6, w: 1.7, d: 2.7 }
  return (
    <IllustrationStage id="beach" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={[...edge, ...shore]} fill={INK.faint} />
        <Mark plane="top" at={[0, 0, 0.55]} points={shore} stroke={INK.line} />
        <Mark plane="top" at={[0, 0, 0.55]} points={shore.map(([u, v]) => [u + 0.45, v + 0.45] as const)} stroke={INK.faint} weight={2} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(ux + 0.55, uy + 0.55, 1.3, 36)} fill={INK.faint} />
      </IsoPlatform>
      <IsoBox {...towel} z={0.55} h={0.04} tone="raised" hue={2}>
        {[0.35, 0.95, 1.55, 2.15].map((v) => (
          <Mark key={v} plane="top" at={[towel.x, towel.y, 0.59]} points={rect(0, v, towel.w, 0.28)} fill={INK.faint} />
        ))}
      </IsoBox>
      <Lathe cx={2.75} cy={5.35} z={0.55} profile={[[0.2, 0], [0.36, 0.1], [0.42, 0.3], [0.36, 0.52], [0.2, 0.62], [0, 0.65]]} convex tone="raised" hue={1}>
        <Link points={arc(0, 0, 0.42, -Math.PI / 2, Math.PI / 2, 12).map(([u, v]) => [2.75 + u * 0.35, 5.35 + u * 0.35, 0.85 + v] as const)} />
      </Lathe>
      <Group float={bob(props, 0.06)} lift={0.8}>
        <IsoCylinder x={ux - 0.05} y={uy - 0.05} z={0.45} r={0.05} h={canopy + 0.6} tone="neutral" />
        <Lathe cx={ux} cy={uy} z={canopy} profile={CANOPY} convex tone="accent">
          {Array.from({ length: 5 }, (_, i) => Math.PI / 4 + (i - 2) * 0.62).map((a) => (
            <Link key={a} points={CANOPY.map(([r, h]) => [ux + r * Math.cos(a), uy + r * Math.sin(a), canopy + h] as const)} />
          ))}
        </Lathe>
      </Group>
    </IllustrationStage>
  )
}
