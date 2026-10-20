'use client'

import { project, toPoints } from '../iso'
import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { useIsoScene } from '../iso-scene'
import { arc, band, bob, circle, Group, IllustrationStage, INK, Lathe, Mark, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Transport: getting there. A car parked in its bay, a bus pulling in to its
 * stop, a train on its rails, a scooter mid-hop and a ship out on the swell. */

/** A wheel on a vehicle's near side, its face toward you, and its hub. */
const wheel = (cx: number, face: number, z: number, r: number) => (
  <Lathe key={cx} axis="y" cx={cx} cy={face} z={z} profile={[[r, 0], [r, 0.14]]} tone="sunken">
    <Mark plane="left" at={[cx, face + 0.14, z]} points={circle(0, 0, r * 0.42, 20)} fill={INK.text} stroke={INK.line} />
  </Lathe>
)

/** Glass through points in the scene, for a pane on a sloped face no plane runs along: a windscreen. Draw it as its shape's child. */
function Glass({ points }: { points: readonly (readonly [number, number, number])[] }) {
  const { unit } = useIsoScene()
  return <polygon points={toPoints(points.map(([x, y, z]) => project(x, y, z, unit)))} style={{ fill: INK.well }} />
}

/** A car's side, u along x and v up from the road: along the sill and over its arches, then back over the roof. */
const CAR: PlanePoint[] = [
  [0.05, 0.5],
  ...arc(1.05, 0.5, 0.62, Math.PI, 0, 10),
  ...arc(3.6, 0.5, 0.62, Math.PI, 0, 10),
  [4.55, 0.5],
  [4.65, 0.62],
  [4.65, 0.95],
  [4.5, 1.12],
  [3.4, 1.22],
  [2.75, 1.9],
  [1.25, 1.95],
  [0.45, 1.3],
  [0.1, 1.2],
  [0, 1],
  [0, 0.62],
]

/** A car in the accent parked in its bay, its wheels on the ground. Hovered, it rises on its springs, ready to go. */
export function IllustrationCar(props: IllustrationProps) {
  const [x, y, z, d] = [1.7, 2.95, 0.55, 2.1]
  const side = [x, y + d, z] as const
  const nose = [x + 4.65, y, z] as const
  return (
    <IllustrationStage id="car" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1}>
        {[y - 0.4, y + d + 0.3].map((v) => (
          <Mark key={v} plane="top" at={[0, 0, 0.55]} points={rect(1.2, v, 5.6, 0.1)} fill={INK.line} />
        ))}
        <Mark plane="top" at={[0, 0, 0.55]} points={rect(1.2, y - 0.4, 0.1, d + 0.8)} fill={INK.line} />
        <Mark plane="top" at={[0, 0, 0.55]} points={rounded(x + 0.1, y + 0.15, 4.5, d, 0.4)} fill={INK.faint} />
      </IsoPlatform>
      <Prism plane="left" at={[x, y, z]} points={CAR} depth={d} tone="accent" float={bob(props, 0.04)} lift={0.45}>
        <Glass points={[[x + 3.3, y + 0.16, z + 1.3], [x + 2.84, y + 0.16, z + 1.8], [x + 2.84, y + d - 0.16, z + 1.8], [x + 3.3, y + d - 0.16, z + 1.3]]} />
        <Mark plane="left" at={side} points={[[0.62, 1.3], [1.27, 1.83], [1.95, 1.84], [1.95, 1.3]]} fill={INK.well} />
        <Mark plane="left" at={side} points={[[2.08, 1.3], [2.08, 1.84], [2.72, 1.83], [3.18, 1.3]]} fill={INK.well} />
        <Mark plane="left" at={side} points={[[2.02, 0.66], [2.02, 1.22]]} stroke={INK.onAccent} opacity={0.4} />
        <Mark plane="left" at={side} points={rect(2.3, 1.02, 0.34, 0.08)} fill={INK.onAccent} opacity={0.6} />
        {[0.2, d - 0.6].map((u) => (
          <Mark key={u} plane="right" at={nose} points={rect(u, 0.7, 0.4, 0.17)} fill={INK.onAccent} opacity={0.85} />
        ))}
      </Prism>
      {[x + 1.05, x + 3.6].map((cx) => wheel(cx, y + d, z + 0.5, 0.5))}
    </IllustrationStage>
  )
}

/** A bus's side, u along x and v up from the road: the sill and its arches, the square nose, the roof. */
const BUS: PlanePoint[] = [
  [0.05, 0.45],
  ...arc(1.2, 0.45, 0.56, Math.PI, 0, 10),
  ...arc(4.3, 0.45, 0.56, Math.PI, 0, 10),
  [5.8, 0.45],
  [5.9, 0.56],
  [5.9, 2.2],
  [5.8, 2.45],
  [5.6, 2.55],
  [0.15, 2.55],
  [0, 2.4],
  [0, 0.56],
]

/** A bus pulled in to its stop, its livery and destination lit in the accent, the sign and a bench on the curb. Hovered, it rises on its springs. */
export function IllustrationBus(props: IllustrationProps) {
  const [x, y, z, d] = [0.9, 2.35, 0.55, 2]
  const side = [x, y + d, z] as const
  const nose = [x + 5.9, y, z] as const
  const kerb = 0.69
  return (
    <IllustrationStage id="bus" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={0.9} y={4.7} z={0.55} w={6.2} d={1.55} h={kerb - 0.55} tone="neutral" />
      <Prism plane="left" at={[x, y, z]} points={BUS} depth={d} tone="raised" hue={1} float={bob(props, 0.04)} lift={0.4}>
        {[0.3, 1.2, 2.1, 3, 3.9].map((u) => (
          <Mark key={u} plane="left" at={side} points={rect(u, 1.5, 0.8, 0.75)} fill={INK.faint} stroke={INK.line} />
        ))}
        <Mark plane="left" at={side} points={rect(0, 1.06, 4.85, 0.3)} fill={INK.accent} />
        <Mark plane="left" at={side} points={rect(4.95, 0.56, 0.75, 1.69)} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={side} points={[[5.33, 0.56], [5.33, 2.25]]} stroke={INK.line} />
        <Mark plane="right" at={nose} points={rect(0, 1.06, d, 0.3)} fill={INK.accent} />
        <Mark plane="right" at={nose} points={rect(0.12, 1.45, d - 0.24, 0.8)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="right" at={nose} points={rect(0.3, 2.3, d - 0.6, 0.14)} fill={INK.accent} />
        {[0.15, d - 0.5].map((u) => (
          <Mark key={u} plane="right" at={nose} points={rect(u, 0.7, 0.35, 0.15)} fill={INK.text} />
        ))}
      </Prism>
      {[x + 1.2, x + 4.3].map((cx) => wheel(cx, y + d, z + 0.45, 0.45))}
      <IsoCylinder x={6.44} y={5.44} z={kerb} r={0.06} h={2.9} tone="neutral" />
      <Lathe axis="y" cx={6.5} cy={5.44} z={kerb + 2.95} profile={[[0.46, 0], [0.46, 0.08]]} tone="raised">
        <Mark plane="left" at={[6.5, 5.52, kerb + 2.95]} points={circle(0, 0, 0.3, 24)} stroke={INK.line} weight={2.5} closed />
        <Mark plane="left" at={[6.5, 5.52, kerb + 2.95]} points={rect(-0.34, -0.07, 0.68, 0.14)} fill={INK.line} />
      </Lathe>
      <IsoBox x={2.2} y={5.45} z={kerb + 0.42} w={1.7} d={0.5} h={0.08} tone="raised" hue={2}>
        {[0.15, 1.45].map((u) => (
          <IsoBox key={u} x={2.2 + u} y={5.55} z={kerb} w={0.1} d={0.3} h={0.42} tone="neutral" />
        ))}
      </IsoBox>
    </IllustrationStage>
  )
}

/** A high-speed train's side, u along x and v up from the rails: the car's body, then its long nose. */
const CARRIAGE: PlanePoint[] = [
  [0, 0.3],
  [4.25, 0.3],
  [4.25, 1.9],
  [3.6, 1.98],
  [0.12, 2],
  [0, 1.88],
]
const NOSE: PlanePoint[] = [
  [4.25, 0.3],
  [4.5, 0.3],
  [5.15, 0.38],
  [5.55, 0.55],
  [5.8, 0.8],
  [5.85, 1],
  [5.7, 1.22],
  [5.35, 1.45],
  [4.85, 1.72],
  [4.25, 1.9],
]

/** A train on its rails, sleepers under them, its long nose in the accent. Hovered, it rises on its springs. */
export function IllustrationTrain(props: IllustrationProps) {
  const [x, y, z, d] = [0.85, 3.05, 0.84, 1.8]
  const side = [x, y + d, z] as const
  return (
    <IllustrationStage id="train" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={0.6} y={2.85} z={0.55} w={6.8} d={2.3} h={0.12} tone="sunken" />
      {Array.from({ length: 9 }, (_, i) => (
        <IsoBox key={i} x={0.8 + i * 0.72} y={2.95} z={0.67} w={0.34} d={2.1} h={0.07} tone="neutral" />
      ))}
      {[3.3, 4.7].map((ry) => (
        <IsoBox key={ry} x={0.6} y={ry} z={0.74} w={6.8} d={0.1} h={0.1} tone="raised" />
      ))}
      <Group float={bob(props, 0.04)} lift={0.45}>
        <Prism plane="left" at={[x, y, z]} points={CARRIAGE} depth={d} tone="raised" hue={1}>
          {[0.35, 0.95, 1.55, 2.15, 2.75, 3.35].map((u) => (
            <Mark key={u} plane="left" at={side} points={rect(u, 1.25, 0.44, 0.42)} fill={INK.faint} stroke={INK.line} />
          ))}
          <Mark plane="left" at={side} points={[[0, 0.85], [4.25, 0.85]]} stroke={INK.line} weight={2} />
        </Prism>
        <Prism plane="left" at={[x, y, z]} points={NOSE} depth={d} tone="accent">
          <Mark plane="left" at={side} points={[[4.25, 1.3], [4.75, 1.3], [5.1, 1.47], [4.6, 1.69], [4.25, 1.77]]} fill={INK.well} />
          <Glass points={[[x + 4.4, y + 0.3, z + 1.86], [x + 5.15, y + 0.3, z + 1.55], [x + 5.15, y + d - 0.3, z + 1.55], [x + 4.4, y + d - 0.3, z + 1.86]]} />
          <Mark plane="left" at={side} points={[[4.25, 0.85], [4.6, 0.85], [5.3, 0.6]]} stroke={INK.onAccent} opacity={0.5} weight={2} />
        </Prism>
      </Group>
      {[x + 0.6, x + 1.2, x + 3.9, x + 4.5].map((cx) => wheel(cx, y + d, z + 0.22, 0.22))}
    </IllustrationStage>
  )
}

/** A kick scooter mid-hop over its shadow: deck, stem and bar in the accent, on two small wheels. Hovered, it kicks up higher. */
export function IllustrationScooter(props: IllustrationProps) {
  const [cy, z, r] = [4, 1.3, 0.55]
  const [rear, front, bar] = [1.5, 6.5, 4.75]
  const deck = { x: rear + 0.6, w: front - rear - 1.25 }
  const stem: PlanePoint[] = [[front - 0.1, z], [front + 0.1, z], [front - 0.4, bar], [front - 0.62, bar]]
  const neck: PlanePoint[] = [[deck.x + deck.w - 0.3, z - 0.14], [deck.x + deck.w, z - 0.14], [front - 0.02, z + 0.5], [front - 0.12, z + 0.78], [deck.x + deck.w - 0.3, z + 0.04]]
  return (
    <IllustrationStage id="scooter" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={rounded(rear - 0.35, cy - 0.5, front - rear + 0.7, 1, 0.5)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.14)} lift={0.8}>
        <Lathe axis="y" cx={rear} cy={cy - 0.14} z={z} profile={[[r, 0], [r, 0.28]]} tone="sunken" />
        <Prism plane="left" at={[0, cy - 0.17, 0]} points={band(rear, z, r + 0.05, r + 0.16, Math.PI * 0.1, Math.PI * 0.72, 10)} depth={0.34} tone="accent" />
        <IsoBox x={deck.x} y={cy - 0.5} z={z - 0.14} w={deck.w} d={1} h={0.18} tone="accent">
          <Mark plane="top" at={[deck.x, cy - 0.5, z + 0.04]} points={rounded(0.22, 0.18, deck.w - 0.44, 0.64, 0.22)} fill={INK.well} />
        </IsoBox>
        <Lathe axis="y" cx={front} cy={cy - 0.14} z={z} profile={[[r, 0], [r, 0.28]]} tone="sunken" />
        <Prism plane="left" at={[0, cy - 0.13, 0]} points={neck} depth={0.26} tone="accent" />
        <Prism plane="left" at={[0, cy - 0.12, 0]} points={stem} depth={0.24} tone="accent" />
        <Lathe axis="y" cx={front - 0.51} cy={cy - 1.05} z={bar} profile={[[0.12, 0], [0.12, 0.4]]} tone="sunken" />
        <Lathe axis="y" cx={front - 0.51} cy={cy - 0.65} z={bar} profile={[[0.08, 0], [0.08, 1.3]]} tone="accent" />
        <Lathe axis="y" cx={front - 0.51} cy={cy + 0.65} z={bar} profile={[[0.12, 0], [0.12, 0.4]]} tone="sunken" />
      </Group>
    </IllustrationStage>
  )
}

/** A hull seen from above, stern to bow along u and centered across v. */
const HULL: PlanePoint[] = [
  [0, -0.85],
  [0.2, -1],
  [4.2, -1],
  [5, -0.8],
  [5.6, -0.42],
  [5.85, 0],
  [5.6, 0.42],
  [5, 0.8],
  [4.2, 1],
  [0.2, 1],
  [0, 0.85],
]

/** A ripple on the water's face: a short squiggle along x. */
const ripple = (u: number, v: number): PlanePoint[] => Array.from({ length: 13 }, (_, i) => [u + i * 0.1, v + Math.sin((i / 12) * Math.PI * 3) * 0.1] as const)

/** A container ship out on the water, the hull in the accent, boxes stacked on deck and the bridge at the stern. Hovered, it rides up the swell. */
export function IllustrationShip(props: IllustrationProps) {
  const [x, cy, z] = [1.1, 4, 0.5]
  const deck = z + 0.85
  const boxes = [0, 1, 2].flatMap((c) => [0, 1].map((r) => [c, r] as const))
  return (
    <IllustrationStage id="ship" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[4, 4, 0.55]} points={circle(0, 0, 2.8, 48)} fill={INK.faint} />
        {[[1.7, 2.6], [3.4, 1.6], [4.4, 6.1], [1.8, 5.2]].map(([u, v]) => (
          <Mark key={`${u}-${v}`} plane="top" at={[0, 0, 0.55]} points={ripple(u!, v!)} stroke={INK.line} />
        ))}
      </IsoPlatform>
      <Group float={bob(props, 0.1)} lift={0.5}>
        <Prism plane="top" at={[x, cy, z]} points={HULL} depth={0.85} tone="accent">
          <Mark plane="left" at={[x, cy + 1, z]} points={rect(0.2, 0.28, 4, 0.08)} fill={INK.onAccent} opacity={0.5} />
        </Prism>
        <IsoBox x={x + 0.3} y={cy - 0.75} z={deck} w={1} d={1.5} h={1.55} tone="raised">
          <Mark plane="left" at={[x + 0.3, cy + 0.75, deck]} points={rect(0.12, 1.1, 0.76, 0.24)} fill={INK.well} />
          <Mark plane="right" at={[x + 1.3, cy - 0.75, deck]} points={rect(0.12, 1.1, 1.26, 0.24)} fill={INK.well} />
        </IsoBox>
        <IsoCylinder x={x + 0.45} y={cy - 0.25} z={deck + 1.55} r={0.25} h={0.45} tone="neutral" />
        {boxes.map(([c, r]) => (
          <IsoBox key={`${c}-${r}`} x={x + 1.6 + c * 0.95} y={cy - 0.85 + r * 0.85} z={deck} w={0.9} d={0.8} h={0.5 + ((c + r) % 2) * 0.5} tone={(c + r) % 2 ? 'neutral' : 'raised'} hue={(c + r) % 2 ? 2 : 1} />
        ))}
      </Group>
    </IllustrationStage>
  )
}
