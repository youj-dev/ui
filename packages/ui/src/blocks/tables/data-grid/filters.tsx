'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeftIcon } from '@youj/icons/components/youj/icons/chevron-left'
import { FilterIcon } from '@youj/icons/components/youj/icons/filter'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import type { RowData } from '@tanstack/react-table'
import { useLocale } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { useCopy } from './copy'
import { cn } from '../../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { initials } from './format'
import { columnLabel, metaOf, type DataGridColumn, type DataGridOption, type DataGridOptionTone } from './model'

/* Filters, the Linear way: one Filter key opens a menu of the columns that
 * can filter, and picking one lists its values with how many rows each
 * would keep. Every filter in force is a chip ("Status  Healthy, At risk  ×")
 * that opens the same list to change it, and glides in and out of the bar.
 * Values are plain strings, so a saved view can hold them. */

export interface FacetOption extends DataGridOption {
  count: number
}

/** A column's filter values, with how many rows (under the other filters) hold each. */
export function facetOptions<TData extends RowData>(column: DataGridColumn<TData>): FacetOption[] {
  const meta = metaOf(column)
  const facet = meta?.facet
  if (!facet) return []
  const counts = new Map<string, number>()
  const found = new Map<string, DataGridOption>()
  for (const row of column.table.getCoreRowModel().rows) {
    const value = row.getValue(column.id)
    for (const key of facet.keys(value)) {
      if (!counts.has(key)) counts.set(key, 0)
      if (!found.has(key)) found.set(key, facet.describe?.(key, value) ?? { value: key, label: key })
    }
  }
  for (const row of column.getFacetedRowModel().rows) {
    for (const key of facet.keys(row.getValue(column.id))) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const declared = facet.options ?? [...found.values()].sort((a, b) => a.label.localeCompare(b.label))
  return declared.map((option) => ({ ...option, count: counts.get(option.value) ?? 0 }))
}

function OptionMark({ option }: { option: DataGridOption }) {
  if (option.src !== undefined || option.tone === undefined) {
    if (option.src === undefined) return null
    return (
      <Avatar size="sm" className="size-5">
        <AvatarImage src={option.src} alt="" />
        <AvatarFallback className="own:text-[length:calc(var(--spacing)*2.25)]">{initials(option.label)}</AvatarFallback>
      </Avatar>
    )
  }
  return <span aria-hidden className={cn('size-2 shrink-0 rounded-full', TONE_DOT[option.tone])} />
}

const TONE_DOT: Record<DataGridOptionTone, string> = {
  neutral: 'bg-fg-subtle',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}

/** One column's values as a checklist: the second step of the Filter menu, and a chip's own menu. */
function ValueList<TData extends RowData>({ column, onBack }: { column: DataGridColumn<TData>; onBack?: () => void }) {
  const labels = useCopy()
  const locale = useLocale()
  const chosen = (column.getFilterValue() as string[] | undefined) ?? []
  const options = facetOptions(column)
  const title = metaOf(column)?.facet?.title ?? columnLabel(column)
  const toggle = (value: string) => {
    const next = chosen.includes(value) ? chosen.filter((v) => v !== value) : [...chosen, value]
    column.setFilterValue(next.length ? next : undefined)
  }
  return (
    <Command label={labels.filterBy(title)}>
      <div className="own:flex items-center border-b border-line">
        {onBack && (
          <Button variant="ghost" size="icon-xs" aria-label={labels.addFilter} onClick={onBack} className="ms-1.5 shrink-0">
            <ChevronLeftIcon className="rtl:-scale-x-100" />
          </Button>
        )}
        <CommandInput
          placeholder={`${title}…`}
          wrapperClassName="flex-1 border-b-0"
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && event.currentTarget.value === '' && onBack) {
              event.preventDefault()
              onBack()
            }
          }}
        />
      </div>
      <CommandList>
        <CommandEmpty>{labels.filterNoOptions(title)}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={`${option.label} ${option.value}`}
              checked={chosen.includes(option.value)}
              indicator="checkbox"
              onSelect={() => toggle(option.value)}
            >
              <OptionMark option={option} />
              <span className="truncate">{option.label}</span>
              <span className="own:ms-auto own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">{option.count.toLocaleString(locale)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      {chosen.length > 0 && (
        <div className="border-t border-line p-1">
          <Button variant="ghost" size="sm" className="w-full justify-start own:text-fg-muted" onClick={() => column.setFilterValue(undefined)}>
            {labels.clearFilter}
          </Button>
        </div>
      )}
    </Command>
  )
}

/** The Filter key: the columns that filter, then the chosen column's values. */
export function FilterMenu<TData extends RowData>({ columns, compact }: { columns: DataGridColumn<TData>[]; compact?: boolean }) {
  const labels = useCopy()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<string | null>(null)
  const current = columns.find((column) => column.id === step)
  const active = columns.filter((column) => column.getIsFiltered()).length
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setStep(null)
      }}
    >
      <PopoverTrigger
        render={
          // shape: dashed, an add slot (as the data table's filter buttons)
          <Button variant="outline" size={compact ? 'icon-sm' : 'sm'} aria-label={compact ? labels.addFilter : undefined} className="border-dashed">
            <FilterIcon />
            {!compact && labels.addFilter}
            {active > 0 && !compact && (
              <span className="own:-me-1 own:grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent-subtle px-1 own:font-mono own:text-ui-xs own:text-accent-text own:tabular-nums">{active}</span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 overflow-hidden own:p-0">
        {current ? (
          <ValueList column={current} onBack={() => setStep(null)} />
        ) : (
          <Command label={labels.addFilter}>
            <CommandInput placeholder={`${labels.addFilter}…`} />
            <CommandList>
              <CommandGroup>
                {columns.map((column) => {
                  const title = metaOf(column)?.facet?.title ?? columnLabel(column)
                  const count = ((column.getFilterValue() as string[] | undefined) ?? []).length
                  return (
                    <CommandItem key={column.id} value={title} onSelect={() => setStep(column.id)}>
                      <span className="truncate">{title}</span>
                      {count > 0 && <span className="own:ms-auto own:font-mono own:text-ui-xs own:text-accent-text own:tabular-nums">{count}</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** The filters in force, as chips that open their values or remove themselves. */
export function FilterChips<TData extends RowData>({
  columns,
  onClearAll,
  trailing,
}: {
  columns: DataGridColumn<TData>[]
  onClearAll: () => void
  trailing?: ReactNode
}) {
  const labels = useCopy()
  const active = columns.filter((column) => column.getIsFiltered())
  return (
    <PresenceList as="ul" aria-label={labels.activeFilters} className="own:flex min-w-0 flex-wrap items-center gap-1.5">
      {active.map((column) => (
        <PresenceItem as="li" key={column.id}>
          <FilterChip column={column} />
        </PresenceItem>
      ))}
      {active.length > 1 && (
        <PresenceItem as="li" key="__clear">
          <Button variant="ghost" size="xs" className="own:text-fg-muted" onClick={onClearAll}>
            {labels.clearAll}
          </Button>
        </PresenceItem>
      )}
      {trailing}
    </PresenceList>
  )
}

function FilterChip<TData extends RowData>({ column }: { column: DataGridColumn<TData> }) {
  const labels = useCopy()
  const chosen = (column.getFilterValue() as string[] | undefined) ?? []
  const meta = metaOf(column)
  const title = meta?.facet?.title ?? columnLabel(column)
  const chosenKey = chosen.join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the chosen values, not the array, decide the counts
  const options = useMemo(() => facetOptions(column), [column, chosenKey])
  const named: DataGridOption[] = chosen.map((value) => options.find((o) => o.value === value) ?? { value, label: value })
  const summary = named.length > 2 ? `${named.slice(0, 2).map((o) => o.label).join(', ')} +${named.length - 2}` : named.map((o) => o.label).join(', ')
  return (
    <span
      data-slot="data-grid-filter-chip"
      className="own:flex h-control-sm items-stretch overflow-hidden own:rounded-md border own:border-line own:bg-(--dg-chip-bg) own:text-ui own:shadow-xs"
    >
      <span className="own:flex items-center ps-2.5 pe-2 own:text-fg-muted">{title}</span>
      <Popover>
        <PopoverTrigger
          className={cn(
            'flex max-w-56 items-center gap-1.5 border-s own:border-line own:px-2 text-fg outline-none',
            'transition-[background-color] yj-duration-fast ease-standard hover:bg-hover focus-visible:bg-hover own:data-popup-open:bg-hover',
          )}
        >
          {named.length <= 3 && named.some((o) => o.tone || o.src) && (
            <span className="own:flex items-center -space-x-0.5">
              {named.map((o) => (
                <OptionMark key={o.value} option={o} />
              ))}
            </span>
          )}
          <span className="truncate">{summary}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 overflow-hidden own:p-0">
          <ValueList column={column} />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        aria-label={labels.removeFilter(title)}
        onClick={() => column.setFilterValue(undefined)}
        className={cn(
          'grid w-7 place-items-center border-s border-line text-fg-muted outline-none',
          'transition-[background-color,color] yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-visible:bg-hover focus-visible:text-fg',
        )}
      >
        <XIcon size={13} strokeWidth={2} />
      </button>
    </span>
  )
}
