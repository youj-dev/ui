'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useDirection, usePortalContainer, useSoundCue, useYouj, useYoujScope } from '@youj/core'
import { radialMenuLabels, useComponentLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'

/* A pie menu: a ring of actions that fans out around the pointer (or the
 * trigger, from the keyboard), one icon per circular slot, with a hub in the
 * middle that names the highlighted action.
 * - Opening: `hold` opens after a press is held still (the slow token), so a
 *   drag toward a slot and a release picks it in one gesture; a release in the
 *   hub leaves the ring open to click. `click` opens on a click, `contextmenu`
 *   on a right-click (held, it works like a hold). Enter, Space, the context
 *   menu key and Shift+F10 open it on any trigger, centered on the trigger.
 * - Choosing: the slot is picked by the pointer's angle from the center, as
 *   in a pie menu, anywhere between the hub and a slot's width past the ring;
 *   the hub and anything farther pick nothing, and a click there closes.
 * - Layout: `startAngle` (0 is up, clockwise) and `sweep` set a full ring or
 *   an arc; RTL mirrors it. Near an edge of the window (or `container`) the
 *   ring shifts inward, and a full ring that would have to move far becomes a
 *   half ring facing away from the edge. Crowded slots push the radius out.
 * - Motion: the slots fan out from the center on the smooth spring, staggered
 *   (tight), and collapse back on the fast exit tween in reverse; the hub pops
 *   in on the snappy spring; the highlighted slot scales up and fills with the
 *   accent, and a short accent arc on the hub's rim turns to point at it.
 *   Reduced motion: everything appears and goes at once.
 * - Access: the ring is a menu of menuitems with roving focus; the arrow keys
 *   go around it (mirrored in RTL), Home/End, Enter or Space choose, Escape
 *   and Tab close and return focus to the trigger, and the choice is announced. */

type RadialMenuTrigger = 'hold' | 'click' | 'contextmenu'

interface RadialMenuItem {
  id: string
  label: string
  icon: ReactNode
  onSelect?: () => void
  disabled?: boolean
}

interface RadialMenuProps extends Omit<useRender.ComponentProps<'div'>, 'onSelect'> {
  items: RadialMenuItem[]
  /** How a pointer opens it: a held press (default), a click, or a right-click. The keyboard opens it in every mode. */
  trigger?: RadialMenuTrigger
  /** Distance from the center to the slots' centers, in px. Default 84; crowded slots push it out. */
  radius?: number
  /** Where the first slot sits, in degrees: 0 is up, 90 is the inline end side. Default 0. */
  startAngle?: number
  /** How much of the circle the slots span, in degrees: 360 is a full ring, less is an arc whose ends hold a slot each. Default 360. */
  sweep?: number
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Runs with the chosen item, after the item's own `onSelect`. */
  onSelect?: (item: RadialMenuItem) => void
  /** The ring's accessible name. Default: the `actions` label. */
  label?: string
  /** How long a press is held before the ring opens, in ms. Default: the slow token. */
  holdDelay?: number
  /** The trigger opens nothing. */
  disabled?: boolean
  /** Play the kit's cues: open, a tick per slot passed, select and close. Default true. */
  sound?: boolean
  /** Where the ring renders. Default: the provider's portal container, else `document.body`. It must be a positioning context for `fixed` children. */
  container?: HTMLElement | null
}

interface Point {
  x: number
  y: number
}

interface Layout {
  cx: number
  cy: number
  radius: number
  angles: number[]
  full: boolean
}

const SLOT = 44
const PAD = 8

const rad = (deg: number) => (deg * Math.PI) / 180
const at = (deg: number, r: number): Point => ({ x: Math.sin(rad(deg)) * r, y: -Math.cos(rad(deg)) * r })
/** The angle between two directions, 0–180. */
const gap = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180)
const hubSize = (radius: number) => Math.min(96, Math.max(56, (radius - SLOT / 2 - 10) * 2))

/** The slots' angles: evenly round a full ring, or from end to end of an arc. */
function spread(count: number, start: number, sweep: number): number[] {
  if (Math.abs(sweep) >= 360) return Array.from({ length: count }, (_, i) => start + (i * 360) / count)
  if (count === 1) return [start + sweep / 2]
  return Array.from({ length: count }, (_, i) => start + (i * sweep) / (count - 1))
}

/** The smallest radius at which neighbouring slots keep a little air between them. */
function roomy(angles: number[], radius: number) {
  if (angles.length < 2) return radius
  let step = 360
  angles.forEach((a, i) => {
    angles.forEach((b, j) => {
      if (i < j) step = Math.min(step, gap(a, b))
    })
  })
  return step <= 0 ? radius : Math.max(radius, (SLOT + 8) / (2 * Math.sin(rad(step) / 2)))
}

/** The ring's center: the origin, moved just enough for every slot and the hub to stay inside the box. */
function place(origin: Point, box: { w: number; h: number }, angles: number[], radius: number): Point {
  const hub = hubSize(radius) / 2
  let [minX, maxX, minY, maxY] = [-hub, hub, -hub, hub]
  for (const a of angles) {
    const p = at(a, radius)
    minX = Math.min(minX, p.x - SLOT / 2)
    maxX = Math.max(maxX, p.x + SLOT / 2)
    minY = Math.min(minY, p.y - SLOT / 2)
    maxY = Math.max(maxY, p.y + SLOT / 2)
  }
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi))
  return { x: clamp(origin.x, PAD - minX, box.w - PAD - maxX), y: clamp(origin.y, PAD - minY, box.h - PAD - maxY) }
}

function fit(origin: Point, box: { w: number; h: number }, count: number, radius: number, startAngle: number, sweep: number, rtl: boolean): Layout {
  const mirror = (angles: number[]) => (rtl ? angles.map((a) => -a) : angles)
  const full = sweep >= 360
  let angles = mirror(spread(count, startAngle, Math.min(sweep, 360)))
  let r = roomy(angles, radius)
  let c = place(origin, box, angles, r)
  // A full ring pushed far from the pointer turns into a half ring that faces away from the edge.
  if (full && count > 1 && Math.hypot(c.x - origin.x, c.y - origin.y) > r / 2) {
    const away = (Math.atan2(c.x - origin.x, origin.y - c.y) * 180) / Math.PI
    angles = rtl ? spread(count, away + 90, -180) : spread(count, away - 90, 180)
    r = roomy(angles, radius)
    c = place(origin, box, angles, r)
    return { cx: c.x, cy: c.y, radius: r, angles, full: false }
  }
  return { cx: c.x, cy: c.y, radius: r, angles, full }
}

/** An SVG arc at radius `r` around (c, c), from angle `a` to `b`, clockwise. */
function arc(c: number, r: number, a: number, b: number) {
  const p = at(a, r)
  const q = at(b, r)
  const large = b - a > 180 ? 1 : 0
  return `M${c + p.x},${c + p.y}A${r},${r} 0 ${large} 1 ${c + q.x},${c + q.y}`
}

function RadialMenu({
  items,
  trigger = 'hold',
  radius = 84,
  startAngle = 0,
  sweep = 360,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  label,
  holdDelay,
  disabled = false,
  sound = true,
  container,
  render,
  ref,
  children,
  className,
  ...rest
}: RadialMenuProps) {
  const k = useYouj()
  const direction = useDirection()
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  const labels = useComponentLabels(radialMenuLabels)
  const cue = useSoundCue()
  const [open, setOpen] = useControllableState(openProp, defaultOpen)
  const [client, setClient] = useState(false)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [active, setActive] = useState(-1)
  const [turn, setTurn] = useState(0)
  const { politeRef, announce } = useLiveRegion()
  const self = useRef<HTMLDivElement | null>(null)
  const layer = useRef<HTMLDivElement | null>(null)
  const menu = useRef<HTMLDivElement | null>(null)
  const slots = useRef<(HTMLButtonElement | null)[]>([])
  const origin = useRef<Point | null>(null)
  const center = useRef<Point>({ x: 0, y: 0 })
  const activeRef = useRef(-1)
  const openRef = useRef(open)
  openRef.current = open
  // The press that is down now, and whether it is the one that opened the ring (its release in the hub keeps it open).
  const press = useRef<{ opening: boolean } | null>(null)
  const pending = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const id = useId()
  const hintId = `${id}-hint`
  const rtl = direction === 'rtl'
  const play = (c: Parameters<typeof cue>[0]) => sound && cue(c)

  useEffect(() => setClient(true), [])
  useEffect(() => () => clearTimeout(pending.current?.timer), [])

  const highlight = (i: number) => {
    if (i === activeRef.current) return
    activeRef.current = i
    setActive(i)
    if (i < 0 || !layout) return
    const target = layout.angles[i] ?? 0
    setTurn((t) => t + ((((target - t) % 360) + 540) % 360) - 180)
    play('tick')
  }

  const show = (at: Point | null) => {
    if (disabled || openRef.current) return
    origin.current = at
    activeRef.current = -1
    setActive(-1)
    setOpen(true)
    onOpenChange?.(true)
    play('open')
  }

  const close = (returnFocus = true) => {
    clearTimeout(pending.current?.timer)
    pending.current = null
    press.current = null
    origin.current = null
    if (!openRef.current) return
    openRef.current = false
    setOpen(false)
    onOpenChange?.(false)
    if (returnFocus) self.current?.focus({ preventScroll: true })
  }

  const choose = (i: number) => {
    const item = items[i]
    if (!item || item.disabled) return
    close()
    play('select')
    item.onSelect?.()
    onSelect?.(item)
    announce(labels.radialMenuChosen(item.label))
  }

  const dismiss = () => {
    if (!openRef.current) return
    play('close')
    close()
  }

  /** The enabled slot the point aims at, or -1 in the hub, past the ring or between the ends of an arc. */
  const pick = (x: number, y: number) => {
    if (!layout) return -1
    const dx = x - center.current.x
    const dy = y - center.current.y
    const d = Math.hypot(dx, dy)
    if (d < (hubSize(layout.radius) / 2) * 0.75 || d > layout.radius + SLOT * 1.5) return -1
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI
    let best = -1
    let bestGap = layout.full ? 180 : Math.max(360 / Math.max(items.length, 1) / 2, 30)
    layout.angles.forEach((a, i) => {
      const g = gap(angle, a)
      if (g <= bestGap) {
        best = i
        bestGap = g
      }
    })
    return items[best]?.disabled ? -1 : best
  }

  const triggerCenter = (): Point | null => {
    const r = self.current?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null
  }

  // Place the ring: the layer's box, the origin in it (the trigger's center when none was given), then fit.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the trigger is measured when the ring opens, not when its helper changes
  useLayoutEffect(() => {
    if (!open || !client || !layer.current) return
    const box = layer.current.getBoundingClientRect()
    const from = origin.current ?? triggerCenter() ?? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    const next = fit({ x: from.x - box.left, y: from.y - box.top }, { w: box.width, h: box.height }, items.length, radius, startAngle, sweep, rtl)
    center.current = { x: box.left + next.cx, y: box.top + next.cy }
    setLayout(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the trigger is measured when the ring opens, not when its helper changes
  }, [open, client, items.length, radius, startAngle, sweep, rtl])

  // Focus follows the highlight: the slot, or the menu itself while none is.
  useEffect(() => {
    if (!open || !layout) return
    const el = active >= 0 ? slots.current[active] : menu.current
    el?.focus({ preventScroll: true })
  }, [open, layout, active])

  // While open, the pointer anywhere aims the ring, and a release resolves the press that is down.
  useEffect(() => {
    if (!open || !layout) return
    const onMove = (event: globalThis.PointerEvent) => highlight(pick(event.clientX, event.clientY))
    const onUp = (event: globalThis.PointerEvent) => {
      const down = press.current
      if (!down) return
      press.current = null
      const i = pick(event.clientX, event.clientY)
      if (i >= 0) return choose(i)
      const d = Math.hypot(event.clientX - center.current.x, event.clientY - center.current.y)
      if (down.opening && d <= layout.radius + SLOT * 1.5) return
      dismiss()
    }
    const onCancel = () => {
      press.current = null
    }
    const onResize = () => close(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('resize', onResize)
    }
  })

  const cancelHold = () => {
    clearTimeout(pending.current?.timer)
    pending.current = null
  }

  const triggerProps = {
    'data-slot': 'radial-menu-trigger',
    'data-state': open ? 'open' : 'closed',
    'data-yj-trigger': trigger,
    'data-disabled': disabled || undefined,
    role: render ? undefined : 'button',
    tabIndex: render ? undefined : disabled ? -1 : 0,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    'aria-disabled': disabled || undefined,
    className: cn(trigger === 'hold' && 'touch-none select-none [-webkit-touch-callout:none]', 'focus-ring', className),
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (trigger !== 'hold' || event.button !== 0 || disabled || openRef.current) return
      const { clientX: x, clientY: y } = event
      cancelHold()
      pending.current = {
        x,
        y,
        timer: setTimeout(() => {
          pending.current = null
          press.current = { opening: true }
          show({ x, y })
        }, holdDelay ?? k.ms('slow')),
      }
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const p = pending.current
      if (p && Math.hypot(event.clientX - p.x, event.clientY - p.y) > 8) cancelHold()
    },
    onPointerUp: cancelHold,
    onPointerCancel: cancelHold,
    onPointerLeave: cancelHold,
    onClick: (event: MouseEvent<HTMLElement>) => {
      // A click from the keyboard (detail 0) opens on the trigger in every mode; a pointer's only in click mode.
      if (event.detail === 0) return show(null)
      if (trigger === 'click') show({ x: event.clientX, y: event.clientY })
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (trigger === 'hold') return event.preventDefault()
      if (trigger !== 'contextmenu') return
      event.preventDefault()
      if (openRef.current) return
      // A right button still down (macOS opens on the press) works like a hold: its release picks.
      if (event.buttons & 2) press.current = { opening: true }
      show(event.clientX || event.clientY ? { x: event.clientX, y: event.clientY } : null)
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const native = event.currentTarget.tagName === 'BUTTON'
      const menuKey = event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)
      if (menuKey || (!native && (event.key === 'Enter' || event.key === ' '))) {
        event.preventDefault()
        show(null)
      }
    },
  }

  const element = useRender({
    defaultTagName: 'div',
    render,
    ref: ref ? [self, ref] : self,
    props: mergeProps<'div'>(triggerProps as never, { ...rest, children } as never),
  })

  const move = (dir: 1 | -1) => {
    const count = items.length
    let i = activeRef.current < 0 ? (dir === 1 ? -1 : count) : activeRef.current
    for (let n = 0; n < count; n++) {
      i = (i + dir + count) % count
      if (!items[i]?.disabled) return highlight(i)
    }
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = rtl ? 'ArrowLeft' : 'ArrowRight'
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === next || event.key === 'ArrowDown') move(1)
    else if (event.key === prev || event.key === 'ArrowUp') move(-1)
    else if (event.key === 'Home') {
      activeRef.current = -1
      move(1)
    } else if (event.key === 'End') {
      activeRef.current = -1
      move(-1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (activeRef.current >= 0) choose(activeRef.current)
    } else if (event.key === 'Escape' || event.key === 'Tab') dismiss()
    else return
    event.preventDefault()
    event.stopPropagation()
  }

  // Opened from the keyboard: start on the first slot that can be chosen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only when the ring is placed
  useEffect(() => {
    if (open && layout && origin.current === null && activeRef.current < 0) move(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the ring is placed
  }, [open, layout])

  const shown = open ? layout : null
  const reach = layout ? layout.radius + SLOT / 2 + PAD : 0
  const hub = layout ? hubSize(layout.radius) : 0
  const instant = { type: false } as const
  const highlighted = active >= 0 ? items[active] : undefined
  const count = items.length

  return (
    <>
      {element}
      <div ref={politeRef} role="status" aria-live="polite" className="sr-only" />
      {client &&
        (open || layout) &&
        createPortal(
          <div
            {...scope}
            ref={layer}
            data-slot="radial-menu-layer"
            className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}
            onPointerDown={(event) => {
              if (!openRef.current) return
              event.preventDefault()
              press.current = { opening: false }
            }}
            onContextMenu={(event) => event.preventDefault()}
          >
            <MotionFeatures>
              <AnimatePresence onExitComplete={() => !openRef.current && setLayout(null)}>
                {shown && (
                  <div
                    key="ring"
                    ref={menu}
                    role="menu"
                    tabIndex={-1}
                    aria-label={label ?? labels.actions}
                    aria-describedby={hintId}
                    data-slot="radial-menu"
                    data-state="open"
                    data-yj-tone="overlay"
                    onKeyDown={onMenuKeyDown}
                    className="absolute text-fg outline-none"
                    style={{ left: shown.cx - reach, top: shown.cy - reach, width: reach * 2, height: reach * 2 }}
                  >
                    <span id={hintId} className="sr-only">
                      {labels.radialMenuHint}
                    </span>
                    <m.svg
                      aria-hidden
                      width={reach * 2}
                      height={reach * 2}
                      className="pointer-events-none absolute inset-0 overflow-visible"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={k.reduced ? instant : k.tween('fast', 'enter')}
                    >
                      <path
                        d={
                          shown.full
                            ? `M${reach},${reach - shown.radius}a${shown.radius},${shown.radius} 0 1 1 0,${shown.radius * 2}a${shown.radius},${shown.radius} 0 1 1 0,${-shown.radius * 2}`
                            : arc(reach, shown.radius, Math.min(...shown.angles), Math.max(...shown.angles))
                        }
                        fill="none"
                        strokeWidth={SLOT + 12}
                        strokeLinecap="round"
                        className="stroke-band"
                      />
                    </m.svg>
                    <m.div
                      aria-hidden
                      data-slot="radial-menu-hub"
                      className="absolute own:grid place-items-center own:rounded-full border border-line bg-overlay shadow-md"
                      style={{ left: reach - hub / 2, top: reach - hub / 2, width: hub, height: hub }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={k.reduced ? instant : k.spring('snappy')}
                    >
                      {highlighted && (
                        <m.div
                          className="absolute -inset-1"
                          initial={{ rotate: turn, opacity: 0 }}
                          animate={{ rotate: turn, opacity: 1 }}
                          transition={k.reduced ? instant : k.spring('snappy')}
                        >
                          <svg viewBox={`0 0 ${hub + 8} ${hub + 8}`} className="size-full overflow-visible">
                            <path d={arc((hub + 8) / 2, (hub + 8) / 2 - 1.5, -18, 18)} fill="none" strokeWidth={3} strokeLinecap="round" className="stroke-accent" />
                          </svg>
                        </m.div>
                      )}
                      <m.span
                        key={highlighted?.id ?? ''}
                        className={cn('max-w-full truncate px-2 text-center text-ui-sm font-medium', highlighted ? 'text-fg' : 'text-fg-subtle')}
                        initial={{ opacity: 0, y: k.reduced ? 0 : 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={k.reduced ? instant : k.tween('fast', 'enter')}
                      >
                        {highlighted?.label ?? label ?? labels.actions}
                      </m.span>
                    </m.div>
                    {items.map((item, i) => {
                      const p = at(shown.angles[i] ?? 0, shown.radius)
                      const on = i === active
                      return (
                        <m.div
                          key={item.id}
                          className="absolute"
                          style={{ left: reach - SLOT / 2, top: reach - SLOT / 2 }}
                          initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
                          animate={{ x: p.x, y: p.y, scale: 1, opacity: 1 }}
                          // The collapse runs in reverse order, on the fast exit tween.
                          exit={{
                            x: 0,
                            y: 0,
                            scale: 0.4,
                            opacity: 0,
                            transition: k.reduced ? instant : { ...k.tween('fast', 'exit'), delay: (count - 1 - i) * k.stagger('tight') },
                          }}
                          transition={
                            k.reduced
                              ? instant
                              : {
                                  ...k.spring('smooth'),
                                  delay: i * k.stagger('tight'),
                                  opacity: { ...k.tween('fast', 'enter'), delay: i * k.stagger('tight') },
                                }
                          }
                        >
                          <m.button
                            ref={(node) => {
                              slots.current[i] = node
                            }}
                            type="button"
                            role="menuitem"
                            aria-label={item.label}
                            aria-disabled={item.disabled || undefined}
                            tabIndex={on ? 0 : -1}
                            data-slot="radial-menu-item"
                            data-highlighted={on || undefined}
                            data-disabled={item.disabled || undefined}
                            onClick={(event) => {
                              // Pointer presses resolve on release (above); this is the keyboard's and assistive tech's click.
                              if (event.detail === 0) choose(i)
                            }}
                            animate={{ scale: on ? 1.14 : 1 }}
                            transition={k.reduced ? instant : k.spring('snappy')}
                            className={cn(
                              'focus-ring grid size-11 place-items-center own:rounded-full border border-line bg-overlay text-fg shadow-md transition-colors yj-duration-fast ease-standard',
                              'data-[highlighted]:border-accent data-[highlighted]:bg-accent data-[highlighted]:text-on-accent',
                              'data-[disabled]:text-fg-subtle data-[disabled]:shadow-none',
                              "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5",
                            )}
                          >
                            {item.icon}
                          </m.button>
                        </m.div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </MotionFeatures>
          </div>,
          container ?? portalContainer ?? document.body,
        )}
    </>
  )
}

export { RadialMenu }
export type { RadialMenuItem, RadialMenuProps, RadialMenuTrigger }
