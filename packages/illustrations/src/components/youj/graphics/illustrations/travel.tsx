'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { bob, circle, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Travel: going somewhere. A suitcase with its handle up and its tag
 * swinging, a plane climbing off its runway, and a folded map with a pin in
 * the place. */

/** A suitcase on its wheels, handle up, ribbed, and its luggage tag in the accent. */
export function IllustrationSuitcase(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.1, 3.1, 0.8, 3.5, 1.7, 2.7]
  const top = z + h
  const face = [x, y + d, z] as const
  const wheels = [
    [x + 0.2, y + 0.2],
    [x + w - 0.5, y + 0.2],
    [x + 0.2, y + d - 0.5],
    [x + w - 0.5, y + d - 0.5],
  ] as const
  const tag = { u: x + w - 1.4, y: y + d + 0.06, v: z + 0.85 }
  return (
    <IllustrationStage id="suitcase" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {wheels.map(([wx, wy]) => (
        <IsoCylinder key={`${wx}-${wy}`} x={wx} y={wy} z={0.55} r={0.15} h={0.25} tone="sunken" />
      ))}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        {[0.9, 1.75, 2.6].map((u) => (
          <Mark key={u} plane="left" at={face} points={[[u, 0.3], [u, h - 0.3]]} stroke={INK.line} />
        ))}
        <Mark plane="right" at={[x + w, y, z]} points={[[d / 2, 0.3], [d / 2, h - 0.3]]} stroke={INK.line} />
        <Mark plane="top" at={[x, y, top]} points={rect(0.25, d / 2 - 0.04, w - 0.5, 0.08)} fill={INK.line} />
      </IsoBox>
      {[x + 0.9, x + w - 1.0].map((px) => (
        <IsoBox key={px} x={px} y={y + d / 2 - 0.06} z={top} w={0.1} d={0.12} h={1.05} tone="neutral" />
      ))}
      <IsoBox x={x + 0.8} y={y + d / 2 - 0.12} z={top + 1.05} w={w - 1.6} d={0.24} h={0.22} tone="raised" hue={1} />
      <Prism plane="left" at={[0, tag.y, 0]} points={rounded(tag.u, tag.v, 1.1, 1.5, 0.2)} depth={0.08} tone="accent" float={bob(props, 0.1)} lift={0.6}>
        <Link points={[[tag.u + 0.55, tag.y + 0.08, tag.v + 1.22], [x + w - 0.95, y + d / 2, top + 0.35]]} />
        <Mark plane="left" at={[0, tag.y + 0.08, 0]} points={circle(tag.u + 0.55, tag.v + 1.22, 0.1, 12)} fill={INK.onAccent} opacity={0.8} />
        <Mark plane="left" at={[0, tag.y + 0.08, 0]} points={rect(tag.u + 0.22, tag.v + 0.6, 0.66, 0.12)} fill={INK.onAccent} opacity={0.55} />
        <Mark plane="left" at={[0, tag.y + 0.08, 0]} points={rect(tag.u + 0.22, tag.v + 0.35, 0.44, 0.12)} fill={INK.onAccent} opacity={0.4} />
      </Prism>
    </IllustrationStage>
  )
}

/** A plane seen from above, nose along +u, centered on v = 0: half its outline, nose to tail. */
const WING: PlanePoint[] = [
  [4.2, 0],
  [3.95, 0.22],
  [2.75, 0.27],
  [1.9, 2.05],
  [1.5, 2.05],
  [1.8, 0.27],
  [0.75, 0.24],
  [0.4, 0.95],
  [0.12, 0.95],
  [0.2, 0.14],
  [0, 0.1],
]
const PLANE: PlanePoint[] = [...WING, ...WING.slice(1).reverse().map(([u, v]) => [u, -v] as const)]

/** A plane in the accent climbing off its runway, the dashed path it took behind it, its shadow still on the ground. */
export function IllustrationFlight(props: IllustrationProps) {
  const lane = 4.5
  const at = [2.6, lane, 2.7] as const
  return (
    <IllustrationStage id="flight" {...props}>
      <IsoPlatform x={0.4} y={0.4} w={7.2} d={7.2} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={0.8} y={lane - 0.8} z={0.55} w={6.4} d={1.6} h={0.04} tone="sunken" hue={1}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Mark key={i} plane="top" at={[0.8, lane - 0.8, 0.59]} points={rect(0.4 + i * 1, 0.74, 0.55, 0.12)} fill={INK.line} />
        ))}
        {[0.25, 0.55, 1.05, 1.35].map((v) => (
          <Mark key={v} plane="top" at={[0.8, lane - 0.8, 0.59]} points={rect(0.08, v, 0.2, 0.18)} fill={INK.text} />
        ))}
      </IsoBox>
      <Mark plane="top" at={[at[0], lane, 0.6]} points={PLANE} fill={INK.faint} />
      <Link points={[[1.1, lane, 0.62], [2.3, lane, 0.62], [at[0] + 0.1, lane, at[2] - 0.05]]} lit dashed />
      <Prism plane="top" at={at} points={PLANE} depth={0.3} tone="accent" float={bob(props, 0.24)} lift={1} />
    </IllustrationStage>
  )
}

/** The map's panels, folded like a concertina: up to the first crease, down to the next. */
const FOLD = 1.4
const RISE = 0.8
const MAP = { x: 1.2, y: 1.9, z: 0.55, d: 4.1, panels: 4 }
const surface = (x: number) => {
  const u = Math.min(Math.max(x - MAP.x, 0), FOLD * MAP.panels)
  const k = Math.min(Math.floor(u / FOLD), MAP.panels - 1)
  const t = (u - k * FOLD) / FOLD
  return MAP.z + 0.06 + RISE * (k % 2 ? 1 - t : t)
}
/** A path across the map, following its folds: the corners given, and a point on each crease it crosses. */
const across = (path: readonly (readonly [number, number])[]) =>
  path.flatMap(([x, y], i) => {
    const next = path[i + 1]
    const out: (readonly [number, number, number])[] = [[x, y, surface(x) + 0.02]]
    if (!next) return out
    for (let k = 1; k < MAP.panels; k++) {
      const crease = MAP.x + k * FOLD
      if ((crease - x) * (crease - next[0]) < 0) {
        const t = (crease - x) / (next[0] - x)
        out.push([crease, y + (next[1] - y) * t, surface(crease) + 0.02])
      }
    }
    return out
  })

/** A map pin, bottom up: from its point out to its round head. */
const PIN = [
  [0.02, 0],
  [0.38, 0.55],
  [0.68, 1.05],
  [0.78, 1.36],
  [0.72, 1.64],
  [0.56, 1.88],
  [0.3, 2.04],
  [0, 2.1],
] as const

/** A map folded like a concertina, a road or two across it, and a pin in the accent where the dashed route ends. */
export function IllustrationMap(props: IllustrationProps) {
  const top = Array.from({ length: MAP.panels + 1 }, (_, k) => [k * FOLD, 0.06 + (k % 2 ? RISE : 0)] as const)
  const section: PlanePoint[] = [...top, ...top.map(([u, v]) => [u, v - 0.06] as const).reverse()]
  const pin = [4.7, 3.2] as const
  return (
    <IllustrationStage id="map" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="left" at={[MAP.x, MAP.y, MAP.z]} points={section} depth={MAP.d} tone="raised" hue={1} />
      <Link points={across([[MAP.x + 0.05, 2.8], [MAP.x + FOLD * MAP.panels - 0.05, 2.8]])} />
      <Link points={across([[3.3, MAP.y + 0.05], [3.3, MAP.y + MAP.d - 0.05]])} />
      <Link points={across([[1.8, 5.3], [3.1, 4.1], [pin[0], pin[1] + 0.05]])} lit dashed />
      <Lathe
        cx={pin[0]}
        cy={pin[1]}
        z={surface(pin[0]) + 0.25}
        profile={PIN}
        convex
        tone="accent"
        float={bob(props, 0.16)}
        lift={0.9}
      >
        <Mark plane="left" at={[pin[0], pin[1] + 0.75, surface(pin[0]) + 1.6]} points={circle(0, 0, 0.26, 20)} fill={INK.onAccent} opacity={0.85} />
      </Lathe>
    </IllustrationStage>
  )
}
