'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { bob, circle, Group, IllustrationStage, INK, Link, Mark, rect, type IllustrationProps } from './kit'

/* Infrastructure: the machines and the paths between them. Racks with a
 * blade drawn out, regions under one cloud, a mesh of nodes round a hub, a
 * balancer fanning out to its servers, and an origin with the edge in rings
 * round it. */

/** The units on a rack's front, bottom up, each with its status light. */
function RackFront({ x, y, z, units, lit }: { x: number; y: number; z: number; units: number; lit?: number }) {
  return (
    <>
      {Array.from({ length: units }, (_, i) => (
        <Mark key={i} plane="left" at={[x, y, z]} points={rect(0.2, 0.25 + i * 0.5, 1.8, 0.38)} fill={INK.faint} stroke={INK.line} />
      ))}
      {Array.from({ length: units }, (_, i) => (
        <Mark key={`led-${i}`} plane="left" at={[x, y, z]} points={rect(1.72, 0.39 + i * 0.5, 0.14, 0.1)} fill={i === lit ? INK.accent : INK.success} />
      ))}
    </>
  )
}

/** Two racks on a plinth, one blade drawn out of the taller in the accent. */
export function IllustrationServerRack(props: IllustrationProps) {
  return (
    <IllustrationStage id="server-rack" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={1.4} y={2.2} z={0.55} w={2.2} d={2.2} h={3.2} hue={1}>
        <RackFront x={1.4} y={4.4} z={0.55} units={6} />
      </IsoBox>
      <IsoBox x={4.3} y={2.2} z={0.55} w={2.2} d={2.2} h={2.2} hue={1}>
        <RackFront x={4.3} y={4.4} z={0.55} units={4} lit={2} />
      </IsoBox>
      <IsoBox x={1.6} y={4.4} z={2.3} w={1.8} d={1.1} h={0.38} tone="accent" float={bob(props, 0.05)} lift={0.3} />
    </IllustrationStage>
  )
}

const REGIONS = [
  [0.6, 4.4],
  [4.4, 0.6],
  [4.6, 4.6],
] as const

/** Three regions on their own plinths, one lit, and over them the cloud they share, wired down to each. */
export function IllustrationCloud(props: IllustrationProps) {
  return (
    <IllustrationStage id="cloud" {...props}>
      {REGIONS.map(([x, y]) => (
        <Link key={`l-${x}-${y}`} points={[[x + 1.5, y + 1.5, 1.3], [x + 1.5, y + 1.5, 2.9]]} dashed lit={x === 4.6 && y === 4.6} />
      ))}
      {REGIONS.map(([x, y], i) => (
        <IsoPlatform key={`p-${x}-${y}`} x={x} y={y} w={3} d={3} h={0.3} lip={0.12} inset={0.3} shape="round">
          <IsoBox x={x + 1} y={y + 1} z={0.42} w={1} d={1} h={0.85} tone={i === 2 ? 'accent' : 'raised'} hue={1} />
        </IsoPlatform>
      ))}
      <Group float={bob(props, 0.2)} lift={0.8}>
        <IsoCylinder x={1.6} y={3} z={2.95} r={0.85} h={0.5} tone="raised" />
        <IsoCylinder x={2.55} y={1.95} z={2.95} r={1.25} h={0.85} tone="raised" />
        <IsoCylinder x={4.15} y={2.45} z={2.95} r={0.9} h={0.6} tone="raised" />
        <IsoCylinder x={3} y={3.45} z={2.95} r={0.95} h={0.5} tone="raised" />
      </Group>
    </IllustrationStage>
  )
}

const NODES = [
  [1.3, 1.5],
  [4.1, 0.9],
  [6.5, 1.9],
  [6.6, 4.7],
  [4.2, 6.7],
  [1.4, 5.6],
] as const

/** A hub in the accent and the nodes round it, each wired to the hub and its neighbors along the floor. */
export function IllustrationNetwork(props: IllustrationProps) {
  const top = 0.56
  return (
    <IllustrationStage id="network" {...props}>
      <IsoPlatform x={0.3} y={0.3} w={7.4} d={7.4} h={0.4} lip={0} inset={0}>
        {NODES.map(([x, y]) => (
          <Link key={`hub-${x}-${y}`} points={[[4, 4, top], [x, y, top]]} lit />
        ))}
        {NODES.map(([x, y], i) => {
          const [nx, ny] = NODES[(i + 1) % NODES.length]!
          return <Link key={`ring-${x}-${y}`} points={[[x, y, top], [nx, ny, top]]} dashed />
        })}
      </IsoPlatform>
      {NODES.map(([x, y], i) => (
        <IsoCylinder key={`${x}-${y}`} x={x - 0.45} y={y - 0.45} z={0.4} r={0.45} h={0.45} tone="raised" hue={1} float={bob(props, 0.05 + (i % 3) * 0.03)} />
      ))}
      <IsoBox x={3.3} y={3.3} z={0.4} w={1.4} d={1.4} h={1.2} tone="accent" lift={0.8}>
        <Mark plane="top" at={[3.3, 3.3, 1.6]} points={circle(0.7, 0.7, 0.36)} stroke={INK.onAccent} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** Where the three servers stand, a row across the front, and the square route each takes from the balancer at the back. */
const SERVERS = [
  { at: [0.8, 5.8], route: [[1.5, 2.3], [1.5, 5.8]] },
  { at: [3.3, 3.3], route: [[2, 2.3], [2, 4], [3.3, 4]] },
  { at: [5.8, 0.8], route: [[2.3, 1.5], [5.8, 1.5]] },
] as const

/** A balancer in the accent at the back, its traffic routed square along the floor to a row of three servers, a packet on each route. */
export function IllustrationLoadBalancer(props: IllustrationProps) {
  const top = 0.56
  const packets = [
    [1.32, 4.1],
    [2.55, 3.82],
    [4.1, 1.32],
  ] as const
  return (
    <IllustrationStage id="load-balancer" {...props}>
      <IsoPlatform x={0.3} y={0.3} w={7.4} d={7.4} h={0.4} lip={0.16} inset={0.3} grid={1}>
        {SERVERS.map(({ route }, i) => (
          <Link key={i} points={route.map(([x, y]) => [x, y, top] as const)} lit={i === 1} />
        ))}
      </IsoPlatform>
      <IsoBox x={0.7} y={0.7} z={top} w={1.6} d={1.6} h={1.5} tone="accent" lift={0.7}>
        {[0.4, 0.8, 1.2].map((u) => (
          <Mark key={u} plane="left" at={[0.7, 2.3, top]} points={rect(u - 0.1, 0.6, 0.2, 0.2)} fill={INK.onAccent} opacity={0.8} />
        ))}
      </IsoBox>
      {SERVERS.map(({ at: [x, y] }) => (
        <IsoBox key={`${x}-${y}`} x={x} y={y} z={top} w={1.4} d={1.4} h={1.1} tone="raised" hue={1}>
          <Mark plane="left" at={[x, y + 1.4, top]} points={rect(0.2, 0.3, 1, 0.16)} fill={INK.text} />
          <Mark plane="left" at={[x, y + 1.4, top]} points={rect(0.2, 0.6, 1, 0.16)} fill={INK.text} />
        </IsoBox>
      ))}
      {packets.map(([x, y], i) => (
        <IsoBox key={`p-${i}`} x={x} y={y} z={top + 0.06} w={0.36} d={0.36} h={0.36} tone={i === 1 ? 'accent' : 'raised'} hue={2} float={bob(props, 0.06 + i * 0.02)} />
      ))}
    </IllustrationStage>
  )
}

/** An origin in the accent at the center, and the edge round it: nodes on a ring, a fainter ring further out. */
export function IllustrationEdge(props: IllustrationProps) {
  const top = 0.55
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6
    return [4 + Math.cos(a) * 2.25, 4 + Math.sin(a) * 2.25] as const
  })
  return (
    <IllustrationStage id="edge" {...props}>
      <IsoPlatform x={0.4} y={0.4} w={7.2} d={7.2} h={0.4} lip={0.15} inset={0.35} shape="round">
        <Mark plane="top" at={[0, 0, top]} points={circle(4, 4, 2.25, 48)} stroke={INK.line} closed />
        <Mark plane="top" at={[0, 0, top]} points={circle(4, 4, 3.05, 56)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[0, 0, top]} points={circle(4, 4, 1.25, 40)} fill={INK.faint} />
      </IsoPlatform>
      {nodes.map(([x, y], i) => (
        <IsoBox key={i} x={x - 0.35} y={y - 0.35} z={top} w={0.7} d={0.7} h={0.55} tone="raised" hue={1} float={bob(props, 0.05 + (i % 2) * 0.04)} />
      ))}
      <IsoCylinder x={3.3} y={3.3} z={top} r={0.7} h={2.1} tone="accent" lift={0.8}>
        <IsoCylinder x={3.55} y={3.55} z={top + 2.1} r={0.45} h={0.3} tone="accent" />
      </IsoCylinder>
    </IllustrationStage>
  )
}
