'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { band, bob, circle, flat, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Places: where people go. An office tower with its crown lit, a bank
 * behind its columns, a hospital with a helicopter over the roof, a school
 * with its flag, a museum's prize piece and a lighthouse over the water. */

type Face = readonly [number, number, number]

/** Windows in a grid on a face: `cols` × `rows` of `s`-wide panes from (u, v), `gap` apart. */
function Panes({ plane, at, u, v, cols, rows, s, h = s, gap }: { plane: 'left' | 'right'; at: Face; u: number; v: number; cols: number; rows: number; s: number; h?: number; gap: number }) {
  return (
    <>
      {Array.from({ length: cols * rows }, (_, i) => (
        <Mark key={i} plane={plane} at={at} points={rect(u + (i % cols) * (s + gap), v + Math.floor(i / cols) * (h + gap), s, h)} fill={INK.faint} stroke={INK.line} />
      ))}
    </>
  )
}

/** A glass tower of ribbon windows between two lower blocks, and its crown in the accent. Hovered, the crown lifts off. */
export function IllustrationOfficeTower(props: IllustrationProps) {
  const [x, y, z, w, h] = [2.7, 2.4, 0.55, 2.7, 3.3]
  const top = z + h
  const crown = { x: x + 0.35, y: y + 0.35, z: top, w: w - 0.7, d: w - 0.7, h: 0.8 }
  const floors = [0.95, 1.45, 1.95, 2.45, 2.95]
  const faces: [plane: 'left' | 'right', at: Face][] = [
    ['left', [x, y + w, z]],
    ['right', [x + w, y, z]],
  ]
  return (
    <IllustrationStage id="office-tower" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={0.95} y={4.6} z={z} w={1.5} d={2.2} h={1.6} tone="neutral">
        <Panes plane="right" at={[2.45, 4.6, z]} u={0.25} v={0.35} cols={3} rows={2} s={0.42} gap={0.24} />
      </IsoBox>
      <IsoBox x={x} y={y} z={z} w={w} d={w} h={h} tone="raised" hue={1}>
        {faces.map(([plane, at]) => (
          <g key={plane}>
            <Mark plane={plane} at={at} points={rect(0.2, 0, w - 0.4, 0.6)} fill={INK.well} />
            {floors.map((v) => (
              <Mark key={v} plane={plane} at={at} points={rect(0.2, v, w - 0.4, 0.3)} fill={INK.faint} stroke={INK.line} />
            ))}
            {[0.85, 1.35, 1.85].map((u) => (
              <Mark key={u} plane={plane} at={at} points={[[u, floors[0]!], [u, floors.at(-1)! + 0.3]]} stroke={INK.line} />
            ))}
          </g>
        ))}
      </IsoBox>
      <IsoBox {...crown} tone="accent" float={bob(props, 0.05)} lift={0.9}>
        <Mark plane="left" at={[crown.x, crown.y + crown.d, top]} points={rect(0.2, 0.3, crown.w - 0.4, 0.26)} fill={INK.onAccent} opacity={0.55} />
        <Mark plane="right" at={[crown.x + crown.w, crown.y, top]} points={rect(0.2, 0.3, crown.d - 0.4, 0.26)} fill={INK.onAccent} opacity={0.4} />
        <IsoCylinder x={crown.x + crown.w / 2 - 0.05} y={crown.y + crown.d / 2 - 0.05} z={top + crown.h} r={0.05} h={0.75} tone="accent" />
      </IsoBox>
      <IsoBox x={5.75} y={0.95} z={z} w={1.3} d={1.5} h={2.3} tone="neutral">
        <Panes plane="left" at={[5.75, 2.45, z]} u={0.25} v={0.4} cols={2} rows={3} s={0.3} h={0.4} gap={0.2} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** A bank behind its four columns on a flight of steps, its name across the frieze, and a coin in the accent over the pediment. Hovered, the coin lifts. */
export function IllustrationBank(props: IllustrationProps) {
  const [x, y, w, d] = [1.8, 1.9, 4.4, 4]
  const base = 1.03
  const eave = base + 2.34
  const columns = [0.5, 1.63, 2.77, 3.9]
  return (
    <IllustrationStage id="bank" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[0, 1, 2].map((i) => (
        <IsoBox key={i} x={x - 0.5 + i * 0.25} y={y} z={0.55 + i * 0.16} w={w + 1 - i * 0.5} d={d + 0.6 - i * 0.3} h={0.16} tone={i === 2 ? 'raised' : 'neutral'} />
      ))}
      <IsoBox x={x + 0.3} y={y + 0.1} z={base} w={w - 0.6} d={2.6} h={2} tone="raised" hue={1}>
        <Mark plane="left" at={[x + 0.3, y + 2.7, base]} points={rect(1.4, 0, 1, 1.45)} fill={INK.well} stroke={INK.line} />
      </IsoBox>
      {columns.map((u) => (
        <IsoCylinder key={u} x={x + u - 0.24} y={y + d - 0.8} z={base} r={0.24} h={2} tone="raised" />
      ))}
      <IsoBox x={x} y={y} z={base + 2} w={w} d={d} h={0.34} tone="raised">
        <Mark plane="left" at={[x, y + d, base + 2]} points={rect(1.2, 0.12, 2, 0.11)} fill={INK.text} />
      </IsoBox>
      <Prism plane="left" at={[x, y, eave]} points={[[0, 0], [w, 0], [w / 2, 0.85]]} depth={d} tone="raised">
        <Mark plane="left" at={[x, y + d, eave]} points={[[0.75, 0.14], [w - 0.75, 0.14], [w / 2, 0.6]]} stroke={INK.line} closed />
      </Prism>
      <Lathe axis="y" cx={x + w / 2} cy={y + d / 2 - 0.09} z={eave + 1.55} profile={[[0.6, 0], [0.6, 0.18]]} tone="accent" float={bob(props, 0.18)} lift={0.9}>
        <Mark plane="left" at={[x + w / 2, y + d / 2 + 0.09, eave + 1.55]} points={circle(0, 0, 0.42)} stroke={INK.onAccent} weight={1.5} closed />
      </Lathe>
    </IllustrationStage>
  )
}

/** A helicopter's cabin, laid along x from its tail end to the nose. */
const CABIN = [
  [0.22, 0],
  [0.42, 0.2],
  [0.54, 0.55],
  [0.55, 0.95],
  [0.46, 1.28],
  [0.26, 1.5],
  [0, 1.58],
] as const

/** A plus in plane units, centered on (cu, cv): arms `a` thick, `l` long. */
const plus = (cu: number, cv: number, l: number, a: number): PlanePoint[] => [
  [cu - a, cv - l],
  [cu + a, cv - l],
  [cu + a, cv - a],
  [cu + l, cv - a],
  [cu + l, cv + a],
  [cu + a, cv + a],
  [cu + a, cv + l],
  [cu - a, cv + l],
  [cu - a, cv + a],
  [cu - l, cv + a],
  [cu - l, cv - a],
  [cu - a, cv - a],
]

/** A hospital with its cross over the doors and a pad on the roof, and a helicopter in the accent over it. Hovered, it takes off. */
export function IllustrationHospital(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.1, 2.1, 0.55, 5.4, 2.7, 2.3]
  const top = z + h
  const face = [x, y + d, z] as const
  const [hx, hy, hz] = [3.85, 3.45, top + 0.35]
  return (
    <IllustrationStage id="hospital" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Panes plane="left" at={face} u={0.3} v={0.4} cols={3} rows={3} s={0.42} gap={0.24} />
        <Panes plane="left" at={face} u={3.4} v={0.4} cols={3} rows={3} s={0.42} gap={0.24} />
        <Panes plane="right" at={[x + w, y, z]} u={0.3} v={0.4} cols={3} rows={3} s={0.42} gap={0.3} />
        <Mark plane="left" at={face} points={rect(2.25, 0, 0.9, 0.95)} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={face} points={plus(2.7, 1.72, 0.36, 0.13)} fill={INK.text} stroke={INK.line} />
        <Mark plane="top" at={[hx, hy, top]} points={circle(0, 0, 1.05, 40)} stroke={INK.line} closed />
        <Mark plane="top" at={[hx, hy, top]} points={[flat(-0.24, -0.3), flat(-0.24, 0.3)]} stroke={INK.text} weight={2.5} />
        <Mark plane="top" at={[hx, hy, top]} points={[flat(0.24, -0.3), flat(0.24, 0.3)]} stroke={INK.text} weight={2.5} />
        <Mark plane="top" at={[hx, hy, top]} points={[flat(-0.24, 0), flat(0.24, 0)]} stroke={INK.text} weight={2.5} />
      </IsoBox>
      <IsoBox x={x + 2.05} y={y + d} z={z + 1.05} w={1.3} d={0.55} h={0.08} tone="neutral" />
      <Group float={bob(props, 0.16)} lift={1}>
        {[-0.4, 0.34].map((dy) => (
          <IsoBox key={dy} x={hx - 0.85} y={hy + dy} z={hz} w={1.7} d={0.07} h={0.06} tone="neutral" />
        ))}
        <Lathe axis="x" cx={hx - 2.35} cy={hy} z={hz + 0.8} profile={[[0.07, 0], [0.15, 1.7]]} tone="accent" />
        <Prism plane="left" at={[0, hy - 0.04, 0]} points={[[hx - 2.42, hz + 0.72], [hx - 2.18, hz + 0.72], [hx - 2.08, hz + 1.22], [hx - 2.36, hz + 1.3]]} depth={0.08} tone="accent" />
        <Lathe axis="x" cx={hx - 0.75} cy={hy} z={hz + 0.8} profile={CABIN} convex tone="accent">
          <Mark plane="left" at={[hx - 0.75, hy + 0.55, hz + 0.8]} points={[[0.95, 0.02], [1.38, 0.02], [1.2, 0.32], [0.95, 0.36]]} fill={INK.well} />
        </Lathe>
        <IsoCylinder x={hx - 0.07} y={hy - 0.07} z={hz + 1.33} r={0.07} h={0.18} tone="neutral" />
        <IsoBox x={hx - 1.75} y={hy - 0.06} z={hz + 1.51} w={3.5} d={0.12} h={0.04} tone="raised" />
        <IsoBox x={hx - 0.06} y={hy - 1.75} z={hz + 1.51} w={0.12} d={3.5} h={0.04} tone="raised" />
      </Group>
    </IllustrationStage>
  )
}

/** A flag's cloth on the plane it flies in, from the pole along u, rippling top and bottom. */
const flag = (u: number, v: number, w: number, h: number): PlanePoint[] => {
  const edge = (at: number) => Array.from({ length: 9 }, (_, i) => [u + (w * i) / 8, at + Math.sin((i / 8) * Math.PI * 2) * 0.07] as const)
  return [...edge(v), ...edge(v + h).reverse()]
}

/** A schoolhouse: two floors of windows, the tower over its door with the clock on it, and the flag in the accent at the foot of its pole. Hovered, it runs up. */
export function IllustrationSchool(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.1, 2.3, 0.55, 4.7, 2.3, 1.75]
  const top = z + h
  const face = [x, y + d, z] as const
  const tower = { x: x + 1.7, y: y + d - 0.45, w: 1.3, d: 0.8, h: 3.3 }
  const front = [tower.x, tower.y + tower.d, z] as const
  const pole = [1.15, 5.95] as const
  return (
    <IllustrationStage id="school" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Panes plane="left" at={face} u={0.3} v={0.35} cols={2} rows={2} s={0.38} h={0.5} gap={0.22} />
        <Panes plane="left" at={face} u={3.5} v={0.35} cols={2} rows={2} s={0.38} h={0.5} gap={0.22} />
        <Panes plane="right" at={[x + w, y, z]} u={0.35} v={0.35} cols={3} rows={2} s={0.38} h={0.5} gap={0.3} />
      </IsoBox>
      <Prism plane="right" at={[x - 0.15, y, top]} points={[[-0.25, 0], [d + 0.25, 0], [d / 2, 0.95]]} depth={w + 0.3} tone="neutral" hue={2} />
      <IsoBox x={tower.x} y={tower.y} z={z} w={tower.w} d={tower.d} h={tower.h} tone="raised" hue={1}>
        <Mark plane="left" at={front} points={rect(0.3, 0, 0.7, 1.1)} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={front} points={rect(0.42, 1.45, 0.46, 0.6)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={front} points={circle(0.65, 2.72, 0.32, 28)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={front} points={[[0.65, 2.94], [0.65, 2.72], [0.82, 2.64]]} stroke={INK.line} weight={1.5} />
      </IsoBox>
      <Prism plane="left" at={[tower.x - 0.12, tower.y - 0.1, z + tower.h]} points={[[0, 0], [tower.w + 0.24, 0], [tower.w / 2 + 0.12, 0.7]]} depth={tower.d + 0.2} tone="neutral" hue={2} />
      <IsoCylinder x={pole[0] - 0.05} y={pole[1] - 0.05} z={z} r={0.05} h={3.5} tone="neutral" />
      <IsoCylinder x={pole[0] - 0.08} y={pole[1] - 0.08} z={z + 3.5} r={0.08} h={0.12} tone="neutral" />
      <Prism plane="left" at={[0, pole[1] - 0.02, 0]} points={flag(pole[0] + 0.06, 1.05, 1.25, 0.72)} depth={0.04} tone="accent" float={bob(props, 0.06)} lift={2.2} />
    </IllustrationStage>
  )
}

/** An amphora's belly, bottom up: its foot out to the shoulder and in to the neck. */
const AMPHORA = [
  [0.26, 0],
  [0.48, 0.14],
  [0.64, 0.42],
  [0.66, 0.66],
  [0.56, 0.92],
  [0.36, 1.1],
  [0.22, 1.16],
] as const

/** The rope's sag between two posts, `from` to `to` along x at height z. */
const sag = (from: number, to: number, y: number, z: number) =>
  Array.from({ length: 11 }, (_, i) => [from + ((to - from) * i) / 10, y, z - Math.sin((i / 10) * Math.PI) * 0.3] as const)

/** A gallery corner: a painting on the wall, a rope in front, and on its plinth an amphora in the accent. Hovered, it lifts for a closer look. */
export function IllustrationMuseum(props: IllustrationProps) {
  const [cx, cy] = [4.3, 3.9]
  const plinth = 1.95
  const vase = plinth + 0.2
  const wall = [0.9, 1.15, 0.55] as const
  return (
    <IllustrationStage id="museum" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={0.9} y={0.9} z={0.55} w={6.2} d={0.25} h={3.1} tone="neutral" hue={1}>
        <Mark plane="left" at={wall} points={rect(1.2, 1.05, 2, 1.5)} fill={INK.faint} stroke={INK.line} weight={2} />
        <Mark plane="left" at={wall} points={[[1.35, 1.2], [1.95, 1.95], [2.35, 1.55], [2.65, 1.8], [3.05, 1.2]]} fill={INK.text} />
        <Mark plane="left" at={wall} points={circle(2.6, 2.2, 0.16, 16)} fill={INK.text} />
        <Mark plane="left" at={wall} points={rect(3.45, 1.35, 0.4, 0.12)} fill={INK.text} />
      </IsoBox>
      <IsoBox x={0.9} y={1.15} z={0.55} w={0.25} d={5.95} h={3.1} tone="neutral" hue={1}>
        <Mark plane="right" at={[1.15, 1.15, 0.55]} points={rect(1.3, 1.2, 1.5, 1.2)} fill={INK.faint} stroke={INK.line} weight={2} />
        <Mark plane="right" at={[1.15, 1.15, 0.55]} points={circle(2.05, 1.8, 0.32, 20)} fill={INK.text} />
      </IsoBox>
      <IsoBox x={cx - 0.75} y={cy - 0.75} z={0.55} w={1.5} d={1.5} h={plinth - 0.55} tone="raised">
        <Mark plane="left" at={[cx - 0.75, cy + 0.75, 0.55]} points={rect(0.4, 0.95, 0.7, 0.12)} fill={INK.text} />
      </IsoBox>
      <Group float={bob(props, 0.12)} lift={0.85}>
        <IsoCylinder x={cx - 0.26} y={cy - 0.26} z={vase} r={0.26} h={0.1} tone="accent" />
        <Prism plane="left" at={[0, cy - 0.05, 0]} points={band(cx - 0.42, vase + 1.3, 0.1, 0.19, Math.PI * 0.5, Math.PI * 1.35, 10)} depth={0.1} tone="accent" />
        <Lathe cx={cx} cy={cy} z={vase + 0.1} profile={AMPHORA} convex tone="accent" />
        <Lathe cx={cx} cy={cy} z={vase + 1.26} profile={[[0.2, 0], [0.19, 0.28], [0.32, 0.4], [0.3, 0.46]]} convex tone="accent" />
        <Prism plane="left" at={[0, cy - 0.05, 0]} points={band(cx + 0.42, vase + 1.3, 0.1, 0.19, -Math.PI * 0.35, Math.PI * 0.5, 10)} depth={0.1} tone="accent" />
      </Group>
      {[2.3, 6.3].map((px) => (
        <Group key={px}>
          <IsoCylinder x={px - 0.22} y={6.08} z={0.55} r={0.22} h={0.06} tone="neutral" />
          <IsoCylinder x={px - 0.07} y={6.23} z={0.61} r={0.07} h={0.95} tone="neutral" />
          <Lathe cx={px} cy={6.3} z={1.56} profile={[[0.08, 0], [0.13, 0.06], [0.13, 0.14], [0.07, 0.2], [0, 0.22]]} convex tone="neutral" />
        </Group>
      ))}
      <Link points={sag(2.3, 6.3, 6.3, 1.6)} />
    </IllustrationStage>
  )
}

/** Rays of light either side of (cx, cy, z), across the screen, fanned a little. */
const rays = (cx: number, cy: number, z: number) =>
  [-0.22, 0, 0.22, Math.PI - 0.22, Math.PI, Math.PI + 0.22].map((a) => {
    const at = (s: number) => [cx + (Math.cos(a) * s) / Math.sqrt(3), cy - (Math.cos(a) * s) / Math.sqrt(3), z + Math.sin(a) * s] as const
    return [at(0.95), at(2.05)]
  })

/** A lighthouse on its rock, banded, rings on the water round it, and the lantern in the accent shining out. Hovered, the lantern lifts. */
export function IllustrationLighthouse(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const gallery = 3.7
  const lamp = gallery + 0.43
  return (
    <IllustrationStage id="lighthouse" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 2.8, 48)} fill={INK.faint} />
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 2.25, 48)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 2.7, 48)} stroke={INK.faint} dashed closed />
      </IsoPlatform>
      <Lathe cx={cx} cy={cy} z={0.55} profile={[[1.75, 0], [1.6, 0.16], [1.25, 0.34], [0.7, 0.44], [0, 0.48]]} convex tone="neutral" />
      <Lathe cx={cx} cy={cy} z={0.9} profile={[[0.95, 0], [0.87, 0.95]]} tone="raised">
        <Mark plane="left" at={[cx, cy + 0.93, 0.9]} points={rect(-0.2, 0, 0.4, 0.62)} fill={INK.well} />
      </Lathe>
      <Lathe cx={cx} cy={cy} z={1.85} profile={[[0.87, 0], [0.79, 0.95]]} tone="sunken" hue={2} />
      <Lathe cx={cx} cy={cy} z={2.8} profile={[[0.79, 0], [0.71, 0.9]]} tone="raised">
        <Mark plane="left" at={[cx, cy + 0.76, 2.8]} points={rect(-0.12, 0.35, 0.24, 0.3)} fill={INK.well} />
      </Lathe>
      <IsoCylinder x={cx - 0.98} y={cy - 0.98} z={gallery} r={0.98} h={0.14} tone="neutral" />
      <Group float={bob(props, 0.08)} lift={0.75}>
        <IsoCylinder x={cx - 0.5} y={cy - 0.5} z={gallery + 0.14} r={0.5} h={0.6} tone="accent" />
        <Lathe cx={cx} cy={cy} z={gallery + 0.74} profile={[[0.64, 0], [0.5, 0.18], [0.26, 0.34], [0, 0.4]]} convex tone="accent" />
        <IsoCylinder x={cx - 0.05} y={cy - 0.05} z={gallery + 1.14} r={0.05} h={0.22} tone="accent" />
        {rays(cx, cy, lamp).map(([a, b], i) => (
          <Link key={i} points={[a!, b!]} lit />
        ))}
      </Group>
    </IllustrationStage>
  )
}
