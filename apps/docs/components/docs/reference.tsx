'use client'

import { useRef, type MouseEvent, type ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { ChevronDownIcon } from '@youj/icons'
import { useReveal } from './reveal'
import { tween } from './waapi'

/**
 * The page's reference half (motion spec, props, accessibility, reduced
 * motion), folded under one disclosure so a page leads with the preview and
 * usage. Its headings stay in the TOC: following one, or any link to an id
 * inside, opens it first. The fold is a bar across the page's column, and
 * what it opens runs on that column too, unboxed, so its tables and text
 * keep the page's two edges.
 */
export function Reference({ summary = 'Motion, props and accessibility', children }: { summary?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)

  useReveal((target) => {
    const details = ref.current
    if (!details?.contains(target)) return
    if (!details.open) details.open = true
    requestAnimationFrame(() => target.scrollIntoView())
  })

  return (
    <details ref={ref} className="reference group/reference my-10">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-[14.5px] font-medium tracking-tight text-fg transition-colors yj-duration-fast ease-standard select-none hover:border-line-strong hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="particle size-[5px]" />
        <span className="flex-1">
          Reference
          <span className="ms-2 font-normal text-fg-muted">{summary}</span>
        </span>
        <ChevronDownIcon
          size={16}
          strokeWidth={1.75}
          className="text-fg-muted transition-transform duration-(--yj-duration-fast) ease-standard group-open/reference:rotate-180"
        />
      </summary>
      <div className="prose docs-flow [&>:first-child]:mt-10">{children}</div>
    </details>
  )
}

/**
 * One row of a page's Reference: a closed bar with a one-line summary, opening
 * to a section. The browser's own find opens a closed `<details>` for a match
 * (Chrome, Edge), and a link to an id inside opens it too. Put the row's `###`
 * heading first in it so it lands in the TOC; it is read, not drawn, since the
 * bar carries the name.
 */
export function ReferenceRow({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  const k = useYouj()
  const ref = useRef<HTMLDetailsElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const running = useRef<ReturnType<typeof tween> | null>(null)

  // A click opens and closes the row with its height and a fade, on the same tokens as the examples' tabs. Find in
  // page, a link and the TOC still open it at once (no click passes here); reduced motion toggles it at once.
  const onToggle = (event: MouseEvent) => {
    const details = ref.current
    const el = body.current
    if (!details || !el || k.reduced) return
    event.preventDefault()
    running.current?.cancel()
    const settle = () => {
      el.style.height = ''
      el.style.opacity = ''
      el.style.overflow = ''
    }
    el.style.overflow = 'hidden'
    const closing = details.open
    if (!closing) details.open = true
    const move = tween(
      el,
      closing ? [{ height: `${el.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }] : [{ height: '0px', opacity: 0 }, { height: `${el.scrollHeight}px`, opacity: 1 }],
      k,
      closing ? 'fast' : 'base',
      closing ? 'exit' : 'enter',
    )
    running.current = move
    void move.done.then((finished) => {
      if (!finished) return
      if (closing) details.open = false
      settle()
      move.cancel()
    })
  }

  useReveal((target) => {
    const details = ref.current
    if (!details?.contains(target)) return
    if (!details.open) details.open = true
    requestAnimationFrame(() => target.scrollIntoView())
  })

  return (
    <details ref={ref} className="reference-row group/row border-b border-line first-of-type:border-t">
      <summary onClick={onToggle} className="flex cursor-pointer list-none items-center gap-3 rounded-sm py-4 text-[15px] tracking-tight transition-colors yj-duration-fast ease-standard select-none hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="font-medium text-fg">{title}</span>
          <span className="min-w-0 truncate text-fg-muted">{summary}</span>
        </span>
        <ChevronDownIcon
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-fg-muted transition-transform duration-(--yj-duration-fast) ease-standard group-open/row:rotate-180"
        />
      </summary>
      <div ref={body}>
        <div className="prose docs-flow pt-1 pb-6 [&>:last-child]:mb-0 [&>h3:first-child]:sr-only [&>h3:first-child+*]:mt-0">{children}</div>
      </div>
    </details>
  )
}
