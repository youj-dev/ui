'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, m, useInView, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import type { Node } from './tree'

/* The ring. It shows one level, the focused node's parts, through a window
 * on the whole tree: zooming in slides the window from the old node's span
 * to the new one's, so the part you picked opens round the ring while its
 * neighbours slip out at the top, and its own parts fade in over it, each
 * already where it lies inside it. Zooming out runs the same move back. One
 * pair of numbers drives every arc, so a reversal mid-flight continues from
 * where the ring is. It sweeps in clockwise from the top the first time it
 * is seen. A pointed part lifts and the others step back. Reduced motion:
 * each level is drawn in place. */

const TAU = Math.PI * 2
const C = 100
const R1 = 96
const R0 = 66

const point = (angle: number, r: number) => `${(C + r * Math.sin(angle)).toFixed(2)},${(C - r * Math.cos(angle)).toFixed(2)}`

/** An annular sector clockwise from the top; a whole ring as two halves with its hole cut out. */
function sector(a0: number, a1: number) {
  const span = a1 - a0
  if (span < 0.002) return ''
  if (span >= TAU - 1e-4)
    return `M${point(a0, R1)} A${R1},${R1} 0 1 1 ${point(a0 + Math.PI, R1)} A${R1},${R1} 0 1 1 ${point(a0, R1)} M${point(a0, R0)} A${R0},${R0} 0 1 0 ${point(a0 + Math.PI, R0)} A${R0},${R0} 0 1 0 ${point(a0, R0)} Z`
  const large = span > Math.PI ? 1 : 0
  return `M${point(a0, R1)} A${R1},${R1} 0 ${large} 1 ${point(a1, R1)} L${point(a1, R0)} A${R0},${R0} 0 ${large} 0 ${point(a0, R0)} Z`
}

const clamp = (t: number) => Math.min(1, Math.max(0, t))
export const toneColor = (tone: Node['tone']) => (tone === 'quiet' ? 'var(--color-chart-quiet)' : `var(--color-${tone})`)

interface ArcProps {
  node: Node
  w0: MotionValue<number>
  w1: MotionValue<number>
  sweep: MotionValue<number>
  state: 'rest' | 'lifted' | 'back'
  onHover: (key: string | null) => void
  onOpen: (node: Node) => void
}

function Arc({ node, w0, w1, sweep, state, onHover, onOpen }: ArcProps) {
  const d = useTransform([w0, w1, sweep], ([a, b, s]: number[]) => {
    const span = b! - a! || 1
    return sector(clamp((node.x0 - a!) / span) * s! * TAU, clamp((node.x1 - a!) / span) * s! * TAU)
  })
  return (
    <m.path
      d={d}
      data-yj-key={node.key}
      data-state={state}
      fill={toneColor(node.tone)}
      stroke="var(--color-surface)"
      strokeWidth={2}
      strokeLinejoin="round"
      className={cn(
        'origin-center transition-[opacity,scale] yj-duration-fast ease-standard [transform-box:view-box]',
        node.children.length > 0 && 'cursor-pointer',
        state === 'lifted' && 'scale-[1.035] reduced:scale-100',
        state === 'back' && 'opacity-35',
      )}
      onPointerEnter={() => onHover(node.key)}
      onPointerLeave={() => onHover(null)}
      onClick={() => onOpen(node)}
    />
  )
}

interface RingProps extends Omit<ArcProps, 'node' | 'state'> {
  focus: Node
  current: boolean
  /** Drawn with the block, not after a zoom: it is there at once (the sweep brings it in). */
  initial: boolean
  hovered: string | null
  /** Its fade-out finished: the ring can go. */
  onGone: (key: string) => void
}

/** One level's arcs, fading in when it becomes the level shown and out when it stops being it. */
function Ring({ focus, current, initial, hovered, onGone, ...arc }: RingProps) {
  const k = useYouj()
  const opacity = useMotionValue(current && !initial ? 0 : 1)
  useEffect(() => {
    if (k.reduced) {
      opacity.set(current ? 1 : 0)
      return
    }
    // The level going away fades over the whole move, so its parts are seen slipping out; the new one arrives on base.
    const fade = animate(opacity, current ? 1 : 0, current ? k.tween('base', 'enter') : k.tween('deliberate', 'exit'))
    if (!current) fade.then(() => onGone(focus.key))
    return () => fade.stop()
  }, [current, k, opacity, focus.key, onGone])
  return (
    <m.g style={{ opacity }} className={cn(!current && 'pointer-events-none')}>
      {focus.children.map((child) => (
        <Arc key={child.key} node={child} state={hovered === null ? 'rest' : hovered === child.key ? 'lifted' : 'back'} {...arc} />
      ))}
    </m.g>
  )
}

interface DonutProps {
  focus: Node
  hovered: string | null
  onHover: (key: string | null) => void
  onOpen: (node: Node) => void
  /** What the hole says: the total, or the pointed part. */
  children: ReactNode
  className?: string
}

function Donut({ focus, hovered, onHover, onOpen, children, className }: DonutProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const w0 = useMotionValue(focus.x0)
  const w1 = useMotionValue(focus.x1)
  const sweep = useMotionValue(k.reduced ? 1 : 0)

  // The levels drawn: the one shown, and any still fading out.
  const [rings, setRings] = useState<Node[]>([focus])
  const [shown, setShown] = useState(focus)
  // Rings drawn with the block are there at once; later ones fade in.
  const [fresh, setFresh] = useState(true)
  if (shown !== focus) {
    setShown(focus)
    setFresh(false)
    setRings((all) => [...all.filter((r) => r.key !== focus.key), focus])
  }
  const drawn = k.reduced ? [focus] : rings
  const gone = useCallback((key: string) => setRings((all) => all.filter((r) => r.key !== key)), [])

  useEffect(() => {
    if (k.reduced) {
      w0.set(focus.x0)
      w1.set(focus.x1)
      return
    }
    const move = k.tween('deliberate', 'emphasized')
    const a = animate(w0, focus.x0, move)
    const b = animate(w1, focus.x1, move)
    return () => {
      a.stop()
      b.stop()
    }
  }, [focus, k, w0, w1])

  useEffect(() => {
    if (k.reduced) sweep.set(1)
    else if (inView) animate(sweep, 1, k.tween('deliberate', 'enter'))
  }, [inView, k, sweep])

  return (
    <MotionFeatures>
      <div ref={ref} data-slot="breakdown-ring" className={cn('relative aspect-square', className)}>
        <svg viewBox="0 0 200 200" aria-hidden className="size-full overflow-visible">
          {drawn.map((ring) => (
            <Ring
              key={ring.key}
              focus={ring}
              current={ring.key === focus.key}
              initial={fresh}
              hovered={hovered}
              onGone={gone}
              w0={w0}
              w1={w1}
              sweep={sweep}
              onHover={onHover}
              onOpen={onOpen}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-[18%] grid place-items-center text-center">{children}</div>
      </div>
    </MotionFeatures>
  )
}

export { Donut }
