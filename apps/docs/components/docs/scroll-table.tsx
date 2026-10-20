'use client'

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { observeScroll } from '@/lib/observe-scroll'

/**
 * A frame for something that can be wider than the column (a table). It
 * scrolls sideways inside itself instead of clipping; while it does, it's a
 * focusable, labeled group, so the keyboard can scroll it too, and the side
 * with more to see fades out (`scroll-fade`, styles/site.css). Something that
 * fits stays out of the tab order.
 */
export function ScrollFrame({
  label,
  group = false,
  className,
  children,
}: {
  label: string
  /** Always a focusable, labeled group (a command line), not only while it scrolls. */
  group?: boolean
  className?: string
  children: ReactNode
}) {
  const frame = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth
      // scrollLeft runs negative in RTL; its size is how far from the start.
      const at = Math.abs(el.scrollLeft)
      setScrolls(max > 1)
      el.toggleAttribute('data-more-start', max > 1 && at > 1)
      el.toggleAttribute('data-more-end', max > 1 && at < max - 1)
    }
    return observeScroll(el, measure)
  }, [])

  return (
    <div
      ref={frame}
      tabIndex={group || scrolls ? 0 : undefined}
      role={group || scrolls ? 'group' : undefined}
      aria-label={group || scrolls ? label : undefined}
      className={cn('scroll-fade overflow-x-auto overscroll-x-contain', className)}
    >
      {children}
    </div>
  )
}

/**
 * MDX tables, on the page's column like everything else. Code in a cell
 * never breaks mid-token (`--yj-` / `neutral-`): a table too wide for a phone
 * scrolls instead. The frame's padding (taken back by its negative margin)
 * keeps the first header's glyph clear of the rounded corner, which would
 * otherwise clip it.
 */
export function ScrollTable(props: ComponentProps<'table'>) {
  return (
    <ScrollFrame label="Table, scrolls sideways" className="docs-table prose-no-margin relative -mx-1 my-5 rounded-md p-1 focus-ring [&_td_code]:whitespace-nowrap">
      <table {...props} />
    </ScrollFrame>
  )
}
