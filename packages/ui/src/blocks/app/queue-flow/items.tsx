'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { routeKey, type QueueFlowNode, type QueueFlowRoute } from './data'

/* Items on the move: small dots riding each route's curve, as many as its
 * volume earns (one to four), evenly spaced. Each dot is a Web Animation of
 * `transform` alone, with keyframes sampled along the curve, so the
 * compositor runs them: nothing is computed per frame, and a busy main
 * thread doesn't stutter them. A route into a team over target slows
 * (updatePlaybackRate, which keeps every dot where it is) and they all pause
 * together: when the desk is paused, off screen or in a hidden tab. Reduced
 * motion: the dots stand still along their routes, so the density and
 * colors still read. */

export interface Lattice {
  /** The box the node centers span, px. */
  width: number
  height: number
  /** Layers run down instead of across (a narrow canvas). */
  vertical: boolean
}

/** A node's center in the lattice, 0–1 each way. */
export const centreOf = (node: QueueFlowNode, vertical: boolean) => (vertical ? { x: node.lane / 2, y: node.layer / 2 } : { x: node.layer / 2, y: node.lane / 2 })

/** The route as a cubic whose ends leave and meet their nodes along the flow. */
export function curveOf(a: { x: number; y: number }, b: { x: number; y: number }, vertical: boolean) {
  if (vertical) {
    const my = (a.y + b.y) / 2
    return [a, { x: a.x, y: my }, { x: b.x, y: my }, b] as const
  }
  const mx = (a.x + b.x) / 2
  return [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b] as const
}

const SAMPLES = 24

/** Points along the curve at even distances, px, with each one's share of the way. */
function sample(curve: ReturnType<typeof curveOf>, lattice: Lattice) {
  const [p0, p1, p2, p3] = curve.map((p) => ({
    x: p.x * lattice.width,
    y: p.y * lattice.height,
  }))
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const t = i / SAMPLES
    const u = 1 - t
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    return {
      x: w[0]! * p0!.x + w[1]! * p1!.x + w[2]! * p2!.x + w[3]! * p3!.x,
      y: w[0]! * p0!.y + w[1]! * p1!.y + w[2]! * p2!.y + w[3]! * p3!.y,
    }
  })
  let length = 0
  const run = points.map((p, i) => (i === 0 ? 0 : (length += Math.hypot(p.x - points[i - 1]!.x, p.y - points[i - 1]!.y))))
  return {
    points: points.map((p, i) => ({
      ...p,
      offset: length > 0 ? run[i]! / length : i / SAMPLES,
    })),
    length,
  }
}

/** How many dots a route carries for its volume, tickets an hour. */
export const dotsFor = (rate: number) => (rate >= 200 ? 4 : rate >= 80 ? 3 : rate >= 25 ? 2 : 1)

/** Where a dot sits when nothing moves: the point nearest its share of the way. */
function at(points: { x: number; y: number; offset: number }[], share: number) {
  return points.reduce((best, p) => (Math.abs(p.offset - share) < Math.abs(best.offset - share) ? p : best), points[0]!)
}

export type RouteTone = 'flow' | 'slow' | 'sink'

interface ItemsProps {
  nodes: QueueFlowNode[]
  routes: QueueFlowRoute[]
  /** Dots per route, by key: set by the opening volumes so the DOM holds still. */
  counts: Record<string, number>
  /** How fast each route runs against its usual pace (1), by key. */
  paces: Record<string, number>
  tones: Record<string, RouteTone>
  lattice: Lattice | null
  /** Desk on, on screen, tab visible. */
  running: boolean
}

/** Moves a dot to a new pace from where it is (all at once where the browser can't ease it). */
function easePace(run: Animation, pace: number) {
  if (typeof run.updatePlaybackRate === 'function') run.updatePlaybackRate(pace)
  else run.playbackRate = pace
}

export function Items({ nodes, routes, counts, paces, tones, lattice, running }: ItemsProps) {
  const k = useYouj()
  const dots = useRef(new Map<string, HTMLSpanElement[]>())
  const animations = useRef(new Map<string, Animation[]>())
  const latest = useRef({ paces, running })
  useLayoutEffect(() => {
    latest.current = { paces, running }
  })

  // Lay the tracks out again whenever the lattice changes size or orientation.
  useEffect(() => {
    if (!lattice) return
    const made = new Map<string, Animation[]>()
    for (const route of routes) {
      const key = routeKey(route)
      const from = nodes.find((n) => n.id === route.from)
      const to = nodes.find((n) => n.id === route.to)
      const els = dots.current.get(key) ?? []
      if (!from || !to || !els.length) continue
      const { points, length } = sample(curveOf(centreOf(from, lattice.vertical), centreOf(to, lattice.vertical), lattice.vertical), lattice)
      if (k.reduced || typeof els[0]!.animate !== 'function') {
        els.forEach((el, i) => {
          const p = at(points, (i + 0.5) / els.length)
          el.style.transform = `translate(${p.x}px, ${p.y}px)`
        })
        continue
      }
      const frames = points.map((p) => ({
        transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`,
        offset: p.offset,
      }))
      // About a hundred pixels a second, on the deliberate token, so Speed reaches it.
      const duration = Math.max(k.ms('deliberate'), (length / 60) * k.ms('deliberate'))
      const list = els.map((el, i) => {
        const run = el.animate(frames, {
          duration,
          iterations: Infinity,
          iterationStart: i / els.length,
          easing: 'linear',
        })
        run.playbackRate = latest.current.paces[key] ?? 1
        if (!latest.current.running) run.pause()
        return run
      })
      made.set(key, list)
    }
    animations.current = made
    return () => {
      for (const list of made.values()) for (const run of list) run.cancel()
    }
  }, [lattice, nodes, routes, k])

  // A new pace eases in from where each dot is: no jump.
  useEffect(() => {
    for (const [key, list] of animations.current) {
      const pace = paces[key] ?? 1
      for (const run of list) {
        if (run.playbackRate !== pace) easePace(run, pace)
      }
    }
  }, [paces])

  useEffect(() => {
    for (const list of animations.current.values())
      for (const run of list) {
        if (running) run.play()
        else run.pause()
      }
  }, [running, lattice])

  return (
    <div aria-hidden data-slot="queue-flow-items" className="pointer-events-none absolute inset-0 rtl:-scale-x-100">
      {routes.map((route) => {
        const key = routeKey(route)
        const tone = tones[key] ?? 'flow'
        return Array.from({ length: counts[key] ?? 1 }, (_, i) => (
          <span
            key={`${key}:${i}`}
            ref={(el) => {
              if (!el) return
              const list = dots.current.get(key) ?? []
              list[i] = el
              dots.current.set(key, list)
            }}
            data-tone={tone}
            className={cn(
              // Parked on the route's first node until the tracks are laid.
              // youj-allow: physical side, placed by transform in canvas px
              'absolute top-0 left-0 -m-[3px] size-1.5 rounded-full transition-[background-color,box-shadow] yj-duration-slow ease-standard',
              !lattice && 'opacity-0',
              tone === 'flow' && 'bg-fg shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-fg)_14%,transparent)]',
              tone === 'slow' && 'bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-warning)_22%,transparent)]',
              tone === 'sink' && 'bg-danger shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-danger)_22%,transparent)]',
            )}
          />
        ))
      })}
    </div>
  )
}
