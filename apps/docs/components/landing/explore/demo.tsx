'use client'

import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { YoujProvider } from '@youj/core'
import { TooltipProvider } from '@youj/react'

/* What every live tile shares, in a chunk the tiles load with their own: the kit's default look (Classic, as the site's
 * chrome and its previews are), tooltips grouped as an app's are, and the hooks a looping demo needs to give way
 * to a person. The demos play through usePlaying (components/landing/use-loop.ts): on screen, in a visible tab, with
 * motion allowed. */

export function Demo({ children }: { children: ReactNode }) {
  return (
    <YoujProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </YoujProvider>
  )
}

/**
 * Whether someone is using the demo in `ref`: a pointer over it, or focus inside it. A demo's own loop holds while
 * they are, and picks up `resume` ms after they leave. Pointer touches count as use until the next touch elsewhere.
 */
export function useInUse(ref: RefObject<HTMLElement | null>, resume = 2500) {
  const [inUse, setInUse] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let hovered = false
    let focused = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const sync = () => {
      clearTimeout(timer)
      if (hovered || focused) setInUse(true)
      else timer = setTimeout(() => setInUse(false), resume)
    }
    const enter = () => ((hovered = true), sync())
    const leave = (event: PointerEvent) => {
      // A touch ends with a leave: it stays in use until a touch lands elsewhere.
      if (event.pointerType === 'touch') return
      hovered = false
      sync()
    }
    const outside = (event: PointerEvent) => {
      if (!hovered || el.contains(event.target as Node)) return
      hovered = false
      sync()
    }
    const focusIn = () => ((focused = true), sync())
    const focusOut = (event: FocusEvent) => {
      if (el.contains(event.relatedTarget as Node | null)) return
      focused = false
      sync()
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('focusin', focusIn)
    el.addEventListener('focusout', focusOut)
    document.addEventListener('pointerdown', outside)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('focusin', focusIn)
      el.removeEventListener('focusout', focusOut)
      document.removeEventListener('pointerdown', outside)
    }
  }, [ref, resume])
  return inUse
}

/** Quiets the live regions inside `ref` (`selector`) that a looping demo would keep talking through. */
export function useQuietRegions(ref: RefObject<HTMLElement | null>, selector: string) {
  useEffect(() => {
    for (const region of ref.current?.querySelectorAll(selector) ?? []) region.setAttribute('aria-live', 'off')
  })
}

/** The card a small demo sits in, so it reads as part of an app rather than floating on the tile. */
export function TileCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  // A card with a ground, edge or shadow of its own keeps it instead of the default.
  const own = (prefix: string) => new RegExp(`(^|\\s)${prefix}`).test(className)
  const ground = own('bg-') ? '' : 'bg-surface'
  const edge = own('border-\\[') ? '' : 'border-line'
  const lift = own('shadow-\\[') ? '' : 'shadow-xs'
  return <div className={`flex w-full flex-col gap-4 rounded-2xl border ${edge} ${ground} p-5 ${lift} ${className}`}>{children}</div>
}
