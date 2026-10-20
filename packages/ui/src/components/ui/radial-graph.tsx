'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useInView } from 'motion/react'
import { radialGraphLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { cn, initials, toneColor } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* What one thing reaches: a center with everything linked to it in rings by
 * how many hops away it is, the nodes one hop out on the first ring and the
 * ones they lead to on the next, each spread over the room its own branch
 * needs, so a branch reads as a wedge. A node's dot takes its tone (its kind),
 * and a ring around it its state: solid (hit) or dashed (exposed), in the
 * ring's tone, with the link into it drawn the same way, so a path through
 * the graph shows at a glance. Dashed circles mark the rings, each named in a
 * quiet gap ("1 hop", "2 hops").
 * - `hops` shows fewer rings: the nodes past it fold into the ones they hang
 *   from, and unfold again on the same spot.
 * - Keyboard: one tab stop. Left and Right walk a ring (mirrored in RTL), Down
 *   follows a link outward and Up goes back toward the center, Home and End go
 *   to the center and the last node; focus or hover shows a node's label,
 *   state and detail, lights its path from the center and quiets the rest.
 * - Semantics: a named group holding a list of the nodes, each named with its
 *   label and distance and described by its state and detail, and a summary
 *   (how many nodes within how many hops) as the group's description.
 * - Motion: when it scrolls into view the nodes travel out from the center
 *   ring by ring and their links fade in; folding and unfolding glide on the
 *   slow token. Reduced motion: drawn in place; folds land at once. */

type RadialGraphTone = 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface RadialGraphNode {
  id: string
  label: string
  /** The node it is reached through, one ring in. Default: the center. */
  via?: string
  /** A line under the label in its tooltip: "Read by the new key". */
  detail?: string
  /** The dot's color: the kind of thing it is. Default 'neutral'. */
  tone?: RadialGraphTone
  /** A ring around the dot for its state, `solid` or `dashed`; the link into the node is drawn the same way. */
  ring?: 'solid' | 'dashed'
  /** The ring's and that link's color. Default 'danger'. */
  ringTone?: RadialGraphTone
  /** Its state in words, shown in the tooltip and spoken: "Compromised". */
  state?: string
}

interface RadialGraphCenter extends Omit<RadialGraphNode, 'via'> {
  /** Up to three characters in the center's disc. Default: the label's initials. */
  short?: string
}

interface RadialGraphProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the graph is drawn around. Its tone defaults to 'accent'. */
  center: RadialGraphCenter
  /** Everything linked to it, in any order: each hangs from its `via`, or from the center. */
  nodes: readonly RadialGraphNode[]
  /** How many rings to show; the nodes past it fold into the ones they hang from. Default: all. */
  hops?: number
  /** Name each ring in a gap beside it ("1 hop"). Default true. */
  ringLabels?: boolean
  /** Accessible name of the graph. Default: the labels' "Radial graph". */
  label?: string
}

/** The drawing's box, in viewBox units: the center, the outer ring's radius and the center disc's. */
const SIZE = 320
const MID = SIZE / 2
const OUTER = 134
const DISC = 17
/** A dot's radius by ring (1, 2, 3 and further out), and how far a state ring sits outside it. */
const DOT = [DISC, 6, 4.75, 4]
const HALO = 4

interface Placed {
  id: string
  node: RadialGraphNode | RadialGraphCenter
  depth: number
  angle: number
  x: number
  y: number
  parent?: string
  children: string[]
}

const dotOf = (depth: number) => DOT[Math.min(depth, DOT.length - 1)]!
const r2 = (n: number) => Math.round(n * 100) / 100

/** Places the center and every node: depth from its chain of `via`s, rings evenly spaced to the deepest, and each branch an angular wedge sized by how many leaves it holds, from the top, clockwise. */
function layout(center: RadialGraphCenter, nodes: readonly RadialGraphNode[]) {
  const ids = new Set(nodes.map((n) => n.id))
  const parentOf = new Map<string, string>()
  for (const n of nodes) parentOf.set(n.id, n.via && n.via !== n.id && ids.has(n.via) ? n.via : center.id)
  // A chain of vias that loops hangs from the center instead.
  const depthOf = new Map<string, number>([[center.id, 0]])
  const depth = (id: string, seen = new Set<string>()): number => {
    const known = depthOf.get(id)
    if (known !== undefined) return known
    const parent = parentOf.get(id) ?? center.id
    if (seen.has(id)) {
      parentOf.set(id, center.id)
      depthOf.set(id, 1)
      return 1
    }
    seen.add(id)
    const d = depth(parent, seen) + 1
    depthOf.set(id, d)
    return d
  }
  for (const n of nodes) depth(n.id)
  const children = new Map<string, string[]>([[center.id, []]])
  for (const n of nodes) children.set(n.id, [])
  for (const n of nodes) children.get(parentOf.get(n.id)!)!.push(n.id)
  const leaves = new Map<string, number>()
  const weigh = (id: string): number => {
    const w = Math.max(
      1,
      (children.get(id) ?? []).reduce((sum, c) => sum + weigh(c), 0),
    )
    leaves.set(id, w)
    return w
  }
  weigh(center.id)
  const deepest = Math.max(1, ...depthOf.values())
  const radius = (d: number) => (d === 0 ? 0 : (OUTER * d) / deepest)
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const placed = new Map<string, Placed>()
  const place = (id: string, from: number, to: number) => {
    const d = depthOf.get(id)!
    const angle = (from + to) / 2
    const r = radius(d)
    placed.set(id, {
      id,
      node: d === 0 ? center : byId.get(id)!,
      depth: d,
      angle: d === 0 ? 0 : angle,
      x: r2(MID + Math.cos(angle) * r),
      y: r2(MID + Math.sin(angle) * r),
      parent: d === 0 ? undefined : parentOf.get(id),
      children: children.get(id) ?? [],
    })
    const kids = children.get(id) ?? []
    const total = kids.reduce((sum, c) => sum + leaves.get(c)!, 0)
    let start = from
    for (const c of kids) {
      const span = ((to - from) * leaves.get(c)!) / total
      place(c, start, start + span)
      start += span
    }
  }
  place(center.id, -Math.PI / 2, (Math.PI * 3) / 2)
  return { placed, deepest, radius }
}

/** Where to name a ring: the angle on the left half farthest from any node on it or the ring inside it, so the caption sits in a quiet gap. */
function captionAngle(angles: number[]) {
  const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const away = (a: number, b: number) => {
    const d = Math.abs(norm(a) - norm(b))
    return Math.min(d, Math.PI * 2 - d)
  }
  let best = Math.PI
  let room = -1
  for (let deg = 110; deg <= 250; deg += 2) {
    const a = (deg * Math.PI) / 180
    const gap = angles.length ? Math.min(...angles.map((b) => away(a, b))) : Math.PI
    // Ties keep the one nearest the left, where captions read best.
    if (gap > room + 1e-6 || (Math.abs(gap - room) <= 1e-6 && Math.abs(a - Math.PI) < Math.abs(best - Math.PI))) {
      best = a
      room = gap
    }
  }
  return best
}

function RadialGraph({ center, nodes, hops: hopsProp, ringLabels = true, label, className, style, ...props }: RadialGraphProps) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(radialGraphLabels)
  const summaryId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const targets = useRef(new Map<string, HTMLDivElement>())
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [focus, setFocus] = useState<string>()
  const [active, setActive] = useState<string>()
  const [handle] = useState(() => TooltipPrimitive.createHandle<string>())

  const { placed, deepest, radius } = useMemo(() => layout(center, nodes), [center, nodes])
  const hops = Math.max(1, Math.min(deepest, Math.round(hopsProp ?? deepest)))
  const all = [...placed.values()]
  const visible = all.filter((p) => p.depth <= hops)
  // Reading order: the center, then each ring clockwise from the top.
  const order = [...visible].sort((a, b) => a.depth - b.depth || a.angle - b.angle)
  const current = focus && visible.some((p) => p.id === focus) ? focus : center.id

  // The path from the center to the node in reading, lit while the rest go quiet.
  const path = new Set<string>()
  for (let at = active ? placed.get(active) : undefined; at; at = at.parent ? placed.get(at.parent) : undefined) path.add(at.id)
  const quiet = (id: string) => path.size > 0 && !path.has(id)

  const hopsText = (d: number) => labels.radialGraphHops(d)
  const spread = k.reduced ? 0 : k.ms('slow')

  const move = (id: string | undefined) => {
    if (!id) return
    setFocus(id)
    targets.current.get(id)?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const here = placed.get(current)
    if (!here) return
    const ring = order.filter((p) => p.depth === here.depth)
    const at = ring.findIndex((p) => p.id === here.id)
    const clockwise = rtl ? 'ArrowLeft' : 'ArrowRight'
    const counter = rtl ? 'ArrowRight' : 'ArrowLeft'
    let next: string | undefined
    if (event.key === clockwise) next = here.depth === 0 ? order[1]?.id : ring[(at + 1) % ring.length]?.id
    else if (event.key === counter)
      next = here.depth === 0 ? order.filter((p) => p.depth === 1).at(-1)?.id : ring[(at - 1 + ring.length) % ring.length]?.id
    else if (event.key === 'ArrowDown') {
      const kids = here.children.map((c) => placed.get(c)!).filter((p) => p.depth <= hops)
      const outer = order.filter((p) => p.depth === here.depth + 1)
      const nearest = (list: Placed[]) =>
        list.reduce<Placed | undefined>(
          (best, p) => (!best || Math.abs(p.angle - here.angle) < Math.abs(best.angle - here.angle) ? p : best),
          undefined,
        )
      next = (nearest(kids) ?? (here.depth === 0 ? outer[0] : nearest(outer)))?.id
    } else if (event.key === 'ArrowUp') next = here.parent
    else if (event.key === 'Home') next = center.id
    else if (event.key === 'End') next = order.at(-1)?.id
    else return
    event.preventDefault()
    move(next)
  }

  const ringsShown = Array.from({ length: hops }, (_, i) => i + 1)
  const captions = ringLabels
    ? ringsShown.map((d) => {
        const angles = all.filter((p) => p.depth === d || (p.depth === d - 1 && d > 1)).map((p) => p.angle)
        const a = captionAngle(angles)
        const inner = d === 1 ? DISC + 6 : radius(d - 1)
        const r = (inner + radius(d)) / 2
        return { d, x: MID + Math.cos(a) * r, y: MID + Math.sin(a) * r }
      })
    : []

  const at = (p: Placed) => ({ left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` })
  const colorOf = (tone: RadialGraphTone | undefined, fallback: RadialGraphTone) => toneColor(tone ?? fallback)
  const offset = (p: Placed) => {
    // Not in view yet: everything waits at the center. Folded: it sits on the node it hangs from.
    if (!shown) return { x: MID - p.x, y: MID - p.y }
    if (p.depth > hops) {
      let host = p
      while (host.depth > hops && host.parent) host = placed.get(host.parent)!
      return { x: host.x - p.x, y: host.y - p.y }
    }
    return { x: 0, y: 0 }
  }
  const delayOf = (p: Placed) => (shown && spread ? Math.round(((p.depth - 1) / Math.max(1, deepest)) * spread) : 0)
  const empty = nodes.length === 0

  return (
    <>
      <div
        ref={rootRef}
        role="group"
        aria-label={label ?? labels.radialGraph}
        aria-describedby={empty ? undefined : summaryId}
        data-slot="radial-graph"
        className={cn(
          'own:relative w-full min-w-0',
          // The gap kept round a dot so a link never touches it: the surface the graph sits on.
          '[--radial-graph-gap:var(--color-surface)]',
          className,
        )}
        style={style}
        {...props}
      >
        {empty ? (
          <div
            data-slot="radial-graph-empty"
            className="own:grid aspect-[4/3] place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted"
          >
            {labels.noData}
          </div>
        ) : (
          <div data-slot="radial-graph-stage" className="own:relative own:mx-auto aspect-square w-full max-w-md">
            <svg aria-hidden viewBox={`0 0 ${SIZE} ${SIZE}`} data-slot="radial-graph-plot" className="absolute inset-0 size-full overflow-visible">
              {Array.from({ length: deepest }, (_, i) => i + 1).map((d) => (
                <circle
                  key={d}
                  data-slot="radial-graph-ring"
                  data-state={d <= hops ? 'shown' : 'hidden'}
                  cx={MID}
                  cy={MID}
                  r={radius(d)}
                  fill="none"
                  strokeDasharray="2 4"
                  vectorEffect="non-scaling-stroke"
                  className={cn(
                    'stroke-line-strong transition-opacity yj-duration-slow ease-standard',
                    d <= hops && shown ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ))}
              {all.map((p) => {
                if (!p.parent) return null
                const from = placed.get(p.parent)!
                const node = p.node as RadialGraphNode
                const marked = node.ring !== undefined
                const lit = path.has(p.id)
                return (
                  <line
                    key={`link-${p.id}`}
                    data-slot="radial-graph-link"
                    data-yj-ring={node.ring}
                    x1={from.x}
                    y1={from.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={marked ? colorOf(node.ringTone, 'danger') : lit ? 'var(--color-fg-muted)' : 'var(--color-line-strong)'}
                    strokeWidth={marked || lit ? 1.5 : 1}
                    strokeDasharray={node.ring === 'dashed' ? '3 3' : undefined}
                    vectorEffect="non-scaling-stroke"
                    className="transition-[opacity,stroke] yj-duration-slow ease-standard"
                    style={{
                      opacity: !shown || p.depth > hops ? 0 : quiet(p.id) ? 0.3 : 1,
                      transitionDelay: delayOf(p) ? `${delayOf(p)}ms` : undefined,
                    }}
                  />
                )
              })}
              {all.map((p) => {
                const node = p.node
                const dot = dotOf(p.depth)
                const shift = offset(p)
                const fill = colorOf(node.tone, p.depth === 0 ? 'accent' : 'neutral')
                const ringColor = colorOf(node.ringTone, 'danger')
                const isActive = active === p.id
                return (
                  <g
                    key={p.id}
                    data-slot={p.depth === 0 ? 'radial-graph-center' : 'radial-graph-node'}
                    data-state={p.depth > hops ? 'folded' : 'shown'}
                    data-yj-ring={node.ring}
                    className={cn(!k.reduced && 'transition-[transform,opacity] yj-duration-slow ease-emphasized')}
                    style={{
                      transform: `translate(${r2(shift.x)}px, ${r2(shift.y)}px)`,
                      opacity: !shown || p.depth > hops ? 0 : quiet(p.id) ? 0.35 : 1,
                      transitionDelay: delayOf(p) ? `${delayOf(p)}ms` : undefined,
                    }}
                  >
                    {isActive && <circle cx={p.x} cy={p.y} r={dot + HALO + 4} fill={fill} opacity={0.18} />}
                    {node.ring && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={dot + HALO}
                        fill="var(--radial-graph-gap)"
                        stroke={ringColor}
                        strokeWidth={1.5}
                        strokeDasharray={node.ring === 'dashed' ? '2 2' : undefined}
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isActive && p.depth > 0 ? dot + 1 : dot}
                      fill={fill}
                      stroke="var(--radial-graph-gap)"
                      strokeWidth={node.ring ? 0 : 2}
                      className="transition-[r] yj-duration-fast ease-standard"
                    />
                  </g>
                )
              })}
            </svg>

            {captions.map((c) => (
              <span
                key={c.d}
                aria-hidden
                data-slot="radial-graph-caption"
                className={cn(
                  'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 own:text-ui-xs whitespace-nowrap own:text-fg-subtle own:tabular-nums',
                  'transition-opacity yj-duration-slow ease-standard',
                  shown ? 'opacity-100' : 'opacity-0',
                )}
                style={{ left: `${(c.x / SIZE) * 100}%`, top: `${(c.y / SIZE) * 100}%` }}
              >
                {hopsText(c.d)}
              </span>
            ))}

            <span
              aria-hidden
              data-slot="radial-graph-short"
              className="pointer-events-none absolute own:text-ui-sm own:font-semibold own:text-canvas -translate-x-1/2 -translate-y-1/2 own:tracking-tight"
              style={{ left: '50%', top: '50%' }}
            >
              {center.short ?? initials(center.label)}
            </span>

            <div role="list" data-slot="radial-graph-nodes" className="absolute inset-0" onKeyDown={onKeyDown}>
              {order.map((p) => {
                const node = p.node
                const described = [node.state, node.detail].some(Boolean)
                return (
                  <TooltipTrigger
                    key={p.id}
                    handle={handle}
                    payload={p.id}
                    delay={0}
                    closeDelay={0}
                    render={
                      <div
                        ref={(el: HTMLDivElement | null) => {
                          if (el) targets.current.set(p.id, el)
                          else targets.current.delete(p.id)
                        }}
                        role="listitem"
                        tabIndex={p.id === current ? 0 : -1}
                        aria-label={p.depth === 0 ? node.label : labels.radialGraphItem(node.label, hopsText(p.depth))}
                        aria-describedby={described ? `${summaryId}-${p.id}` : undefined}
                        data-slot="radial-graph-target"
                        onFocus={() => {
                          setFocus(p.id)
                          setActive(p.id)
                        }}
                        onBlur={() => setActive(undefined)}
                        onPointerEnter={() => setActive(p.id)}
                        onPointerLeave={() => setActive(undefined)}
                        className={cn(
                          'absolute -translate-x-1/2 -translate-y-1/2 own:rounded-full outline-none focus-ring',
                          p.depth === 0 ? 'size-11' : 'size-7',
                        )}
                        style={at(p)}
                      />
                    }
                  />
                )
              })}
            </div>
            <div hidden>
              {order.map((p) =>
                p.node.state || p.node.detail ? (
                  <span key={p.id} id={`${summaryId}-${p.id}`}>
                    {[p.node.state, p.node.detail].filter(Boolean).join('. ')}
                  </span>
                ) : null,
              )}
            </div>
            <p id={summaryId} data-slot="radial-graph-summary" className="sr-only">
              {labels.radialGraphSummary(center.label, visible.length - 1, hopsText(hops))}
            </p>
          </div>
        )}
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          const p = typeof payload === 'string' ? placed.get(payload) : undefined
          if (!p) return null
          const node = p.node
          return (
            <TooltipContent data-slot="radial-graph-tooltip" className="max-w-60 flex-col items-start gap-0.5 own:py-1.5">
              <span className="own:font-mono">{node.label}</span>
              {node.state && (
                <span className="own:flex items-center gap-1.5 own:font-normal">
                  <span
                    aria-hidden
                    className={cn('own:size-2 own:rounded-full border-[1.5px]', node.ring === 'dashed' && 'border-dashed')}
                    style={{ borderColor: colorOf(node.ringTone, 'danger') } as CSSProperties}
                  />
                  {node.state}
                </span>
              )}
              {node.detail && <span className="own:font-normal opacity-75">{node.detail}</span>}
              {p.depth > 0 && <span className="own:font-normal own:tabular-nums opacity-75">{hopsText(p.depth)}</span>}
            </TooltipContent>
          )
        }}
      </Tooltip>
    </>
  )
}

export { RadialGraph, type RadialGraphCenter, type RadialGraphNode, type RadialGraphProps, type RadialGraphTone }
