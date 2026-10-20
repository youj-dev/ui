'use client'

import { IsoBox, IsoCylinder, IsoPlatform, IsoScene, useIsoPoint } from '@youj/illustrations'
import type { Cell, DriftHistogramHit } from './stats'

/* The plate seen from an angle, one grid cell per 0.01 mm: each hit counted
 * stands as a column, older ones gray, recent ones in the accent, the ones
 * outside the tolerance circle (the dashed ring) in warning, stacked when a
 * cell holds more than one kind. An arrow runs from where the older hits
 * centered to where the recent ones do. Decorative: the figures and the
 * legend beside it say what it shows. */

const UNIT = 0.5
const PLATE = 7
const CENTER = PLATE / 2
const TOP = 0.35 + 0.15
const MAX_HEIGHT = 3.2
const MM = UNIT / 0.01

const gridOf = (mm: number) => CENTER + mm * MM

const TEXT = {
  paintOrder: 'stroke',
  stroke: 'var(--color-surface)',
  strokeWidth: 'calc(4px * var(--kg-px, 1))',
  strokeLinejoin: 'round',
  fontFamily: 'var(--font-sans)',
  fontSize: 'calc(11.5px * var(--kg-px, 1))',
  fill: 'var(--color-fg-muted)',
} as const

function Arrow({ from, to }: { from: DriftHistogramHit; to: DriftHistogramHit }) {
  const [x0, y0] = useIsoPoint(gridOf(from.x), gridOf(from.y), TOP + 0.02)
  const [x1, y1] = useIsoPoint(gridOf(to.x), gridOf(to.y), TOP + 0.02)
  const angle = Math.atan2(y1 - y0, x1 - x0)
  const head = 8
  const wing = (turn: number) => `${x1 - head * Math.cos(angle + turn)},${y1 - head * Math.sin(angle + turn)}`
  return (
    <g aria-hidden>
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-fg)" strokeWidth={1.75} strokeLinecap="round" />
      <polygon points={`${x1},${y1} ${wing(0.45)} ${wing(-0.45)}`} fill="var(--color-fg)" />
    </g>
  )
}

function Label({ x, y, text }: { x: number; y: number; text: string }) {
  const [px, py] = useIsoPoint(x, y, TOP)
  return (
    <text x={px} y={py} textAnchor="middle" style={TEXT} aria-hidden>
      {text}
    </text>
  )
}

interface PlateProps {
  cells: Cell[]
  older: DriftHistogramHit
  recent: DriftHistogramHit
  /** The tolerance circle's diameter, mm. */
  tolerance: number
  label: string
  toleranceText: string
}

export function Plate({ cells, older, recent, tolerance, label, toleranceText }: PlateProps) {
  const peak = Math.max(1, ...cells.map((c) => c.older + c.recent + c.out))
  const height = (count: number) => (count / peak) * MAX_HEIGHT
  const radius = (tolerance / 2) * MM
  return (
    <IsoScene title={label} unit={26} pad={[26, 26, 8, 26]} grow>
      <IsoPlatform x={0} y={0} w={PLATE} d={PLATE} h={0.35} lip={0.15} inset={0.2} shape="round" />
      <IsoCylinder x={CENTER - radius} y={CENTER - radius} z={TOP} r={radius} h={0} variant="ghost" tone="neutral" />
      {cells.flatMap((cell) => {
        const x = cell.i * UNIT
        const y = cell.j * UNIT
        const layers: { key: string; count: number; color: string }[] = [
          { key: 'older', count: cell.older, color: 'var(--color-fg-subtle)' },
          { key: 'recent', count: cell.recent, color: 'var(--color-accent)' },
          { key: 'out', count: cell.out, color: 'var(--color-warning)' },
        ]
        let z = TOP
        return layers
          .filter((layer) => layer.count > 0)
          .map((layer) => {
            const box = <IsoBox key={`${cell.i}-${cell.j}-${layer.key}`} x={x + 0.04} y={y + 0.04} z={z} w={UNIT - 0.08} d={UNIT - 0.08} h={height(layer.count)} color={layer.color} />
            z += height(layer.count)
            return box
          })
      })}
      <Arrow from={older} to={recent} />
      <Label x={CENTER} y={CENTER - radius - 0.5} text={toleranceText} />
    </IsoScene>
  )
}
