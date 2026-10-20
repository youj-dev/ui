'use client'

import { useEffect, useMemo, useRef, type Ref } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '../../../../lib/utils'
import { DOT_PITCH, landDots, MAP_HEIGHT, MAP_WIDTH, pointAt } from '../geo'
import { progressAt, type FleetMapHandle, type MapInsets, type SimClock, type Voyage } from '../model'
import { useMapCamera } from '../use-map-camera'
import { PortMarks, STORM_RADIUS, StormCell, VesselMarks, type Markers } from './map-layers'

/* The fleet on a dot map of the world. A camera (pan and zoom, eased by the
 * motion tokens) frames the selected voyage in whatever space the panels
 * leave; drag to pan, ⌘/Ctrl + scroll to zoom. Routes draw themselves in,
 * vessels steam along them and the storm breathes, all from one rAF loop on
 * the simulation clock (scaled by Speed, stopped off screen, in a hidden tab
 * and under reduced motion, where everything holds where it is). Marks and
 * labels keep their size as the map zooms. The map is a picture for assistive
 * tech: the shipments list next to it is the way to pick a vessel. */

interface FleetMapProps {
  voyages: Voyage[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Screen space the camera keeps clear, where panels float over the map. */
  insets: MapInsets
  clock: SimClock
  /** What the map shows, for assistive tech. */
  label: string
  className?: string
  ref?: Ref<FleetMapHandle>
}

export function FleetMap({ voyages, selectedId, onSelect, insets, clock, label, className, ref }: FleetMapProps) {
  const k = useYouj()
  const svg = useRef<SVGSVGElement>(null)
  const world = useRef<SVGGElement>(null)
  const markers = useRef<Markers>(new Map())
  const traveled = useRef<SVGPathElement>(null)
  const halo = useRef<SVGCircleElement>(null)
  const stormRing = useRef<SVGCircleElement>(null)
  const dots = useMemo(() => landDots(), [])
  const selected = voyages.find((v) => v.id === selectedId) ?? null

  const overview = useMemo(() => {
    const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
    for (const v of voyages) {
      if (v.status === 'arrived') continue
      box.x0 = Math.min(box.x0, v.route.box.x0)
      box.y0 = Math.min(box.y0, v.route.box.y0)
      box.x1 = Math.max(box.x1, v.route.box.x1)
      box.y1 = Math.max(box.y1, v.route.box.y1)
    }
    return box
  }, [voyages])

  const targetBox = selected ? selected.route.box : overview
  const targetKey = `${selected?.id ?? 'all'}:${insets.top},${insets.right},${insets.bottom},${insets.left}`

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useMapCamera({ svg, world, insets, targetBox, targetKey, ref })

  // Everything that moves, from the simulation clock.
  const draw = (time: number) => {
    for (const v of voyages) {
      const mark = markers.current.get(v.id)
      if (!mark?.outer) continue
      const p = progressAt(v, time)
      const at = pointAt(v.route, p)
      mark.outer.setAttribute('transform', `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)})`)
      mark.hull?.setAttribute('transform', `rotate(${at.angle.toFixed(1)})`)
      if (v.id === selectedId) traveled.current?.setAttribute('stroke-dasharray', `${p} 1`)
    }
    const breath = Math.sin((time / 3.2) * Math.PI * 2)
    stormRing.current?.setAttribute('r', String(STORM_RADIUS * (1.08 + 0.1 * breath)))
    stormRing.current?.setAttribute('opacity', String(0.55 - 0.3 * breath))
    halo.current?.setAttribute('r', String(11 + 2.5 * Math.sin((time / 1.6) * Math.PI * 2)))
  }

  useEffect(() => {
    const el = svg.current
    if (k.reduced || !el) return
    let raf = 0
    let last = 0
    let onscreen = true
    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      clock.time += dt / k.timeScale
      draw(clock.time)
      schedule()
    }
    const schedule = () => {
      if (raf || document.hidden || !onscreen) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry?.isIntersecting ?? true
      schedule()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', schedule)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- draw is rebuilt each render from the inputs listed
  }, [k.reduced, k.timeScale, voyages, selectedId, clock])

  const selectedProgress = selected ? progressAt(selected, clock.time) : 0

  return (
    <svg
      ref={svg}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={(event) => {
        if (!(event.target as Element).closest('[data-vessel]')) onSelect(null)
      }}
      className={cn('block size-full touch-none select-none [--map-scale:1]', 'cursor-grab active:cursor-grabbing', className)}
    >
      <defs>
        <pattern id="harbor-sea" width={DOT_PITCH} height={DOT_PITCH} patternUnits="userSpaceOnUse">
          <circle cx={DOT_PITCH / 2} cy={DOT_PITCH / 2} r={0.7} className="fill-band" />
        </pattern>
        <radialGradient id="harbor-storm">
          <stop offset="0%" className="[stop-color:var(--color-warning)] [stop-opacity:0.34]" />
          <stop offset="70%" className="[stop-color:var(--color-warning)] [stop-opacity:0.08]" />
          <stop offset="100%" className="[stop-color:var(--color-warning)] [stop-opacity:0]" />
        </radialGradient>
        <filter id="harbor-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <g ref={world}>
        <rect x={-MAP_WIDTH} y={-MAP_HEIGHT} width={MAP_WIDTH * 3} height={MAP_HEIGHT * 3} fill="url(#harbor-sea)" />
        <path d={dots} fill="none" strokeLinecap="round" strokeWidth={3} className="stroke-line-strong" />

        <StormCell ringRef={stormRing} />

        {voyages.map((v, i) => (
          <motion.path
            key={`${v.id}:${v.routeId}`}
            d={v.route.d}
            fill="none"
            strokeLinecap="round"
            className={cn(v.status === 'arrived' ? 'stroke-line' : 'stroke-accent-line', v.id === selectedId && 'stroke-accent-line')}
            style={{ strokeWidth: `calc(${v.id === selectedId ? 1.6 : 1.1}px / var(--map-scale))` }}
            initial={k.reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={k.reduced ? { type: false } : { ...k.tween('deliberate', 'emphasized'), delay: i * k.stagger('base') }}
          />
        ))}

        {selected && (
          <g key={`${selected.id}:${selected.routeId}`} aria-hidden>
            <motion.path
              d={selected.route.d}
              fill="none"
              strokeLinecap="round"
              filter="url(#harbor-glow)"
              className="stroke-accent"
              style={{ strokeWidth: 'calc(5px / var(--map-scale))' }}
              initial={k.reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={k.tween('slow', 'enter')}
            />
            <path
              ref={traveled}
              d={selected.route.d}
              pathLength={1}
              strokeDasharray={`${selectedProgress} 1`}
              fill="none"
              strokeLinecap="round"
              className="stroke-accent"
              style={{ strokeWidth: 'calc(2.25px / var(--map-scale))' }}
            />
          </g>
        )}

        <PortMarks selected={selected} />

        <VesselMarks voyages={voyages} selectedId={selectedId} onSelect={onSelect} clock={clock} markers={markers} haloRef={halo} />
      </g>
    </svg>
  )
}
