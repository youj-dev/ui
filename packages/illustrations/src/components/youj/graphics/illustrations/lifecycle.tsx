'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { bob, circle, flat, Group, Hollow, IllustrationStage, INK, Lathe, Link, Mark, rect, type IllustrationProps } from './kit'

/* The product's moments: shipping it, keeping it safe, working on it
 * together, getting it done, and the two states nobody plans for, a page
 * that isn't there and a box with nothing in it yet. */

/** The rocket's nose cone, bottom up: its radius at each height. */
const NOSE = [
  [0.72, 0],
  [0.68, 0.18],
  [0.58, 0.42],
  [0.44, 0.66],
  [0.28, 0.86],
  [0.12, 1],
  [0.03, 1.04],
] as const

/** A rocket hovering over its pad on a flame, its band in the accent. Hovered, it lifts off. */
export function IllustrationDeploy(props: IllustrationProps) {
  const zb = 1.2
  const r = 0.72
  const [c0, c1] = [4 - r, 4 + r]
  const fin = { h: 1, tone: 'raised' as const, hue: 1 as const }
  return (
    <IllustrationStage id="deploy" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 2.25, 48)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 1.25, 40)} fill={INK.accent} opacity={0.2} />
      </IsoPlatform>
      <Group float={bob(props, 0.2)} lift={1.6}>
        <IsoCylinder x={3.64} y={3.64} z={zb - 0.5} r={0.36} h={0.5} tone="accent" />
        <IsoBox x={c0 - 0.75} y={3.92} z={zb} w={0.75} d={0.16} {...fin} />
        <IsoBox x={3.92} y={c0 - 0.75} z={zb} w={0.16} d={0.75} {...fin} />
        <IsoCylinder x={c0} y={c0} z={zb} r={r} h={1.05} tone="raised" />
        <IsoCylinder x={c0} y={c0} z={zb + 1.05} r={r} h={0.34} tone="accent" />
        <IsoCylinder x={c0} y={c0} z={zb + 1.39} r={r} h={0.85} tone="raised" />
        <Lathe cx={4} cy={4} z={zb + 2.24} profile={NOSE} tone="raised" hue={1} />
        <IsoBox x={c1} y={3.92} z={zb} w={0.75} d={0.16} {...fin} />
        <IsoBox x={3.92} y={c1} z={zb} w={0.16} d={0.75} {...fin} />
      </Group>
    </IllustrationStage>
  )
}

/** A vault with its round door and dial, and over it a seal in the accent. */
export function IllustrationSecurity(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.6, 1.9, 0.55, 4.6, 3.4, 3]
  const face = [x, y + d, z] as const
  const [cu, cv] = [2.3, 1.45]
  const spokes = [0, 1, 2].map((i) => (i / 3) * Math.PI * 2 + Math.PI / 2)
  return (
    <IllustrationStage id="security" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} hue={1}>
        <Mark plane="left" at={face} points={circle(cu, cv, 1.2)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={face} points={circle(cu, cv, 0.9)} stroke={INK.line} closed />
        {spokes.map((a) => (
          <Mark key={a} plane="left" at={face} points={[[cu, cv], [cu + Math.cos(a) * 0.72, cv + Math.sin(a) * 0.72]]} stroke={INK.line} weight={2} />
        ))}
        <Mark plane="left" at={face} points={circle(cu, cv, 0.24)} fill={INK.line} />
        {[0.55, 2.1].map((v) => (
          <Mark key={v} plane="left" at={face} points={rect(0.7, v, 0.2, 0.36)} fill={INK.line} />
        ))}
        <Mark plane="right" at={[x + w, y, z]} points={rect(0.4, 0.4, d - 0.8, 0.16)} fill={INK.faint} />
      </IsoBox>
      <IsoCylinder x={2.95} y={2.65} z={4.25} r={0.95} h={0.18} tone="accent" float={bob(props, 0.16)} lift={0.8}>
        <Mark plane="top" at={[3.9, 3.6, 4.43]} points={circle(0, -0.12, 0.2)} fill={INK.onAccent} />
        <Mark plane="top" at={[3.9, 3.6, 4.43]} points={[[-0.07, -0.05], [0.07, -0.05], [0.12, 0.4], [-0.12, 0.4]]} fill={INK.onAccent} />
      </IsoCylinder>
    </IllustrationStage>
  )
}

/** One figure: a body and a head that bob as one. */
function figure(key: string, cx: number, cy: number, lit: boolean, height: number | boolean) {
  return (
    <Group key={key} float={height} lift={lit ? 0.6 : 0}>
      <IsoCylinder x={cx - 0.42} y={cy - 0.42} z={0.55} r={0.42} h={0.78} tone={lit ? 'accent' : 'raised'} hue={1} />
      <IsoCylinder x={cx - 0.3} y={cy - 0.3} z={1.45} r={0.3} h={0.36} tone={lit ? 'accent' : 'raised'} hue={1} />
    </Group>
  )
}

/** Four people round a table, one in the accent, and the work they share on it. */
export function IllustrationTeam(props: IllustrationProps) {
  const seats = [
    [2.35, 2.35],
    [5.65, 2.35],
    [2.35, 5.65],
    [5.65, 5.65],
  ] as const
  return (
    <IllustrationStage id="team" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={2.9} y={2.9} z={0.55} r={1.1} h={0.55} tone="raised">
        <IsoBox x={3.5} y={3.6} z={1.1} w={1} d={0.8} h={0.05} tone="accent" />
      </IsoCylinder>
      {seats.map(([cx, cy], i) => figure(`${cx}-${cy}`, cx, cy, i === 3, bob(props, 0.08 + (i % 2) * 0.04)))}
    </IllustrationStage>
  )
}

/** A coin in the accent with a check on its face, hovering over a plinth, with a few bits of confetti round it. */
export function IllustrationSuccess(props: IllustrationProps) {
  const confetti = [
    [1.3, 2.4, 2.6, 0.42],
    [5.6, 1.1, 3.1, 0.34],
    [6.3, 5.2, 1.9, 0.44],
    [1.9, 6, 1.4, 0.3],
    [4.4, 0.8, 1.2, 0.26],
  ] as const
  return (
    <IllustrationStage id="success" {...props}>
      <IsoPlatform x={1.2} y={1.2} w={5.6} d={5.6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 1.6, 40)} fill={INK.accent} opacity={0.14} />
      </IsoPlatform>
      <IsoCylinder x={2.2} y={2.2} z={1.5} r={1.8} h={0.42} tone="accent" float={bob(props)} lift={0.9}>
        <Mark plane="top" at={[4, 4, 1.92]} points={[flat(-0.95, -0.05), flat(-0.3, 0.5), flat(1, -0.62)]} stroke={INK.onAccent} weight={3.5} />
      </IsoCylinder>
      {confetti.map(([x, y, z, s], i) => (
        <IsoBox key={i} x={x} y={y} z={z} w={s} d={s} h={s} tone={i % 2 ? 'neutral' : 'raised'} hue={i % 2 ? 2 : 1} float={bob(props, 0.1 + i * 0.03)} lift={0.4 + i * 0.1} />
      ))}
    </IllustrationStage>
  )
}

const TILE = 1.5
const STEP = 1.72
const MISSING = [1, 2] as const

/** A floor of tiles with one gone, its outline dashed, and the missing tile hovering over the gap in the accent. */
export function IllustrationNotFound(props: IllustrationProps) {
  const z = 0.55
  const cells = [0, 1, 2, 3].flatMap((c) => [0, 1, 2, 3].map((r) => [c, r] as const)).filter(([c, r]) => !(c === MISSING[0] && r === MISSING[1]))
  const at = (i: number) => 0.62 + i * STEP
  const [mx, my] = [at(MISSING[0]), at(MISSING[1])]
  return (
    <IllustrationStage id="not-found" {...props}>
      <IsoPlatform x={0.3} y={0.3} w={7.4} d={7.4} h={0.4} lip={0.15} inset={0.12} />
      {cells.map(([c, r]) => (
        <IsoBox key={`${c}-${r}`} x={at(c)} y={at(r)} z={z} w={TILE} d={TILE} h={0.16} tone="raised" hue={1} />
      ))}
      <IsoBox x={mx} y={my} z={z} w={TILE} d={TILE} h={0} variant="ghost" tone="accent" />
      <Link points={[[mx + TILE / 2, my + TILE / 2, z], [mx + TILE / 2, my + TILE / 2, 2.3]]} lit dashed />
      <IsoBox x={mx} y={my} z={2.4} w={TILE} d={TILE} h={0.16} tone="accent" float={bob(props)} lift={0.8} />
    </IllustrationStage>
  )
}

/** An open box with its flaps folded out and nothing inside, and a dashed ghost of the first thing hovering over it. */
export function IllustrationEmpty(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.3, 2.3, 0.55, 3.4, 3.4, 1.7]
  const top = z + h
  const rim = 0.14
  return (
    <IllustrationStage id="empty" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoBox x={x - 1.3} y={y} z={top} w={1.3} d={d} h={0.04} tone="raised" hue={1} />
      <IsoBox x={x} y={y - 1.3} z={top} w={w} d={1.3} h={0.04} tone="raised" hue={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} hue={1}>
        <Hollow x={x + rim} y={y + rim} top={top} w={w - rim * 2} d={d - rim * 2} depth={h - 0.2} />
      </IsoBox>
      <IsoBox x={x + w} y={y} z={top} w={1.1} d={d} h={0.04} tone="raised" hue={1} />
      <IsoBox x={x} y={y + d} z={top} w={w} d={1.1} h={0.04} tone="raised" hue={1} />
      <IsoBox x={3.35} y={3.35} z={3.1} w={1.3} d={1.3} h={1.3} variant="ghost" tone="accent" float={bob(props)} lift={0.8} />
    </IllustrationStage>
  )
}
