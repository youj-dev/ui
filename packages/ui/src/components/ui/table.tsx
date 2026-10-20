'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { tableLabels, useComponentLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'

/* shadcn's table, re-skinned. The table is `border-separate` with the
 * dividers on the cells, not on the rows: with `border-collapse` (Tailwind's
 * preflight default) borders belong to the table grid, so they would stay
 * behind while a row moves (PresenceList insert, remove and re-sort). Rows
 * paint their background under the cells, so a hover or selected tint covers
 * the whole row, and every side uses logical properties so RTL mirrors. */

function Table({ className, ...props }: ComponentProps<'table'>) {
  const labels = useComponentLabels(tableLabels)
  const frame = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Content can grow wider without resizing the scroll container.
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={frame}
      data-slot="table-container"
      tabIndex={scrolls ? 0 : undefined}
      role={scrolls ? 'region' : undefined}
      aria-label={scrolls ? labels.tableScrollRegion : undefined}
      // A one-column grid: the table still sizes the frame where nothing else does, but its width never holds a grid or flex parent wider than the screen; it scrolls here instead.
      className="relative own:grid w-full grid-cols-[minmax(0,1fr)] overflow-x-auto yj-scrollbar focus-ring"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom border-separate own:border-spacing-0 own:text-ui own:text-fg', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn(className)} {...props} />
}

function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-band own:font-medium [&>tr>td]:border-t [&>tr>td]:border-line', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'transition-[background-color] own:yj-duration-fast own:ease-standard',
        '[tbody>&]:hover:bg-hover has-aria-expanded:bg-hover data-[state=selected]:bg-accent-subtle',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'own:h-[calc(var(--spacing)*(9_-_var(--ui--compact,0)))] own:border-b border-line own:px-3 own:text-start align-middle own:text-ui-sm own:font-medium whitespace-nowrap own:text-fg-muted',
        'own:[&:has([role=checkbox])]:pe-0',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'own:border-b border-line own:px-3 own:py-[calc(var(--spacing)*(2.5_-_var(--ui--compact,0)))] align-middle whitespace-nowrap',
        // The last body row sits on the frame's edge: no divider under it.
        '[tbody>tr:last-child>&]:border-b-0',
        'own:[&:has([role=checkbox])]:pe-0',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('mt-3 own:text-ui-sm own:text-fg-muted', className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
