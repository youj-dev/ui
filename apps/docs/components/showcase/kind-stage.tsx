'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import type { Framing } from '@/lib/showcase'
import { kindBox } from '@/lib/kind-box'

/**
 * The stage a section or a card is shown on (lib/showcase's `framing`), in
 * its /view page and in a gallery tile's live render. A section is
 * full-bleed and as tall as it is; a card sits at its own width, centered,
 * with room around it. Either way a page the story or the block draws around
 * it (`min-h-dvh`) is held to its content (styles/site.css,
 * `[data-kind-stage]`), so the stage is the content's size, not the
 * viewport's. A page is the caller's own full-height column.
 */
export function KindStage({ framing, children }: { framing: Exclude<Framing, 'screen'>; children: ReactNode }) {
  if (framing === 'section')
    return (
      <div data-kind-stage="section" data-kind-root="" className="flex flex-col">
        {children}
      </div>
    )
  return <CardStage>{children}</CardStage>
}

/* The card sits at its own width, centered, through the providers and theme scopes around it, which draw no box
 * (`display: contents`). Only in the pages that draw a card's stage: matching the `style` attribute anywhere else
 * would restyle an element's subtree whenever an animation writes its inline style. */
const CENTERED = `
[data-kind-stage='card'] [data-kind-root] > *,
[data-kind-stage='card'] [data-kind-root] > :is([style*='display: contents'], .contents) > *,
[data-kind-stage='card'] [data-kind-root] > :is([style*='display: contents'], .contents) > :is([style*='display: contents'], .contents) > *,
[data-kind-stage='card'] [data-kind-root] > :is([style*='display: contents'], .contents) > :is([style*='display: contents'], .contents) > :is([style*='display: contents'], .contents) > * {
  margin-inline: auto;
}`

function CardStage({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useCentered(root)
  return (
    <div data-kind-stage="card" className="flex min-h-dvh flex-1 flex-col justify-center overflow-x-clip px-5 py-10 sm:px-10 sm:py-12">
      <style href="kind-stage-card" precedence="default">
        {CENTERED}
      </style>
      <div ref={root} data-kind-root="" className="relative">
        {children}
      </div>
    </div>
  )
}

/**
 * Centers the card's box (lib/kind-box.ts's `kindBox`, which is what a
 * tile's capture is cropped to) on its stage, both ways: a card a story
 * lays out in a full-width wrapper (a button in a block row) would sit at the
 * stage's start edge, where its thumbnail shows it in the middle. It is moved
 * by `left` and `top`, so layout and fixed-position children are untouched;
 * a card as wide or as tall as the stage stays where it is.
 */
function useCentered(rootRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current
    const stage = root?.parentElement
    if (!root || !stage) return
    let frame = 0
    const center = () => {
      root.style.left = root.style.top = ''
      const box = kindBox('card', root)
      const area = stage.getBoundingClientRect()
      if (!box || area.width < 1) return
      const dx = box.width < area.width - 1 ? area.left + area.width / 2 - (box.x + box.width / 2) : 0
      const dy = box.height < area.height - 1 ? area.top + area.height / 2 - (box.y + box.height / 2) : 0
      if (Math.abs(dx) >= 0.5) root.style.left = `${Math.round(dx)}px`
      if (Math.abs(dy) >= 0.5) root.style.top = `${Math.round(dy)}px`
    }
    const later = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(center)
    }
    center()
    const resize = new ResizeObserver(later)
    const watch = () => {
      resize.disconnect()
      resize.observe(stage)
      resize.observe(root)
      for (const child of root.children) resize.observe(child)
    }
    watch()
    // A story mounts after the stage, and swaps its content.
    const mutated = new MutationObserver(() => {
      watch()
      later()
    })
    mutated.observe(root, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      mutated.disconnect()
    }
  }, [rootRef])
}

/** The height the stage needs, in CSS pixels: a section's, or a card's with the stage's room above and below it. */
export function stageHeight(framing: Exclude<Framing, 'screen'>): number | null {
  const box = kindBox(framing)
  if (!box) return null
  if (framing === 'section') return Math.ceil(box.height)
  const stage = document.querySelector<HTMLElement>('[data-kind-stage="card"]')
  const style = stage ? getComputedStyle(stage) : null
  const room = style ? parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) : 0
  return Math.ceil(box.height + room)
}

/** Calls `onHeight` with the stage's height whenever it changes (its content grows, wraps or settles). */
export function useStageHeight(framing: Framing, onHeight: ((height: number) => void) | null) {
  useEffect(() => {
    if (framing === 'screen' || !onHeight) return
    let last = 0
    let frame = 0
    const report = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const height = stageHeight(framing)
        if (height && height !== last) onHeight((last = height))
      })
    }
    const observer = new ResizeObserver(report)
    const watch = () => {
      const root = document.querySelector('[data-kind-root]')
      if (!root) return false
      observer.observe(root)
      for (const child of root.children) observer.observe(child)
      report()
      return true
    }
    // The story mounts after the stage; wait for its root.
    const mounted = new MutationObserver(() => watch() && mounted.disconnect())
    if (!watch()) mounted.observe(document.body, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      mounted.disconnect()
    }
  }, [framing, onHeight])
}
