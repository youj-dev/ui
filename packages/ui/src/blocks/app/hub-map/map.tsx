'use client'

import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { placeOf, type HubMapCopy, type HubMapHub, type HubMapLane, type HubMapMetric, type HubMapStatus, type HubMapTone } from './data'
import { GRID, SCANLINES } from './land'
import { arcOf } from './arcs'
import { CSS } from './map-css'

/* The map: the world as scanlines (one hairline per 3° of latitude where
 * there's land), the lanes between hubs as arcs that bow toward the pole,
 * and each hub as a node you can pick. A node's halo is its share of the
 * busiest hub's volume (or the most delayed hub's backlog), its core
 * its on-time status; a delayed or halted hub pings. Parcels run along each
 * arc the way the freight ships, more of them on the busier lanes. Picking
 * a hub glides the reticle to it and lights its lanes while the rest dim.
 * The drawing is aria-hidden; the nodes are a radio group, named with their
 * figures, and move west to east with the arrow keys (the map keeps its
 * geography in RTL). Every loop is CSS or SVG (no per-frame script): the
 * parcels are SMIL paused with the map, the pings stop on [data-paused].
 * Reduced motion: drawn in place, no parcels (a chevron on each arc gives
 * its direction) and a still ring for a ping. */

const W = GRID.cols
const H = GRID.rows

const TONE: Record<HubMapTone, string> = { success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)' }

interface HubMapCanvasProps {
  hubs: HubMapHub[]
  lanes: HubMapLane[]
  statuses: HubMapStatus[]
  selected: string
  metric: HubMapMetric
  diverted: readonly string[]
  /** Parcels run and pings breathe: live, on screen, in a visible tab. */
  running: boolean
  /** The map has scrolled into view: it draws itself in. */
  shown: boolean
  /** One parcel per lane on a slow device. */
  light: boolean
  copy: HubMapCopy
  /** A hub's figure beside its code, for the metric shown. */
  figure: (hub: HubMapHub) => string
  /** A hub as spoken. */
  label: (hub: HubMapHub) => string
  onSelect: (id: string) => void
}

export function HubMapCanvas({
  hubs,
  lanes,
  statuses,
  selected,
  metric,
  diverted,
  running,
  shown,
  light,
  copy,
  figure,
  label,
  onSelect,
}: HubMapCanvasProps) {
  const k = useYouj()
  const packets = useRef<SVGSVGElement>(null)
  const nodes = useRef(new Map<string, HTMLButtonElement>())
  const byId = new Map(hubs.map((h) => [h.id, h]))
  const statusOf = (hub: HubMapHub) => statuses.find((s) => s.id === hub.status)
  // West to east: the order the arrow keys walk, whatever the writing direction.
  const order = [...hubs].sort((a, b) => a.lng - b.lng)
  const peak = Math.max(1, ...hubs.map((h) => (metric.measure === 'volume' ? h.volume : h.backlog)))
  const current = byId.get(selected)
  const spot = current ? placeOf(current.lng, current.lat) : null

  useEffect(() => {
    const svg = packets.current
    if (!svg || typeof svg.pauseAnimations !== 'function') return
    if (running) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [running])

  const step = (event: KeyboardEvent) => {
    const i = order.findIndex((r) => r.id === selected)
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: order.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const target = order[(next + order.length) % order.length]!
    onSelect(target.id)
    nodes.current.get(target.id)?.focus()
  }

  const arcs = lanes.flatMap((lane) => {
    const a = byId.get(lane.from)
    const b = byId.get(lane.to)
    if (!a || !b) return []
    const troubled = [a, b].some((h) => !statusOf(h)?.healthy && !diverted.includes(h.id))
    const idle = diverted.includes(a.id) || diverted.includes(b.id)
    return [{ lane, ...arcOf(a, b), related: lane.from === selected || lane.to === selected, troubled, idle }]
  })

  return (
    <div
      data-slot="hub-map-canvas"
      data-shown={shown || undefined}
      data-paused={!running || undefined}
      data-reduced-motion={k.reduced || undefined}
      className="kh-map @container/map relative isolate aspect-[120/45] w-full select-none"
    >
      <style href="youj-hub-map" precedence="youj">
        {CSS}
      </style>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false" className="absolute inset-0 size-full overflow-visible">
        <line x1={0} x2={W} y1={26} y2={26} strokeDasharray="0.4 0.9" className="stroke-line [stroke-width:0.12]" />
        <g
          strokeLinecap="round"
          strokeWidth={0.46}
          style={{ stroke: 'color-mix(in oklab, var(--color-fg) calc(20% - 6% * var(--yj-dark, 0)), transparent)' }}
        >
          {SCANLINES.map((row, r) => {
            let d = ''
            for (let i = 0; i < row.length; i += 2) d += `M${row[i]! + 0.5} ${r + 0.5}H${row[i + 1]! - 0.5}`
            return d ? <path key={r} d={d} className="kh-row" style={{ '--kh-i': r } as CSSProperties} /> : null
          })}
        </g>
        {arcs.map(({ lane, d, mid, angle, related, troubled, idle }) => (
          <g
            key={`${lane.from}-${lane.to}`}
            className="kh-arc"
            data-dim={(!related && selected) || undefined}
            style={{ '--kh-tone': troubled ? 'var(--color-warning)' : 'var(--color-accent)' } as CSSProperties}
          >
            <path
              d={d}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={idle ? '0.5 0.7' : undefined}
              className={cn(related ? 'stroke-(--kh-tone)' : 'stroke-line-strong')}
              style={{ strokeWidth: 0.12 + Math.min(lane.volume, 15_000) * 0.00004, strokeOpacity: related ? 0.8 : undefined }}
            />
            {/* The freight's direction, drawn where parcels can't show it. */}
            {k.reduced && (
              <path
                d="M-0.7 -0.6L0.3 0L-0.7 0.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={`translate(${mid[0]} ${mid[1]}) rotate(${angle})`}
                className="stroke-(--kh-tone) [stroke-width:0.3]"
              />
            )}
          </g>
        ))}
      </svg>

      {!k.reduced && (
        <svg
          ref={packets}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden
          focusable="false"
          className="pointer-events-none absolute inset-0 size-full overflow-visible will-change-transform"
        >
          {shown &&
            arcs.map(({ lane, d, length, related, troubled, idle }) => {
              const count = idle || light ? 1 : 1 + Number(lane.volume >= 5_000) + Number(lane.volume >= 9_000)
              const dur = Math.max(k.ms('deliberate') * 2.5, (length * k.ms('deliberate')) / 12)
              return (
                <g
                  key={`${lane.from}-${lane.to}`}
                  className="kh-arc"
                  data-dim={(!related && selected) || undefined}
                  style={{ '--kh-tone': troubled ? 'var(--color-warning)' : 'var(--color-accent)' } as CSSProperties}
                >
                  {Array.from({ length: count }, (_, i) => {
                    const begin = `${Math.round(-(dur * i) / count - dur * 0.37 * (Math.round(lane.volume / 100) % 3))}ms`
                    return (
                      <g key={i} opacity={0}>
                        <polygon points="-2.6,0 -0.45,-0.28 -0.45,0.28" className="fill-(--kh-tone) opacity-45" />
                        <rect x={-0.45} y={-0.45} width={0.9} height={0.9} rx={0.18} className="fill-(--kh-tone)" />
                        <animateMotion dur={`${Math.round(dur)}ms`} begin={begin} repeatCount="indefinite" rotate="auto" path={d} />
                        <animate
                          attributeName="opacity"
                          values="0;1;1;0"
                          keyTimes="0;0.12;0.86;1"
                          dur={`${Math.round(dur)}ms`}
                          begin={begin}
                          repeatCount="indefinite"
                        />
                      </g>
                    )
                  })}
                </g>
              )
            })}
        </svg>
      )}

      {/* The reticle: a full-size layer translated by the hub's place (percentages of its own box, the map's), so it glides on the compositor. */}
      {spot && (
        <div
          aria-hidden
          className="kh-reticle pointer-events-none absolute inset-0 text-fg"
          style={{ translate: `${spot.x * 100}% ${spot.y * 100}%` }}
        >
          <svg
            viewBox="0 0 36 36"
            // youj-allow: physical side, map coordinates
            className="absolute top-0 left-0 size-[clamp(1.5rem,5.5cqw,2.25rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible"
          >
            <path d="M1 9V1h8M27 1h8v8M35 27v8h-8M9 35H1v-8" fill="none" strokeWidth={1.5} strokeLinecap="round" className="stroke-current" />
          </svg>
        </div>
      )}

      <div role="radiogroup" aria-label={copy.hubs} onKeyDown={step} className="absolute inset-0">
        {order.map((hub, i) => {
          const place = placeOf(hub.lng, hub.lat)
          const status = statusOf(hub)
          const healthy = !!status?.healthy
          const on = hub.id === selected
          const out = diverted.includes(hub.id)
          const value = metric.measure === 'volume' ? hub.volume : hub.backlog
          const tone = out ? 'var(--color-fg-subtle)' : TONE[status?.tone ?? 'success']
          return (
            <button
              key={hub.id}
              ref={(el) => {
                if (el) nodes.current.set(hub.id, el)
                else nodes.current.delete(hub.id)
              }}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={label(hub)}
              tabIndex={on ? 0 : -1}
              onClick={() => onSelect(hub.id)}
              data-status={hub.status}
              // Geography, not reading order: the map stays west to east in RTL, so the place is physical.
              style={{ left: `${place.x * 100}%`, top: `${place.y * 100}%`, '--kh-tone': tone, '--kh-i': i } as CSSProperties}
              className="group/node absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-ring"
            >
              <span aria-hidden className="kh-node-mark pointer-events-none absolute inset-0 grid place-items-center">
                <span
                  className={cn(
                    'kh-halo absolute size-[clamp(1.5rem,8cqw,3.25rem)] rounded-full',
                    healthy || out
                      ? 'bg-fg opacity-[calc(0.07+0.03*var(--yj-dark,0))] group-hover/node:opacity-15'
                      : 'bg-(--kh-tone) opacity-20 group-hover/node:opacity-30',
                  )}
                  style={{ scale: out ? 0.2 : 0.22 + 0.78 * Math.sqrt(value / peak) }}
                />
                {!healthy && !out && <span className="kh-ping absolute size-3 rounded-full border-[1.5px] border-(--kh-tone)" />}
                <span
                  className={cn(
                    'relative size-2.5 rounded-full bg-(--kh-tone) shadow-[0_0_0_2px_var(--color-surface)]',
                    on && 'shadow-[0_0_0_2px_var(--color-surface),0_0_0_3.5px_var(--color-fg)]',
                  )}
                />
              </span>
              <span
                aria-hidden
                className={cn(
                  'kh-node-mark pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-baseline gap-1 rounded-[min(var(--radius-sm),4px)] px-1 font-mono text-ui-xs whitespace-nowrap tabular-nums',
                  // youj-allow: physical side, the label sits away from the map edge
                  place.x > 0.8 ? 'right-full' : 'left-full',
                  // A narrow map keeps only the marks: the panel beside it names the picked hub.
                  '@max-[34rem]/map:hidden',
                  on ? 'bg-fg text-canvas' : 'bg-surface text-fg-muted',
                )}
              >
                <span className={cn(on ? 'text-canvas' : 'text-fg')}>{hub.id}</span>
                {figure(hub)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
