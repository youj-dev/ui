'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { band, bob, circle, flat, Group, IllustrationStage, INK, Lathe, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Work: getting things done. A checklist with its next tick landing, a
 * briefcase ready to go, and a trophy on its podium. */

/** A tick, drawn upright on a top face, centered on its box. */
const tick = (s: number): PlanePoint[] => [flat(-0.5 * s, 0), flat(-0.15 * s, 0.32 * s), flat(0.55 * s, -0.38 * s)]

/** A clipboard with its list, two items ticked, the third's tick landing in the accent, and a pencil beside it. */
export function IllustrationChecklist(props: IllustrationProps) {
  const paper = { x: 1.8, y: 1.9, z: 0.67, w: 3.8, d: 4.7 }
  const sheet = [paper.x, paper.y, paper.z + 0.04] as const
  const rows = [0, 1, 2, 3].map((i) => 0.55 + i * 1.05)
  const box = 0.55
  const next = rows[2]!
  const [bx, by] = [paper.x + 0.35 + box / 2, paper.y + next + box / 2]
  return (
    <IllustrationStage id="checklist" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={1.5} y={1.3} z={0.55} w={4.4} d={5.6} h={0.12} tone="neutral" hue={1}>
        <IsoBox {...paper} h={0.04} tone="raised">
          {rows.map((v, i) => (
            <g key={v}>
              <Mark plane="top" at={sheet} points={rect(0.35, v, box, box)} fill={INK.faint} stroke={INK.line} dashed={i === 2} closed />
              <Mark plane="top" at={sheet} points={rect(1.2, v + 0.18, [2.2, 1.7, 2.0, 1.3][i]!, 0.2)} fill={INK.text} />
              {i < 2 && <Mark plane="top" at={[paper.x + 0.35 + box / 2, paper.y + v + box / 2, sheet[2]]} points={tick(0.62)} stroke={INK.line} weight={2} />}
            </g>
          ))}
        </IsoBox>
        <IsoBox x={2.9} y={1.1} z={0.67} w={1.6} d={0.7} h={0.22} tone="neutral">
          <IsoCylinder x={3.52} y={1.27} z={0.89} r={0.18} h={0.1} tone="raised" />
        </IsoBox>
      </IsoBox>
      <IsoCylinder x={bx - 0.5} y={by - 0.5} z={1.45} r={0.5} h={0.14} tone="accent" float={bob(props, 0.16)} lift={0.8}>
        <Mark plane="top" at={[bx, by, 1.59]} points={tick(0.58)} stroke={INK.onAccent} weight={2.5} />
      </IsoCylinder>
      <Lathe axis="y" cx={6.5} cy={1.9} z={0.71} profile={[[0.16, 0], [0.16, 0.3]]} tone="neutral" />
      <Lathe axis="y" cx={6.5} cy={2.2} z={0.71} profile={[[0.16, 0], [0.16, 2.9]]} tone="raised" hue={2} />
      <Lathe axis="y" cx={6.5} cy={5.1} z={0.71} profile={[[0.16, 0], [0.04, 0.5]]} tone="sunken" />
    </IllustrationStage>
  )
}

/** A briefcase in the accent hovering over its shadow, handle up, latches shut. */
export function IllustrationBriefcase(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.7, 3, 1, 4.6, 1.8, 2.6]
  const top = z + h
  const seam = h - 0.62
  const face = [x, y + d, z] as const
  return (
    <IllustrationStage id="briefcase" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Mark plane="top" at={[x, y, 0.56]} points={rect(0.1, 0.1, w - 0.2, d - 0.2)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.16)} lift={0.8}>
        <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="accent">
          <Mark plane="left" at={face} points={[[0, seam], [w, seam]]} stroke={INK.onAccent} opacity={0.45} />
          <Mark plane="right" at={[x + w, y, z]} points={[[0, seam], [d, seam]]} stroke={INK.onAccent} opacity={0.45} />
          {[0.75, w - 1.05].map((u) => (
            <Mark key={u} plane="left" at={face} points={rect(u, seam - 0.22, 0.3, 0.42)} fill={INK.onAccent} opacity={0.75} />
          ))}
          <Mark plane="left" at={face} points={rect(0.18, 0.18, w - 0.36, seam - 0.36)} stroke={INK.onAccent} opacity={0.3} dashed closed />
        </IsoBox>
        <Prism
          plane="left"
          at={[x + w / 2 - 0.85, y + d / 2 - 0.15, top]}
          points={[[0, 0], [0.26, 0], [0.26, 0.36], [1.44, 0.36], [1.44, 0], [1.7, 0], [1.7, 0.62], [0, 0.62]]}
          depth={0.3}
          tone="raised" hue={1}
        />
      </Group>
    </IllustrationStage>
  )
}

/** The trophy's cup, bottom up: from its stem out to the rim. */
const CUP = [
  [0.32, 0],
  [0.8, 0.28],
  [1.1, 0.68],
  [1.26, 1.12],
  [1.3, 1.5],
] as const

/** A trophy in the accent over its podium, the name plate on the front. */
export function IllustrationTrophy(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.8, 2.8, 0.55, 2.4, 2.4, 0.95]
  const [cx, cy] = [x + w / 2, y + d / 2]
  const foot = z + h + 0.22
  const bowl = foot + 0.9
  return (
    <IllustrationStage id="trophy" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={[x, y + d, z]} points={rect(0.45, 0.3, w - 0.9, 0.42)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={[x, y + d, z]} points={rect(0.75, 0.46, w - 1.5, 0.1)} fill={INK.text} />
      </IsoBox>
      <Group float={bob(props, 0.18)} lift={0.9}>
        <IsoBox x={cx - 0.62} y={cy - 0.62} z={foot} w={1.24} d={1.24} h={0.36} tone="accent" />
        <IsoCylinder x={cx - 0.2} y={cy - 0.2} z={foot + 0.36} r={0.2} h={bowl - foot - 0.36} tone="accent" />
        <Prism plane="left" at={[0, cy - 0.12, 0]} points={band(cx - 1.12, bowl + 0.95, 0.28, 0.52, Math.PI / 2, (3 * Math.PI) / 2, 12)} depth={0.24} tone="accent" />
        <Lathe cx={cx} cy={cy} z={bowl} profile={CUP} convex tone="accent">
          <Mark plane="top" at={[cx, cy, bowl + 1.5]} points={circle(0, 0, 1.12, 40)} fill={INK.well} />
        </Lathe>
        <Prism plane="left" at={[0, cy - 0.12, 0]} points={band(cx + 1.12, bowl + 0.95, 0.28, 0.52, -Math.PI / 2, Math.PI / 2, 12)} depth={0.24} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}
