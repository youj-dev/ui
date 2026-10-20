'use client'

import { dataTableFiltersLabels } from '@youj/core/labels'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { CalendarIcon } from '@youj/icons/components/youj/icons/calendar'
import { CirclePlusIcon } from '@youj/icons/components/youj/icons/circle-plus'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { SlidersIcon } from '@youj/icons/components/youj/icons/sliders'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import type { RowData } from '@tanstack/react-table'
import { useLocale, type YoujLabels } from '@youj/core'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { Badge } from '../badge'
import { Button } from '../button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../command'
import { Field, FieldLabel } from '../field'
import { Input } from '../input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../input-group'
import { Kbd } from '../kbd'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Separator } from '../separator'
import { Slider } from '../slider'
import {
  columnLabel,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableFilterOption,
  type DataTableInstance,
  type DataTableDateRange,
  type DataTableNumberRange,
} from './data-table-model'

/* The toolbar's filters. Each is a dashed key that fills in once it holds a
 * value, opening a popover to set it; the active ones repeat below the
 * toolbar as chips that glide in and out (PresenceList) in a row that eases
 * open and closed (Collapse). Filter values are plain JSON, so a saved view
 * can hold them. */

/* ── Search ──────────────────────────────────────────────────────────────── */

/**
 * The global search. Typing filters after a short pause (Enter at once);
 * Escape clears it. `/` anywhere outside a text field jumps here.
 */
export function DataTableSearch<TData extends RowData>({
  table,
  placeholder,
  debounce = 200,
  shortcut = '/',
  className,
}: {
  table: DataTableInstance<TData>
  placeholder?: string
  /** Milliseconds of quiet before the table filters. */
  debounce?: number
  /** A key that focuses the search from anywhere on the page, or false. */
  shortcut?: string | false
  className?: string
}) {
  const labels = useComponentLabels(dataTableFiltersLabels)
  placeholder ??= labels.searchPlaceholder
  const committed = String(table.atoms.globalFilter.get() ?? '')
  const [draft, setDraft] = useState(committed)
  const sent = useRef(committed)
  const input = useRef<HTMLInputElement>(null)

  // Another control changed the search (clear all, a saved view): follow it.
  useEffect(() => {
    if (committed !== sent.current) {
      sent.current = committed
      setDraft(committed)
    }
  }, [committed])

  const commit = (value: string) => {
    sent.current = value
    table.setGlobalFilter(value)
  }

  useEffect(() => {
    if (draft === sent.current) return
    const id = setTimeout(() => commit(draft), debounce)
    return () => clearTimeout(id)
  })

  useEffect(() => {
    if (!shortcut) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== shortcut || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable=true], [role=combobox]')) return
      event.preventDefault()
      input.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shortcut])

  return (
    <InputGroup className={cn('h-control-sm w-full sm:w-64', className)}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={input}
        type="search"
        aria-label={placeholder.replace(/…$/, '')}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(draft)
          if (event.key === 'Escape' && draft) {
            event.preventDefault()
            setDraft('')
            commit('')
          }
        }}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      <InputGroupAddon align="inline-end">
        {draft ? (
          <InputGroupButton
            size="icon-xs"
            aria-label={labels.clearSearch}
            onClick={() => {
              setDraft('')
              commit('')
              input.current?.focus()
            }}
          >
            <XIcon />
          </InputGroupButton>
        ) : (
          shortcut && <Kbd aria-hidden>{shortcut}</Kbd>
        )}
      </InputGroupAddon>
    </InputGroup>
  )
}

/* ── Describing a filter ─────────────────────────────────────────────────── */

/* Days are written with their year ("Sep 3 – 6, 2026"): leaving out this
 * year's would read the clock while rendering, which a prerender refuses. */
const DAY_FORMAT = { month: 'short', day: 'numeric', year: 'numeric' } as const
const dayOf = (iso: string) => new Date(`${iso}T00:00:00`)

function formatDay(iso: string, locale: string) {
  return dateTimeFormat(locale, DAY_FORMAT).format(dayOf(iso))
}

/** The filter's value in words: the key's summary, the chip, the announcement. */
export function describeDataTableFilter(
  filter: DataTableFilter,
  value: unknown,
  options?: ReadonlyArray<DataTableFilterOption>,
  locale = 'en-US',
  labels: Pick<YoujLabels, 'filterFrom' | 'filterUntil'> = dataTableFiltersLabels,
): string {
  if (filter.type === 'select') {
    const values = (value as string[]) ?? []
    const labels = values.map((v) => options?.find((o) => o.value === v)?.label ?? v)
    return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ')
  }
  if (filter.type === 'date-range') {
    const { from, to } = (value as DataTableDateRange) ?? {}
    if (from && to) return from === to ? formatDay(from, locale) : dateTimeFormat(locale, DAY_FORMAT).formatRange(dayOf(from), dayOf(to))
    return from ? labels.filterFrom(formatDay(from, locale)) : to ? labels.filterUntil(formatDay(to, locale)) : ''
  }
  const { min, max } = (value as DataTableNumberRange) ?? {}
  const format = filter.format ?? ((n: number) => n.toLocaleString(locale))
  if (min !== undefined && max !== undefined) return `${format(min)} – ${format(max)}`
  return min !== undefined ? `≥ ${format(min)}` : max !== undefined ? `≤ ${format(max)}` : ''
}

/**
 * A select filter's options: the declared ones, or every value in the data,
 * sorted. Every value, not only those the other filters leave, so an option
 * never vanishes while the list is open.
 */
function useFilterOptions<TData extends RowData>(
  column: DataTableColumn<TData>,
  filter: Extract<DataTableFilter, { type: 'select' }>,
): ReadonlyArray<DataTableFilterOption> {
  const rows = column.table.getCoreRowModel().flatRows
  return useMemo(() => {
    if (filter.options) return filter.options
    const values = new Set<string>()
    for (const row of rows) {
      const value = row.getValue(column.id)
      if (value !== undefined && value !== null && value !== '') values.add(String(value))
    }
    return [...values].sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }))
  }, [filter.options, rows, column.id])
}

/* ── The key that opens a filter ─────────────────────────────────────────── */

function FilterKey({ label, summary, icon, ...props }: { label: string; summary: string; icon: ReactNode }) {
  const active = summary !== ''
  return (
    <PopoverTrigger
      render={
        <Button
          variant="outline"
          size="sm"
          data-active={active || undefined}
          // shape: dashed while empty (an add slot); the outline fills in once it holds a value
          className={cn('max-w-72 border-dashed data-active:border-solid own:data-active:bg-selected', 'gap-1.5 own:ps-2')}
        />
      }
      {...props}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <>
          <Separator orientation="vertical" className="own:mx-0.5 own:h-4 self-center" />
          <Badge variant="secondary" size="sm" className="own:min-w-0 truncate own:text-fg">
            {summary}
          </Badge>
        </>
      )}
    </PopoverTrigger>
  )
}

/* ── Select: several values, with counts ─────────────────────────────────── */

export function DataTableFacetedFilter<TData extends RowData>({
  column,
  filter,
}: {
  column: DataTableColumn<TData>
  filter: Extract<DataTableFilter, { type: 'select' }>
}) {
  const label = filter.title ?? columnLabel(column)
  const selected = (column.getFilterValue() as string[] | undefined) ?? []
  const locale = useLocale()
  const labels = useComponentLabels(dataTableFiltersLabels)
  return (
    <Popover>
      <FilterKey label={label} summary={describeDataTableFilter(filter, selected, filter.options, locale, labels)} icon={<CirclePlusIcon />} />
      <PopoverContent align="start" aria-label={labels.filterBy(label)} className="w-60 gap-0 own:p-0">
        <FacetedOptions column={column} filter={filter} label={label} selected={selected} />
      </PopoverContent>
    </Popover>
  )
}

/** The open list: mounted only while the popover is, so a closed filter never walks the rows. */
function FacetedOptions<TData extends RowData>({
  column,
  filter,
  label,
  selected,
}: {
  column: DataTableColumn<TData>
  filter: Extract<DataTableFilter, { type: 'select' }>
  label: string
  selected: string[]
}) {
  const options = useFilterOptions(column, filter)
  const labels = useComponentLabels(dataTableFiltersLabels)
  // Counts come from the loaded rows, so a server-filtered table shows none rather than one page's.
  const counts = column.table.options.manualFiltering ? undefined : column.getFacetedUniqueValues()
  const set = (next: Set<string>) => column.setFilterValue(next.size ? [...next] : undefined)
  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    set(next)
  }
  return (
    <Command label={labels.filterBy(label)}>
      <CommandInput placeholder={label} />
      <CommandList>
        <CommandEmpty>{labels.filterNoOptions(label)}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const count = counts?.get(option.value) ?? counts?.get(Number(option.value)) ?? 0
            const checked = selected.includes(option.value)
            return (
              <CommandItem
                key={option.value}
                value={option.label}
                checked={checked}
                onSelect={() => toggle(option.value)}
                // An option nothing matches stays in place (the list never reshuffles) but recedes.
                className={cn(counts && count === 0 && !checked && 'text-fg-muted')}
              >
                {option.icon && <option.icon />}
                <span className="truncate">{option.label}</span>
                {counts && (
                  <>
                    {' '}
                    <span className="own:ms-auto own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">{count}</span>
                  </>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
        {selected.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => set(new Set())} className="justify-center">
                {labels.clearFilter}
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}

/* ── Date range: presets, or exact days ──────────────────────────────────── */

function iso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function presets(labels: Pick<YoujLabels, keyof typeof dataTableFiltersLabels>, today: Date): Array<{ label: string; value: DataTableDateRange }> {
  const back = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days)
  return [
    { label: labels.today, value: { from: iso(today), to: iso(today) } },
    { label: labels.last7Days, value: { from: iso(back(6)), to: iso(today) } },
    { label: labels.last30Days, value: { from: iso(back(29)), to: iso(today) } },
    { label: labels.thisMonth, value: { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) } },
    { label: labels.thisYear, value: { from: iso(new Date(today.getFullYear(), 0, 1)), to: iso(today) } },
  ]
}

export function DataTableDateRangeFilter<TData extends RowData>({
  column,
  filter,
}: {
  column: DataTableColumn<TData>
  filter: Extract<DataTableFilter, { type: 'date-range' }>
}) {
  const label = filter.title ?? columnLabel(column)
  const value = (column.getFilterValue() as DataTableDateRange | undefined) ?? {}
  const set = (next: DataTableDateRange) => column.setFilterValue(next.from || next.to ? next : undefined)
  const locale = useLocale()
  const labels = useComponentLabels(dataTableFiltersLabels)
  // Read each time the popover opens, never while rendering: a prerender can't read the clock.
  const [today, setToday] = useState<Date | null>(null)
  return (
    <Popover onOpenChange={(open) => open && setToday(new Date())}>
      <FilterKey label={label} summary={describeDataTableFilter(filter, value, undefined, locale, labels)} icon={<CalendarIcon />} />
      <PopoverContent align="start" aria-label={labels.filterBy(label)} className="w-72 gap-0 own:p-0">
        <div role="group" aria-label={labels.presets} className="own:flex flex-col p-1.5">
          {today && presets(labels, today).map((preset) => {
            const pressed = preset.value.from === value.from && preset.value.to === value.to
            return (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                aria-pressed={pressed}
                onClick={() => set(preset.value)}
                className="justify-between own:aria-pressed:bg-selected own:aria-pressed:text-fg"
              >
                {preset.label}
                {pressed && <span className="size-1.5 rounded-full bg-accent" aria-hidden />}
              </Button>
            )
          })}
        </div>
        <Separator />
        <div className="own:grid grid-cols-2 gap-2 p-3">
          <Field>
            <FieldLabel>{labels.dateFrom}</FieldLabel>
            <Input type="date" value={value.from ?? ''} max={value.to} onChange={(event) => set({ ...value, from: event.target.value || undefined })} />
          </Field>
          <Field>
            <FieldLabel>{labels.dateTo}</FieldLabel>
            <Input type="date" value={value.to ?? ''} min={value.from} onChange={(event) => set({ ...value, to: event.target.value || undefined })} />
          </Field>
        </div>
        {(value.from || value.to) && (
          <div className="own:flex justify-end border-t border-line p-1.5">
            <Button variant="ghost" size="sm" onClick={() => set({})}>
              {labels.clear}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ── Number range: a two-thumb slider and exact bounds ───────────────────── */

export function DataTableNumberRangeFilter<TData extends RowData>({
  column,
  filter,
}: {
  column: DataTableColumn<TData>
  filter: Extract<DataTableFilter, { type: 'number-range' }>
}) {
  const label = filter.title ?? columnLabel(column)
  const value = (column.getFilterValue() as DataTableNumberRange | undefined) ?? {}
  const locale = useLocale()
  const labels = useComponentLabels(dataTableFiltersLabels)
  const facets = filter.min === undefined || filter.max === undefined ? column.getFacetedMinMaxValues() : undefined
  const lo = Math.floor(filter.min ?? facets?.[0] ?? 0)
  const hi = Math.ceil(filter.max ?? facets?.[1] ?? 100)
  const step = filter.step ?? 1
  // The slider drags a draft; the table filters when the thumb is let go.
  // The draft follows the filter's value: a change to it (or to the bounds) replaces the draft while rendering.
  const applied: [number, number] = [value.min ?? lo, value.max ?? hi]
  const appliedKey = `${applied[0]}|${applied[1]}|${lo}|${hi}`
  const [draft, setDraft] = useState<[number, number]>(applied)
  const [draftFrom, setDraftFrom] = useState(appliedKey)
  if (draftFrom !== appliedKey) {
    setDraftFrom(appliedKey)
    setDraft(applied)
  }
  // The fields show the draft (an open end stays empty and shows the column's bound), unless the user is mid-edit in them.
  const draftKey = `${draft[0]}|${draft[1]}|${lo}|${hi}`
  const [typed, setTyped] = useState<{ key: string; texts: [string, string] } | null>(null)
  const texts: [string, string] = typed && typed.key === draftKey ? typed.texts : [draft[0] <= lo ? '' : String(draft[0]), draft[1] >= hi ? '' : String(draft[1])]
  const commit = ([min, max]: [number, number]) =>
    column.setFilterValue(min <= lo && max >= hi ? undefined : { min: min <= lo ? undefined : min, max: max >= hi ? undefined : max })
  const format = filter.format ?? ((n: number) => n.toLocaleString(locale))
  const bound = (index: 0 | 1) => {
    const text = texts[index]
    const n = Number(text.replace(/[^\d.-]/g, ''))
    const next: [number, number] = [...draft]
    next[index] = text.trim() === '' ? (index === 0 ? lo : hi) : Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : draft[index]
    if (next[0] > next[1]) next.reverse()
    setDraft(next)
    setTyped(null)
    commit(next)
  }
  const field = (index: 0 | 1) => ({
    inputMode: 'decimal' as const,
    value: texts[index],
    placeholder: format(index === 0 ? lo : hi),
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const next: [string, string] = [...texts]
      next[index] = event.target.value
      setTyped({ key: draftKey, texts: next })
    },
    onBlur: () => bound(index),
    onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => event.key === 'Enter' && bound(index),
  })
  return (
    <Popover>
      <FilterKey label={label} summary={describeDataTableFilter(filter, value, undefined, locale, labels)} icon={<SlidersIcon />} />
      <PopoverContent align="start" aria-label={labels.filterBy(label)} className="w-72">
        <div className="own:flex items-baseline justify-between own:text-ui-sm text-fg-muted own:tabular-nums">
          <span>{format(draft[0])}</span>
          <span>{format(draft[1])}</span>
        </div>
        <Slider
          min={lo}
          max={hi}
          step={step}
          value={draft}
          onValueChange={(next) => setDraft(next as [number, number])}
          onValueCommitted={(next) => commit(next as [number, number])}
          thumbLabels={[labels.minimumOf(label), labels.maximumOf(label)]}
        />
        <div className="own:grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel>{labels.rangeMin}</FieldLabel>
            <Input {...field(0)} />
          </Field>
          <Field>
            <FieldLabel>{labels.rangeMax}</FieldLabel>
            <Input {...field(1)} />
          </Field>
        </div>
        {(value.min !== undefined || value.max !== undefined) && (
          <Button variant="ghost" size="sm" className="self-end" onClick={() => column.setFilterValue(undefined)}>
            {labels.clear}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** The trigger for a column's declared filter. */
export function DataTableColumnFilter<TData extends RowData>({ column }: { column: DataTableColumn<TData> }) {
  const filter = column.columnDef.meta?.filter
  if (!filter) return null
  if (filter.type === 'select') return <DataTableFacetedFilter column={column} filter={filter} />
  if (filter.type === 'date-range') return <DataTableDateRangeFilter column={column} filter={filter} />
  return <DataTableNumberRangeFilter column={column} filter={filter} />
}

/* ── Chips ───────────────────────────────────────────────────────────────── */

export interface DataTableFilterChip {
  id: string
  label: string
  value: string
  remove: () => void
}

/** The filters in force, one chip each, and Clear all. */
export function dataTableFilterChips<TData extends RowData>(
  table: DataTableInstance<TData>,
  locale: string,
  labels: Pick<YoujLabels, 'search' | 'quoted' | 'filterFrom' | 'filterUntil'> = dataTableFiltersLabels,
): DataTableFilterChip[] {
  const chips: DataTableFilterChip[] = []
  const search = String(table.atoms.globalFilter.get() ?? '')
  if (search) chips.push({ id: '__search', label: labels.search, value: labels.quoted(search), remove: () => table.setGlobalFilter('') })
  for (const column of table.getAllLeafColumns()) {
    const filter = column.columnDef.meta?.filter
    const value = column.getFilterValue()
    if (!filter || value === undefined) continue
    chips.push({
      id: column.id,
      label: filter.title ?? columnLabel(column),
      value: describeDataTableFilter(filter, value, filter.type === 'select' ? filter.options : undefined, locale, labels),
      remove: () => column.setFilterValue(undefined),
    })
  }
  return chips
}

/**
 * Chips for the filters in force. A chip arrives by fading into its place
 * while the others make room, and leaves the same way; the row itself eases
 * open and shut. Removing one hands focus to its neighbor (or out of the
 * row, via `onEmptied`), so a keyboard user never lands on nothing.
 */
export function DataTableFilterChips({
  chips,
  onClearAll,
  onEmptied,
}: {
  chips: DataTableFilterChip[]
  onClearAll: () => void
  /** Where focus goes when the last chip is removed from the keyboard. */
  onEmptied?: () => void
}) {
  const list = useRef<HTMLDivElement>(null)
  const refocus = useRef<number | null>(null)
  const labels = useComponentLabels(dataTableFiltersLabels)
  useLayoutEffect(() => {
    if (refocus.current === null) return
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>('li:not([inert]) button')
    const index = refocus.current
    refocus.current = null
    if (!buttons?.length || chips.length === 0) onEmptied?.()
    else buttons[Math.min(index, buttons.length - 1)]?.focus()
  })
  const focusedIndex = () => {
    const buttons = [...(list.current?.querySelectorAll('li:not([inert]) button') ?? [])]
    return buttons.indexOf(document.activeElement as Element)
  }
  return (
    <Collapse open={chips.length > 0}>
      <div ref={list} role="group" aria-label={labels.activeFilters} className="pt-0.5 pb-1">
        <PresenceList className="own:flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <PresenceItem key={chip.id}>
              <span className="own:inline-flex h-control-xs max-w-80 items-center gap-1 rounded-md border border-line bg-surface ps-2 pe-0.5 own:text-ui-sm shadow-xs">
                <span className="own:text-fg-muted">{chip.label}</span>
                <span className="truncate own:font-medium own:text-fg">{chip.value}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={labels.removeFilter(chip.label)}
                  onClick={() => {
                    const index = focusedIndex()
                    if (index !== -1) refocus.current = index
                    chip.remove()
                  }}
                >
                  <XIcon className="own:size-3" />
                </Button>
              </span>
            </PresenceItem>
          ))}
          <PresenceItem key="__clear">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                if (list.current?.contains(document.activeElement)) refocus.current = 0
                onClearAll()
              }}
            >
              {labels.clearAll}
            </Button>
          </PresenceItem>
        </PresenceList>
      </div>
    </Collapse>
  )
}
