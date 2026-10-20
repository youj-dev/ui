'use client'

import type { CSSProperties, ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from '@youj/icons'
import { PresenceItem } from '@youj/motion'
import { Progress } from '../../../components/ui/progress'
import { cn } from '../../../lib/utils'
import type { GroupedTableCopy } from './data'
import { money, rowName, type GroupedRow, type GroupedSortable } from './model'

interface Format {
  format: (value: number) => string
}
export interface Formats {
  money: Format
  signed: Format
  percent: Format
  count: Format
}

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
/** A steady hue per name, from the theme's chart colors. */
const hue = (name: string) => `var(--color-chart-${(Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 5) + 1})`

function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ '--hue': hue(name) } as CSSProperties}
      className={cn(
        'grid size-5.5 shrink-0 place-items-center rounded-full text-ui-xs leading-none font-semibold tracking-tight ring-2 ring-surface',
        'bg-[color-mix(in_oklab,var(--hue)_18%,var(--color-surface))] text-[color-mix(in_oklab,var(--hue)_55%,var(--color-fg))]',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/** Spent against planned: a quiet bar that turns red only past the line, so overspend is the one thing that stands out. */
function Used({ ratio, label }: { ratio: number; label: string }) {
  return (
    <span className="flex items-center justify-end gap-2.5">
      <Progress aria-hidden value={Math.min(ratio, 1) * 100} size="sm" tone={ratio > 1 ? 'danger' : 'neutral'} className="w-14" />
      <span className={cn('w-11 text-end', ratio > 1 && 'text-danger-text')}>{label}</span>
    </span>
  )
}

export const cell = 'h-10 border-b border-line px-3 align-middle whitespace-nowrap'
const figure = 'text-end tabular-nums'

/** The money columns, shared by the rows and the totals. */
export function Figures({ budget, actual, variance, used, formats, copy }: ReturnType<typeof money> & { formats: Formats; copy: GroupedTableCopy }) {
  return (
    <>
      <td role="gridcell" className={cn(cell, figure)}>
        {formats.money.format(budget)}
      </td>
      <td role="gridcell" className={cn(cell, figure)}>
        {formats.money.format(actual)}
      </td>
      <td role="gridcell" className={cn(cell, figure, variance > 0 ? 'text-danger-text' : variance < 0 ? 'text-success-text' : 'text-fg-muted')}>
        {variance === 0 ? '–' : formats.signed.format(variance)}
        {variance !== 0 && <span className="sr-only">, {variance > 0 ? copy.over : copy.under}</span>}
      </td>
      <td role="gridcell" className={cn(cell, figure)}>
        <Used ratio={used} label={formats.percent.format(used)} />
      </td>
    </>
  )
}

/**
 * One row of the tree: a group (its chevron, name, line count, the owners in
 * it and its sums) or a line. Groups open with a click on the row, Right or
 * Enter; the chevron turns as they do.
 */
export function GroupedRowView({
  row,
  active,
  posinset,
  setsize,
  formats,
  copy,
  onToggle,
  onActivate,
}: {
  row: GroupedRow
  active: boolean
  posinset: number
  setsize: number
  formats: Formats
  copy: GroupedTableCopy
  onToggle: (row: GroupedRow) => void
  onActivate: (row: GroupedRow) => void
}) {
  const grouped = row.getIsGrouped()
  const open = grouped && row.getIsExpanded()
  const leaves = grouped ? row.getLeafRows().filter((leaf) => !leaf.getIsGrouped()) : []
  const owners = grouped ? [...new Set(leaves.map((leaf) => leaf.original.owner))] : []
  const byOwner = row.groupingColumnId === 'owner'
  return (
    <PresenceItem
      as="tr"
      role="row"
      aria-level={row.depth + 1}
      aria-expanded={grouped ? open : undefined}
      aria-posinset={posinset}
      aria-setsize={setsize}
      tabIndex={active ? 0 : -1}
      data-yj-row={row.id}
      data-yj-group={grouped || undefined}
      data-yj-depth={row.depth}
      onClick={() => (grouped ? onToggle(row) : onActivate(row))}
      className={cn(
        'group/row cursor-default bg-surface outline-hidden transition-[background-color] yj-duration-fast ease-standard',
        'hover:bg-[color-mix(in_oklab,var(--color-surface),var(--color-fg)_3.5%)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        grouped && row.depth === 0 && 'bg-[color-mix(in_oklab,var(--color-surface),var(--color-fg)_2%)] font-medium',
      )}
    >
      <td role="gridcell" className={cell}>
        <span className="flex min-w-0 items-center gap-2" style={{ paddingInlineStart: `calc(${row.depth} * 1.25rem)` }}>
          {grouped ? (
            <ChevronRightIcon
              aria-hidden
              className={cn('size-4 shrink-0 text-fg-muted transition-transform yj-duration-fast ease-standard rtl:-scale-x-100', open && 'rotate-90 rtl:-rotate-90')}
            />
          ) : (
            <span aria-hidden className="w-4 shrink-0" />
          )}
          {byOwner && grouped && <Initials name={rowName(row)} />}
          <span className="truncate">{rowName(row)}</span>
          {grouped && <span className="shrink-0 text-ui-xs font-normal text-fg-subtle tabular-nums">{copy.lines(formats.count.format(leaves.length), leaves.length)}</span>}
        </span>
      </td>
      <td role="gridcell" className={cell}>
        {grouped ? (
          !byOwner && (
            <span className="flex items-center">
              {owners.slice(0, 3).map((owner, i) => (
                <Initials key={owner} name={owner} className={i > 0 ? '-ms-1' : undefined} />
              ))}
              {owners.length > 3 && <span className="ms-1.5 text-ui-xs text-fg-subtle tabular-nums">+{owners.length - 3}</span>}
              <span className="sr-only">{owners.join(', ')}</span>
            </span>
          )
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <Initials name={row.original.owner} />
            <span className="truncate text-fg-muted">{row.original.owner}</span>
          </span>
        )}
      </td>
      <td role="gridcell" className={cn(cell, 'text-fg-muted')}>
        {grouped ? null : row.original.category}
      </td>
      <Figures {...money(row)} formats={formats} copy={copy} />
    </PresenceItem>
  )
}

/** A column heading; the sortable ones are buttons that cycle the sort and say which way it runs. */
export function Heading({
  id,
  label,
  sorted,
  onSort,
  align = 'start',
  className,
  children,
}: {
  id: GroupedSortable | 'owner' | 'category'
  label: string
  sorted?: false | 'asc' | 'desc'
  onSort?: (id: GroupedSortable) => void
  align?: 'start' | 'end'
  className?: string
  children?: ReactNode
}) {
  const Arrow = sorted === 'asc' ? ArrowUpIcon : ArrowDownIcon
  return (
    <th
      role="columnheader"
      scope="col"
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : onSort ? 'none' : undefined}
      className={cn(
        'sticky top-0 z-1 h-9 border-b border-line bg-[color-mix(in_oklab,var(--color-surface),var(--color-fg)_2.5%)] px-3 text-ui-sm font-medium whitespace-nowrap text-fg-muted',
        align === 'end' ? 'text-end' : 'text-start',
        className,
      )}
    >
      {onSort ? (
        <button
          type="button"
          onClick={() => onSort(id as GroupedSortable)}
          className={cn('inline-flex items-center gap-1 rounded-sm hover:text-fg focus-ring', align === 'end' && 'flex-row-reverse', sorted && 'text-fg')}
        >
          {label}
          <Arrow aria-hidden className={cn('size-3.5 transition-opacity yj-duration-fast ease-standard', !sorted && 'opacity-0')} />
        </button>
      ) : (
        label
      )}
      {children}
    </th>
  )
}
