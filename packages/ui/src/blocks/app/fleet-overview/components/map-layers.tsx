'use client'

import type { RefObject } from 'react'
import { cn } from '../../../../lib/utils'
import { PORTS, STORM, type ShipmentStatus } from '../data'
import { DOT_PITCH, pointAt, project } from '../geo'
import { progressAt, type SimClock, type Voyage } from '../model'

/* The fleet map's marks: the storm, the ports and the vessels. Marks and
 * labels keep their size as the map zooms (`--map-scale`). */

export const STORM_POINT = project(STORM.at)
export const STORM_RADIUS = STORM.radius * (DOT_PITCH / 2)

const TONE: Record<ShipmentStatus, string> = {
  'on-time': 'fill-accent',
  rerouted: 'fill-accent',
  delayed: 'fill-warning',
  arrived: 'fill-fg-muted',
}

export function StormCell({ ringRef }: { ringRef: RefObject<SVGCircleElement | null> }) {
  return (
    <g aria-hidden>
      <circle cx={STORM_POINT[0]} cy={STORM_POINT[1]} r={STORM_RADIUS * 1.6} fill="url(#harbor-storm)" />
      <circle
        ref={ringRef}
        cx={STORM_POINT[0]}
        cy={STORM_POINT[1]}
        r={STORM_RADIUS * 1.08}
        fill="none"
        strokeDasharray="2 3"
        className="stroke-warning"
        style={{ strokeWidth: 'calc(1px / var(--map-scale))' }}
      />
      <g transform={`translate(${STORM_POINT[0]} ${STORM_POINT[1]})`}>
        <g className="[transform:scale(calc(1/var(--map-scale)))]">
          <text
            y={3.2}
            textAnchor="middle"
            className="fill-warning-text text-[9.5px] font-medium tracking-[0.08em] uppercase [paint-order:stroke] stroke-canvas [stroke-width:3px]"
          >
            Storm cell
          </text>
        </g>
      </g>
    </g>
  )
}

export function PortMarks({ selected }: { selected: Voyage | null }) {
  return (
    <>
      {Object.values(PORTS).map((port) => {
        const [x, y] = project(port.at)
        const active = selected && (selected.from === port.code || selected.to === port.code)
        const place = port.label ?? 'end'
        const text = (
          {
            end: { x: 6, y: 3.2, anchor: 'start' },
            start: { x: -6, y: 3.2, anchor: 'end' },
            above: { x: 0, y: -7, anchor: 'middle' },
            below: { x: 0, y: 12.5, anchor: 'middle' },
          } as const
        )[place]
        return (
          <g key={port.code} transform={`translate(${x} ${y})`} aria-hidden>
            <g className="[transform:scale(calc(1/var(--map-scale)))]">
              <circle r={active ? 3.6 : 2.6} className={cn('stroke-fg-subtle', active ? 'fill-accent stroke-canvas' : 'fill-canvas')} strokeWidth={1.25} />
              <text
                x={text.x}
                y={text.y}
                textAnchor={text.anchor}
                className={cn(
                  'font-mono text-[9px] font-medium tracking-[0.08em] [paint-order:stroke] stroke-canvas [stroke-width:3px]',
                  active ? 'fill-fg' : 'fill-fg-muted',
                )}
              >
                {port.code}
              </text>
            </g>
          </g>
        )
      })}
    </>
  )
}

export type Markers = Map<string, { outer: SVGGElement | null; hull: SVGGElement | null }>

export function VesselMarks({
  voyages,
  selectedId,
  onSelect,
  clock,
  markers,
  haloRef,
}: {
  voyages: Voyage[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  clock: SimClock
  markers: RefObject<Markers>
  haloRef: RefObject<SVGCircleElement | null>
}) {
  return (
    <>
      {voyages.map((v) => {
        const at = pointAt(v.route, progressAt(v, clock.time))
        const isSelected = v.id === selectedId
        return (
          <g
            key={v.id}
            data-vessel={v.id}
            ref={(outer) => {
              const mark = markers.current.get(v.id) ?? { outer: null, hull: null }
              mark.outer = outer
              markers.current.set(v.id, mark)
            }}
            transform={`translate(${at.x.toFixed(2)} ${at.y.toFixed(2)})`}
            onClick={() => onSelect(v.id)}
            className="group/vessel cursor-pointer"
            aria-hidden
          >
            <g className="[transform:scale(calc(1/var(--map-scale)))]">
              <circle r={13} className="fill-transparent" />
              {isSelected && <circle ref={haloRef} r={11} className="fill-accent-subtle stroke-accent-line" strokeWidth={1} />}
              <g
                ref={(hull) => {
                  const mark = markers.current.get(v.id) ?? { outer: null, hull: null }
                  mark.hull = hull
                  markers.current.set(v.id, mark)
                }}
                transform={`rotate(${at.angle.toFixed(1)})`}
              >
                <path
                  d="M6.5 0 L-4.5 4.2 L-2.2 0 L-4.5 -4.2 Z"
                  strokeLinejoin="round"
                  strokeWidth={1.4}
                  className={cn(TONE[v.status], 'stroke-canvas transition-transform yj-duration-fast ease-standard group-hover/vessel:scale-125')}
                />
              </g>
              <text
                x={10}
                y={19}
                className={cn(
                  'text-[11px] font-semibold [paint-order:stroke] stroke-canvas [stroke-width:3.5px] transition-opacity yj-duration-fast ease-standard',
                  v.status === 'delayed' ? 'fill-warning-text' : 'fill-fg',
                  'opacity-0 group-hover/vessel:opacity-100',
                )}
              >
                {v.vessel}
              </text>
            </g>
          </g>
        )
      })}
    </>
  )
}
