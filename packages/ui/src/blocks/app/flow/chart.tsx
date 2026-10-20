'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import type { Tone } from './data'
import { bundlesOf, ribbon, run, runs, type Layout } from './layout'

/* The picture: a stage header over each column, the ribbons between the
 * columns in their first node's colour, and over them each node as a bar
 * with its name and figure. The nodes are buttons on one tab stop: Up and
 * Down move along a stage, Left and Right to the nearest node of the next
 * or last stage, Home and End to a stage's ends; pointing at a node or
 * focusing it lights every path through it, pressing it pins that, Escape
 * lets go. Pointing at a ribbon lights its one path, start to end. The
 * ribbons wipe in along the flow the first time they're seen, and a new
 * range morphs every ribbon and bar from where it is. The flow reads left
 * to right in either direction of text; reduced motion draws it in place. */

export const HEIGHT = 240
export const GAP = 14
const BAR = 10

const TONE: Record<Tone, string> = {
  'chart-1': 'var(--color-chart-1)',
  'chart-2': 'var(--color-chart-2)',
  'chart-3': 'var(--color-chart-3)',
  'chart-4': 'var(--color-chart-4)',
  'chart-5': 'var(--color-chart-5)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  neutral: 'var(--color-fg-subtle)',
}
export const toneOf = (tone: Tone) => TONE[tone]

interface ChartProps {
  stages: string[]
  layout: Layout
  /** Each node's colour. */
  tones: Map<string, Tone>
  /** The paths lit, or every path at rest. */
  lit: Set<number> | null
  pinned: string | null
  onNode: (id: string | null) => void
  onPath: (index: number | null) => void
  onPin: (id: string | null) => void
  /** A node's figure, and its name for assistive tech. */
  figure: (value: number) => string
  label: (id: string) => string
  copy: { nodes: string }
}

/** Where a stage's bars stand across the room: between the gutters the first and last stages' names take. */
const across = (stage: number, stages: number) => `calc(var(--lg) + (100% - var(--lg) - var(--rg)) * ${stage / Math.max(1, stages - 1)})`

function Chart({ stages, layout, tones, lit, pinned, onNode, onPath, onPin, figure, label, copy }: ChartProps) {
  const k = useYouj()
  const clip = `flow-${useId().replace(/[^\w-]/g, '')}`
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  // While the ribbons wipe in, each stage's bars arrive as the wipe reaches them; after that, changes don't wait.
  const [settled, setSettled] = useState(k.reduced)
  useEffect(() => {
    if (!shown || settled) return
    const done = setTimeout(() => setSettled(true), k.ms('deliberate') + k.ms('base'))
    return () => clearTimeout(done)
  }, [shown, settled, k])
  const boxes = [...layout.boxes.values()]
  const bundles = useMemo(() => bundlesOf(layout.pieces), [layout])
  const [chosen, setCursor] = useState(boxes[0]?.node.id ?? '')
  const cursor = layout.boxes.has(chosen) ? chosen : (boxes[0]?.node.id ?? '')
  const last = stages.length - 1
  const on = (id: string) => lit === null || layout.paths.some((p, i) => lit.has(i) && p.steps.includes(id))

  const go = (id: string | undefined) => {
    if (!id) return
    setCursor(id)
    ref.current?.querySelector<HTMLElement>(`[data-yj-node="${id}"]`)?.focus()
  }
  const keys = (event: KeyboardEvent) => {
    const box = layout.boxes.get(cursor)
    if (!box) return
    const stage = box.node.stage
    const column = boxes.filter((b) => b.node.stage === stage)
    const nearest = (s: number) =>
      boxes.filter((b) => b.node.stage === s).sort((a, b) => Math.abs(a.y + a.h / 2 - (box.y + box.h / 2)) - Math.abs(b.y + b.h / 2 - (box.y + box.h / 2)))[0]?.node.id
    const to: Record<string, string | undefined> = {
      ArrowDown: column[box.index + 1]?.node.id,
      ArrowUp: column[box.index - 1]?.node.id,
      ArrowRight: nearest(stage + 1),
      ArrowLeft: nearest(stage - 1),
      Home: column[0]?.node.id,
      End: column.at(-1)?.node.id,
    }
    if (event.key === 'Escape') {
      onPin(null)
      return
    }
    if (!(event.key in to)) return
    event.preventDefault()
    go(to[event.key])
  }

  return (
    <MotionFeatures>
      <div ref={ref} dir="ltr" className="relative [--lg:--spacing(30)] [--rg:--spacing(34)]">
        <div aria-hidden className="relative h-5">
          {stages.map((name, s) => (
            <span
              key={name}
              className="absolute top-0 truncate font-(family-name:--yj-label-font) text-ui-xs font-medium tracking-(--yj-label-tracking) text-fg-muted [text-transform:var(--yj-label-case)]"
              style={s === 0 ? { insetInlineEnd: `calc(100% - var(--lg) - ${BAR / 2}px)`, maxWidth: 'var(--lg)' } : { insetInlineStart: `calc(${across(s, stages.length)} - ${BAR / 2}px)` }}
            >
              {name}
            </span>
          ))}
        </div>
        <div className="relative mt-2" style={{ height: HEIGHT }} onPointerLeave={() => onPath(null)}>
          <svg aria-hidden viewBox={`0 0 1000 ${HEIGHT}`} preserveAspectRatio="none" className="absolute inset-y-0 h-full overflow-visible" style={{ insetInlineStart: 'var(--lg)', width: 'calc(100% - var(--lg) - var(--rg))' }}>
            <defs>
              <clipPath id={clip}>
                <m.rect x={0} y={-1} height={HEIGHT + 2} initial={{ width: k.reduced ? 1000 : 0 }} animate={{ width: shown ? 1000 : 0 }} transition={k.reduced ? { type: false } : k.tween('deliberate', 'enter')} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clip})`}>
              {/* A bundle (one first node, one step) is one shape, so its paths show no seams; it morphs to a new range. */}
              {bundles.map(({ key, pieces }) => (
                <m.path
                  key={key}
                  data-state={lit === null ? 'rest' : 'back'}
                  initial={false}
                  animate={{ d: ribbon(run(pieces), stages.length) }}
                  transition={k.reduced ? { type: false } : k.spring('smooth')}
                  fill={toneOf(tones.get(pieces[0]!.origin) ?? 'neutral')}
                  className="[fill-opacity:0.55] transition-[fill-opacity] ease-standard yj-duration-fast data-[state=back]:[fill-opacity:0.08]"
                />
              ))}
              {/* The lit paths over them: each run of neighbours in a bundle one shape again. */}
              {lit &&
                bundles.flatMap(({ key, pieces }) =>
                  runs(pieces, (p) => lit.has(p.path)).map((r) => (
                    <path
                      key={`${key}#${r[0]!.path}`}
                      d={ribbon(run(r), stages.length)}
                      fill={toneOf(tones.get(r[0]!.origin) ?? 'neutral')}
                      className="pointer-events-none [fill-opacity:0.85] transition-[fill-opacity] ease-standard yj-duration-fast starting:[fill-opacity:0.08]"
                    />
                  )),
                )}
            </g>
            {/* Each path's own pieces, unseen, to point at. */}
            <g className="fill-transparent">
              {layout.pieces.map((piece) => (
                <path key={piece.key} data-yj-path={piece.path} data-state={lit === null ? 'rest' : lit.has(piece.path) ? 'lit' : 'back'} d={ribbon(piece, stages.length)} onPointerEnter={() => onPath(piece.path)} />
              ))}
            </g>
          </svg>
          <div role="group" aria-label={copy.nodes} onKeyDown={keys}>
            {boxes.map((box) => {
              const { node } = box
              const side = node.stage === 0 ? 'start' : node.stage === last ? 'end' : 'middle'
              return (
                <button
                  key={node.id}
                  type="button"
                  data-yj-node={node.id}
                  aria-pressed={pinned === node.id}
                  aria-label={label(node.id)}
                  tabIndex={cursor === node.id ? 0 : -1}
                  className={cn(
                    'absolute top-0 flex min-h-6 items-center gap-2 rounded-sm text-ui-xs outline-hidden focus-ring',
                    // Moving, a bar lands on the CSS spring, as its ribbons do on the JS one; dimming is quick.
                    '[transition:translate_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring),opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-standard)]',
                    side === 'start' && 'flex-row-reverse',
                    !on(node.id) && 'opacity-35',
                    !shown && 'opacity-0',
                  )}
                  style={
                    {
                      ...(side === 'start' ? { insetInlineEnd: `calc(100% - var(--lg) - ${BAR / 2}px)` } : { insetInlineStart: `calc(${across(node.stage, stages.length)} - ${BAR / 2}px)` }),
                      translate: `0 calc(${box.y + box.h / 2}px - 50%)`,
                      transitionDelay: shown && !settled && !k.reduced ? `${Math.round((k.ms('deliberate') * 0.45 * node.stage) / Math.max(1, last))}ms` : undefined,
                    } as CSSProperties
                  }
                  onPointerEnter={() => onNode(node.id)}
                  onPointerLeave={() => onNode(null)}
                  onFocus={() => {
                    setCursor(node.id)
                    onNode(node.id)
                  }}
                  onBlur={() => onNode(null)}
                  onClick={() => onPin(pinned === node.id ? null : node.id)}
                >
                  <span
                    className={cn('block w-2.5 shrink-0 rounded-xs [transition:height_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring)]', pinned === node.id && 'ring-[1.5px] ring-fg ring-offset-2 ring-offset-surface')}
                    style={{ height: Math.max(1, box.h), backgroundColor: toneOf(tones.get(node.id) ?? 'neutral') }}
                  />
                  <span
                    className={cn('flex min-w-0 items-baseline gap-1.5 whitespace-nowrap', side === 'middle' && 'rounded-xs bg-surface px-1 py-0.5', side === 'start' ? 'max-w-[calc(var(--lg)-var(--spacing)*4)]' : side === 'end' && 'max-w-[calc(var(--rg)-var(--spacing)*4)]')}
                  >
                    <span className="truncate font-medium text-fg">{node.label}</span>
                    <span className="shrink-0 text-fg-muted tabular-nums">{figure(box.value)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </MotionFeatures>
  )
}

export { Chart }
