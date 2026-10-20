'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { IsoStack } from '../iso-stack'
import { bob, circle, flat, IllustrationStage, INK, Mark, rect, type IllustrationProps } from './kit'

/* Data: where it lives and how it moves. A database as three disks, a
 * warehouse whose last table is landing, a pipeline carrying packets
 * between stages, a cabinet with a drawer out, and backups as snapshots
 * stepping back in time. */

/** Three disks on a turntable and, hovering over them, the next one in the accent, about to be written. */
export function IllustrationDatabase(props: IllustrationProps) {
  return (
    <IllustrationStage id="database" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.45} shape="round" />
      <IsoStack
        x={2.5}
        y={2.5}
        z={0.55}
        w={3}
        d={3}
        shape="disk"
        gap={0.45}
        layers={[
          { id: 'a', h: 0.62, hue: 1 },
          { id: 'b', h: 0.62, hue: 1 },
          { id: 'c', h: 0.62, hue: 1 },
        ]}
      />
      <IsoCylinder x={2.5} y={2.5} z={3.35} r={1.5} h={0.62} tone="accent" float={bob(props, 0.16)} lift={1.1} />
    </IllustrationStage>
  )
}

const TABLES = [
  [1, 1, 0.7],
  [3.1, 1, 1.3],
  [5.2, 1, 0.9],
  [1, 3.1, 1.5],
  [3.1, 3.1, 1],
  [5.2, 3.1, 1.2],
  [1, 5.2, 0.8],
  [5.2, 5.2, 0.55],
] as const

/** A floor of tables at their own heights, and over the one bay left, the last table landing. */
export function IllustrationWarehouse(props: IllustrationProps) {
  return (
    <IllustrationStage id="warehouse" {...props}>
      <IsoPlatform x={0.4} y={0.4} w={7.2} d={7.2} h={0.4} lip={0.15} inset={0.3} />
      {TABLES.map(([x, y, h]) => (
        <IsoBox key={`${x}-${y}`} x={x} y={y} z={0.55} w={1.8} d={1.8} h={h} hue={1}>
          <IsoBox x={x + 0.3} y={y + 0.3} z={0.55 + h} w={1.2} d={0.3} h={0} tone="sunken" />
        </IsoBox>
      ))}
      <IsoBox x={3.1} y={5.2} z={0.55} w={1.8} d={1.8} h={0} variant="ghost" tone="accent" />
      <IsoBox x={3.1} y={5.2} z={2.1} w={1.8} d={1.8} h={0.9} tone="accent" float={bob(props)} lift={0.8} />
    </IllustrationStage>
  )
}

/** Packets riding a track through three stages: a source, a transform in the accent, and the store they end in. */
export function IllustrationPipeline(props: IllustrationProps) {
  const packets = [2.15, 2.7, 4.95, 5.5]
  return (
    <IllustrationStage id="pipeline" {...props}>
      <IsoPlatform x={0} y={2.4} w={8} d={3.2} h={0.4} lip={0.15} inset={0.3} />
      <IsoCylinder x={0.35} y={3.2} z={0.55} r={0.8} h={1.3} hue={1} />
      <IsoBox x={2} y={3.75} z={0.55} w={1.2} d={0.5} h={0.1} tone="sunken" />
      <IsoBox x={3.2} y={3.2} z={0.55} w={1.6} d={1.6} h={1.05} tone="accent">
        <Mark plane="top" at={[3.2, 3.2, 1.6]} points={circle(0.8, 0.8, 0.42)} stroke={INK.onAccent} />
      </IsoBox>
      <IsoBox x={4.8} y={3.75} z={0.55} w={1.2} d={0.5} h={0.1} tone="sunken" />
      <IsoBox x={6} y={3.1} z={0.55} w={1.7} d={1.8} h={1.6} hue={2} />
      {packets.map((x, i) => (
        <IsoBox key={x} x={x} y={3.8} z={0.65} w={0.4} d={0.4} h={0.4} tone="raised" hue={x < 3.2 ? 1 : 2} float={bob(props, 0.06 + (i % 2) * 0.04)} />
      ))}
    </IllustrationStage>
  )
}

/** A cabinet of drawers with one pulled out in the accent, and a file hovering over it, about to go in. */
export function IllustrationStorage(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.1, 1.6, 0.55, 5, 2.4, 2.7]
  const drawers = [0, 1].flatMap((col) => [0, 1, 2].map((row) => [col, row] as const)).filter(([c, r]) => !(c === 0 && r === 1))
  return (
    <IllustrationStage id="storage" {...props}>
      <IsoPlatform x={0.4} y={0.9} w={7.2} d={6.4} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} hue={1}>
        {drawers.map(([c, r]) => (
          <Mark key={`${c}-${r}`} plane="left" at={[x, y + d, z]} points={rect(0.2 + c * 2.4, 0.2 + r * 0.85, 2.2, 0.7)} fill={INK.faint} stroke={INK.line} />
        ))}
        {drawers.map(([c, r]) => (
          <Mark key={`h-${c}-${r}`} plane="left" at={[x, y + d, z]} points={rect(0.95 + c * 2.4, 0.5 + r * 0.85, 0.7, 0.1)} fill={INK.line} />
        ))}
      </IsoBox>
      <IsoBox x={x + 0.2} y={y + d} z={z + 1.05} w={2.2} d={1.3} h={0.7} tone="accent">
        <Mark plane="top" at={[x + 0.2, y + d, z + 1.75]} points={rect(0.15, 0.15, 1.9, 1)} fill={INK.well} />
      </IsoBox>
      <IsoBox x={x + 0.35} y={y + d + 0.2} z={z + 2.35} w={1.9} d={0.95} h={0.05} tone="raised" float={bob(props, 0.16)} lift={0.7}>
        <Mark plane="top" at={[x + 0.35, y + d + 0.2, z + 2.4]} points={rect(0.25, 0.22, 1.1, 0.13)} fill={INK.text} />
        <Mark plane="top" at={[x + 0.35, y + d + 0.2, z + 2.4]} points={rect(0.25, 0.52, 0.7, 0.13)} fill={INK.text} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** Snapshots stepping back in time, each a little further off and fainter, the newest in the accent with a clock on its face. */
export function IllustrationBackups(props: IllustrationProps) {
  const snaps = [
    { at: 0, tone: 'accent', variant: 'solid' },
    { at: 1, tone: 'neutral', variant: 'solid' },
    { at: 2, tone: 'neutral', variant: 'wire' },
    { at: 3, tone: 'neutral', variant: 'ghost' },
  ] as const
  return (
    <IllustrationStage id="backups" {...props}>
      <IsoPlatform x={2.9} y={2.9} w={4.6} d={4.6} h={0.4} lip={0.15} inset={0.3} />
      {snaps.map(({ at, tone, variant }) => {
        const [x, y, z] = [3.7 - at * 1.12, 3.7 - at * 1.12, 0.55 + at * 0.5]
        return (
          <IsoBox key={at} x={x} y={y} z={z} w={3.2} d={3.2} h={0.36} tone={tone} hue={1} variant={variant} float={at ? bob(props, 0.1) : false} lift={at * 0.35}>
              {at === 0 && (
                <>
                  <Mark plane="top" at={[x + 1.6, y + 1.6, z + 0.36]} points={circle(0, 0, 0.95)} stroke={INK.onAccent} weight={1.5} />
                  <Mark plane="top" at={[x + 1.6, y + 1.6, z + 0.36]} points={[flat(0, -0.42), flat(0, 0), flat(0.36, 0.1)]} stroke={INK.onAccent} weight={2} />
                </>
              )}
          </IsoBox>
        )
      })}
    </IllustrationStage>
  )
}
