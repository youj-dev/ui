'use client'

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react'
import { flushSync } from 'react-dom'
import { m } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MotionFeatures } from '@youj/core/lib/youj/features'

/* A highlight that glides between the items of a group: tabs, segmented
 * controls, toggle groups, nav. Put one inside the group's container; it
 * treats the container's other children as items.
 * - Which item: the one that matches `match`, by default the attributes a
 *   selected item exposes anyway (aria-selected, aria-current, aria-pressed,
 *   aria-checked, Base UI's data-active / data-pressed / data-checked…). With
 *   follow="hover" it tracks the pointer and keyboard focus instead.
 * - How it moves: its box is set to the item's box and Motion's layout
 *   projection animates the difference, so the glide is transform-only and the
 *   corners stay round mid-flight. It glides only when the target changes;
 *   resizes, font loads and RTL reflow re-place it without motion.
 * - Keyboard moves jump, pointer moves glide: a move that follows a key press
 *   (arrows, Home/End, typeahead, Tab) lands at once, so holding ArrowDown
 *   through a menu never trails the highlight behind focus. Enter and Space
 *   activate rather than navigate, so a tab picked with them still glides.
 * - With `linger`, losing the target holds the highlight where it is for the
 *   fast token before it fades, so a pointer crossing a gap, a separator or a
 *   group label carries it on to the next item in one glide.
 * - Scoped by construction: each group owns its indicator.
 * - Measured lazily: with follow="active" the first placement and every
 *   selection change are read in the next animation frame, when the browser
 *   lays the page out anyway, and committed before that frame paints. Reading
 *   in a layout effect forced an extra style and layout pass of whatever just
 *   mounted around it (a whole command palette on its first open). */

const ACTIVE =
  '[aria-selected="true"], [aria-current]:not([aria-current="false"]), [aria-pressed="true"], [aria-checked="true"], ' +
  '[data-active], [data-pressed], [data-checked], [data-selected], [data-state="active"], [data-state="on"], [data-state="checked"]'
const DISABLED = ':disabled, [aria-disabled="true"], [data-disabled]'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** The attributes a selector depends on, so a MutationObserver can watch just those. */
function attributesIn(selector: string) {
  const names = new Set<string>()
  for (const [, name] of selector.matchAll(/\[\s*([\w-]+)/g)) names.add(name!)
  if (/\.[\w-]/.test(selector)) names.add('class')
  return [...names]
}

/** The target's box in the indicator's containing block, undoing any ancestor scale. */
function measure(target: Element, indicator: HTMLElement): Box | null {
  const parent = indicator.offsetParent as HTMLElement | null
  if (!parent) return null
  const p = parent.getBoundingClientRect()
  const sx = parent.offsetWidth ? p.width / parent.offsetWidth : 1
  const sy = parent.offsetHeight ? p.height / parent.offsetHeight : 1
  const t = target.getBoundingClientRect()
  return {
    x: (t.left - p.left) / sx - parent.clientLeft + parent.scrollLeft,
    y: (t.top - p.top) / sy - parent.clientTop + parent.scrollTop,
    w: t.width / sx,
    h: t.height / sy,
  }
}

/* Every indicator waiting on a frame is placed in one: all of them read, then
 * all of them commit together before the frame paints, so one indicator's
 * write never forces a layout for the next one's read (a page of segmented
 * controls and toggle groups hydrating at once). */
type Placement = () => (() => void) | undefined
const due = new Set<Placement>()
/** Run after the batch has committed. */
const settled = new Set<() => void>()
let batch = 0
function inNextFrame(placement: Placement) {
  due.add(placement)
  batch ||= requestAnimationFrame(() => {
    batch = 0
    const placements = [...due]
    due.clear()
    const writes = placements.flatMap((p) => p() ?? [])
    flushSync(() => writes.forEach((write) => write()))
    const after = [...settled]
    settled.clear()
    after.forEach((fn) => fn())
  })
  return () => {
    due.delete(placement)
    if (due.size || !batch) return
    cancelAnimationFrame(batch)
    batch = 0
  }
}

/* The page's last input, shared by every indicator: when a key was pressed
 * and no pointer has moved since. Listening starts with the first indicator
 * and stops with the last. */
let keyedAt = -Infinity
let listeners = 0
const onKeyDown = Object.assign(
  (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') keyedAt = performance.now()
  },
  // Only notes when a key was pressed; never handles one (tools that audit a page's key listeners skip it).
  { [Symbol.for('youj.observeOnly')]: true },
)
const onPointer = () => {
  keyedAt = -Infinity
}
function listenForInput() {
  if (listeners++ === 0) {
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointermove', onPointer, true)
    window.addEventListener('pointerdown', onPointer, true)
  }
  return () => {
    if (--listeners > 0) return
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('pointermove', onPointer, true)
    window.removeEventListener('pointerdown', onPointer, true)
  }
}

function isFocusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

const same = (a: Box | null, b: Box) =>
  !!a && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5

export interface SlidingIndicatorProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** 'pill' fills the item; 'underline' is a bar along its bottom edge. Default 'pill'. */
  variant?: 'pill' | 'underline'
  /** 'active' follows the selected item; 'hover' follows the pointer and keyboard focus and fades out when they leave. Default 'active'. */
  follow?: 'active' | 'hover'
  /** Selector for the active item, tested on the items and inside them. Default: ARIA and Base UI selected states. */
  match?: string
  /**
   * When nothing matches (or the pointer leaves, with follow="hover"), hold the
   * highlight on its last item for the fast token before fading, so crossing a
   * gap, a separator or a group label glides on to the next item instead of
   * blinking out. Menus want this. No hold under reduced motion. Default false.
   */
  linger?: boolean
}

/**
 * A highlight that glides to the active (or hovered) item of its group. Render
 * it inside the group's container and give the container `relative isolate`:
 * the indicator sits behind the items' content. Reduced motion jumps instead
 * of gliding.
 */
export function SlidingIndicator({
  variant = 'pill',
  follow = 'active',
  match = ACTIVE,
  linger = false,
  className,
  style,
  ...rest
}: SlidingIndicatorProps) {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const target = useRef<Element | null>(null)
  // Read when the target goes, so Speed and reduced motion apply without re-running the effect.
  const hold = useRef(0)
  hold.current = linger && !k.reduced ? k.ms('fast') : 0
  // How recent a key press still counts as the cause of a move: the slow token
  // covers a follow="active" selection that lands a frame or two later.
  const keyWindow = useRef(0)
  keyWindow.current = k.ms('slow')
  const [view, setView] = useState<{ box: Box | null; visible: boolean; moves: number; jump: boolean }>({
    box: null,
    visible: false,
    moves: 0,
    jump: false,
  })
  // Motion keeps corners round during the glide only when the radius is an
  // inline value. (Shadows stay in CSS: copying them would freeze theme colors.)
  // It's read with the first placement, when style is clean, not on mount.
  const [radius, setRadius] = useState<string>()
  const radiusStale = useRef(true)
  // The first placement happens before the first paint and shouldn't fade in.
  // With follow="active" that placement is in the first frame (see below).
  const mounted = useRef(false)
  useEffect(() => {
    if (follow !== 'active') mounted.current = true
  }, [follow])

  useLayoutEffect(() => {
    // Only a radius already copied inline goes stale; otherwise the next placement reads it.
    radiusStale.current = true
    if (ref.current && radius !== undefined) {
      radiusStale.current = false
      setRadius(getComputedStyle(ref.current).borderRadius || undefined)
    }
  }, [className, variant])

  useLayoutEffect(() => {
    const el = ref.current
    const container = el?.parentElement
    if (!el || !container) return
    let live = true

    const items = () => Array.from(container.children).filter((c) => c !== el)
    const itemOf = (node: EventTarget | null) => {
      let n = node instanceof Element ? node : null
      while (n && n.parentElement !== container) n = n.parentElement
      return n && n !== el ? n : null
    }
    // An item that is itself selected wins over a match inside another one
    // (an icon drawn in its active state carries data-state="active").
    const findActive = () => {
      const all = items()
      const own = all.find((item) => item.matches(match))
      if (own) return own
      for (const item of all) {
        const inner = item.querySelector(match)
        if (inner) return inner
      }
      return null
    }

    const hide = () => setView((v) => (v.visible ? { ...v, visible: false } : v))
    // Pending while the highlight lingers on an item it has lost.
    let lingering: ReturnType<typeof setTimeout> | undefined

    /** Point at `next`: glide if another item was showing, otherwise appear in place. Reads now; returns the writes. */
    const read = (next: Element | null): (() => void) | undefined => {
      if (!live) return
      const changed = next !== target.current
      target.current = next
      if (!next) {
        if (changed && hold.current > 0) {
          clearTimeout(lingering)
          lingering = setTimeout(() => {
            lingering = undefined
            hide()
          }, hold.current)
        } else if (lingering === undefined) {
          return hide
        }
        return
      }
      clearTimeout(lingering)
      lingering = undefined
      const box = measure(next, el)
      if (!box) return
      if (variant === 'underline') box.y += box.h - el.offsetHeight
      const radiusNow = radiusStale.current ? getComputedStyle(el).borderRadius || undefined : null
      radiusStale.current = false
      const keyed = performance.now() - keyedAt < keyWindow.current
      return () => {
        if (radiusNow !== null) setRadius(radiusNow)
        setView((v) => {
          const glide = changed && v.visible
          if (!glide && v.visible && same(v.box, box)) return v
          return { box, visible: true, moves: glide ? v.moves + 1 : v.moves, jump: glide ? keyed : v.jump }
        })
      }
    }
    const place = (next: Element | null) => read(next)?.()
    const replace = () => {
      if (target.current?.isConnected) place(target.current)
      else if (follow === 'active') place(findActive())
    }

    const cleanups: (() => void)[] = [listenForInput()]
    const resize = new ResizeObserver(replace)
    const observeAll = () => {
      resize.disconnect()
      resize.observe(container)
      for (const item of items()) resize.observe(item)
    }
    observeAll()
    cleanups.push(() => resize.disconnect())

    if (follow === 'active') {
      // One read per frame, however many attributes changed: after the first
      // frame's placement, later ones may fade.
      let cancel: (() => void) | undefined
      const placeNextFrame = () => {
        cancel ??= inNextFrame(() => {
          cancel = undefined
          settled.add(() => (mounted.current = true))
          return read(findActive())
        })
      }
      placeNextFrame()
      const mutations = new MutationObserver((records) => {
        if (records.some((r) => r.type === 'childList')) observeAll()
        placeNextFrame()
      })
      mutations.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: attributesIn(match) })
      cleanups.push(() => {
        mutations.disconnect()
        cancel?.()
      })
    } else {
      let pointerInside = false
      const hoverable = (item: Element | null) => (item && !item.matches(DISABLED) ? item : null)
      const focusedItem = () => {
        const focused = document.activeElement
        return focused && container.contains(focused) && isFocusVisible(focused) ? hoverable(itemOf(focused)) : null
      }
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return
        pointerInside = true
        const item = hoverable(itemOf(e.target))
        if (item && item !== target.current) place(item)
      }
      const onLeave = () => {
        pointerInside = false
        place(focusedItem())
      }
      const onFocusIn = (e: FocusEvent) => {
        const node = e.target as Element
        if (isFocusVisible(node)) place(hoverable(itemOf(node)))
      }
      const onFocusOut = (e: FocusEvent) => {
        if (!pointerInside && !container.contains(e.relatedTarget as Node | null)) place(null)
      }
      container.addEventListener('pointermove', onMove)
      container.addEventListener('pointerleave', onLeave)
      container.addEventListener('focusin', onFocusIn)
      container.addEventListener('focusout', onFocusOut)
      cleanups.push(() => {
        container.removeEventListener('pointermove', onMove)
        container.removeEventListener('pointerleave', onLeave)
        container.removeEventListener('focusin', onFocusIn)
        container.removeEventListener('focusout', onFocusOut)
      })
    }

    // Asking for document.fonts recalculates style, so it waits for the frame too.
    const fonts = requestAnimationFrame(() => document.fonts?.ready.then(replace, () => {}))
    cleanups.push(() => cancelAnimationFrame(fonts))

    return () => {
      live = false
      clearTimeout(lingering)
      for (const cleanup of cleanups) cleanup()
      target.current = null
    }
  }, [follow, match, variant])

  const { box } = view
  return (
    <MotionFeatures features="max">
      <m.span
        {...rest}
        ref={ref}
        aria-hidden
        data-yj-indicator={variant}
        data-instant={view.jump ? '' : undefined}
        layout
        layoutDependency={view.moves}
        transition={{ layout: k.reduced || view.jump ? { type: false } : k.spring('smooth') }}
        // Visibility is a class, not a Motion value: with `layout` Motion would own opacity.
        className={cn(
          'pointer-events-none absolute top-0 left-0 -z-1',
          mounted.current && 'transition-opacity yj-duration-fast own:ease-standard',
          view.visible ? 'opacity-100' : 'opacity-0',
          variant === 'pill' ? 'own:rounded-md own:bg-selected' : 'own:h-0.5 own:rounded-full own:bg-fg',
          className,
        )}
        style={{
          borderRadius: radius,
          ...style,
          left: box?.x ?? 0,
          top: box?.y ?? 0,
          width: box?.w ?? 0,
          height: variant === 'pill' ? (box?.h ?? 0) : undefined,
        }}
      />
    </MotionFeatures>
  )
}
