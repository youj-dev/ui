import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { AnimatePresence, m, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import { dockLabels } from '@youj/core/labels'
import { springs } from '@youj/core'
import { springPhysics } from '@youj/core/internal'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

/* A magnifying dock, transform-only. Rather than springing every icon on its
 * own, one spring smooths the pointer's x and one spring fades the effect in
 * and out; every icon's scale and shift is then a pure function of those two
 * values, so neighbors can never disagree about where they are. Icons grow
 * upward from their baseline and push neighbors outward, anchored so the
 * point under the cursor stays put; the backplate widens with them through a
 * clip-path inset.
 * Keyboard focus puts the "pointer" on the focused icon, so arrowing through
 * the dock magnifies exactly as hovering does. */

export interface DockItem {
  id: string
  label: string
  icon: ReactNode
  /** Render as a link instead of a button. */
  href?: string
}

export interface DockProps {
  items: DockItem[]
  /** The active item's id; it gets the indicator dot. */
  value?: string
  onValueChange?: (id: string) => void
  /** Resting icon size in px. Default 48. In a container too narrow for the row, the icons shrink to fit it, to no less than 28. */
  size?: number
  /** Peak scale under the pointer. Default 1.6. */
  magnification?: number
  /** How far the magnification reaches, in px from the pointer. Default 140. */
  distance?: number
  /** Accessible name of the toolbar. Default "Dock". */
  label?: string
  className?: string
}

const GAP = 8
const PAD = 8
/** The smallest an icon shrinks to in a narrow container: still a comfortable target. */
const MIN_SIZE = 28

interface DockLayout {
  scale: number[]
  shift: number[]
  /** Where the grown row's left and right edges moved to, relative to rest. */
  left: number
  right: number
}

function layoutAt(x: number, amount: number, n: number, size: number, mag: number, distance: number): DockLayout {
  const scale: number[] = []
  const extras: number[] = []
  // Anchor: the point under the pointer stays under the pointer, so the icon
  // you are aiming at never slides away from the cursor (the row grows unevenly around it).
  let anchor = 0
  for (let i = 0; i < n; i++) {
    const start = PAD + i * (size + GAP)
    const t = Math.abs(x - (start + size / 2)) / distance
    const falloff = t < 1 ? (1 + Math.cos(Math.PI * t)) / 2 : 0
    const s = 1 + (mag - 1) * amount * falloff
    const extra = (s - 1) * size
    scale.push(s)
    extras.push(extra)
    anchor += extra * Math.min(1, Math.max(0, (x - start) / size))
  }
  const shift: number[] = []
  let before = 0
  for (let i = 0; i < n; i++) {
    shift.push(-anchor + before + extras[i]! / 2)
    before += extras[i]!
  }
  return { scale, shift, left: -anchor, right: before - anchor }
}

export function Dock({
  items,
  value,
  onValueChange,
  size: restingSize = 48,
  magnification = 1.6,
  distance = 140,
  label,
  className,
}: DockProps) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  // The room its container gives it: a phone's column is narrower than eight 48px icons.
  const [room, setRoom] = useState<number | null>(null)
  useEffect(() => {
    const parent = root.current?.parentElement
    if (!parent || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => entry && setRoom(entry.contentRect.width))
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])
  const fits = room === null ? restingSize : Math.floor((room - 2 * PAD - (items.length - 1) * GAP) / items.length)
  const size = Math.max(MIN_SIZE, Math.min(restingSize, fits))
  const labels = useComponentLabels(dockLabels)
  label ??= labels.dock
  const id = useId()
  const row = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLElement | null)[]>([])
  const pointerInside = useRef(false)

  const activeIndex = Math.max(0, items.findIndex((it) => it.id === value))
  const [focusIndex, setFocusIndex] = useState(activeIndex)
  const [hovered, setHovered] = useState<number | null>(null)
  const [keyboardFocus, setKeyboardFocus] = useState<number | null>(null)

  const smooth = springPhysics(springs.snappy, k.timeScale)
  const pointerX = useMotionValue(0)
  const x = useSpring(pointerX, smooth)
  const amount = useSpring(0, smooth)
  const mag = k.reduced ? 1 : magnification
  const layout = useTransform(() => layoutAt(x.get(), amount.get(), items.length, size, mag, distance))

  const reach = (magnification - 1) * size * items.length
  const plateClip = useTransform(
    layout,
    (l) => `inset(0px ${Math.max(0, reach - l.right)}px 0px ${Math.max(0, reach + l.left)}px round 18px)`,
  )

  const aim = (localX: number) => {
    // Fresh entry: jump straight to the pointer instead of sweeping across.
    if (amount.get() < 0.05) x.jump(localX)
    pointerX.set(localX)
    amount.set(1)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !row.current) return
    pointerInside.current = true
    aim(e.clientX - row.current.getBoundingClientRect().left)
  }
  const onPointerLeave = () => {
    pointerInside.current = false
    setHovered(null)
    if (keyboardFocus === null) amount.set(0)
  }

  const focusItem = (i: number) => {
    const n = items.length
    buttons.current[(i + n) % n]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: focusIndex + 1,
      ArrowDown: focusIndex + 1,
      ArrowLeft: focusIndex - 1,
      ArrowUp: focusIndex - 1,
      Home: 0,
      End: items.length - 1,
    }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    focusItem(next)
  }

  const onItemFocus = (i: number, el: HTMLElement) => {
    setFocusIndex(i)
    if (!el.matches(':focus-visible')) return
    setKeyboardFocus(i)
    aim(PAD + i * (size + GAP) + size / 2)
  }

  const onBlur = (e: FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setKeyboardFocus(null)
    if (!pointerInside.current) amount.set(0)
  }

  return (
    <MotionFeatures features="max">
      <div
        ref={root}
        role="toolbar"
        aria-label={label}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn('relative inline-flex', className)}
      >
        <m.div
          aria-hidden
          data-yj-tone="float"
          className="absolute inset-y-0 rounded-[18px] border border-line bg-chrome-float/80 youj-allow-glass shadow-[0_8px_32px_-12px_var(--color-shadow)] backdrop-blur-xl"
          style={{ left: -reach, right: -reach, clipPath: plateClip }}
        />
        <div
          ref={row}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="relative flex items-end"
          style={{ gap: GAP, padding: PAD }}
        >
          {items.map((item, i) => (
            <DockButton
              key={item.id}
              item={item}
              index={i}
              size={size}
              layout={layout}
              active={item.id === value}
              tabIndex={i === focusIndex ? 0 : -1}
              tooltip={hovered === i || keyboardFocus === i}
              indicatorId={`${id}-indicator`}
              ref={(el) => {
                buttons.current[i] = el
              }}
              onSelect={() => onValueChange?.(item.id)}
              onFocus={(el) => onItemFocus(i, el)}
              onHover={(on) => setHovered(on ? i : null)}
            />
          ))}
        </div>
      </div>
    </MotionFeatures>
  )
}

interface DockButtonProps {
  item: DockItem
  index: number
  size: number
  layout: MotionValue<DockLayout>
  active: boolean
  tabIndex: number
  tooltip: boolean
  indicatorId: string
  ref: (el: HTMLElement | null) => void
  onSelect: () => void
  onFocus: (el: HTMLElement) => void
  onHover: (on: boolean) => void
}

function DockButton({ item, index, size, layout, active, tabIndex, tooltip, indicatorId, ref, onSelect, onFocus, onHover }: DockButtonProps) {
  const k = useYouj()
  const scale = useTransform(layout, (l) => l.scale[index] ?? 1)
  const shift = useTransform(layout, (l) => l.shift[index] ?? 0)
  const lift = useTransform(scale, (s) => -(s - 1) * size)

  const Tag = item.href ? 'a' : 'button'
  const common = {
    ref,
    tabIndex,
    'aria-label': item.label,
    'aria-current': active ? ('true' as const) : undefined,
    onClick: onSelect,
    onFocus: (e: FocusEvent<HTMLElement>) => onFocus(e.currentTarget),
    onPointerEnter: () => onHover(true),
    onPointerLeave: () => onHover(false),
    // The ::before strip covers half the gap on each side, so there are no dead zones between icons.
    className: 'group relative block cursor-pointer before:absolute before:inset-y-0 before:-inset-x-1 before:content-[""] rounded-[22%] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    style: { width: size, height: size },
  }

  return (
    <m.div className="relative" style={{ x: shift }}>
      <AnimatePresence>
        {tooltip && (
          <m.div
            aria-hidden
            className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2"
            style={{ y: lift }}
          >
            <m.div
              className="rounded-md border border-line bg-overlay px-2 py-1 text-xs font-medium whitespace-nowrap text-fg shadow-sm"
              initial={k.reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2, transition: k.reduced ? { type: false } : k.tween('instant', 'exit') }}
              transition={k.reduced ? { type: false } : k.tween('fast', 'enter')}
            >
              {item.label}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
      {/* Scale on an inner layer so the focus ring and hit target scale together. */}
      <m.div style={{ scale, transformOrigin: '50% 100%' }}>
        {Tag === 'a' ? (
          <a {...common} href={item.href}>
            <Tile>{item.icon}</Tile>
          </a>
        ) : (
          <button {...common} type="button">
            <Tile>{item.icon}</Tile>
          </button>
        )}
      </m.div>
      <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2">
        {active && (
          <m.span
            layoutId={indicatorId}
            transition={k.reduced ? { type: false } : k.spring('smooth')}
            className="block size-1 rounded-full bg-fg"
          />
        )}
      </div>
    </m.div>
  )
}

function Tile({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-full place-items-center overflow-hidden rounded-[22%] border border-line bg-well text-fg [&>svg]:size-1/2">
      {children}
    </span>
  )
}
