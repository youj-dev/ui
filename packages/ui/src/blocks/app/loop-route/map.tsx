'use client'

import type { ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { LOOP, LOOP_PATH, pointAt, type LoopRouteStop, type LoopRouteStopState } from './loop'

/* The route as a loop: a track in the quiet line color, the stretch the vehicle
 * has covered in success, a marker for every stop (a square for the store,
 * filled when done, ringed in the accent when next, hollow when ahead, dashed
 * when skipped) with its name outside the loop, and the vehicle as the accent
 * disc with a slow ring. The middle is the card's to fill (the loop count and
 * what is on board). Decorative: the stop list beside it says it all. */

const PAD = { x: 50, y: 28 }

const CSS = `
.dl-ring { transform-box: fill-box; transform-origin: center; animation: dl-ring calc(var(--yj-duration-deliberate) * 3) var(--ease-exit) infinite; }
@keyframes dl-ring { from { transform: scale(1); opacity: 0.5; } to { transform: scale(2.2); opacity: 0; } }
`

function Marker({ stop, state }: { stop: LoopRouteStop; state: LoopRouteStopState }) {
  const { x, y } = pointAt(stop.position)
  if (stop.depot)
    return <rect x={x - 5} y={y - 5} width={10} height={10} fill="var(--color-surface)" stroke="var(--color-fg)" strokeWidth={1.75} />
  if (state === 'done') return <circle cx={x} cy={y} r={5} fill="var(--color-success)" stroke="var(--color-surface)" strokeWidth={1.5} />
  if (state === 'next')
    return (
      <>
        <circle cx={x} cy={y} r={8} fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth={2} />
        <circle cx={x} cy={y} r={3} fill="var(--color-accent)" />
      </>
    )
  if (state === 'skipped') return <circle cx={x} cy={y} r={5} fill="var(--color-surface)" stroke="var(--color-fg-subtle)" strokeWidth={1.5} strokeDasharray="2 2" />
  return <circle cx={x} cy={y} r={5} fill="var(--color-surface)" stroke="var(--color-fg-subtle)" strokeWidth={1.75} />
}

interface MapProps {
  stops: LoopRouteStop[]
  states: Map<string, LoopRouteStopState>
  progress: number
  label: string
  /** The middle of the loop. */
  children: ReactNode
}

export function RouteMap({ stops, states, progress, label, children }: MapProps) {
  const k = useYouj()
  const vehicle = pointAt(progress)
  return (
    <div className="relative">
      <style>{CSS}</style>
      <svg role="img" aria-label={label} viewBox={`${-PAD.x} ${-PAD.y} ${LOOP.width + PAD.x * 2} ${LOOP.height + PAD.y * 2}`} className="block w-full">
        <path d={LOOP_PATH} fill="none" stroke="var(--color-line)" strokeWidth={7} />
        <path d={LOOP_PATH} fill="none" stroke="var(--color-success)" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.min(1, Math.max(0, progress))} 1`} />
        {stops.map((stop) => {
          const { x, y, nx, ny } = pointAt(stop.position)
          const state = states.get(stop.id) ?? 'upcoming'
          return (
            <g key={stop.id}>
              <Marker stop={stop} state={state} />
              <text
                x={x + nx * 16}
                y={y + ny * 16}
                textAnchor={nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle'}
                dominantBaseline={ny > 0.35 ? 'hanging' : ny < -0.35 ? 'auto' : 'middle'}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: state === 'next' ? 600 : 400 }}
                fill={state === 'next' ? 'var(--color-fg)' : 'var(--color-fg-muted)'}
              >
                {stop.name}
              </text>
            </g>
          )
        })}
        <circle cx={vehicle.x} cy={vehicle.y} r={k.reduced ? 11 : 7} className={k.reduced ? undefined : 'dl-ring'} opacity={k.reduced ? 0.3 : undefined} fill="var(--color-accent)" />
        <circle cx={vehicle.x} cy={vehicle.y} r={7} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
