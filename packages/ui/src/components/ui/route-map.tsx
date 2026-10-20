'use client'

import { useId, useRef, type ComponentProps, type ReactNode } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { routeMapLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'

/* A route on a drawn map, with no tiles: land, water, parks and roads are
 * abstract shapes in the theme's own tones, so the routes are the loudest
 * thing on it. Each route is a smooth line through its stops and waypoints in
 * its state: driven (quiet), on time (ink), delayed (the danger tone) or
 * proposed (a dotted line in the accent: a reroute nobody has accepted yet).
 * Stops are markers by kind (origin, stop, destination, and where the
 * vehicle is now, which pulses), and a stop can carry a card anchored beside
 * it: an ETA, a warning, a reroute to approve.
 * - Markers are buttons in route order: focus or hover shows the stop's
 *   name, pressing picks it (`value`). A legend names the states on the map.
 * - Text alternative: the map is a group whose routes and stops are also
 *   written out as lists for screen readers, every stop with its kind and
 *   detail, every route with its state and the stops it runs through.
 * - Motion: when the map scrolls into view the driven line draws from the
 *   origin, the line ahead follows, the delayed stretch draws in its tone and
 *   the proposed route draws last; markers land as their line reaches them
 *   and cards rise in after. The current position's ring pulses while the
 *   map is on screen. Reduced motion: everything drawn in place, no pulse.
 * - Geography doesn't mirror: in RTL the map stays as drawn, and only the
 *   text in cards and the legend runs right to left. */

type RouteMapStatus = 'done' | 'on-time' | 'delayed' | 'proposed'
type RouteMapStopKind = 'origin' | 'stop' | 'destination' | 'current'
type RouteMapPoint = [x: number, y: number]

interface RouteMapStop {
  id: string
  /** "Harbor depot". */
  name: string
  /** Across the map, 0–100 from its left edge. */
  x: number
  /** Down the map, 0–100 from its top. */
  y: number
  /** Its marker. Default `stop`. */
  kind?: RouteMapStopKind
  /** A line said with its name and shown on hover: "Departed 09:14", "ETA 15:49". */
  detail?: string
  /** Your own marker face: a truck, a courier. The current position wears it on the accent; any other stop on an ink disc, in place of its dot. */
  icon?: ReactNode
  /** A card anchored beside the marker, always shown. */
  card?: ReactNode
  /** Which side of the marker the card sits on. Default: left or right, toward the middle of the map. */
  cardSide?: 'left' | 'right' | 'top' | 'bottom'
}

interface RouteMapRoute {
  id: string
  /** What it passes through, in order: stop ids, and waypoints as [x, y] (0–100) to bend it along the roads. */
  path: (string | RouteMapPoint)[]
  /** Default `on-time`. */
  status?: RouteMapStatus
  /** Its name in the legend and the text alternative: "AI proposed via ring road". Default: its state's word. */
  label?: string
}

interface RouteMapTerrain {
  /** Filled water shapes (path data in a 100 × 100 box). */
  water?: string[]
  /** Rivers and channels: water drawn as thick lines. */
  rivers?: string[]
  /** Filled green shapes. */
  parks?: string[]
  /** Major roads. */
  roads?: string[]
  /** Streets, drawn finer. */
  streets?: string[]
}

interface RouteMapProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue'> {
  stops: RouteMapStop[]
  routes: RouteMapRoute[]
  /** The land under the routes. Default: a built-in abstract coast with a bay, a river, parks and a road grid. */
  terrain?: RouteMapTerrain
  /** The picked stop's id (controlled); `null` for none. */
  value?: string | null
  /** The stop picked at first. Default: none. */
  defaultValue?: string | null
  onValueChange?: (id: string | null) => void
  /** Shows the legend of route states. Default true. */
  legend?: boolean
  /** The map's width over its height. Default 16 / 10. */
  ratio?: number
  /** The map's accessible name. Default: the labels' "Route map". */
  label?: string
  /** Your own overlays on the map: controls, a summary card. */
  children?: ReactNode
}

const DEFAULT_TERRAIN: Required<RouteMapTerrain> = {
  water: [
    'M0 50 C 8 49 14 55 17 62 C 20 69 19 76 26 81 C 32 86 30 93 34 100 L 0 100 Z',
    'M76 74 C 80 69 89 69 92 74 C 95 79 89 84 83 83 C 77 82 73 79 76 74 Z',
  ],
  rivers: [
    'M13 57 C 22 52 30 55 39 50 C 48 45 54 48 62 43 C 70 38 76 41 84 35 C 90 31 95 32 100 29',
    'M62 43 C 65 51 61 58 65 66 C 68 72 72 75 77 74',
  ],
  parks: [
    'M54 64 C 58 60 66 61 68 66 C 70 72 62 76 57 74 C 53 72 52 68 54 64 Z',
    'M20 14 C 26 10 34 13 33 19 C 32 25 23 26 20 22 C 18 19 18 16 20 14 Z',
    'M86 8 C 90 6 96 8 96 12 C 96 17 89 18 86 15 C 84 13 84 10 86 8 Z',
    'M41 31 C 45 28 51 30 50 34 C 49 38 43 38 41 35 C 40 34 40 32 41 31 Z',
    'M63 85 C 67 82 73 84 72 88 C 71 92 65 92 63 89 C 62 88 62 86 63 85 Z',
  ],
  roads: [
    'M0 24 C 20 28 40 21 60 27 S 88 22 100 18',
    'M31 0 C 33 20 29 40 35 60 S 41 88 39 100',
    'M67 0 C 65 28 73 50 71 70 S 75 92 77 100',
    'M0 84 C 28 74 58 86 100 66',
  ],
  // A finer grid of streets gives the land a city's grain without competing with the routes.
  streets: [
    'M0 38 C 30 40 60 34 100 40',
    'M0 66 C 22 62 44 70 66 60',
    'M48 0 C 50 30 46 60 52 100',
    'M84 0 C 82 30 88 60 86 100',
    'M14 0 C 16 14 12 30 16 46',
    'M40 76 C 54 80 64 92 70 100',
    'M74 52 C 82 50 92 56 100 52',
    'M8 92 C 14 88 20 90 24 96',
    'M0 11 C 30 9 60 14 100 8',
    'M22 0 C 24 14 21 28 25 40',
    'M58 0 C 56 16 60 30 57 44',
    'M94 0 C 92 20 96 40 93 60',
    'M36 31 C 48 34 60 30 72 33',
    'M44 56 C 54 58 62 53 72 56',
    'M56 77 C 66 80 76 76 88 79',
    'M24 64 C 30 68 36 66 42 72',
    'M58 91 C 72 93 84 89 100 93',
    'M78 44 C 82 52 80 60 84 64',
    'M7 31 C 14 34 22 30 30 34',
  ],
}

const STROKE: Record<RouteMapStatus, string> = {
  done: 'stroke-line-strong',
  'on-time': 'stroke-fg',
  delayed: 'stroke-danger',
  proposed: 'stroke-accent',
}
/** The order lines draw in when the map arrives. */
const ORDER: RouteMapStatus[] = ['done', 'on-time', 'delayed', 'proposed']

/** A smooth line through the points (Catmull–Rom as cubic Béziers). */
function smooth(points: RouteMapPoint[]) {
  if (points.length < 2) return ''
  const f = (n: number) => +n.toFixed(2)
  let d = `M${f(points[0]![0])},${f(points[0]![1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!
    const t = 1 / 6
    d += ` C${f(p1[0] + (p2[0] - p0[0]) * t)},${f(p1[1] + (p2[1] - p0[1]) * t)} ${f(p2[0] - (p3[0] - p1[0]) * t)},${f(p2[1] - (p3[1] - p1[1]) * t)} ${f(p2[0])},${f(p2[1])}`
  }
  return d
}

function RouteMap({
  stops,
  routes,
  terrain = DEFAULT_TERRAIN,
  value,
  defaultValue = null,
  onValueChange,
  legend = true,
  ratio = 16 / 10,
  label,
  className,
  style,
  children,
  ...props
}: RouteMapProps) {
  const k = useYouj()
  const labels = useComponentLabels(routeMapLabels)
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const arrived = useInView(ref, { once: true, amount: 0.3 })
  const onScreen = useInView(ref, { amount: 0 })
  const shown = k.reduced || arrived
  const [picked, setPicked] = useControllableState<string | null>(value, defaultValue)
  const stopOf = new Map(stops.map((s) => [s.id, s]))
  const kindWord: Record<RouteMapStopKind, string> = { origin: labels.routeOrigin, stop: labels.routeStop, destination: labels.routeDestination, current: labels.routeCurrent }
  const statusWord: Record<RouteMapStatus, string> = { done: labels.routeDone, 'on-time': labels.routeOnTime, delayed: labels.routeDelayed, proposed: labels.proposed }

  const drawn = [...routes].sort((a, b) => ORDER.indexOf(a.status ?? 'on-time') - ORDER.indexOf(b.status ?? 'on-time'))
  const beat = k.reduced ? 0 : k.duration('slow')
  // Each state draws after the ones before it: a route's delay is its state's place in the order.
  const delayOf = (status: RouteMapStatus) => ORDER.filter((s) => drawn.some((r) => (r.status ?? 'on-time') === s)).indexOf(status) * beat
  const pointsOf = (route: RouteMapRoute) =>
    route.path.flatMap((p): RouteMapPoint[] => (typeof p === 'string' ? (stopOf.has(p) ? [[stopOf.get(p)!.x, stopOf.get(p)!.y]] : []) : [p]))
  // A stop lands when the first line through it starts drawing.
  const landOf = (stop: RouteMapStop) => {
    const through = drawn.filter((r) => r.path.includes(stop.id)).map((r) => delayOf(r.status ?? 'on-time'))
    return through.length ? Math.min(...through) : 0
  }
  const legendItems = ORDER.flatMap((status) => {
    const route = drawn.find((r) => (r.status ?? 'on-time') === status)
    return route ? [{ status, text: route.label ?? statusWord[status] }] : []
  })
  const press = (stopId: string) => {
    const next = picked === stopId ? null : stopId
    setPicked(next)
    onValueChange?.(next)
  }

  return (
    <MotionFeatures>
      <div
        ref={ref}
        role="group"
        aria-label={label ?? labels.routeMap}
        data-slot="route-map"
        data-reduced-motion={k.reduced || undefined}
        className={cn(
          'relative isolate own:w-full overflow-hidden own:rounded-xl border own:border-line',
          'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),var(--color-surface))]',
          className,
        )}
        style={{ aspectRatio: ratio, ...style }}
        {...props}
      >
        {/* The land: a faint dot texture, water, parks and roads, under everything. */}
        <div aria-hidden data-slot="route-map-land" className="absolute inset-0 [background-image:radial-gradient(color-mix(in_oklab,var(--color-fg)_9%,transparent)_0.75px,transparent_0.75px)] [background-size:12px_12px]" />
        <m.svg
          aria-hidden
          data-slot="route-map-terrain"
          className="absolute inset-0 size-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          initial={k.reduced ? false : { opacity: 0 }}
          animate={shown ? { opacity: 1 } : undefined}
          transition={k.reduced ? { type: false } : k.tween('slow', 'enter')}
        >
          {terrain.water?.map((d, i) => (
            <path key={`w${i}`} d={d} className="fill-[color-mix(in_oklab,var(--color-accent)_6%,color-mix(in_oklab,var(--color-fg)_9%,var(--color-surface)))]" />
          ))}
          {terrain.rivers?.map((d, i) => (
            <path key={`r${i}`} d={d} fill="none" strokeWidth={7} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-[color-mix(in_oklab,var(--color-accent)_6%,color-mix(in_oklab,var(--color-fg)_9%,var(--color-surface)))]" />
          ))}
          {terrain.parks?.map((d, i) => (
            <path key={`p${i}`} d={d} className="fill-[color-mix(in_oklab,var(--color-success)_9%,transparent)]" />
          ))}
          {terrain.streets?.map((d, i) => (
            <path key={`s${i}`} d={d} fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-line" />
          ))}
          {terrain.roads?.map((d, i) => (
            <g key={`d${i}`}>
              <path d={d} fill="none" strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-line" />
              <path d={d} fill="none" strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),var(--color-surface))]" />
            </g>
          ))}
        </m.svg>

        {/* The routes. */}
        <svg aria-hidden data-slot="route-map-routes" className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {drawn.map((route) => {
            const status = route.status ?? 'on-time'
            const d = smooth(pointsOf(route))
            const mask = `${id}-${route.id}`
            // Lines keep a constant width at any size (non-scaling), so they draw in through a mask in the map's own
            // units: a wide stroke that grows along the path reveals the line under it, dotted or solid.
            return (
              <g key={route.id} data-slot="route-map-route" data-status={status} mask={`url(#${mask})`}>
                <mask id={mask} maskUnits="userSpaceOnUse" x={-10} y={-10} width={120} height={120}>
                  <m.path
                    d={d}
                    fill="none"
                    stroke="white"
                    strokeWidth={8}
                    strokeLinecap="round"
                    initial={k.reduced ? false : { pathLength: 0 }}
                    animate={shown ? { pathLength: 1 } : undefined}
                    transition={k.reduced ? { type: false } : { ...k.tween('deliberate', 'emphasized'), delay: delayOf(status) }}
                  />
                </mask>
                {status === 'proposed' ? (
                  <path d={d} fill="none" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="0.01 6" vectorEffect="non-scaling-stroke" className={STROKE[status]} />
                ) : (
                  <>
                    {/* A casing in the land's tone keeps the line clear of the roads under it. */}
                    <path d={d} fill="none" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),var(--color-surface))]" />
                    <path d={d} fill="none" strokeWidth={status === 'done' ? 2.5 : 3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className={STROKE[status]} />
                  </>
                )}
              </g>
            )
          })}
        </svg>

        {/* Markers and their cards. The map doesn't mirror, so neither do they. */}
        {stops.map((stop) => {
          const kind = stop.kind ?? 'stop'
          const isPicked = picked === stop.id
          // A stop with a face of its own (a truck on the fleet map) is a small ink disc wearing it.
          const face = kind !== 'current' && stop.icon !== undefined
          const side = stop.cardSide ?? (stop.x > 55 ? 'left' : 'right')
          const land = landOf(stop)
          const name = [stop.name, kindWord[kind], stop.detail].filter(Boolean).join(', ')
          return (
            <div
              key={stop.id}
              data-slot="route-map-stop"
              data-kind={kind}
              className="absolute z-10 size-0"
              style={{ left: `${stop.x}%`, top: `${stop.y}%` }} // youj-allow: physical side the map doesn't mirror
            >
              <m.button
                type="button"
                data-slot="route-map-marker"
                aria-label={name}
                aria-pressed={isPicked}
                onClick={() => press(stop.id)}
                className={cn(
                  'peer/marker focus-ring absolute top-0 left-0 own:grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full', // youj-allow: physical side the map doesn't mirror
                  'before:absolute before:-inset-3 before:content-[""]',
                  kind === 'current'
                    ? 'size-7 own:bg-accent own:text-on-accent shadow-[0_0_0_3px_var(--color-surface)]'
                    : face
                      ? cn('size-6 shadow-[0_0_0_2px_var(--color-surface)] transition-colors yj-duration-fast ease-standard', isPicked ? 'own:bg-accent own:text-on-accent' : 'own:bg-fg own:text-canvas')
                      : kind === 'destination'
                        ? 'size-4'
                        : 'size-3',
                )}
                initial={k.reduced ? false : { scale: 0, opacity: 0 }}
                animate={shown ? { scale: isPicked ? 1.15 : 1, opacity: 1 } : undefined}
                transition={k.reduced ? { type: false } : { ...k.spring(kind === 'destination' ? 'settle' : 'snappy'), delay: land }}
              >
                {kind === 'current' ? (
                  <>
                    {!k.reduced && onScreen && (
                      <m.span
                        aria-hidden
                        className="absolute inset-0 rounded-full border-2 border-accent"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ ...k.tween('deliberate', 'exit'), duration: k.duration('deliberate') * 2.4, repeat: Infinity }}
                      />
                    )}
                    <span aria-hidden className="relative own:grid place-items-center">
                      {stop.icon ?? <span className="size-2.5 rounded-full bg-on-accent" />}
                    </span>
                  </>
                ) : face ? (
                  <span aria-hidden className="own:grid place-items-center">
                    {stop.icon}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      'size-full rounded-full shadow-[0_0_0_2px_var(--color-surface)]',
                      kind === 'origin' && 'own:bg-fg',
                      kind === 'stop' && 'border-2 border-fg own:bg-surface',
                      kind === 'destination' && 'border-[2.5px] border-fg own:bg-surface [background-image:radial-gradient(var(--color-fg)_0_2.5px,transparent_2.5px)]',
                      isPicked && 'border-accent',
                    )}
                  />
                )}
              </m.button>
              {/* The name, while the marker is hovered, focused or picked. */}
              {!stop.card && (
                <span
                  aria-hidden
                  data-slot="route-map-tag"
                  data-open={isPicked || undefined}
                  className={cn(
                    'pointer-events-none absolute bottom-3 left-0 -translate-x-1/2 own:flex flex-col items-center rounded-md own:bg-fg px-2 py-1 own:text-ui-xs whitespace-nowrap own:text-canvas opacity-0 translate-y-1', // youj-allow: physical side the map doesn't mirror
                    'transition-[opacity,translate] yj-duration-fast ease-standard reduced:transition-none',
                    'peer-hover/marker:translate-y-0 peer-hover/marker:opacity-100 peer-focus-visible/marker:translate-y-0 peer-focus-visible/marker:opacity-100 data-open:translate-y-0 data-open:opacity-100',
                  )}
                >
                  <span className="own:font-medium">{stop.name}</span>
                  {stop.detail && <span className="opacity-70">{stop.detail}</span>}
                </span>
              )}
              {stop.card && (
                <m.div
                  data-slot="route-map-card"
                  data-side={side}
                  className={cn(
                    'absolute w-max max-w-56 own:rounded-lg border own:border-line own:bg-overlay own:p-2.5 own:text-ui-sm own:text-fg own:shadow-md',
                    // youj-allow: physical side the map doesn't mirror
                    side === 'right' ? 'left-5' : side === 'left' ? 'right-5' : 'left-0 -translate-x-1/2',
                    side === 'top' ? 'bottom-5' : side === 'bottom' ? 'top-5' : stop.y < 25 ? 'top-0 -translate-y-3' : stop.y > 75 ? 'top-0 -translate-y-[calc(100%---spacing(3))]' : 'top-0 -translate-y-1/2',
                  )}
                  initial={k.reduced ? false : { opacity: 0, y: 6 }}
                  animate={shown ? { opacity: 1, y: 0 } : undefined}
                  transition={k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: land + k.duration('deliberate') * 0.6 }}
                >
                  {stop.card}
                </m.div>
              )}
            </div>
          )
        })}

        {legend && legendItems.length > 0 && (
          <ul
            aria-hidden
            data-slot="route-map-legend"
            className="absolute start-3 bottom-3 z-20 own:flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border own:border-line own:bg-overlay/90 youj-allow-glass own:px-3 own:py-1.5 own:text-ui-xs own:text-fg own:shadow-sm-soft backdrop-blur-sm"
          >
            {legendItems.map((item) => (
              <li key={item.status} data-status={item.status} className="own:flex items-center gap-1.5">
                <svg width="16" height="6" viewBox="0 0 16 6" className="shrink-0 overflow-visible">
                  <path
                    d="M1 3 H15"
                    fill="none"
                    strokeWidth={item.status === 'proposed' ? 2.5 : 3}
                    strokeLinecap="round"
                    strokeDasharray={item.status === 'proposed' ? '0.01 5' : undefined}
                    className={STROKE[item.status]}
                  />
                </svg>
                {item.text}
              </li>
            ))}
          </ul>
        )}

        {children}

        {/* The text alternative. */}
        <div className="sr-only">
          <ol data-slot="route-map-stops">
            {stops.map((stop) => (
              <li key={stop.id}>{[stop.name, kindWord[stop.kind ?? 'stop'], stop.detail].filter(Boolean).join(', ')}</li>
            ))}
          </ol>
          <ul data-slot="route-map-summary">
            {drawn.map((route) => (
              <li key={route.id}>
                {`${route.label ?? statusWord[route.status ?? 'on-time']}: ${route.path.flatMap((p) => (typeof p === 'string' && stopOf.has(p) ? [stopOf.get(p)!.name] : [])).join(' → ')}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MotionFeatures>
  )
}

export { RouteMap, type RouteMapPoint, type RouteMapProps, type RouteMapRoute, type RouteMapStatus, type RouteMapStop, type RouteMapStopKind, type RouteMapTerrain }
