'use client'

import { memo, useRef, type ReactNode } from 'react'
import { MoreHorizontalIcon } from '@youj/icons/components/youj/icons/more-horizontal'
import { FlexRender, type RowData } from '@tanstack/react-table'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { useCopy } from './copy'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import type { GridBodyContext, DataGridRowAction, GridItem } from './body'
import { columnLabel, isUtilityColumn, type DataGridColumnMeta, type DataGridRow } from './model'

/* On a narrow screen a row becomes a card: its identity as the title, its
 * status beside it, and every other column as a labeled field in two
 * columns. The cards are a list, not a grid: each control is its own Tab
 * stop, which is how touch and screen-reader users move through a feed.
 * Cards enter, leave and reorder like rows do (PresenceList). */

/* A folded card's detail is hidden, so it takes this stand-in: the live `renderDetail` is a new function every render, which would
 * re-render every memoized card. A card that opens takes the live one. */
const CLOSED_DETAIL = (): ReactNode => null

export function CardList<TData extends RowData>({
  items,
  isSelected,
  activeRowId,
  selectable,
  isExpanded,
  renderDetail,
  actions,
  ctx,
  label,
}: {
  items: GridItem<TData>[]
  isSelected: (row: DataGridRow<TData>) => boolean
  activeRowId?: string | null
  selectable: boolean
  isExpanded: (rowId: string) => boolean
  renderDetail?: (row: TData) => ReactNode
  actions?: (row: TData) => DataGridRowAction<TData>[]
  ctx: GridBodyContext
  label?: string
}) {
  return (
    <PresenceList as="ul" aria-label={label} data-slot="data-grid-cards" className="own:flex flex-col gap-2 own:p-3">
      {items.flatMap((item) => {
        if (item.kind === 'group')
          return [
            <PresenceItem as="li" key={item.key} className="sticky top-0 z-2 own:-mx-3 own:bg-(--dg-group-bg) own:px-4 own:py-2 own:text-ui own:font-medium">
              <span className="own:flex items-center gap-2">
                {item.group.label}
                <span className="own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">{item.group.rows.length}</span>
              </span>
            </PresenceItem>,
          ]
        if (item.kind !== 'row') return []
        return [
          <PresenceItem as="li" key={item.key}>
            <Card
              row={item.row}
              selected={isSelected(item.row)}
              active={item.row.id === activeRowId}
              selectable={selectable && item.row.getCanSelect()}
              expanded={isExpanded(item.row.id)}
              renderDetail={renderDetail && (isExpanded(item.row.id) ? renderDetail : CLOSED_DETAIL)}
              actions={actions}
              ctx={ctx}
            />
          </PresenceItem>,
        ]
      })}
    </PresenceList>
  )
}

const Card = memo(function CardView<TData extends RowData>({
  row,
  selected,
  active,
  selectable,
  expanded,
  renderDetail,
  actions,
  ctx,
}: {
  row: DataGridRow<TData>
  selected: boolean
  active: boolean
  selectable: boolean
  expanded: boolean
  renderDetail?: (row: TData) => ReactNode
  actions?: (row: TData) => DataGridRowAction<TData>[]
  ctx: GridBodyContext
}) {
  const labels = useCopy()
  const shift = useRef(false)
  const cells = row.getVisibleCells().filter((cell) => !isUtilityColumn(cell.column.id))
  const role = (meta: DataGridColumnMeta | undefined) => meta?.card ?? 'field'
  const title = cells.find((cell) => role(cell.column.columnDef.meta) === 'title') ?? cells[0]
  const badges = cells.filter((cell) => cell !== title && role(cell.column.columnDef.meta) === 'badge')
  const fields = cells.filter((cell) => cell !== title && role(cell.column.columnDef.meta) === 'field')
  const list = actions?.(row.original) ?? []
  const name = ctx.rowLabel(row.id)
  return (
    <article
      data-slot="data-grid-card"
      data-row-id={row.id}
      data-selected={selected || undefined}
      data-active={active || undefined}
      aria-current={active || undefined}
      aria-label={name}
      className={cn(
        'group/row relative own:rounded-xl border own:border-line own:bg-(--dg-row-bg) own:p-3.5 own:shadow-xs',
        'transition-[background-color,border-color] yj-duration-fast ease-standard',
        'data-selected:border-accent-line data-selected:[--dg-row-bg:var(--dg-row-selected)]',
        'data-active:border-accent-line data-active:[--dg-row-bg:var(--dg-row-selected)]',
      )}
    >
      <div className="own:flex items-start gap-3">
        {selectable && (
          <span className="pt-2" onPointerDownCapture={(event) => (shift.current = event.shiftKey)}>
            <Checkbox
              aria-label={labels.selectRow(name)}
              checked={selected}
              onCheckedChange={(checked) => {
                ctx.toggleRow(row.id, checked, shift.current)
                shift.current = false
              }}
            />
          </span>
        )}
        <div className="own:flex min-w-0 flex-1 flex-col gap-2">
          {title && <FlexRender cell={title} />}
          {badges.length > 0 && (
            <div className="own:flex flex-wrap items-center gap-1.5">
              {badges.map((cell) => (
                <FlexRender key={cell.id} cell={cell} />
              ))}
            </div>
          )}
        </div>
        {list.length > 0 && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={labels.rowActions(name)} className="-me-1.5 shrink-0" />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {list.map((action) => {
                const Icon = action.icon
                return (
                  <span key={action.label} className="own:contents">
                    {action.separated && <DropdownMenuSeparator />}
                    <DropdownMenuItem variant={action.destructive ? 'danger' : 'default'} disabled={action.disabled} onClick={() => action.onSelect(row.original)}>
                      {Icon && <Icon />}
                      {action.label}
                    </DropdownMenuItem>
                  </span>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {fields.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-(--dg-line) pt-3">
          {fields.map((cell) => (
            <div key={cell.id} className="own:flex min-w-0 flex-col gap-1">
              <dt className="truncate own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase">{columnLabel(cell.column)}</dt>
              <dd className="flex min-h-6 min-w-0 items-center text-ui [&>*]:min-w-0">
                <FlexRender cell={cell} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {renderDetail && (
        <>
          <Button
            variant="ghost"
            size="xs"
            aria-expanded={expanded}
            onClick={() => ctx.toggleExpanded(row.id)}
            className="mt-2 -ms-2 own:text-fg-muted"
          >
            {expanded ? labels.hideDetails(name) : labels.showDetails(name)}
          </Button>
          <Collapse open={expanded}>
            <div data-dg-panel="" className="pt-2">
              {renderDetail(row.original)}
            </div>
          </Collapse>
        </>
      )}
    </article>
  )
}) as <TData extends RowData>(props: {
  row: DataGridRow<TData>
  selected: boolean
  active: boolean
  selectable: boolean
  expanded: boolean
  renderDetail?: (row: TData) => ReactNode
  actions?: (row: TData) => DataGridRowAction<TData>[]
  ctx: GridBodyContext
}) => ReactNode
