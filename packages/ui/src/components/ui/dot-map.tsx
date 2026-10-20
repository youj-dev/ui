'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent } from 'react'
import { AnimatePresence, m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { dotMapLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { LAND } from './dot-map.land'

/* The world as a grid of dots, lit where the numbers are. Land is a coarse
 * equirectangular grid (3° cells, from committed data: nothing geographic
 * loads at runtime). Each region lights the dots around it like LEDs: the
 * reach and strength grow with its share of the largest value, brightest at
 * its center, under a soft halo in its tone (the accent unless it sets one).
 * - Highlight: `active` (hover a region, or set it from a list beside the
 *   map) brightens that region, dims the rest, and runs an instrument's
 *   crosshair through it with its name and value on an ink tag. The
 *   crosshair glides from one region to the next.
 * - Motion: a scan sweeps the grid in from the west as the map scrolls into
 *   view, and each region lights as the scan reaches it, the light spreading
 *   outward from its center. Every change to a region's value sends one
 *   pulse from it: a ring in its tone that opens and fades, and the lit dots
 *   brighten or dim outward from the center.
 * - Semantics: the map is a labeled image with a summary; pair it with a
 *   list or table that holds the figures. It stays west to east in RTL.
 * - Reduced motion: drawn in place; no scan, no pulses; changes land at once. */

type DotMapTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface DotMapRegion {
  id: string
  /** Shown on the tag while the region is active, and in the map's summary. */
  name: string
  /** Longitude in degrees, east positive. */
  lon: number
  /** Latitude in degrees, north positive. */
  lat: number
  /** Lights the dots around it: the reach and strength grow with its share of the largest value. */
  value: number
  /** Default: the accent. */
  tone?: DotMapTone
}

interface DotMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  regions?: readonly DotMapRegion[]
  /** The highlighted region's id; `null` for none. Set it to follow a list beside the map. */
  active?: string | null
  /** Default: none. */
  defaultActive?: string | null
  /** Hovering or tapping a region on the map, and leaving it. */
  onActiveChange?: (id: string | null) => void
  /** Formats values on the tag and in the summary. Default: the locale's compact number format. */
  formatValue?: (value: number) => string
  /** Accessible name of the map. Default: the labels' "World map". */
  label?: string
}

const COLS = LAND.rows[0].length
const ROWS = LAND.rows.length
/** Land dots as [column, row], and one path that draws them all (round caps on zero-length segments). */
const DOTS = LAND.rows.flatMap((row, r) => [...row].flatMap((cell, c) => (cell === '#' ? [[c, r] as const] : [])))
const LAND_PATH = DOTS.map(([c, r]) => `M${c + 0.5} ${r + 0.5}h0`).join('')

/** A region's reach in cells, from the least to the most traffic. */
const REACH = [1.6, 5.5] as const
/** Pointer distance, in cells, within which the nearest region answers a hover. */
const HOVER_RADIUS = 4.5

const project = (lon: number, lat: number) => ({ x: (lon + 180) / LAND.step, y: (LAND.north - lat) / LAND.step })
const toneFill = (tone: DotMapTone) => toneColor(tone, 'var(--color-fg)')

function DotMap({ regions = [], active: activeProp, defaultActive = null, onActiveChange, formatValue, label, className, ...props }: DotMapProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(dotMapLabels)
  const uid = useId().replace(/[^\w-]/g, '')
  const summaryId = `${uid}-summary`
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  // The reveal staggers everything behind the scan; once it has run, updates ripple from each center alone.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!inView || k.reduced) return
    const timer = setTimeout(() => setSettled(true), k.ms('deliberate') + k.ms('slow'))
    return () => clearTimeout(timer)
  }, [inView, k])
  const [active, setActive] = useControllableState<string | null>(activeProp, defaultActive)
  const format = useMemo(() => formatValue ?? numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format, [formatValue, locale])

  const change = (id: string | null) => {
    if (id === active) return
    setActive(id)
    onActiveChange?.(id)
  }

  const peak = regions.reduce((max, r) => Math.max(max, r.value), 0)
  const placed = useMemo(
    () =>
      regions.map((region) => {
        const share = peak > 0 ? Math.max(0, region.value) / peak : 0
        return { region, ...project(region.lon, region.lat), share, reach: REACH[0] + (REACH[1] - REACH[0]) * Math.sqrt(share) }
      }),
    [regions, peak],
  )

  // The dots a region can ever light: fixed while regions keep their places,
  // so a change in value fades the same dots rather than swapping them.
  const positions = placed.map((p) => `${p.region.id}:${p.x}:${p.y}`).join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: the set depends on positions only
  const near = useMemo(
    () => DOTS.filter(([c, r]) => placed.some((p) => Math.hypot(c + 0.5 - p.x, r + 0.5 - p.y) <= REACH[1])),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the set depends on positions only
    [positions],
  )
  const lit = near.map(([c, r]) => {
    let best = { level: 0, tone: 'accent' as DotMapTone, distance: 0, id: '' }
    for (const p of placed) {
      const distance = Math.hypot(c + 0.5 - p.x, r + 0.5 - p.y)
      if (distance >= p.reach || p.share <= 0) continue
      // Brightest at the center, easing out toward the edge; a small region is dimmer overall.
      const level = (1 - distance / p.reach) ** 1.25 * (0.35 + 0.65 * Math.sqrt(p.share))
      if (level > best.level) best = { level, tone: p.region.tone ?? 'accent', distance, id: p.region.id }
    }
    return { key: `${c}-${r}`, x: c + 0.5, y: r + 0.5, ...best }
  })

  // One pulse per update: a region whose value changed since the last render sends a ring.
  const [pulses, setPulses] = useState<Record<string, number>>({})
  const lastValues = useRef<Map<string, number> | null>(null)
  const values = regions.map((r) => `${r.id}=${r.value}`).join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: compares values, not identity
  useEffect(() => {
    const previous = lastValues.current
    lastValues.current = new Map(regions.map((r) => [r.id, r.value]))
    if (!previous || k.reduced) return
    const changed = regions.filter((r) => previous.has(r.id) && previous.get(r.id) !== r.value)
    if (changed.length) setPulses((p) => Object.fromEntries([...Object.entries(p), ...changed.map((r) => [r.id, (p[r.id] ?? 0) + 1])]))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compares values, not identity
  }, [values, k.reduced])

  const current = placed.find((p) => p.region.id === active)
  const largest = placed.reduce<(typeof placed)[number] | undefined>((top, p) => (!top || p.region.value > top.region.value ? p : top), undefined)
  const tones = [...new Set(placed.map((p) => p.region.tone ?? 'accent'))]
  // The scan takes the deliberate token to cross; everything lights as it passes.
  const scanAt = (x: number) => (k.reduced || settled ? 0 : (x / COLS) * k.duration('deliberate'))

  const hover = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!box.width) return
    const x = ((event.clientX - box.left) / box.width) * COLS
    const y = ((event.clientY - box.top) / box.height) * ROWS
    let nearest: string | null = null
    let best = HOVER_RADIUS
    for (const p of placed) {
      const distance = Math.hypot(x - p.x, y - p.y)
      if (distance < best) {
        best = distance
        nearest = p.region.id
      }
    }
    change(nearest)
  }

  return (
    <MotionFeatures>
      {/* Clipped across only: the tag's full-size layer slides past the end edge and would widen the page; the tag itself keeps inside by its alignment. */}
      <div data-slot="dot-map" data-reduced-motion={k.reduced || undefined} className={cn('relative w-full min-w-0 overflow-x-clip', className)} {...props}>
        <div
          ref={ref}
          role="img"
          aria-label={label ?? labels.dotMap}
          aria-describedby={largest ? summaryId : undefined}
          // Geography doesn't mirror: west stays on the left in RTL.
          dir="ltr"
          data-slot="dot-map-canvas"
          data-active={current ? '' : undefined}
          className="group/dot-map relative w-full"
          style={
            {
              aspectRatio: `${COLS} / ${ROWS}`,
              '--dot-map-cross': `color-mix(in oklab, ${toneFill(current?.region.tone ?? 'accent')} 45%, transparent)`,
            } as CSSProperties
          }
          onPointerMove={hover}
          onPointerDown={hover}
          onPointerLeave={() => change(null)}
        >
          <svg aria-hidden viewBox={`0 0 ${COLS} ${ROWS}`} className="absolute inset-0 size-full overflow-visible">
            <defs>
              {tones.map((tone) => (
                <radialGradient key={tone} id={`${uid}-${tone}`}>
                  <stop offset="0%" style={{ stopColor: toneFill(tone), stopOpacity: 0.55 }} />
                  <stop offset="55%" style={{ stopColor: toneFill(tone), stopOpacity: 0.16 }} />
                  <stop offset="100%" style={{ stopColor: toneFill(tone), stopOpacity: 0 }} />
                </radialGradient>
              ))}
            </defs>
            <path
              data-slot="dot-map-land"
              d={LAND_PATH}
              className="own:text-line-strong transition-[clip-path] yj-duration-deliberate ease-emphasized reduced:transition-none"
              stroke="currentColor"
              strokeWidth={0.46}
              strokeLinecap="round"
              style={{ clipPath: shown ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' }}
            />
            {placed.map((p) => (
              <circle
                key={p.region.id}
                data-slot="dot-map-glow"
                cx={p.x}
                cy={p.y}
                r={REACH[1] * 1.3}
                fill={`url(#${uid}-${p.region.tone ?? 'accent'})`}
                className="origin-center transition-[opacity,scale] yj-duration-slow ease-standard [transform-box:fill-box] reduced:transition-none"
                style={{
                  scale: shown ? String(0.35 + 0.65 * (p.reach / REACH[1])) : '0.2',
                  opacity: !shown ? 0 : current && current !== p ? 0.35 : 1,
                  transitionDelay: `${scanAt(p.x)}s`,
                }}
              />
            ))}
            <g data-slot="dot-map-lit">
              {lit.map((dot) => {
                const dimmed = current && current.region.id !== dot.id
                return (
                  <circle
                    key={dot.key}
                    cx={dot.x}
                    cy={dot.y}
                    r={0.29}
                    fill={toneFill(dot.tone)}
                    className="transition-opacity yj-duration-slow ease-standard reduced:transition-none"
                    style={{
                      opacity: shown ? dot.level * (dimmed ? 0.4 : 1) : 0,
                      transitionDelay: `${scanAt(dot.x) + dot.distance * k.stagger('tight')}s`,
                    }}
                  />
                )
              })}
            </g>
            {placed.map((p) => {
              const on = current === p
              const color = toneFill(p.region.tone ?? 'accent')
              return (
                <g key={p.region.id} data-slot="dot-map-region" data-active={on || undefined} style={{ color }}>
                  {pulses[p.region.id] && shown ? (
                      <m.circle
                        key={pulses[p.region.id]}
                        data-slot="dot-map-pulse"
                        cx={p.x}
                        cy={p.y}
                        r={p.reach * 1.25}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.25}
                        vectorEffect="non-scaling-stroke"
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        initial={{ scale: 0.25, opacity: 0.9 }}
                        animate={{ scale: 1, opacity: 0 }}
                        transition={k.tween('deliberate', 'enter')}
                      />
                    ) : null}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={on ? 1.35 : 0.95}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={on ? 1 : 0.55}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    className="transition-[stroke-opacity] yj-duration-fast ease-standard"
                  />
                  <circle cx={p.x} cy={p.y} r={0.42} fill="currentColor" />
                </g>
              )
            })}
          </svg>

          {/* The crosshair and tag: HTML over the map, each on a full-size layer slid by the region's place. */}
          <div aria-hidden data-slot="dot-map-crosshair" className="pointer-events-none absolute inset-0 overflow-hidden">
            <m.div
              className="absolute inset-0"
              initial={false}
              animate={{ x: `${((current?.x ?? 0) / COLS) * 100}%`, opacity: current ? 1 : 0 }}
              transition={k.reduced ? { type: false } : { x: k.spring('smooth'), opacity: k.tween('fast') }}
            >
              <span /* youj-allow: physical side, map coordinates */ className="absolute inset-y-0 left-0 border-l border-dashed border-(--dot-map-cross)" />
            </m.div>
            <m.div
              className="absolute inset-0"
              initial={false}
              animate={{ y: `${((current?.y ?? 0) / ROWS) * 100}%`, opacity: current ? 1 : 0 }}
              transition={k.reduced ? { type: false } : { y: k.spring('smooth'), opacity: k.tween('fast') }}
            >
              <span className="absolute inset-x-0 top-0 border-t border-dashed border-(--dot-map-cross)" />
            </m.div>
          </div>
          <m.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ x: `${((current?.x ?? 0) / COLS) * 100}%`, y: `${((current?.y ?? 0) / ROWS) * 100}%` }}
            transition={k.reduced ? { type: false } : k.spring('smooth')}
          >
            <AnimatePresence>
              {current && (
                <m.span
                  key="tag"
                  data-slot="dot-map-tag"
                  data-align={current.x < COLS * 0.14 ? 'start' : current.x > COLS * 0.86 ? 'end' : 'center'}
                  data-side={current.y < ROWS * 0.28 ? 'bottom' : 'top'}
                  className={cn(
                    // youj-allow: physical side, map coordinates
                    'absolute top-0 left-0 flex items-baseline gap-1.5 rounded-[min(var(--radius-sm),6px)] bg-fg px-1.5 py-0.5 own:font-mono text-ui-xs whitespace-nowrap text-canvas shadow-sm',
                    'data-[align=center]:-translate-x-1/2 data-[align=end]:translate-x-[calc(-100%+0.5rem)] data-[align=start]:-translate-x-2',
                    'data-[side=top]:-translate-y-[calc(100%+0.75rem)] data-[side=bottom]:translate-y-3',
                  )}
                  initial={k.reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={k.tween('fast')}
                >
                  <bdi data-slot="dot-map-tag-name">{current.region.name}</bdi>
                  <span data-slot="dot-map-tag-value" className="opacity-65 own:tabular-nums">
                    {format(current.region.value)}
                  </span>
                </m.span>
              )}
            </AnimatePresence>
          </m.div>
        </div>
        {largest && (
          <p id={summaryId} data-slot="dot-map-summary" className="sr-only">
            {labels.dotMapSummary(placed.length, largest.region.name, format(largest.region.value))}
          </p>
        )}
      </div>
    </MotionFeatures>
  )
}

export { DotMap, type DotMapProps, type DotMapRegion, type DotMapTone }
