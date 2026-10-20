'use client'

import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { observeThemeChange, useYouj, useMotionBudget } from '@youj/core'
import type { ArcGlobePlace, ArcGlobeRegion, ArcGlobeVisit } from './data'
import { arcPoints, frameOf, place, prepareLand, tintLand, toVec, turner, type Land, type Tint } from './globe-draw'
import { clampLat, drawScene, readPalette, stepView, TILT, timingOf, type GlobeState } from './globe-scene'

/* The globe: a canvas, drawn only while it's on screen and the tab is
 * shown. It turns slowly eastward, spinning up the first time it's seen;
 * the pointer over it slows it to a stop so a country can be picked, and a
 * drag spins it (with a coast after). Given an aim (a country or a region
 * from the lists beside it), it glides there on a critically damped spring,
 * so a new aim mid-glide bends the path instead of jumping. Each visit in
 * flight is thrown as an arc from the visitor's city to the site's
 * region that serves it, the thread reeled in behind it, and lands as a ring; a visit
 * served in its own country is a ring where it's placed. Time runs at
 * 1 / timeScale; the 'low' motion budget draws at half rate and 1× pixels.
 * Reduced motion: one still frame (redrawn on change), aimed at once, with
 * the latest visits as whole arcs. */

/** Pointer distance, px, within which the nearest country answers. */
const HIT = 16

export interface GlobeProps {
  places: ArcGlobePlace[]
  /** The regions, in order: their tones color the places. */
  regions: ArcGlobeRegion[]
  /** Each place's share of the volume for the period, by id. */
  shares: Record<string, number>
  /** Hands the globe each new visit to throw, as it's placed (no render). */
  subscribe: (listener: (visit: ArcGlobeVisit) => void) => () => void
  /** Turning on its own; false holds it still (Pause). */
  turning: boolean
  /** The latest settled visits: drawn whole when motion is reduced. */
  recent: ArcGlobeVisit[]
  /** The highlighted place's id. */
  active: string | null
  /** Where to turn to: a place or region, or null to cruise. */
  aim: { lon: number; lat: number } | null
  /** A region's index in `regions` to bring forward, -1 for all. */
  focus: number
  /** Accessible name of the picture. */
  label: string
  /** The active place's tag, over the globe. */
  tag: ReactNode
  onHover: (id: string | null) => void
  onPick: (id: string | null) => void
}

export function Globe({ places, regions, shares, subscribe, turning, recent, active, aim, focus, label, tag, onHover, onPick }: GlobeProps) {
  const k = useYouj()
  const { tier } = useMotionBudget()
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  const land = useMemo<Land>(() => prepareLand(), [])
  const toneKey = regions.map((r) => r.tone).join()
  const placed = useMemo(
    () =>
      places.map((m) => ({
        place: m,
        at: toVec(m.lng, m.lat),
        tone: Math.max(
          0,
          regions.findIndex((r) => r.id === m.region),
        ),
      })),
    [places, regions],
  )
  const tint = useMemo<Tint>(
    () =>
      tintLand(
        land,
        placed.map((p) => ({ at: p.at, tone: p.tone, share: shares[p.place.id] ?? 0 })),
      ),
    [land, placed, shares],
  )

  // Everything the frame reads, kept current without restarting the loop.
  const props = useRef({ placed, tint, shares, turning, active, aim, focus, recent, onHover, onPick })
  useEffect(() => {
    props.current = { placed, tint, shares, turning, active, aim, focus, recent, onHover, onPick }
  })
  const state = useRef<GlobeState>({
    // With motion, the first spin-up carries it from Asia's edge to the Atlantic.
    view: { lon: k.reduced ? -30 : 40, lat: TILT },
    velocity: { lon: 0, lat: 0 },
    spin: 0,
    clock: 0,
    shown: 0,
    size: { width: 0, height: 0 },
    palette: null,
    flights: new Map(),
    pointer: null,
    hovering: false,
    running: false,
    redraw: () => {},
  })

  const timing = useMemo(() => timingOf(k), [k])

  // New visits take off from wherever the clock is (not under reduced motion: the still shows the settled ones).
  useEffect(() => {
    if (k.reduced) return
    return subscribe((visit) => {
      const s = state.current
      // Off screen the clock stands still: an visit thrown then would wait and land with a crowd.
      if (!s.running) return
      const from = placed.find((p) => p.place.id === visit.from)
      const to = placed.find((p) => p.place.id === visit.to)
      if (!from || !to) return
      s.flights.set(visit.id, { points: from === to ? null : arcPoints(from.at, to.at), from: from.at, to: to.at, tone: from.tone, born: s.clock })
    })
  }, [subscribe, placed, k.reduced])

  useEffect(() => {
    const el = canvas.current
    const host = wrap.current
    const ctx = el?.getContext('2d')
    if (!el || !host || !ctx || !probe.current) return
    const s = state.current
    const reduced = k.reduced
    const ratio = Math.min(window.devicePixelRatio || 1, tier === 'low' ? 1 : 2)
    let frame = 0
    let last = 0
    let odd = false
    let onScreen = false
    const draw = () => drawScene(ctx, s, props.current, land, timing, reduced, ratio, tagRef.current)

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = last ? Math.min(64, now - last) / k.timeScale : 0
      last = now
      s.clock += dt
      stepView(s, dt, props.current, timing)
      odd = !odd
      if (tier === 'low' && odd) return
      draw()
    }
    const run = () => {
      if (reduced || frame || !onScreen || document.hidden) return
      last = 0
      s.running = true
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      s.running = false
    }
    s.redraw = () => {
      if (reduced) {
        const aim = props.current.aim
        if (aim) s.view = { lon: aim.lon, lat: clampLat(aim.lat) }
        draw()
      }
    }

    const resize = (entries?: ResizeObserverEntry[]) => {
      const box = entries?.[0]?.contentRect
      const width = box ? box.width : host.clientWidth
      const height = box ? box.height : host.clientHeight
      s.size = { width, height }
      el.width = Math.round(width * ratio)
      el.height = Math.round(height * ratio)
      draw()
    }
    const theme = () => {
      s.palette = readPalette(probe.current!, toneKey.split(','))
      draw()
    }
    theme()
    resize()
    const sizes = new ResizeObserver(resize)
    sizes.observe(host)
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = !!entry?.isIntersecting
      if (onScreen) run()
      else stop()
    })
    seen.observe(host)
    const visibility = () => (document.hidden ? stop() : run())
    document.addEventListener('visibilitychange', visibility)
    const unobserve = observeThemeChange(host, theme)
    return () => {
      stop()
      sizes.disconnect()
      seen.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      unobserve()
      s.redraw = () => {}
    }
  }, [k, tier, land, timing, toneKey])

  // Under reduced motion there is no loop: redraw when anything shown changes.
  useEffect(() => {
    state.current.redraw()
  }, [placed, tint, shares, active, aim, focus, recent])

  const nearest = (x: number, y: number) => {
    const s = state.current
    const turn = turner(s.view)
    let best: string | null = null
    let distance = HIT
    for (const p of props.current.placed) {
      const spot = place(p.at, s.size, turn)
      const d = Math.hypot(spot.x - x, spot.y - y)
      if (spot.depth > 0.05 && d < distance) {
        distance = d
        best = p.place.id
      }
    }
    return best
  }
  const local = (e: React.PointerEvent) => {
    const box = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }

  return (
    <div
      ref={wrap}
      role="img"
      aria-label={label}
      dir="ltr"
      data-slot="traffic-globe"
      className="relative aspect-square w-full touch-pan-y select-none"
      onPointerEnter={() => {
        state.current.hovering = true
      }}
      onPointerLeave={() => {
        state.current.hovering = false
        props.current.onHover(null)
      }}
      onPointerDown={(e) => {
        const { x, y } = local(e)
        state.current.pointer = { x, y, lastX: x, lastY: y, t: performance.now(), dragged: false }
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }}
      onPointerMove={(e) => {
        const s = state.current
        const { x, y } = local(e)
        const p = s.pointer
        if (!p) {
          const id = nearest(x, y)
          if (id !== props.current.active) props.current.onHover(id)
          return
        }
        if (!p.dragged && Math.hypot(x - p.x, y - p.y) < 4) return
        p.dragged = true
        const now = performance.now()
        const scale = 57.3 / frameOf(s.size).r
        const dLon = -(x - p.lastX) * scale
        const dLat = (y - p.lastY) * scale
        s.view.lon += dLon
        s.view.lat = clampLat(s.view.lat + dLat)
        const dt = Math.max(8, now - p.t) / 1000
        s.velocity = { lon: dLon / dt, lat: dLat / dt }
        s.spin = 0
        p.lastX = x
        p.lastY = y
        p.t = now
        s.redraw()
      }}
      onPointerUp={(e) => {
        const s = state.current
        const p = s.pointer
        s.pointer = null
        if (!p || p.dragged) return
        const { x, y } = local(e)
        props.current.onPick(nearest(x, y))
      }}
      onPointerCancel={() => {
        state.current.pointer = null
      }}
    >
      <span ref={probe} hidden />
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
      <div
        ref={tagRef}
        aria-hidden
        // youj-allow: physical side, placed at the projected point in px
        className="pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity yj-duration-fast ease-standard"
      >
        <div className="-translate-x-1/2 -translate-y-[calc(100%+1.5rem)]">{tag}</div>
      </div>
    </div>
  )
}
