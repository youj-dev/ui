'use client'

import { paginationLabels } from '@youj/core/labels'
import type { ComponentProps } from 'react'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { EllipsisIcon } from '@youj/icons/components/youj/icons/ellipsis'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { buttonVariants } from './button'

/* shadcn's pagination with a kinetic current page: one SlidingIndicator in
 * the nav glides a raised key to whichever link carries aria-current="page"
 * (and jumps under reduced motion). Previous / Next nudge their chevron
 * toward where they go on hover. `paginationRange` builds the page list with
 * a fixed number of slots, so the control keeps its width while you page. */

function Pagination({ className, children, 'aria-label': label, ...props }: ComponentProps<'nav'>) {
  const labels = useComponentLabels(paginationLabels)
  return (
    <nav aria-label={label ?? labels.pagination} data-slot="pagination" className={cn('relative isolate own:mx-auto own:flex w-full justify-center', className)} {...props}>
      {children}
      <SlidingIndicator
        data-slot="pagination-indicator"
        match='[aria-current="page"]'
        className="own:rounded-md border border-line own:bg-key own:shadow-xs"
      />
    </nav>
  )
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="pagination-content" className={cn('own:flex flex-wrap items-center gap-0.5', className)} {...props} />
}

function PaginationItem(props: ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  /**
   * The edge of the range: aria-disabled, no href and inert to clicks, but
   * still focusable, so paging onto the last page with Enter keeps focus on
   * the control instead of dropping it to the body.
   */
  disabled?: boolean
  size?: 'default' | 'icon'
} & ComponentProps<'a'>

/* A real link that looks like a ghost button. (Base UI's Button would stamp
 * role="button" on the anchor, and pagination navigates.) */
function PaginationLink({ className, isActive, disabled, size = 'icon', href, onClick, ...props }: PaginationLinkProps) {
  const k = useYouj()
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      data-reduced-motion={k.reduced || undefined}
      href={disabled ? undefined : href}
      // Without an href the anchor is no longer a link or a Tab stop.
      role={disabled ? 'link' : undefined}
      tabIndex={disabled ? 0 : undefined}
      // Assistive tech can still activate it with a synthetic click.
      onClick={(event) => {
        if (disabled) event.preventDefault()
        else onClick?.(event)
      }}
      className={cn(
        buttonVariants({ variant: 'ghost', size }),
        'own:tabular-nums',
        size === 'icon' && 'w-auto min-w-control px-1.5',
        // The raised key under the current page is the nav's sliding indicator.
        isActive && 'text-fg hover:bg-transparent',
        // Dim the ink, not the box, so a focus ring on the edge stays at full strength.
        disabled && 'pointer-events-none text-fg-subtle',
        className,
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, text, ...props }: PaginationLinkProps & { text?: string }) {
  const labels = useComponentLabels(paginationLabels)
  return (
    <PaginationLink aria-label={labels.goToPreviousPage} size="default" className={cn('group/pagination-edge own:ps-2', className)} {...props}>
      <ChevronLeftIcon
        trigger="none"
        className="transition-transform yj-duration-fast ease-standard group-hover/pagination-edge:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/pagination-edge:translate-x-0.5"
      />
      <span className="own:hidden own:sm:block">{text ?? labels.previous}</span>
    </PaginationLink>
  )
}

function PaginationNext({ className, text, ...props }: PaginationLinkProps & { text?: string }) {
  const labels = useComponentLabels(paginationLabels)
  return (
    <PaginationLink aria-label={labels.goToNextPage} size="default" className={cn('group/pagination-edge own:pe-2', className)} {...props}>
      <span className="own:hidden own:sm:block">{text ?? labels.next}</span>
      <ChevronRightIcon
        trigger="none"
        className="transition-transform yj-duration-fast ease-standard group-hover/pagination-edge:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/pagination-edge:-translate-x-0.5"
      />
    </PaginationLink>
  )
}

/** A gap in the page list. Decorative: the page numbers either side already say pages were skipped. */
function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("own:flex size-control items-center justify-center own:text-fg-muted [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      <EllipsisIcon />
    </span>
  )
}

export type PaginationRangeItem = number | 'start-ellipsis' | 'end-ellipsis'

/**
 * The pages to show around `page` (1-based) out of `pageCount`: the first and
 * last pages, `siblings` either side of the current one, and ellipses for the
 * gaps. Once there are enough pages to need a gap, it always returns
 * 5 + 2 × siblings items, so the control's width holds while paging.
 */
function paginationRange(page: number, pageCount: number, siblings = 1): PaginationRangeItem[] {
  const range = (from: number, to: number) => Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i)
  const slots = 5 + siblings * 2
  if (pageCount <= slots) return range(1, pageCount)
  const current = Math.min(Math.max(page, 1), pageCount)
  const start = Math.min(Math.max(current - siblings, 3), pageCount - 2 - siblings * 2)
  const end = start + siblings * 2
  return [
    1,
    start > 3 ? 'start-ellipsis' : 2,
    ...range(start, end),
    end < pageCount - 2 ? 'end-ellipsis' : pageCount - 1,
    pageCount,
  ]
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
  type PaginationLinkProps,
}
