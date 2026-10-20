'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { m } from 'motion/react'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { useYouj } from '@youj/core'
import { Collapse, PresenceItem } from '@youj/motion'
import { cn } from '../../../lib/utils'
import { ALIGN, cellRing, edgeShadow, pinStyle, type GridColumnLayout } from './head'

/* ── A detail panel under its row ───────────────────────────────────────── */

export function DetailRow({
  id,
  navIndex,
  span,
  open,
  label,
  presence,
  children,
  measure,
  virtualIndex,
}: {
  id: string
  navIndex: number
  span: number
  open: boolean
  label: string
  presence: boolean
  children: ReactNode
  measure?: (el: HTMLElement | null) => void
  virtualIndex?: number
}) {
  // Mounted closed, then opened a frame later, so the first opening eases down too.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(open))
    return () => cancelAnimationFrame(frame)
  }, [open])
  const cell = (
    <td
      role="gridcell"
      colSpan={span}
      // Only an open panel is a stop for the arrows.
      {...(open && { 'data-dg-cell': '', 'data-dg-span': '', 'data-dg-row': navIndex, 'data-dg-col': 0, tabIndex: -1 })}
      className={cn('bg-(--dg-row-bg) own:p-0', open && 'border-b border-(--dg-line)', cellRing)}
    >
      <Collapse open={shown && open}>
        {/* Its own controls keep the Tab order (data-dg-panel). */}
        <div
          id={id}
          data-dg-panel=""
          role="region"
          aria-label={label}
          className="sticky start-0 w-(--dg-view-w,100%) max-w-full px-4 pt-1 pb-5 ps-[calc(var(--dg-detail-inset)_+_var(--spacing)*4)]"
        >
          {children}
        </div>
      </Collapse>
    </td>
  )
  const props = { 'data-slot': 'data-grid-detail', 'data-dg-kind': 'detail', 'data-index': virtualIndex, className: 'group/detail [--dg-row-bg:var(--dg-detail-bg)]' }
  return presence ? (
    <PresenceItem as="tr" {...props}>
      {cell}
    </PresenceItem>
  ) : (
    <tr ref={measure} {...props}>
      {cell}
    </tr>
  )
}

/* ── Group headings and footers ─────────────────────────────────────────── */

export function GroupRow({
  navIndex,
  span,
  label,
  count,
  collapsed,
  toggleLabel,
  onToggle,
  presence,
  measure,
  virtualIndex,
  ariaRowIndex,
}: {
  navIndex: number
  span: number
  label: ReactNode
  count: string
  collapsed: boolean
  toggleLabel: string
  onToggle: () => void
  presence: boolean
  measure?: (el: HTMLElement | null) => void
  virtualIndex?: number
  ariaRowIndex: number
}) {
  const k = useYouj()
  const cell = (
    <td
      role="gridcell"
      colSpan={span}
      data-dg-cell=""
      data-dg-span=""
      data-dg-row={navIndex}
      data-dg-col={0}
      tabIndex={-1}
      className={cn(
        'sticky top-(--dg-head-h) z-2 h-10 border-b border-(--dg-line) bg-(--dg-group-bg) own:p-0 align-middle',
        cellRing,
      )}
    >
      {/* Sticks to the inline start while the grid scrolls sideways. */}
      <span className="sticky start-0 own:flex w-fit items-center gap-2.5 ps-3 pe-4">
        <button
          type="button"
          data-dg-focus=""
          tabIndex={-1}
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          onClick={onToggle}
          className={cn(
            'relative grid size-6 place-items-center rounded-sm own:text-fg-muted focus-ring after:absolute after:-inset-1',
            'transition-[color,background-color] yj-duration-fast ease-standard hover:bg-hover hover:text-fg',
          )}
        >
          <m.span
            className="grid place-items-center rtl:-scale-x-100"
            initial={false}
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={k.reduced ? { type: false } : k.spring('snappy')}
          >
            <ChevronRightIcon size={15} strokeWidth={2} trigger="none" />
          </m.span>
        </button>
        <span className="own:flex items-center gap-2 own:text-ui own:font-medium own:text-fg">{label}</span>
        <span className="own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">{count}</span>
      </span>
    </td>
  )
  const props = {
    'data-slot': 'data-grid-group',
    'data-dg-kind': 'group',
    'data-collapsed': collapsed || undefined,
    'data-index': virtualIndex,
    'aria-rowindex': ariaRowIndex,
  }
  return presence ? (
    <PresenceItem as="tr" {...props}>
      {cell}
    </PresenceItem>
  ) : (
    <tr ref={measure} {...props}>
      {cell}
    </tr>
  )
}

/** A group's footer: its figures under their columns (a total, an average), on a quiet band. */
export function FooterRow({
  navIndex,
  columns,
  fillerAt,
  values,
  caption,
  presence,
  measure,
  virtualIndex,
  ariaRowIndex,
}: {
  navIndex: number
  columns: readonly GridColumnLayout[]
  fillerAt: number | null
  /** Each visible column's figure, or null. */
  values: ReactNode[]
  caption: string
  presence: boolean
  measure?: (el: HTMLElement | null) => void
  virtualIndex?: number
  ariaRowIndex: number
}) {
  const firstData = columns.findIndex((layout) => !layout.utility)
  const cells: ReactNode[] = columns.map((layout, i) => (
    <td
      key={layout.id}
      role="gridcell"
      data-dg-cell=""
      data-dg-row={navIndex}
      data-dg-col={layout.index}
      data-numeric={layout.numeric || undefined}
      tabIndex={-1}
      style={pinStyle(layout)}
      className={cn(
        'relative h-9 border-b border-(--dg-line) bg-(--dg-row-bg) own:px-3 align-middle own:text-ui-sm own:first:ps-4 own:last:pe-4',
        cellRing,
        ALIGN[layout.align],
        layout.utility && 'own:px-0 own:first:ps-0 own:last:pe-0',
        layout.pinned && 'sticky z-1',
        layout.edgeStart && edgeShadow.start,
        layout.edgeEnd && edgeShadow.end,
      )}
    >
      {i === firstData ? <span className="own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase">{caption}</span> : values[i]}
    </td>
  ))
  if (fillerAt !== null) cells.splice(fillerAt, 0, <td key="__filler" aria-hidden className="border-b border-(--dg-line) bg-(--dg-row-bg)" />)
  const props = { 'data-slot': 'data-grid-group-footer', 'data-dg-kind': 'footer', 'data-index': virtualIndex, 'aria-rowindex': ariaRowIndex, className: '[--dg-row-bg:var(--dg-band)]' }
  return presence ? (
    <PresenceItem as="tr" {...props}>
      {cells}
    </PresenceItem>
  ) : (
    <tr ref={measure} {...props}>
      {cells}
    </tr>
  )
}
