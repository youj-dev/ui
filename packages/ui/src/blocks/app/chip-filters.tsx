'use client'

import { type ComponentProps, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { CopyIcon, MoreHorizontalIcon, RotateCcwIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { HistogramRange } from '../../components/ui/histogram-range'
import { FilterChips } from '../../components/ui/filter-chips'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import {
  checkToken,
  countIn,
  DEFAULT_COPY,
  DEFAULT_VALUE,
  FIELDS,
  fromTokens,
  OPTIONS,
  toTokens,
  demo,
  WHOLE,
  type ChipFiltersChoice,
  type ChipFiltersCopy,
  type ChipFiltersFields,
  type ChipFiltersOption,
  type ChipFiltersRange,
  type ChipFiltersValue,
} from './chip-filters/data'
import { ChoiceList } from './chip-filters/choice-list'
import { Section } from './chip-filters/section'

/* A search over records, written first and refined after (the demo searches
 * a shop's orders). The search leads: the filters as a query of chips you can
 * type, paste or edit. The result sits in the head's corner, a mono figure
 * over the period's total that counts to each new result (Counter) and is
 * spoken once it settles. Under the search, the checked groups' records as a
 * histogram cut by a range, and beside it the groups as a checklist with a
 * tri-state box and each group's records inside the range. Two fields, a
 * range and a choice, named by `fields` (`total:25..180`,
 * `state:in(paid,shipped)`). The search edits both ways: move a thumb or tick
 * a box and its chip rewrites in place; type or edit a chip and the controls
 * follow. The footer clears the filters or saves the search (Button
 * onAction). Swap `onSaveView` for your API and `options` for your data. It is built for the compact layout density
 * (ui.css), taken from the page: its bands follow Card's spacing. Reduced motion: counts and bars take their values
 * in one frame. */

interface ChipFiltersProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue'> {
  /** Wraps the panel in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside your page: an `h2`, at its natural width, with no page around it. `false` draws its own page around it (a centered canvas and the page's `h1`). Default true. */
  embedded?: boolean
  /** Take the width the page gives it, not its natural width. Default false. */
  fill?: boolean
  /** Any of the panel's strings, to rewrite or translate. */
  copy?: Partial<ChipFiltersCopy>
  /** The two fields: the range the histogram spreads records along, and the checklist; each names its filter in the query. Default: basket value and order state. */
  fields?: ChipFiltersFields
  /** The groups the records fall into, each with its counts per bin of the range. Default: a quarter of demo orders by fulfillment state. */
  options?: ChipFiltersOption[]
  /** The filters it opens with. Default: 25 to 180, paid and shipped. */
  defaultValue?: ChipFiltersValue
  onValueChange?: (value: ChipFiltersValue) => void
  /** "Save search". Reject with an Error to show it failed. */
  onSaveView?: (value: ChipFiltersValue) => unknown
  /** Formats the range's amounts on the axis and the thumbs. Default: whole units of `copy.currency` in the locale. */
  format?: (value: number) => string
  /** Formats counts and amounts. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

function ChipFilters({ theme, embedded = true, fill = false, copy: copyProp, fields = FIELDS, options = OPTIONS, defaultValue = DEFAULT_VALUE, onValueChange, onSaveView = () => demo('ChipFilters: onSaveView', 900), format, locale, className, ...rest }: ChipFiltersProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const [filters, setFilters] = useState(defaultValue)
  const { range } = fields
  const { announce, announcer } = useAnnouncer()

  const update = (next: ChipFiltersValue) => {
    setFilters(next)
    onValueChange?.(next)
  }
  const clear: ChipFiltersValue = { range: [range.min, range.max], selected: options.map((o) => o.id) }
  const cleared = toTokens(filters, options, fields).length === 0

  const counts = useMemo(() => options.map((o) => Math.round(countIn(o.bins, filters.range, range))), [options, filters.range, range])
  const total = useMemo(() => options.reduce((sum, o) => sum + o.bins.reduce((a, b) => a + b, 0), 0), [options])
  const matched = options.reduce((sum, o, i) => (filters.selected.includes(o.id) ? sum + counts[i]! : sum), 0)
  // The histogram shows the checked groups' records, so it reshapes as they change.
  const bins = useMemo(
    () => Array.from({ length: range.bins }, (_, i) => options.reduce((sum, o) => (filters.selected.includes(o.id) ? sum + (o.bins[i] ?? 0) : sum), 0)),
    [options, filters.selected, range.bins],
  )

  const number = numberFormat(copy.locale)
  const amounts = numberFormat(copy.locale, { style: 'currency', currency: copy.currency, maximumFractionDigits: 0 })

  // The result is spoken once it settles, after the range has had its turn.
  const spoken = copy.matchedAnnouncement(number.format(matched))
  const lastSpoken = useRef(spoken)
  useEffect(() => {
    if (spoken === lastSpoken.current) return
    lastSpoken.current = spoken
    const timer = setTimeout(() => announce(spoken), 900)
    return () => clearTimeout(timer)
  }, [spoken, announce])

  const copyQuery = async () => {
    await navigator.clipboard?.writeText(toTokens(filters, options, fields).join(' '))
    announce(copy.copied)
  }

  const Root = embedded ? 'section' : 'main'
  const Title = embedded ? 'h2' : 'h1'
  const card = (
      <Root aria-labelledby={titleId} {...(embedded ? rest : null)} className={cn('w-full text-fg', !fill && 'max-w-184', embedded && className)}>
        <Card className={cn('gap-0 py-0', embedded ? 'shadow-sm' : 'shadow-lg')}>
          <CardHeader className="border-b border-line py-(--card-spacing)">
            <CardTitle>
              <Title id={titleId}>{copy.title}</Title>
            </CardTitle>
            <CardDescription className="truncate">{copy.scope}</CardDescription>
            <CardAction className="flex items-center gap-4">
              {/* The result, in the corner: the count over the quarter's total. */}
              <p className="flex shrink-0 flex-col items-end gap-1 text-end">
                <Counter value={matched} locale={copy.locale} format={WHOLE} className="font-mono text-2xl leading-none font-medium tracking-tight text-fg" />
                <span className="text-ui-sm text-fg-muted tabular-nums">{copy.ofTotal(number.format(total))}</span>
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="shrink-0" aria-label={copy.more} />}>
                  <MoreHorizontalIcon size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyQuery} disabled={cleared}>
                    <CopyIcon size={14} /> {copy.copyQuery}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => update(clear)} disabled={cleared}>
                    <RotateCcwIcon size={14} /> {copy.reset}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </CardHeader>

          <Section className="py-[calc(var(--card-spacing)-var(--spacing))]">
            <FilterChips
              aria-label={copy.search}
              value={toTokens(filters, options, fields)}
              onValueChange={(tokens) => update(fromTokens(tokens, options, fields))}
              validate={(token) => checkToken(token, options, copy, fields)}
              // Outline chips: the accent is kept for the selected choices below.
              className="[&_[data-slot=query-chip]]:border-line [&_[data-slot=query-chip]]:bg-transparent [&_[data-slot=query-chip]]:text-fg"
            />
          </Section>

          <div className="grid border-b border-line sm:grid-cols-[minmax(0,1fr)_--spacing(60)]">
            <div className="min-w-0 px-(--card-spacing) pt-(--card-spacing) pb-[calc(var(--card-spacing)-var(--spacing))]">
              <HistogramRange
                label={copy.rangeLabel}
                bins={bins}
                min={range.min}
                max={range.max}
                step={range.step}
                value={filters.range}
                onValueChange={(next) => update({ ...filters, range: next })}
                format={format ?? amounts.format}
                ticks={range.ticks}
              />
            </div>
            <div className="border-t border-line px-(--card-spacing) py-[calc(var(--card-spacing)-var(--spacing))] sm:border-t-0 sm:border-s">
              <ChoiceList
                options={options}
                counts={counts}
                selected={filters.selected}
                onSelectedChange={(selected) => update({ ...filters, selected: options.filter((o) => selected.includes(o.id)).map((o) => o.id) })}
                copy={copy}
              />
            </div>
          </div>

          <CardFooter className="flex-wrap justify-between gap-3 py-[calc(var(--card-spacing)-var(--spacing))]">
            {/* A ghost's label would sit a padding in from the content edge; pulled back, its icon lines up with the sections above. */}
            <Button variant="ghost" className="-ms-3 me-auto" disabled={cleared} onClick={() => update(clear)}>
              <RotateCcwIcon size={14} />
              {copy.reset}
            </Button>
            <AsyncButton pendingLabel={copy.saving} successLabel={copy.saved} onAction={() => onSaveView(filters)}>
              {copy.saveView}
            </AsyncButton>
          </CardFooter>
        </Card>
        {announcer}
      </Root>
  )
  const panel = embedded ? (
    card
  ) : (
    <div {...rest} className={cn('flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{panel}</ThemeScope> : panel
}

export { ChipFilters, type ChipFiltersProps }
export type { ChipFiltersChoice, ChipFiltersCopy, ChipFiltersFields, ChipFiltersOption, ChipFiltersRange, ChipFiltersValue }
