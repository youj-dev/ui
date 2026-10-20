import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { m, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useYouj, useMotionBudget } from '@youj/core/lib/youj/provider'
import { springs } from '@youj/core'
import { springPhysics } from '@youj/core/internal'
import { MotionFeatures } from '@youj/core/lib/youj/features'

/* A second cursor that reads the page. Targets opt in with data-cursor:
 *   button  the shape grows to wrap the target, leaning 10% toward the pointer
 *   text    the shape collapses to an I-beam the height of the line
 *   link    the shape becomes a small pill label beside the pointer
 *   media   the shape becomes a round "View" badge
 * The shape is one 100×100 box scaled on each axis (transform only), with
 * its border radius counter-scaled so corners stay round mid-morph. Position
 * and shape run on separate springs so moving feels responsive while morphs
 * feel deliberate. Labels live outside the scaled box so text never stretches.
 * All updates are imperative in the pointer handler: no React render per move. */

export type CursorKind = 'button' | 'text' | 'link' | 'media'

export interface CursorFollowerProps {
  /** Only react inside this element. Default: the whole document. */
  scope?: RefObject<HTMLElement | null>
  /**
   * Hide the native cursor while the follower is drawing. Off by default. The
   * native cursor is only hidden once the follower is active and visible, and
   * comes back whenever the follower is disabled or the pointer leaves.
   */
  hideNativeCursor?: boolean
  /** Turn the follower off. It is also off for touch / coarse pointers, reduced motion and the low motion-budget tier. */
  disabled?: boolean
}

const BASE = 100
const HALO = 28
const PAD = 6

const CSS = `
[data-yj-cursor-hidden], [data-yj-cursor-hidden] * { cursor: none !important; }
`

function usePointerIsFine() {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return fine
}

export function CursorFollower({ scope, hideNativeCursor = false, disabled = false }: CursorFollowerProps) {
  const k = useYouj()
  const fine = usePointerIsFine()
  const low = useMotionBudget().tier === 'low'
  const enabled = fine && !k.reduced && !disabled && !low
  if (!enabled) return null
  return <MotionFeatures><CursorLayer scope={scope} hideNativeCursor={hideNativeCursor} /></MotionFeatures>
}

function CursorLayer({ scope, hideNativeCursor }: Pick<CursorFollowerProps, 'scope' | 'hideNativeCursor'>) {
  const k = useYouj()
  const move = springPhysics(springs.snappy, k.timeScale)
  const morph = springPhysics(springs.smooth, k.timeScale)

  const x = useSpring(0, move)
  const y = useSpring(0, move)
  const w = useSpring(HALO, morph)
  const h = useSpring(HALO, morph)
  const r = useSpring(HALO / 2, morph)
  // Fills crossfade on the quicker spring so the old color never lingers mid-morph.
  const fg = useSpring(0.12, move)
  const accent = useSpring(0, move)
  const labelOpacity = useSpring(0, move)
  const visible = useSpring(0, move)
  const dotOpacity = useSpring(0, move)
  const dotX = useMotionValue(0)
  const dotY = useMotionValue(0)

  const scaleX = useTransform(w, (v) => v / BASE)
  const scaleY = useTransform(h, (v) => v / BASE)
  const radius = useTransform(() => {
    const rr = Math.min(r.get(), w.get() / 2, h.get() / 2)
    return `${(rr * BASE) / w.get()}px / ${(rr * BASE) / h.get()}px`
  })

  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root: HTMLElement = scope?.current ?? document.documentElement
    let last: { x: number; y: number } | null = null
    let shown = false
    // The pill's width only changes with its text: measure on change, not on every move (a forced layout per event).
    let labelText: string | null = null
    let labelWidth = 0

    const show = (on: boolean) => {
      shown = on
      if (!on) last = null
      visible.set(on ? 1 : 0)
      if (hideNativeCursor) root.toggleAttribute('data-yj-cursor-hidden', on)
    }

    const update = (px: number, py: number, hit: Element | null) => {
      const target = hit?.closest<HTMLElement>('[data-cursor]')
      const kind = (target && root.contains(target) ? target.dataset.cursor : undefined) as CursorKind | undefined
      // The I-beam and the "View" badge sit on the pointer and mark it; a dot would cover them.
      const dot = hideNativeCursor && kind !== 'text' && kind !== 'media' ? 1 : 0
      dotOpacity.set(dot)

      if (kind === 'button' && target) {
        const rect = target.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const tr = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0
        x.set(cx + (px - cx) * 0.1)
        y.set(cy + (py - cy) * 0.1)
        w.set(rect.width + PAD * 2)
        h.set(rect.height + PAD * 2)
        r.set(tr + PAD)
        fg.set(0)
        accent.set(0.14)
        labelOpacity.set(0)
        return
      }
      if (kind === 'text' && target) {
        const cs = getComputedStyle(target)
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25
        x.set(px)
        y.set(py)
        w.set(2)
        h.set(lh)
        r.set(1)
        fg.set(0.9)
        accent.set(0)
        labelOpacity.set(0)
        return
      }
      if ((kind === 'link' || kind === 'media') && target && label.current) {
        const text = target.dataset.cursorLabel ?? (kind === 'link' ? 'Open' : 'View')
        if (text !== labelText) {
          label.current.textContent = labelText = text
          labelWidth = label.current.offsetWidth
        }
        if (kind === 'link') {
          const lw = labelWidth + 20
          x.set(px + 14 + lw / 2)
          y.set(py + 24)
          w.set(lw)
          h.set(24)
          r.set(12)
        } else {
          x.set(px)
          y.set(py)
          w.set(68)
          h.set(68)
          r.set(34)
        }
        fg.set(0)
        accent.set(1)
        labelOpacity.set(1)
        return
      }
      x.set(px)
      y.set(py)
      w.set(HALO)
      h.set(HALO)
      r.set(HALO / 2)
      fg.set(0.12)
      accent.set(0)
      labelOpacity.set(0)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const inside = root.contains(e.target as Node)
      if (!inside) {
        if (shown) show(false)
        return
      }
      if (!last) {
        // First sighting: appear in place instead of flying in from the corner.
        x.jump(e.clientX)
        y.jump(e.clientY)
      }
      last = { x: e.clientX, y: e.clientY }
      dotX.set(e.clientX)
      dotY.set(e.clientY)
      if (!shown) show(true)
      update(e.clientX, e.clientY, e.target as Element)
    }
    const onLeaveDoc = (e: PointerEvent) => {
      if (!e.relatedTarget) show(false)
    }
    const onScroll = () => {
      if (last && shown) update(last.x, last.y, document.elementFromPoint(last.x, last.y))
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onLeaveDoc)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onLeaveDoc)
      window.removeEventListener('scroll', onScroll, { capture: true })
      root.removeAttribute('data-yj-cursor-hidden')
    }
  }, [scope, hideNativeCursor, x, y, w, h, r, fg, accent, labelOpacity, visible, dotOpacity, dotX, dotY])

  return createPortal(
    <m.div
      aria-hidden
      data-yj-cursor=""
      className="pointer-events-none fixed inset-0 z-[2147483000] overflow-hidden"
      style={{ opacity: visible }}
    >
      <style href="youj-cursor-follower" precedence="youj">
        {CSS}
      </style>
      <m.div
        className="absolute"
        style={{ left: -BASE / 2, top: -BASE / 2, width: BASE, height: BASE, x, y, scaleX, scaleY, borderRadius: radius, overflow: 'hidden' }}
      >
        <m.div className="absolute inset-0 bg-fg" style={{ opacity: fg }} />
        <m.div className="absolute inset-0 bg-accent" style={{ opacity: accent }} />
      </m.div>
      <m.span
        ref={label}
        className="absolute top-0 left-0 -translate-1/2 text-[11px] leading-none font-medium whitespace-nowrap text-on-accent"
        style={{ x, y, opacity: labelOpacity }}
      />
      <m.div
        className="absolute -top-[3px] -left-[3px] size-1.5 rounded-full bg-fg"
        style={{ x: dotX, y: dotY, opacity: dotOpacity }}
      />
    </m.div>,
    document.body,
  )
}
