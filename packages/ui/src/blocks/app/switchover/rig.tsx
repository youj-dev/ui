'use client'

import { memo, useEffect, useRef, type CSSProperties } from 'react'
import { IsoBox, IsoCylinder, IsoPlatform, IsoScene, isoEllipse, project } from '@youj/illustrations'
import { useYouj } from '@youj/core'
import type { SwitchoverHealth } from './data'

/* The home's power, isometric: its panel on a round pad at the back, the
 * grid's pad to the front-left (three pole transformers and a status
 * beacon) and the backup's to the front-right (two battery packs and a
 * solar array on its stand). Each line from the panel is eight strands, one
 * per eighth of the load: a strand is lit while it carries its share, and a
 * pulse of current runs along it. As the load moves, strands go dark on one
 * line from the outside in and light on the other from the center out, and
 * the equipment follows (solid while it supplies, a wireframe while it
 * idles; the solar array always produces). The grid's lit strands and
 * transformers take its health: warning while unstable, danger while out;
 * a beacon in trouble pings. In RTL the drawing mirrors, so the grid is on
 * the side its figures are. Pulses are SMIL and pings CSS; both pause with
 * [data-paused] (off screen, hidden tab); their rules are the block's
 * stylesheet (switchover.tsx). Reduced motion: no pulses or pings,
 * strands change in place. */

const UNIT = 28
const STRANDS = 8
/** Strands from the line's center out: the order they light in. */
const ORDER = [3, 4, 2, 5, 1, 6, 0, 7]
const GAP = 0.13
/** The panel's center, and how far along each axis the sources stand from it. */
const HUB = 1
const REACH = 8
/** Where a line leaves the panel's pad and meets a source's. */
const FROM = 2.45
const TO = REACH - 1.8

const TONE: Record<SwitchoverHealth, string> = { healthy: 'var(--color-accent)', degraded: 'var(--color-warning)', down: 'var(--color-danger)' }
const BEACON: Record<SwitchoverHealth, 'success' | 'warning' | 'danger'> = { healthy: 'success', degraded: 'warning', down: 'danger' }

interface RigProps {
  /** The grid's share of the load, 0–1. */
  weight: number
  grid: SwitchoverHealth
  running: boolean
  title: string
}

/** A line's strands: along y to the grid (front-left), along x to the backup (front-right). */
function lane(axis: 'x' | 'y', lit: number, tone: string, reduced: boolean, ms: number, key: string) {
  const lit_ = new Set(ORDER.slice(0, lit))
  return Array.from({ length: STRANDS }, (_, i) => {
    const off = HUB + (i - (STRANDS - 1) / 2) * GAP
    const [a, b] = axis === 'y' ? [project(off, FROM, 0, UNIT), project(off, TO, 0, UNIT)] : [project(FROM, off, 0, UNIT), project(TO, off, 0, UNIT)]
    const d = `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`
    const on = lit_.has(i)
    const begin = `${Math.round(-(ORDER.indexOf(i) / STRANDS) * ms)}ms`
    return (
      <g key={`${key}-${i}`} style={{ '--ke-rank': ORDER.indexOf(i) } as CSSProperties}>
        <path
          d={d}
          strokeLinecap="round"
          strokeWidth={1.4}
          style={{ stroke: 'color-mix(in oklab, var(--color-fg) calc(13% + 3% * var(--yj-dark, 0)), transparent)' }}
        />
        <g className="ke-lit" opacity={on ? 1 : 0}>
          <path d={d} strokeLinecap="round" strokeWidth={1.6} style={{ stroke: tone, strokeOpacity: 0.75 }} />
          {on && !reduced && (
            <g opacity={0}>
              <circle r={2.1} style={{ fill: tone }} />
              <animateMotion dur={`${ms}ms`} begin={begin} repeatCount="indefinite" path={d} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur={`${ms}ms`} begin={begin} repeatCount="indefinite" />
            </g>
          )}
        </g>
      </g>
    )
  })
}

/** Memoised: the card re-renders every beat, but the rig only changes when the load split or the grid's health do. */
export const Rig = memo(function Rig({ weight, grid, running, title }: RigProps) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const litGrid = Math.round(weight * STRANDS)
  const ms = Math.round(k.ms('deliberate') * 2)

  // SMIL runs on the document's clock: pause it with the loops.
  useEffect(() => {
    const svg = root.current?.querySelector('svg')
    if (!svg || typeof svg.pauseAnimations !== 'function') return
    if (running) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [running])

  const gTone = grid === 'healthy' ? 'raised' : grid === 'degraded' ? 'warning' : 'danger'
  const onGrid = Math.ceil(weight * 3)
  const onBattery = Math.max(1, Math.ceil((1 - weight) * 2))
  const ping = isoEllipse(HUB + 1.55, REACH + 1.2, 0.72, 0.26, UNIT)
  return (
    <div ref={root} data-paused={!running || undefined} data-reduced-motion={k.reduced || undefined} className="ke-rig w-full">
      <IsoScene assemble unit={UNIT} pad={[14, 10, 10, 10]} title={title} className="rtl:-scale-x-100">
        {lane('y', litGrid, TONE[grid], k.reduced, ms, 'p')}
        {lane('x', STRANDS - litGrid, 'var(--color-accent)', k.reduced, ms, 's')}
        {/* The home's panel: a cabinet on its round pad. */}
        <IsoPlatform x={HUB - 1.3} y={HUB - 1.3} w={2.6} d={2.6} h={0.3} lip={0.12} inset={0.3} shape="round" />
        <IsoBox x={HUB - 0.5} y={HUB - 0.3} z={0.42} w={1} d={0.6} h={1.35} tone="accent" />
        {/* The grid: three pole transformers, each capped by an insulator while it supplies. */}
        <IsoPlatform x={HUB - 1.8} y={REACH - 1.8} w={3.6} d={3.6} h={0.3} lip={0.12} inset={0.3} />
        {[0, 1, 2].map((i) => (
          <IsoCylinder
            key={`g-${i}`}
            x={HUB - 1.3 + i * 0.95}
            y={REACH - 0.45}
            z={0.42}
            r={0.34}
            h={1.1}
            tone={i < onGrid ? gTone : 'neutral'}
            variant={i < onGrid ? 'solid' : 'wire'}
          />
        ))}
        {[0, 1, 2].map((i) =>
          i < onGrid ? <IsoCylinder key={`gi-${i}`} x={HUB - 1.07 + i * 0.95} y={REACH - 0.22} z={1.52} r={0.11} h={0.24} tone="neutral" /> : null,
        )}
        <IsoCylinder x={HUB + 1.3} y={REACH + 0.95} z={0.42} r={0.25} h={0.3} tone={BEACON[grid]} />
        {/* The backup: two battery packs, and the solar array on its stand. */}
        <IsoPlatform x={REACH - 1.8} y={HUB - 1.8} w={3.6} d={3.6} h={0.3} lip={0.12} inset={0.3} />
        {[0, 1].map((i) => (
          <IsoBox
            key={`b-${i}`}
            x={REACH - 0.55}
            y={HUB - 1.5 + i * 0.78}
            z={0.42}
            w={0.55}
            d={0.66}
            h={1.4}
            tone={i < onBattery ? 'raised' : 'neutral'}
            variant={i < onBattery ? 'solid' : 'wire'}
          />
        ))}
        <IsoBox x={REACH - 0.3} y={HUB + 1.05} z={0.42} w={0.14} d={0.14} h={0.5} tone="neutral" />
        <IsoBox x={REACH - 0.95} y={HUB + 0.55} z={0.92} w={1.4} d={1.15} h={0.07} tone="accent" />
        <IsoCylinder x={REACH + 0.95} y={HUB + 1.3} z={0.42} r={0.25} h={0.3} tone="success" />
        {grid !== 'healthy' && (
          <ellipse
            cx={ping.cx}
            cy={ping.cy}
            rx={ping.rx}
            ry={ping.ry}
            fill="none"
            strokeWidth={1.5}
            className="ke-ping"
            style={{ stroke: TONE[grid] }}
          />
        )}
      </IsoScene>
    </div>
  )
})
