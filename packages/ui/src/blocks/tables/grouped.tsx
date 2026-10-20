'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { MotionFeatures, ThemeScope, useDirection, useLocale, type ThemeInput } from '@youj/core'
import { ChevronsUpDownIcon, ListCollapseIcon } from '@youj/icons'
import { PresenceList } from '@youj/motion'
import { Button } from '../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, GROUPINGS, LINES, type GroupedTableCopy, type GroupedTableGrouping, type GroupedTableLine } from './grouped/data'
import { rowName, useGrouped, type GroupedRow, type GroupedSortable } from './grouped/model'
import { Figures, GroupedRowView, Heading, cell, type Formats } from './grouped/rows'

/* Planned against spent as a tree (the demo: a budget): lines gathered by the
 * groupings you define (the demo's: team inside department, category or
 * owner), each group summing what it plans and spends, how far
 * over or under it runs and how much it has used, down to a grand total. Open
 * a group and its lines slide in under it; sort any money column and every
 * level sorts inside itself. It's a treegrid: the arrows move between rows,
 * Right and Left open and close, Enter opens a line (`onLineOpen`). Built
 * on TanStack Table's grouping and aggregation. Reduced motion: groups open
 * and close at once. */

interface GroupedTableProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** The lines, planned and spent each. Default: a software company's quarter, 28 lines in four departments. */
  lines?: GroupedTableLine[]
  /** The ways to gather the lines, each a choice in the header. Default: team (department then team), category, owner, none. */
  groupings?: GroupedTableGrouping[]
  /** The grouping's id (controlled). Pair with `onGroupByChange`. */
  groupBy?: string
  /** The grouping's id at first. Default: the first of `groupings`. */
  defaultGroupBy?: string
  onGroupByChange?: (groupBy: string) => void
  /** The currency the money is in. Default 'USD'. */
  currency?: string
  /** Formats the amounts, the totals and the variance's size (hours, points…). Default: the money in `currency`. */
  format?: (value: number) => string
  /** A line's row clicked, or Enter on it: open its detail. Default: none. */
  onLineOpen?: (line: GroupedTableLine) => void
  /** Header buttons beside the grouping. */
  actions?: ReactNode
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no lines. */
  empty?: ReactNode
  /** The title's level when embedded. Default 2. */
  headingLevel?: 2 | 3 | 4
  theme?: ThemeInput
  /** Inside another page: the card alone, a `section` named by its title. Default true; `false` draws a page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at 72rem. Default false. */
  fill?: boolean
  /** Any of the table's strings, to rewrite or translate. */
  copy?: Partial<GroupedTableCopy>
  /** Formats money and counts (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

/** Where each open row sits among its siblings, and its parent: what a treegrid says and where Left goes. */
function treeOf(rows: GroupedRow[]) {
  const lists = new Map<string, string[]>()
  const parents = new Map<string, string>()
  const open: string[][] = []
  const last: string[] = []
  for (const row of rows) {
    open.length = row.depth + 1
    last.length = row.depth
    const list = (open[row.depth] ??= [])
    list.push(row.id)
    lists.set(row.id, list)
    if (row.depth > 0 && last[row.depth - 1]) parents.set(row.id, last[row.depth - 1]!)
    last[row.depth] = row.id
  }
  return { lists, parents }
}

function GroupedTable({
  lines: linesProp,
  groupings = GROUPINGS,
  groupBy: groupByProp,
  defaultGroupBy,
  onGroupByChange,
  currency = 'USD',
  format,
  onLineOpen,
  actions,
  loading,
  error,
  onRetry,
  empty,
  headingLevel = 2,
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  className,
  ...rest
}: GroupedTableProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const dir = useDirection()
  const titleId = useId()
  const hintId = useId()
  const Title = embedded ? (`h${headingLevel}` as const) : 'h1'
  const { announce, announcer } = useAnnouncer()
  const lines = linesProp ?? LINES
  const [ownGroupBy, setOwnGroupBy] = useState(defaultGroupBy)
  const groupBy = groupByProp ?? ownGroupBy ?? groupings[0]?.id
  const grouping = groupings.find((g) => g.id === groupBy) ?? groupings[0] ?? { id: 'none', label: '', by: [] }
  const { table, rows, sorting, setSorting, totals, canExpand } = useGrouped(lines, grouping)
  const formats = useMemo<Formats>(
    () => ({
      money: format ? { format } : numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }),
      signed: format ? { format: (n) => `${n < 0 ? '-' : '+'}${format(Math.abs(n))}` } : numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, signDisplay: 'exceptZero' }),
      percent: numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }),
      count: numberFormat(locale),
    }),
    [locale, currency, format],
  )
  const compact = useMemo(() => format ? { format } : numberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }), [locale, currency, format])
  const tree = useMemo(() => treeOf(rows), [rows])

  // One row is the Tab stop; the arrows move it.
  const tableRef = useRef<HTMLTableElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = rows.some((row) => row.id === activeId) ? activeId : (rows[0]?.id ?? null)
  const focusRow = (id: string) => {
    setActiveId(id)
    Array.from(tableRef.current?.querySelectorAll<HTMLElement>('tr[data-yj-row]') ?? [])
      .find((el) => el.dataset.yjRow === id)
      ?.focus()
  }
  const toggle = (row: GroupedRow) => {
    const opening = !row.getIsExpanded()
    row.toggleExpanded()
    setActiveId(row.id)
    announce((opening ? copy.expanded : copy.collapsed)(rowName(row)))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTableSectionElement>) => {
    const index = rows.findIndex((row) => row.id === active)
    const row = rows[index]
    if (!row || event.altKey || event.metaKey || event.ctrlKey) return
    const move = (to: number) => {
      const target = rows[Math.max(0, Math.min(rows.length - 1, to))]
      if (target) focusRow(target.id)
    }
    // In right-to-left text, the arrow pointing into the row is Left.
    const inward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const outward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const parent = tree.parents.get(row.id)
    if (event.key === 'ArrowDown') move(index + 1)
    else if (event.key === 'ArrowUp') move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(rows.length - 1)
    else if (event.key === inward && row.getIsGrouped()) {
      if (row.getIsExpanded()) move(index + 1)
      else toggle(row)
    } else if (event.key === outward && row.getIsGrouped() && row.getIsExpanded()) toggle(row)
    else if (event.key === outward && parent) focusRow(parent)
    else if (event.key === 'Enter' || (event.key === ' ' && row.getIsGrouped())) {
      if (row.getIsGrouped()) toggle(row)
      else onLineOpen?.(row.original)
    } else return
    event.preventDefault()
  }

  const sortOf = (id: GroupedSortable) => {
    const entry = sorting.find((s) => s.id === id)
    return entry ? (entry.desc ? 'desc' : 'asc') : false
  }
  // Click: largest first, then smallest first, then back to the plan's order.
  const onSort = (id: GroupedSortable) => {
    const now = sortOf(id)
    const first = id === 'name' ? 'asc' : 'desc'
    setSorting(now === false ? [{ id, desc: first === 'desc' }] : now === first ? [{ id, desc: first !== 'desc' }] : [])
  }
  const sortable = (id: GroupedSortable, align: 'start' | 'end' = 'end') => <Heading id={id} label={copy.columns[id]} sorted={sortOf(id)} onSort={onSort} align={align} />

  const status = error ? 'error' : loading && rows.length === 0 ? 'loading' : rows.length === 0 ? 'empty' : 'rows'
  const placeholder = (content: ReactNode) => (
    <tr>
      <td colSpan={7} className="px-6 py-12 text-center">
        {content}
      </td>
    </tr>
  )

  const card = (
    <MotionFeatures>
      <div className="flex flex-col gap-4 text-fg">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Title id={titleId} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
              {copy.title}
            </Title>
            <p className="text-ui-sm text-fg-muted tabular-nums">{copy.description(copy.period, compact.format(totals.budget), compact.format(totals.actual))}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              variant="pill"
              aria-label={copy.groupBy}
              value={grouping.id}
              onValueChange={(value) => {
                setOwnGroupBy(String(value))
                onGroupByChange?.(String(value))
              }}
            >
              {groupings.map((g) => (
                <SegmentedControlItem key={g.id} value={g.id}>
                  {g.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            <TooltipProvider delay={400}>
              {([true, false] as const).map((open) => (
                <Tooltip key={String(open)}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={open ? copy.expandAll : copy.collapseAll}
                        disabled={!canExpand}
                        onClick={() => table.toggleAllRowsExpanded(open)}
                      />
                    }
                  >
                    {open ? <ChevronsUpDownIcon /> : <ListCollapseIcon />}
                  </TooltipTrigger>
                  <TooltipContent>{open ? copy.expandAll : copy.collapseAll}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {actions}
          </div>
        </header>
        {/* The rows scroll under the sticky header in one height (638px at 100%): another grouping never resizes the block. */}
        <div className="relative h-159.5 overflow-auto rounded-xl border border-line bg-surface shadow-xs yj-scrollbar">
          <table ref={tableRef} role="treegrid" aria-labelledby={titleId} aria-describedby={hintId} aria-busy={loading || undefined} className="w-full min-w-254 table-fixed border-separate border-spacing-0 text-ui">
            <colgroup>
              <col />
              <col className="w-44" />
              <col className="w-30" />
              <col className="w-30" />
              <col className="w-30" />
              <col className="w-28" />
              <col className="w-36" />
            </colgroup>
            <thead>
              <tr role="row">
                {sortable('name', 'start')}
                <Heading id="owner" label={copy.columns.owner} />
                <Heading id="category" label={copy.columns.category} />
                {sortable('budget')}
                {sortable('actual')}
                {sortable('variance')}
                {sortable('used')}
              </tr>
            </thead>
            {status === 'rows' ? (
              <PresenceList as="tbody" onKeyDown={onKeyDown}>
                {rows.map((row) => {
                  const siblings = tree.lists.get(row.id) ?? [row.id]
                  return (
                    <GroupedRowView
                      key={row.id}
                      row={row}
                      active={row.id === active}
                      posinset={siblings.indexOf(row.id) + 1}
                      setsize={siblings.length}
                      formats={formats}
                      copy={copy}
                      onToggle={toggle}
                      onActivate={(line) => {
                        setActiveId(line.id)
                        onLineOpen?.(line.original)
                      }}
                    />
                  )
                })}
              </PresenceList>
            ) : (
              <tbody>
                {status === 'loading' &&
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td className={cell}>
                        <Skeleton className="h-3 w-40" />
                      </td>
                      <td className={cell}>
                        <Skeleton className="h-3 w-24" />
                      </td>
                      <td className={cell} />
                      {Array.from({ length: 4 }, (_, j) => (
                        <td key={j} className={cell}>
                          <Skeleton className="ms-auto h-3 w-16" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {status === 'error' &&
                  placeholder(
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-ui-sm text-danger-text">{error}</p>
                      {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                          {copy.retry}
                        </Button>
                      )}
                    </div>,
                  )}
                {status === 'empty' &&
                  placeholder(
                    empty ?? (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-ui font-medium">{copy.emptyTitle}</p>
                        <p className="text-ui-sm text-fg-muted">{copy.emptyHint}</p>
                      </div>
                    ),
                  )}
              </tbody>
            )}
            {status === 'rows' && (
              <tfoot className="bg-[color-mix(in_oklab,var(--color-surface),var(--color-fg)_2.5%)] font-semibold [&_td]:border-b-0">
                <tr role="row">
                  <td role="gridcell" colSpan={3} className={cell}>
                    {copy.total}
                  </td>
                  <Figures {...totals} formats={formats} copy={copy} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p id={hintId} className="sr-only">
          {copy.treeHint}
        </p>
        {announcer}
      </div>
    </MotionFeatures>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-6xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg sm:px-8', className)}>
      <div className={cn('mx-auto w-full', !fill && 'max-w-6xl')}>{card}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { GroupedTable, type GroupedTableProps }
export type { GroupedTableCopy, GroupedTableField, GroupedTableGrouping, GroupedTableLine } from './grouped/data'
