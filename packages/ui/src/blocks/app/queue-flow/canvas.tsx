'use client'

import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { BanIcon, BotIcon, CodeIcon, CreditCardIcon, MailIcon, MessagesIcon, PhoneIcon, RouteIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { HOLDING, OVER_TARGET, routeKey, type QueueFlowNode, type QueueFlowRoute, type QueueFlowDesk, type QueueFlowHealth, type QueueFlowIconName, type QueueFlowCopy } from './data'
import { centreOf, curveOf, Items, type RouteTone, type Lattice } from './items'

/* The desk as a drawing: channels, triage and teams in three columns (three
 * rows on a narrow canvas, by container query, so it's right from the
 * server's first paint), joined by routes whose weight follows their volume,
 * with tickets riding them. Every step is a button: one tab stop, arrows
 * follow the flow (along a route to the nearest step it sends to or gets
 * tickets from) or move within a column, Home and End jump. Picking one opens
 * it in the inspector. The routes live in a 0–100 box stretched over the node
 * centers, so they need no measuring; only the moving tickets do. */

const ICONS: Record<QueueFlowIconName, ComponentType<{ size?: number; className?: string }>> = {
  mail: MailIcon,
  phone: PhoneIcon,
  messages: MessagesIcon,
  route: RouteIcon,
  bot: BotIcon,
  card: CreditCardIcon,
  code: CodeIcon,
  ban: BanIcon,
}

/** A named icon at the card's size, or your own, in the same place. */
const iconOf = (icon: ReactNode) => {
  const Icon = typeof icon === 'string' ? ICONS[icon as QueueFlowIconName] : undefined
  const hidden = cn('shrink-0 text-fg-muted', '@max-[36rem]/flow:hidden')
  return Icon ? (
    <Icon size={13} className={hidden} />
  ) : (
    <span aria-hidden className={cn('inline-flex', hidden)}>
      {icon}
    </span>
  )
}

const DOT: Record<QueueFlowHealth, string> = {
  ok: 'bg-success',
  over: 'bg-warning',
  holding: 'bg-warning',
  sink: 'bg-danger',
}

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

const pathOf = (a: { x: number; y: number }, b: { x: number; y: number }, vertical: boolean) => {
  const [p0, p1, p2, p3] = curveOf(a, b, vertical).map((p) => `${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`)
  return `M${p0} C${p1} ${p2} ${p3}`
}

/** The stroke a route's volume (tickets an hour) earns, px. */
const weightOf = (rate: number) => (rate >= 200 ? 2.5 : rate >= 80 ? 2 : rate >= 25 ? 1.5 : 1)

interface DeskCanvasProps {
  nodes: QueueFlowNode[]
  routes: QueueFlowRoute[]
  state: QueueFlowDesk
  selected: string
  onSelect: (id: string) => void
  /** Each step's figure for the chosen lens, formatted. */
  figure: (node: QueueFlowNode) => string
  copy: QueueFlowCopy
  /** The inspector's id. */
  controls: string
  counts: Record<string, number>
  paces: Record<string, number>
  tones: Record<string, RouteTone>
  running: boolean
}

export function FlowCanvas({ nodes, routes, state, selected, onSelect, figure, copy, controls, counts, paces, tones, running }: DeskCanvasProps) {
  const latticeRef = useRef<HTMLDivElement>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const [lattice, setLattice] = useState<Lattice | null>(null)

  // The dots need the lattice in pixels and which way it runs (the container query decides; CSS says which).
  useEffect(() => {
    const el = latticeRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      const vertical = getComputedStyle(el).getPropertyValue('--flow-v').trim() === '1'
      setLattice((prev) => (prev && prev.width === width && prev.height === height && prev.vertical === vertical ? prev : { width, height, vertical }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const order = [...nodes].sort((a, b) => a.layer - b.layer || a.lane - b.lane)
  const move = (e: KeyboardEvent<HTMLButtonElement>, node: QueueFlowNode) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const vertical = lattice?.vertical ?? false
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
    const next = vertical ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
    const prev = vertical ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
    let target: QueueFlowNode | undefined
    if (e.key === 'Home') target = order[0]
    else if (e.key === 'End') target = order.at(-1)
    else if (e.key === forward || e.key === back) {
      const ahead = e.key === forward
      const linked = routes.filter((route) => (ahead ? route.from === node.id : route.to === node.id)).map((route) => (ahead ? route.to : route.from))
      const layer = node.layer + (ahead ? 1 : -1)
      const pool = nodes.filter((n) => (linked.length ? linked.includes(n.id) : n.layer === layer))
      target = pool.sort((a, b) => Math.abs(a.lane - node.lane) - Math.abs(b.lane - node.lane))[0]
    } else if (e.key === next || e.key === prev) {
      const column = order.filter((n) => n.layer === node.layer)
      target = column[column.findIndex((n) => n.id === node.id) + (e.key === next ? 1 : -1)]
    } else return
    e.preventDefault()
    if (!target) return
    onSelect(target.id)
    buttons.current.get(target.id)?.focus()
  }

  return (
    <div className="@container/flow w-full">
      <div
        data-slot="queue-flow-canvas"
        className={cn(
          'relative h-[21rem] overflow-hidden rounded-lg [--flow-v:0] [--node-h:3.5rem] [--node-w:9.75rem]',
          '@max-[36rem]/flow:h-[24rem] @max-[36rem]/flow:[--flow-v:1] @max-[36rem]/flow:[--node-h:3.25rem] @max-[36rem]/flow:[--node-w:5.75rem]',
          // A dot grid under the drawing, from the ink: a planner's pad.
          'bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-fg)_13%,transparent)_1px,transparent_1.25px)] bg-size-[18px_18px] bg-center',
        )}
      >
        <div
          ref={latticeRef}
          className={cn(
            'absolute inset-x-[calc(var(--node-w)/2_+_0.75rem)] top-[calc(var(--node-h)/2_+_2.5rem)] bottom-[calc(var(--node-h)/2_+_1rem)]',
            '@max-[36rem]/flow:inset-x-[calc(var(--node-w)/2_+_0.25rem)] @max-[36rem]/flow:top-[calc(var(--node-h)/2_+_1rem)] @max-[36rem]/flow:bottom-[calc(var(--node-h)/2_+_0.75rem)]',
          )}
        >
          {copy.layers.map((name, layer) => (
            <span
              key={name}
              aria-hidden
              style={{ '--lu': layer / 2 } as CSSProperties}
              className={cn(
                'absolute start-[calc(var(--lu)*100%)] top-[calc(var(--node-h)/-2_-_1.75rem)] -translate-x-1/2 text-ui-xs whitespace-nowrap text-fg-muted rtl:translate-x-1/2',
                '@max-[36rem]/flow:hidden',
                VOICE,
              )}
            >
              {name}
            </span>
          ))}

          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible rtl:-scale-x-100">
            {routes.map((route) => {
              const key = routeKey(route)
              const from = nodes.find((n) => n.id === route.from)
              const to = nodes.find((n) => n.id === route.to)
              if (!from || !to) return null
              const rate = state.routes[key] ?? 0
              const tone = tones[key] ?? 'flow'
              const lit = route.from === selected || route.to === selected
              const stroke = cn(
                'fill-none transition-[stroke,stroke-width] yj-duration-slow ease-standard',
                tone === 'sink'
                  ? lit
                    ? 'stroke-danger'
                    : 'stroke-danger-line'
                  : tone === 'slow'
                    ? lit
                      ? 'stroke-warning'
                      : 'stroke-warning'
                    : lit
                      ? 'stroke-fg-subtle'
                      : 'stroke-line-strong',
              )
              return (
                <g key={key} data-route={key} data-tone={tone}>
                  <path
                    d={pathOf(centreOf(from, false), centreOf(to, false), false)}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={weightOf(rate)}
                    className={cn(stroke, '@max-[36rem]/flow:hidden')}
                  />
                  <path
                    d={pathOf(centreOf(from, true), centreOf(to, true), true)}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={weightOf(rate)}
                    className={cn(stroke, 'hidden @max-[36rem]/flow:inline')}
                  />
                </g>
              )
            })}
          </svg>

          <Items nodes={nodes} routes={routes} counts={counts} paces={paces} tones={tones} lattice={lattice} running={running} />

          <div role="group" aria-label={copy.graph}>
            {nodes.map((node) => {
              const stats = state.nodes[node.id]
              const health = stats?.health ?? 'ok'
              const fill = node.limit && stats ? Math.min(1, stats.waiting / node.limit) : undefined
              const on = node.id === selected
              const place = {
                '--hx': `${(node.layer / 2) * 100}%`,
                '--hy': `${(node.lane / 2) * 100}%`,
                '--vx': `${(node.lane / 2) * 100}%`,
                '--vy': `${(node.layer / 2) * 100}%`,
              } as CSSProperties
              return (
                <button
                  key={node.id}
                  ref={(el) => {
                    if (el) buttons.current.set(node.id, el)
                  }}
                  type="button"
                  data-node={node.id}
                  data-health={health}
                  aria-pressed={on}
                  aria-controls={controls}
                  aria-label={`${node.label}, ${copy.kinds[node.kind]}, ${copy.health[health]}, ${figure(node)}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => onSelect(node.id)}
                  onFocus={() => onSelect(node.id)}
                  onKeyDown={(e) => move(e, node)}
                  style={place}
                  className={cn(
                    'absolute start-(--hx) top-(--hy) flex h-(--node-h) w-(--node-w) -translate-x-1/2 -translate-y-1/2 flex-col justify-center gap-1 rounded-lg border border-line bg-surface px-2.5 pb-1 text-start shadow-xs rtl:translate-x-1/2',
                    '@max-[36rem]/flow:start-(--vx) @max-[36rem]/flow:top-(--vy) @max-[36rem]/flow:px-2',
                    'cursor-default transition-[border-color,box-shadow] yj-duration-fast ease-standard focus-ring hover:border-line-control',
                    'aria-pressed:border-line-strong aria-pressed:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-fg)_8%,transparent),var(--shadow-xs)]',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {iconOf(node.icon)}
                    <span className="min-w-0 truncate text-ui-sm font-medium text-fg @max-[36rem]/flow:text-ui-xs">{node.label}</span>
                    <span
                      aria-hidden
                      className={cn('ms-auto size-1.5 shrink-0 rounded-full transition-colors yj-duration-slow ease-standard @max-[36rem]/flow:hidden', DOT[health])}
                    />
                  </span>
                  <span className="flex min-w-0 items-baseline justify-between gap-2 text-ui-xs text-fg-muted">
                    <span className={cn('truncate', VOICE, '@max-[36rem]/flow:hidden')}>{copy.kinds[node.kind]}</span>
                    <span className="flex items-center gap-1.5 font-mono text-fg tabular-nums">
                      {/* On a narrow canvas the health dot moves down beside the figure, so the name gets the whole line. */}
                      <span
                        aria-hidden
                        className={cn('hidden size-1.5 shrink-0 rounded-full transition-colors yj-duration-slow ease-standard @max-[36rem]/flow:block', DOT[health])}
                      />
                      <bdi>{figure(node)}</bdi>
                    </span>
                  </span>
                  {fill !== undefined && (
                    // How full its queue is: a hairline at the card's foot, warning once it's over target.
                    <span aria-hidden className="absolute inset-x-2.5 bottom-1 h-[2px] overflow-hidden rounded-full bg-band">
                      <span
                        data-slot="queue-flow-queue"
                        className={cn(
                          'block h-full origin-left transition-[transform,background-color] yj-duration-slow ease-standard rtl:origin-right',
                          fill >= HOLDING ? 'bg-danger' : fill >= OVER_TARGET ? 'bg-warning' : 'bg-line-strong',
                        )}
                        style={{ transform: `scaleX(${fill.toFixed(3)})` }}
                      />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
