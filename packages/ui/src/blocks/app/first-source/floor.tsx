'use client'

import { IsoBox, IsoCylinder, IsoPlatform, IsoScene, useIsoPoint } from '@youj/illustrations'
import type { FirstSourceKind } from './data'

/* The warehouse floor, empty: a gridded plinth with six bays marked out
 * where tables will stand, and over the front bay, hanging on a dashed drop
 * line, the first thing waiting to land. Its shape is the chosen source's: a
 * cylinder for a database, three thin slabs for an event stream (packets,
 * bobbing out of step), a crate for files. Switching sources drops the new
 * one in on the settle spring; under reduced motion it simply changes, and
 * nothing bobs. A picture: the scene is aria-hidden, the choice below says it
 * in words. */

const FLOOR = { w: 9, d: 7, top: 0.7 }
/** The other five bays of six (three by two, 2 × 2 units each); the landing bay is drawn in the accent. */
const BAYS = [
  [0.9, 1],
  [3.5, 1],
  [6.1, 1],
  [0.9, 3.7],
  [6.1, 3.7],
] as const
/** The front bay, where the first table lands. */
const LANDING = { x: 3.5, y: 3.7 }
/** How high the waiting object hangs over the floor, grid units. */
const HANG = 1.5

function DropLine() {
  const cx = LANDING.x + 1
  const cy = LANDING.y + 1
  const [x1, y1] = useIsoPoint(cx, cy, FLOOR.top)
  const [, y2] = useIsoPoint(cx, cy, FLOOR.top + HANG - 0.15)
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x1}
      y2={y2}
      style={{
        vectorEffect: 'non-scaling-stroke',
        strokeWidth: 1,
        stroke: 'color-mix(in oklab, var(--color-accent) 70%, transparent)',
        strokeDasharray: 'calc(2px * var(--kg-px, 1)) calc(3px * var(--kg-px, 1))',
      }}
    />
  )
}

/** What's waiting to land, in the chosen source's shape. */
function waiting(kind: FirstSourceKind) {
  const z = FLOOR.top + HANG
  if (kind === 'database') return [<IsoCylinder key="database" x={LANDING.x + 0.25} y={LANDING.y + 0.25} z={z} r={0.75} h={1.15} tone="accent" float />]
  if (kind === 'stream')
    return [0, 1, 2].map((i) => <IsoBox key={`stream-${i}`} x={LANDING.x + 0.25} y={LANDING.y + 0.25} z={z + i * 0.36} w={1.5} d={1.5} h={0.16} tone="accent" float={0.08} />)
  return [
    <IsoBox key="files" x={LANDING.x + 0.3} y={LANDING.y + 0.3} z={z} w={1.4} d={1.4} h={0.95} tone="accent" float>
      {/* A label on the crate's lid. */}
      <IsoBox x={LANDING.x + 0.6} y={LANDING.y + 0.7} z={z + 0.95} w={0.8} d={0.35} h={0} tone="raised" />
    </IsoBox>,
  ]
}

export function FirstSourceFloor({ source, kind }: { source: string; kind: FirstSourceKind }) {
  return (
    <div data-slot="first-source-floor" data-source={source} className="relative px-4 py-5 sm:py-7">
      <IsoScene assemble unit={28} pad={20}>
        <IsoPlatform x={0} y={0} w={FLOOR.w} d={FLOOR.d} h={0.5} grid={1}>
          {BAYS.map(([x, y]) => (
            <IsoBox key={`${x}-${y}`} x={x} y={y} z={FLOOR.top} w={2} d={2} h={0} variant="ghost" />
          ))}
          {/* The landing bay: its outline in the accent, and a faint pool of it where the shape will stand. */}
          <IsoBox x={LANDING.x + 0.3} y={LANDING.y + 0.3} z={FLOOR.top} w={1.4} d={1.4} h={0} tone="accent" style={{ opacity: 0.16 }} />
          <IsoBox x={LANDING.x} y={LANDING.y} z={FLOOR.top} w={2} d={2} h={0} variant="ghost" tone="accent" />
        </IsoPlatform>
        <DropLine />
        {waiting(kind)}
      </IsoScene>
    </div>
  )
}
