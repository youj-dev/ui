'use client'

import { HeartIcon, SlidersIcon, SortIcon, XIcon } from '@youj/icons'
import { useRef, type RefObject } from 'react'
import { Counter, PresenceItem, PresenceList } from '@youj/motion'
import { Button } from '../../../components/ui/button'
import { HistogramRange } from '../../../components/ui/histogram-range'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Toggle } from '../../../components/ui/toggle'
import { useIsPhone } from '../../../hooks/use-mobile'
import { cn } from '../../../lib/utils'
import type { ProductGridCopy, ProductSort } from './data'

/* The grid's controls, one row on a hairline: the categories as tabs with live counts (a select on a phone), then the
 * count, the Saved view, the Filters popover (price over its histogram, colors as swatches, each with what it leaves)
 * and the sort. Under it, a chip for every filter set, each one removable. */

interface Facet {
  value: string
  label: string
  count: number
  swatch?: string
}

interface ToolbarProps {
  copy: ProductGridCopy
  categories: Facet[]
  /** Everything the other filters leave, the All tab's count. */
  total: number
  category: string
  onCategoryChange: (category: string) => void
  savedOnly: boolean
  onSavedOnlyChange: (on: boolean) => void
  savedCount: number
  prices: number[]
  priceMax: number
  price: [number, number]
  onPriceChange: (price: [number, number]) => void
  colors: Facet[]
  picked: string[]
  onPickedChange: (colors: string[]) => void
  /** What the filters leave, for the popover's button. */
  matches: number
  sort: ProductSort
  onSortChange: (sort: ProductSort) => void
  money: (value: number) => string
  locale: string
  /** The count of what's shown, spoken as it changes. */
  status: string
  /** The count's element: focus lands there when the chip it was on goes. */
  statusRef: RefObject<HTMLParagraphElement | null>
}

export function Toolbar(props: ToolbarProps) {
  const {
    copy,
    categories,
    total,
    category,
    onCategoryChange,
    savedOnly,
    onSavedOnlyChange,
    savedCount,
    sort,
    onSortChange,
    locale,
    status,
    statusRef,
  } = props
  const phone = useIsPhone()
  const set = (props.price[0] > 0 || props.price[1] < props.priceMax ? 1 : 0) + props.picked.length
  return (
    <div className="flex flex-col gap-3 border-b border-line md:flex-row md:items-end md:justify-between md:gap-6">
      {phone ? (
        <Select
          items={{ '': copy.all, ...Object.fromEntries(categories.map((c) => [c.value, c.label])) }}
          value={category}
          onValueChange={(next) => onCategoryChange(next ?? '')}
        >
          <SelectTrigger aria-label={copy.categories} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{copy.all}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <SegmentedControl
          value={category || '*'}
          onValueChange={(next) => onCategoryChange(next === '*' ? '' : next)}
          aria-label={copy.categories}
          className="-mb-px shadow-none"
        >
          {[{ value: '*', label: copy.all, count: total }, ...categories].map((c) => (
            <SegmentedControlItem key={c.value} value={c.value} className="gap-1.5 px-3">
              {c.label}
              <span className="font-mono text-ui-xs text-fg-subtle tabular-nums">{c.count}</span>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
      <div className="flex items-center gap-1.5 pb-2 md:pb-1.5">
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="me-auto rounded-sm text-ui-sm text-fg-muted tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-focus md:me-2"
        >
          {status}
        </p>
        <Toggle size="sm" pressed={savedOnly} onPressedChange={onSavedOnlyChange} className="gap-1.5 px-2.5">
          <HeartIcon size={14} active={savedOnly} />
          {copy.saved}
          {savedCount > 0 && (
            <Counter
              value={savedCount}
              mode="roll"
              from={savedCount - 1}
              inView={false}
              locale={locale}
              className="font-mono text-ui-xs text-fg-subtle"
            />
          )}
        </Toggle>
        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" size="sm" aria-label={set ? copy.filtersSet(set) : copy.filters} className="gap-1.5 px-2.5" />}
          >
            <SlidersIcon size={14} />
            {copy.filters}
            {set > 0 && (
              <span className="grid size-4.5 place-items-center rounded-full bg-accent font-mono text-ui-xs text-on-accent tabular-nums">{set}</span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 gap-5">
            <Filters {...props} />
          </PopoverContent>
        </Popover>
        <Select items={copy.sorts} value={sort} onValueChange={(next) => next && onSortChange(next as ProductSort)}>
          <SelectTrigger size="sm" variant="ghost" aria-label={copy.sortBy} className="gap-1.5 shadow-none">
            <SortIcon size={14} className="text-fg-muted" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(copy.sorts).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function Filters({ copy, prices, priceMax, price, onPriceChange, colors, picked, onPickedChange, matches, money }: ToolbarProps) {
  const toggle = (color: string) => onPickedChange(picked.includes(color) ? picked.filter((c) => c !== color) : [...picked, color])
  return (
    <>
      <HistogramRange
        label={copy.price}
        data={prices}
        binCount={Math.min(24, Math.max(10, prices.length * 2))}
        ticks={[0, Math.round(priceMax / 20) * 10, priceMax]}
        min={0}
        max={priceMax}
        step={1}
        value={price}
        onValueChange={onPriceChange}
        format={money}
        thumbLabels={[copy.minPrice, copy.maxPrice]}
      />
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-ui font-medium text-fg">{copy.color}</legend>
        <div className="grid grid-cols-2 gap-1">
          {colors.map((c) => (
            <label
              key={c.value}
              className={cn(
                'flex h-control-sm cursor-pointer items-center gap-2 rounded-md px-2 text-ui transition-colors yj-duration-fast ease-standard hover:bg-hover',
                'has-checked:bg-selected has-focus-visible:outline-2 has-focus-visible:outline-focus',
                c.count === 0 && !picked.includes(c.value) && 'text-fg-subtle',
              )}
            >
              <input type="checkbox" checked={picked.includes(c.value)} onChange={() => toggle(c.value)} className="peer sr-only" />
              <span
                aria-hidden
                className="size-3.5 shrink-0 rounded-full border border-line-subtle peer-checked:outline-1 peer-checked:outline-offset-2 peer-checked:outline-fg"
                style={{ background: c.swatch }}
              />
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              <span className="font-mono text-ui-xs text-fg-subtle tabular-nums">{c.count}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="-mx-1 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onPriceChange([0, priceMax])
            onPickedChange([])
          }}
        >
          {copy.clearFilters}
        </Button>
        <PopoverClose render={<Button size="sm" />}>{copy.showResults(matches)}</PopoverClose>
      </div>
    </>
  )
}

interface ChipsProps {
  copy: ProductGridCopy
  chips: { id: string; label: string; onRemove: () => void }[]
  onClear: () => void
  /** Where focus goes when the last chip (or Clear all) is gone. */
  fallback: RefObject<HTMLElement | null>
}

/** A chip for each filter set. Removing one hands focus to its neighbor, the last one (or Clear all) to the count, so
 * focus is never dropped on the page. */
export function Chips({ copy, chips, onClear, fallback }: ChipsProps) {
  const row = useRef<HTMLDivElement>(null)
  const remove = (index: number, run: () => void) => {
    const buttons = [...(row.current?.querySelectorAll<HTMLButtonElement>('li:not([inert]) button') ?? [])]
    const next = buttons[index + 1] ?? buttons[index - 1]
    run()
    ;(next ?? fallback.current)?.focus()
  }
  if (!chips.length) return null
  return (
    <div ref={row} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <PresenceList aria-label={copy.activeFilters} className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip, i) => (
          <PresenceItem key={chip.id}>
            <Button
              variant="outline"
              size="xs"
              aria-label={copy.removeFilter(chip.label)}
              onClick={() => remove(i, chip.onRemove)}
              className="gap-1 ps-2.5 pe-1.5"
            >
              {chip.label}
              <XIcon size={12} className="text-fg-muted" />
            </Button>
          </PresenceItem>
        ))}
      </PresenceList>
      <Button variant="link" size="xs" onClick={() => remove(Infinity, onClear)} className="px-0 text-fg-muted hover:text-fg">
        {copy.clearAll}
      </Button>
    </div>
  )
}
