'use client'

import { IsoBox, IsoPiece, IsoPlatform, IsoScene, project, useIsoScene, type IsoBounds, type IsoShape } from '@youj/illustrations'
import { NEAR_LIMIT, shareOf, usedOf, type TieredCapacityRegion, type TieredCapacityTier } from './data'

/* The regions as a block of storage silos on one plinth, three to a row.
 * Each column is its tiers stacked (the archive at the base, the hot tier on
 * top) inside a dashed case the height of what's provisioned, so how full a
 * region is reads as how far its column climbs its case; a case near its
 * ceiling turns warning, past it danger, with the column poking through.
 * The selected region's case is drawn solid with its code pinned above it,
 * and while you're looking (the pointer over the drawing or the region
 * keys, or focus in them) the others dim. A picture: the data is in the
 * detail panel and the table beside it. */

const PER_ROW = 3
/** Distance between cases, the case's side, the column's side and the plinth's margin, in grid units. */
const PITCH = 2.9
const CASE = 1.96
const COLUMN = 1.6
const MARGIN = 0.7
/** The plinth's top: its slab and its lip. */
const FLOOR = 0.6
/** The tallest case (or column), grid units. */
const TALLEST = 6

interface ColumnProps {
  region: TieredCapacityRegion
  /** From the base up. */
  stack: TieredCapacityTier[]
  x: number
  y: number
  /** Grid units per terabyte. */
  scale: number
  selected: boolean
  dimmed: boolean
  onSelect: (id: string) => void
}

const columnBounds = ({ region, x, y, scale }: ColumnProps): IsoBounds => {
  const used = usedOf(region)
  return { x, y, z: FLOOR, w: CASE, d: CASE, h: Math.max(region.provisioned, used) * scale }
}

function ColumnImpl({ region, stack, x, y, scale, selected, dimmed, onSelect }: ColumnProps) {
  const share = shareOf(region)
  const tone = share > 1 ? 'danger' : share >= NEAR_LIMIT ? 'warning' : 'neutral'
  const inset = (CASE - COLUMN) / 2
  // Where each tier's box starts: stacked on the ones under it.
  const bases: number[] = []
  let z = FLOOR
  for (const tier of stack) {
    bases.push(z)
    z += (region.used[tier.id] ?? 0) * scale
  }
  return (
    <IsoPiece>
      <g
        data-region={region.id}
        data-selected={selected || undefined}
        onPointerEnter={() => onSelect(region.id)}
        onClick={() => onSelect(region.id)}
        className="transition-opacity yj-duration-fast ease-standard"
        style={{ opacity: dimmed ? 0.32 : 1 }}
      >
        {stack.map((tier, i) => {
          const h = (region.used[tier.id] ?? 0) * scale
          return h > 0 ? (
            <IsoBox key={tier.id} x={x + inset} y={y + inset} z={bases[i]!} w={COLUMN} d={COLUMN} h={h} color={`var(--color-${tier.tone})`} />
          ) : null
        })}
        <IsoBox
          x={x}
          y={y}
          z={FLOOR}
          w={CASE}
          d={CASE}
          h={region.provisioned * scale}
          variant={selected ? 'wire' : 'ghost'}
          tone={tone}
          hidden={false}
        />
      </g>
    </IsoPiece>
  )
}

// The scene frames and orders it by its box (the taller of its case and its column).
const Column = Object.assign(ColumnImpl, { isoBounds: columnBounds }) as IsoShape<ColumnProps>

/** The selected region's code on a short pin above its case, drawn over everything (it follows the columns). */
function Pin({ region, x, y, scale, label }: { region: TieredCapacityRegion; x: number; y: number; scale: number; label: string }) {
  const { unit } = useIsoScene()
  const top = FLOOR + Math.max(region.provisioned, usedOf(region)) * scale
  const [px, py] = project(x + CASE / 2, y + CASE / 2, top, unit)
  // Lengths in CSS px at any scale: a 12 px stem, scaled from its foot by --kg-px (SVG lines have no CSS geometry).
  const stem = { transform: 'scaleY(var(--kg-px, 1))', transformBox: 'fill-box', transformOrigin: 'bottom' } as const
  return (
    <g data-slot="tiered-capacity-pin" aria-hidden>
      <line
        x1={px}
        x2={px}
        y1={py - 12}
        y2={py}
        style={{ ...stem, stroke: 'var(--color-fg-muted)', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' }}
      />
      <circle
        cx={px}
        cy={py}
        r={2}
        style={{ fill: 'var(--color-fg)', transform: 'scale(var(--kg-px, 1))', transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <text
        x={px}
        y={py}
        textAnchor="middle"
        style={{
          transform: 'translateY(calc(-17px * var(--kg-px, 1)))',
          fontFamily: 'var(--font-mono)',
          fontSize: 'calc(11px * var(--kg-px, 1))',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fill: 'var(--color-fg)',
          paintOrder: 'stroke',
          stroke: 'var(--kg-halo, var(--color-surface))',
          strokeWidth: 'calc(4px * var(--kg-px, 1))',
          strokeLinejoin: 'round',
        }}
      >
        {label}
      </text>
    </g>
  )
}

export interface CapacityChartProps {
  regions: TieredCapacityRegion[]
  /** The key's order, top first. */
  tiers: TieredCapacityTier[]
  selected: string
  /** The pin's text for a region: its code and share. */
  pinLabel: (region: TieredCapacityRegion) => string
  /** Someone is looking at one region: the rest dim. */
  inspecting: boolean
  onSelect: (id: string) => void
  onInspect: (inspecting: boolean) => void
}

export function CapacityChart({ regions, tiers, selected, pinLabel, inspecting, onSelect, onInspect }: CapacityChartProps) {
  const rows = Math.ceil(regions.length / PER_ROW)
  const peak = Math.max(1, ...regions.map((r) => Math.max(r.provisioned, usedOf(r))))
  const stack = [...tiers].reverse()
  const scale = TALLEST / peak
  const width = MARGIN * 2 + (Math.min(PER_ROW, regions.length) - 1) * PITCH + CASE
  const depth = MARGIN * 2 + (rows - 1) * PITCH + CASE
  const cell = (i: number) => ({ x: MARGIN + (i % PER_ROW) * PITCH, y: MARGIN + Math.floor(i / PER_ROW) * PITCH })
  const at = regions.findIndex((r) => r.id === selected)
  return (
    <IsoScene
      assemble
      unit={24}
      pad={[40, 10, 10, 10]}
      onPointerEnter={() => onInspect(true)}
      onPointerLeave={() => onInspect(false)}
      className="touch-manipulation"
    >
      <IsoPlatform x={0} y={0} w={width} d={depth} h={0.45} lip={0.15} inset={0.3} grid={0.725} />
      {regions.map((region, i) => (
        <Column
          key={region.id}
          region={region}
          stack={stack}
          {...cell(i)}
          scale={scale}
          selected={region.id === selected}
          dimmed={inspecting && region.id !== selected}
          onSelect={onSelect}
        />
      ))}
      {at >= 0 && <Pin region={regions[at]!} {...cell(at)} scale={scale} label={pinLabel(regions[at]!)} />}
    </IsoScene>
  )
}
