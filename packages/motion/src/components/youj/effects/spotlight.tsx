'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'

/* One light source, many surfaces. A group tracks the pointer once and hands
 * every surface the pointer position in that surface's own coordinates
 * (--yj-spot-x / --yj-spot-y), so a surface's border lights up where the cursor
 * is near it even when the cursor is over a neighbor. The light itself is a
 * radial blob moved with transform only; the border layer is the same blob
 * masked down to a 1px ring.
 * Keyboard focus parks the light at the focused surface's center and glides it
 * from surface to surface, which lights the same neighboring edges. */

const CSS = `
.yj-spot { position: relative; isolation: isolate; }
.yj-spot__surface, .yj-spot__edge {
  position: absolute;
  border-radius: inherit;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  transition: opacity var(--yj-duration-slow) var(--ease-standard);
}
.yj-spot__surface { inset: 0; z-index: -1; }
.yj-spot__edge {
  inset: -1px;
  z-index: 1;
  padding: 1px;
  -webkit-mask: linear-gradient(white 0 0) content-box, linear-gradient(white 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(white 0 0) content-box exclude, linear-gradient(white 0 0);
}
.yj-spot__blob {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(var(--yj-spot-r) * 2);
  height: calc(var(--yj-spot-r) * 2);
  border-radius: 50%;
  transform: translate(calc(var(--yj-spot-x, -999px) - var(--yj-spot-r)), calc(var(--yj-spot-y, -999px) - var(--yj-spot-r)));
  will-change: transform;
}
.yj-spot__surface > .yj-spot__blob {
  background: radial-gradient(closest-side, color-mix(in oklch, var(--color-accent) 11%, transparent), transparent);
}
.yj-spot__edge > .yj-spot__blob {
  background: radial-gradient(closest-side, var(--color-accent), color-mix(in oklch, var(--color-accent) 25%, transparent) 55%, transparent);
}

[data-yj-spot-active] .yj-spot__edge { opacity: 1; }
.yj-spot:hover > .yj-spot__surface,
.yj-spot[data-yj-spot-focus] > .yj-spot__surface { opacity: 1; }

[data-yj-spot-mode='focus'] .yj-spot__blob {
  transition: transform var(--yj-duration-slow) var(--ease-standard);
}

/* Reduced motion: no tracking. The hovered or focused surface shows a static accent border. */
.yj-spot[data-reduced] > .yj-spot__surface { display: none; }
.yj-spot[data-reduced] > .yj-spot__edge { transition: none; background: color-mix(in oklch, var(--color-accent) 70%, transparent); }
.yj-spot[data-reduced] .yj-spot__blob { display: none; }
.yj-spot[data-reduced]:is(:hover, :has(:focus-visible), :focus-visible) > .yj-spot__edge { opacity: 1; }
`

/** True inside a SpotlightGroup: surfaces then leave tracking to the group. */
const SpotlightGroupContext = createContext(false)

/**
 * Tracks the pointer (or keyboard focus) over `root` and writes each surface's
 * local light position as --yj-spot-x / --yj-spot-y. Surfaces are `root` itself
 * when it is one, otherwise every `[data-yj-spot-card]` inside it. Use the vars
 * in your own CSS, or render SpotlightSurface for the stock light. Off with
 * reduced motion and for touch.
 */
export function useSpotlight(root: RefObject<HTMLElement | null>, enabled = true) {
  const k = useYouj()
  const active = enabled && !k.reduced
  useEffect(() => {
    const el = root.current
    if (!el || !active) return
    let raf = 0
    let point: { x: number; y: number } | null = null

    const cards = () =>
      el.hasAttribute('data-yj-spot-card') ? [el] : Array.from(el.querySelectorAll<HTMLElement>('[data-yj-spot-card]'))

    const paint = () => {
      raf = 0
      if (!point) return
      for (const card of cards()) {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--yj-spot-x', `${point.x - r.left}px`)
        card.style.setProperty('--yj-spot-y', `${point.y - r.top}px`)
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const setFocused = (card: Element | null) => {
      for (const c of cards()) c.toggleAttribute('data-yj-spot-focus', c === card)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      point = { x: e.clientX, y: e.clientY }
      el.setAttribute('data-yj-spot-mode', 'pointer')
      el.toggleAttribute('data-yj-spot-active', true)
      setFocused(null)
      schedule()
    }
    const onLeave = () => {
      if (el.getAttribute('data-yj-spot-mode') === 'pointer') el.removeAttribute('data-yj-spot-active')
    }
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (!target.matches(':focus-visible')) return
      const card = target.closest<HTMLElement>('[data-yj-spot-card]')
      if (!card) return
      const r = card.getBoundingClientRect()
      point = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      el.setAttribute('data-yj-spot-mode', 'focus')
      el.toggleAttribute('data-yj-spot-active', true)
      setFocused(card)
      schedule()
    }
    const onFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node | null)) return
      if (el.getAttribute('data-yj-spot-mode') === 'focus') el.removeAttribute('data-yj-spot-active')
      setFocused(null)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      el.removeAttribute('data-yj-spot-active')
      el.removeAttribute('data-yj-spot-mode')
      setFocused(null)
    }
  }, [root, active])
}

export interface SpotlightGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Radius of the light in px. Default 260. */
  radius?: number
  children?: ReactNode
}

/** Shares one pointer-tracked light across the SpotlightSurfaces inside it. Brings no layout of its own. */
export function SpotlightGroup({ radius = 260, style, children, ...rest }: SpotlightGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  useSpotlight(ref)
  return (
    <SpotlightGroupContext.Provider value>
      <div {...rest} ref={ref} style={{ '--yj-spot-r': `${radius}px`, ...style } as CSSProperties}>
        {children}
      </div>
    </SpotlightGroupContext.Provider>
  )
}

export interface SpotlightSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Radius of the light in px when used outside a SpotlightGroup. Default 260. */
  radius?: number
  children?: ReactNode
}

/**
 * Any surface, lit by the spotlight: a soft glow under the pointer and a
 * border glow where the light passes the edge. Brings no look of its own (give
 * it a radius, border and background). Tracks the pointer itself unless it
 * sits in a SpotlightGroup. Reduced motion shows a static accent border on
 * hover and focus instead.
 */
export function SpotlightSurface({ radius, className, style, children, ...rest }: SpotlightSurfaceProps) {
  const k = useYouj()
  const inGroup = useContext(SpotlightGroupContext)
  const ref = useRef<HTMLDivElement>(null)
  useSpotlight(ref, !inGroup)
  const ownRadius = !inGroup || radius !== undefined ? { '--yj-spot-r': `${radius ?? 260}px` } : null
  return (
    <div
      {...rest}
      ref={ref}
      data-yj-spot-card=""
      data-reduced={k.reduced ? '' : undefined}
      className={cn('yj-spot', className)}
      style={{ ...ownRadius, ...style } as CSSProperties}
    >
      <style href="youj-spotlight-card" precedence="youj">
        {CSS}
      </style>
      <span aria-hidden className="yj-spot__surface">
        <span className="yj-spot__blob" />
      </span>
      <span aria-hidden className="yj-spot__edge">
        <span className="yj-spot__blob" />
      </span>
      {children}
    </div>
  )
}
