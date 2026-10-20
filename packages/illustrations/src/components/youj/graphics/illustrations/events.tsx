'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Events: the days people mark. Balloons with one slipping away, a roll of
 * tickets with the next one torn off, a stage whose curtain is about to go
 * up, and a cake with its first slice lifting out. */

/** A balloon, bottom up, one grid unit to scale. */
const BALLOON = [[0.08, 0], [0.32, 0.12], [0.56, 0.38], [0.72, 0.72], [0.77, 1.05], [0.72, 1.38], [0.57, 1.64], [0.33, 1.82], [0, 1.9]] as const

/** Three balloons tied to a weight among the confetti, the one in the accent slipping its string. Hovered, it floats off. */
export function IllustrationParty(props: IllustrationProps) {
  const tie = [4.9, 4.9, 1.1] as const
  const balloon = (cx: number, cy: number, z: number, s: number, tone: 'raised' | 'neutral' | 'accent', extra?: { float?: number | boolean; lift?: number }) => (
    <Lathe key={`${cx}-${cy}`} cx={cx} cy={cy} z={z} profile={BALLOON.map(([r, h]) => [r * s, h * s] as const)} convex tone={tone} hue={tone === 'neutral' ? 2 : 1} {...extra}>
      <IsoCylinder x={cx - 0.08} y={cy - 0.08} z={z - 0.1} r={0.08} h={0.12} tone={tone} hue={tone === 'neutral' ? 2 : 1} />
      <Link points={[[cx, cy, z - 0.1], [(cx + tie[0]) / 2 + 0.15, (cy + tie[1]) / 2 - 0.15, (z + tie[2]) / 2], tie]} />
    </Lathe>
  )
  const chips = [[2.1, 5.5, 0.4], [5.9, 4.1, 1.2], [3.2, 6.2, 2.1], [6.1, 2.6, 0.8], [2.2, 2.9, 2.6], [5.3, 6.0, 1.7]] as const
  return (
    <IllustrationStage id="party" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        {chips.map(([u, v, a]) => (
          <Mark key={`${u}-${v}`} plane="top" at={[u, v, 0.55]} points={rect(-0.22, -0.08, 0.44, 0.16).map(([p, q]) => [p * Math.cos(a) - q * Math.sin(a), p * Math.sin(a) + q * Math.cos(a)] as const)} fill={INK.line} />
        ))}
      </IsoPlatform>
      <IsoBox x={4.55} y={4.55} z={0.55} w={0.7} d={0.7} h={0.55} tone="neutral" />
      {balloon(4.75, 2.45, 2.2, 1.05, 'neutral')}
      {balloon(2.65, 4.35, 2.45, 1.05, 'raised')}
      {balloon(3.7, 3.4, 2.95, 1.15, 'accent', { float: bob(props, 0.18), lift: 1.1 })}
    </IllustrationStage>
  )
}

/** A ticket in plane units from its corner, its corners bitten out. */
const ticket = (u: number, v: number, w: number, l: number, r = 0.22): PlanePoint[] => [
  ...arc(u + w, v, r, Math.PI, Math.PI / 2, 5),
  ...arc(u + w, v + l, r, (3 * Math.PI) / 2, Math.PI, 5),
  ...arc(u, v + l, r, 2 * Math.PI, (3 * Math.PI) / 2, 5),
  ...arc(u, v, r, Math.PI / 2, 0, 5),
]

/** A roll of tickets unwinding across the floor, perforated between each, and the last one in the accent torn off it. Hovered, it's taken. */
export function IllustrationTicket(props: IllustrationProps) {
  const [x, w, z] = [2.8, 2.4, 0.55]
  const [roll, end] = [2.4, 5.6]
  const torn = { v: end + 0.15, l: 1.25, z: 1.3 }
  return (
    <IllustrationStage id="ticket" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Mark plane="top" at={[0, 0, z]} points={ticket(x, torn.v, w, torn.l)} fill={INK.faint} />
      </IsoPlatform>
      <IsoBox x={x} y={roll} z={z} w={w} d={end - roll} h={0.03} tone="raised" hue={1}>
        {[3.4, 4.5].map((v) => (
          <g key={v}>
            <Mark plane="top" at={[x, 0, z + 0.03]} points={[[0.1, v], [w - 0.1, v]]} stroke={INK.line} dashed />
            <Mark plane="top" at={[x, 0, z + 0.03]} points={rect(0.4, v + 0.3, 1.3, 0.14)} fill={INK.text} />
            <Mark plane="top" at={[x, 0, z + 0.03]} points={rect(0.4, v + 0.6, 0.8, 0.14)} fill={INK.text} />
          </g>
        ))}
      </IsoBox>
      <Lathe axis="x" cx={x - 0.2} cy={roll} z={z + 1} profile={[[1, 0], [1, w + 0.4]]} tone="raised" hue={1}>
        <Mark plane="right" at={[x + w + 0.2, roll, z + 1]} points={circle(0, 0, 0.66, 32)} stroke={INK.line} closed />
        <Mark plane="right" at={[x + w + 0.2, roll, z + 1]} points={circle(0, 0, 0.34, 24)} fill={INK.well} stroke={INK.line} />
      </Lathe>
      <Prism plane="top" at={[0, 0, torn.z]} points={ticket(x, torn.v, w, torn.l)} depth={0.05} tone="accent" float={bob(props, 0.14)} lift={1}>
        <Mark plane="top" at={[x, 0, torn.z + 0.05]} points={[[0.12, torn.v + 0.88], [w - 0.12, torn.v + 0.88]]} stroke={INK.onAccent} opacity={0.5} dashed />
        <Mark plane="top" at={[x, 0, torn.z + 0.05]} points={rect(0.4, torn.v + 0.25, 1.3, 0.15)} fill={INK.onAccent} opacity={0.7} />
        <Mark plane="top" at={[x, 0, torn.z + 0.05]} points={rect(0.4, torn.v + 0.52, 0.8, 0.15)} fill={INK.onAccent} opacity={0.5} />
      </Prism>
    </IllustrationStage>
  )
}

/** A stage behind its arch, its curtain in the accent just off the boards, a spotlight on the microphone waiting behind it. Hovered, the curtain goes up. */
export function IllustrationShowStage(props: IllustrationProps) {
  const [x0, x1, floor] = [1.3, 6.7, 1.05]
  const [open0, open1, arch] = [1.75, 6.25, 3.4]
  const [cy, mic] = [2.3, [4, 1.6] as const]
  const pleats = Array.from({ length: 7 }, (_, i) => open0 + ((open1 - open0) * (i + 1)) / 8)
  const hem: PlanePoint[] = Array.from({ length: 33 }, (_, i) => [open0 + ((open1 - open0) * i) / 32, floor + 0.5 - 0.1 * Math.abs(Math.sin((i / 32) * Math.PI * 8))])
  return (
    <IllustrationStage id="stage" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={x0} y={0.9} z={0.55} w={x1 - x0} d={3.6} h={floor - 0.55} tone="raised">
        <Mark plane="top" at={[mic[0], mic[1], floor]} points={circle(0, 0, 0.85, 32)} fill={INK.accent} opacity={0.22} />
        <Mark plane="left" at={[x0, 4.5, 0.55]} points={rect(0.3, 0.18, x1 - x0 - 0.6, 0.14)} fill={INK.faint} />
      </IsoBox>
      <IsoBox x={open0} y={0.9} z={floor} w={open1 - open0} d={0.15} h={arch - floor} tone="sunken" />
      <IsoCylinder x={mic[0] - 0.3} y={mic[1] - 0.3} z={floor} r={0.3} h={0.06} tone="neutral" />
      <IsoCylinder x={mic[0] - 0.05} y={mic[1] - 0.05} z={floor + 0.06} r={0.05} h={0.95} tone="neutral" />
      <Lathe cx={mic[0]} cy={mic[1]} z={floor + 0.98} profile={[[0.08, 0], [0.16, 0.08], [0.17, 0.2], [0.13, 0.32], [0, 0.36]]} convex tone="raised" />
      {/* It rises no higher than the arch's top can hide, back edge and all. */}
      <Prism plane="left" at={[0, cy + 0.05, 0]} points={[...hem, [open1, arch + 0.05], [open0, arch + 0.05]]} depth={0.15} tone="accent" float={bob(props, 0.08)} lift={0.9}>
        {pleats.map((u) => (
          <Mark key={u} plane="left" at={[0, cy + 0.2, 0]} points={[[u, floor + 0.48], [u, arch]]} stroke="var(--kg-edge)" opacity={0.7} />
        ))}
      </Prism>
      {[x0, open1].map((px) => (
        <IsoBox key={px} x={px} y={cy + 0.2} z={floor} w={open0 - x0} d={0.4} h={arch - floor} tone="raised" hue={2} />
      ))}
      <IsoBox x={x0} y={cy + 0.2} z={arch} w={x1 - x0} d={0.4} h={1.2} tone="raised" hue={2}>
        <Mark plane="left" at={[x0, cy + 0.6, arch]} points={rect(1.6, 0.45, x1 - x0 - 3.2, 0.3)} fill={INK.text} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** A round cake, bottom up, and the quarter cut from it: from its center out round the arc and back. */
const CAKE = (r: number, from: number, to: number): PlanePoint[] => [[4, 4], ...arc(4, 4, r, from, to, 24)]

/** A cake on its stand, candles lit, a quarter cut showing its layers and the slice in the accent lifting out. Hovered, it's served. */
export function IllustrationCake(props: IllustrationProps) {
  const [plate, h, r] = [1.47, 1.15, 1.6]
  const top = plate + h
  const candles = [[3.2, 3.35], [4.35, 2.85], [2.85, 4.35]] as const
  return (
    <IllustrationStage id="cake" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={3.1} y={3.1} z={0.55} r={0.9} h={0.12} tone="neutral" />
      <IsoCylinder x={3.75} y={3.75} z={0.67} r={0.25} h={plate - 0.77} tone="neutral" />
      <IsoCylinder x={1.9} y={1.9} z={plate - 0.1} r={2.1} h={0.1} tone="neutral" />
      <Prism plane="top" at={[0, 0, plate]} points={CAKE(r, Math.PI / 2, 2 * Math.PI)} depth={h} tone="raised" hue={2}>
        {(['left', 'right'] as const).map((plane) =>
          [0.36, 0.76].map((v) => <Mark key={`${plane}${v}`} plane={plane} at={[4, 4, plate]} points={rect(0.05, v, r - 0.1, 0.12)} fill={INK.text} />),
        )}
        <Mark plane="top" at={[0, 0, top]} points={arc(4, 4, r - 0.2, Math.PI / 2 + 0.12, 2 * Math.PI - 0.12, 24)} stroke={INK.line} dashed />
      </Prism>
      {candles.map(([cx, cy]) => (
        <IsoCylinder key={cx} x={cx - 0.08} y={cy - 0.08} z={top} r={0.08} h={0.55} tone="neutral" hue={1}>
          <Lathe cx={cx} cy={cy} z={top + 0.62} profile={[[0.03, 0], [0.1, 0.08], [0.11, 0.16], [0.07, 0.27], [0, 0.36]]} convex tone="raised" />
        </IsoCylinder>
      ))}
      <Prism plane="top" at={[0, 0, top + 0.35]} points={CAKE(r, 0, Math.PI / 2)} depth={h} tone="accent" float={bob(props, 0.14)} lift={0.9} />
    </IllustrationStage>
  )
}
