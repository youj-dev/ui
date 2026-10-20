'use client'

import { useId, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PlusIcon, XIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { AllocationBar, FILL, TickMeter, TONES, type Tone } from './split-allocation/allocation'
import {
  CATEGORIES,
  DEFAULT_COPY,
  demo,
  START,
  MONEY,
  TOTAL,
  type SplitAllocationCategory,
  type SplitLine,
  type SplitAllocationCopy,
  type SplitAllocationTotal,
} from './split-allocation/data'
import { NumberField } from './split-allocation/fields'
import { equalShares, fractionDigits, parseDecimal, sumOf, type SplitRow } from './split-allocation/model'

/* One amount split across categories (a purchase, the rent, a pool of hours). Equal split divides the amount evenly
 * in whole cents and gives the leftover cents to the last row; Custom split
 * lets each row's amount or percent be typed (the two stay in step), and rows
 * be added from the categories not yet used or removed. The bar above the rows
 * is the split at a glance: a segment per row sized to its share, what is
 * still unallocated hatched, and the status line under it says it in words
 * ("100% of $128.00", "$12.80 left to allocate", "$4.00 over"). Save waits for
 * exactly 100%; the status line is its reason. Wire `onSave` to your API.
 * Reduced motion: the bar changes in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

type Mode = 'equal' | 'custom'

interface SplitAllocationProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSave'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<SplitAllocationCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** How the amounts are written (Intl.NumberFormat options): dollars, hours… Default: US dollars. */
  format?: Intl.NumberFormatOptions
  /** What is being split: its label, the amount and a line of detail. */
  total?: SplitAllocationTotal
  /** The categories a row can take. Each can be used by one row. */
  categories?: SplitAllocationCategory[]
  /** The mode it opens in. Default 'equal'. */
  defaultMode?: Mode
  /** The rows it opens with (a custom split's amounts). Default: the first three categories, split equally. */
  defaultLines?: SplitLine[]
  /** Called with the new mode after every change of mode. */
  onModeChange?: (mode: Mode) => void
  /** Called with the rows (amounts in the format's major units) after every edit. */
  onLinesChange?: (lines: SplitLine[]) => void
  /** Saves the split once it adds up to the whole amount; resolve when it is done. Default: a short demo wait. */
  onSave?: (lines: SplitLine[]) => Promise<unknown> | unknown
  /** Called by Cancel, after the card has put its rows back as it opened. */
  onCancel?: () => void
}

const ROW =
  'grid grid-cols-[minmax(0,1fr)_--spacing(28)_--spacing(20)_var(--spacing-control)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_--spacing(14)_--spacing(28)_--spacing(20)_var(--spacing-control)]'
const STATUS = { done: 'text-success-text', left: 'text-warning-text', over: 'text-danger-text' }

function SplitAllocation({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  format = MONEY,
  total: given = TOTAL,
  categories = CATEGORIES,
  defaultMode = 'equal',
  defaultLines,
  onModeChange,
  onLinesChange,
  onSave,
  onCancel,
  className,
  ...rest
}: SplitAllocationProps) {
  const lang = useLocale(locale ?? copyProp?.locale)
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: lang }
  const titleId = useId()
  const statusId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const digits = fractionDigits(lang, format)
  const unit = 10 ** digits
  const total = Math.round(given.amount * unit)

  const open = (): SplitRow[] => {
    const lines = defaultLines ?? START.filter((id) => categories.some((c) => c.id === id)).map((category) => ({ category, amount: 0 }))
    const seeded = lines.length > 0 ? lines : categories.slice(0, 2).map((c) => ({ category: c.id, amount: 0 }))
    const shares = equalShares(total, seeded.length)
    return seeded.map((line, i) => ({
      id: `row-${i}`,
      category: line.category,
      minor: defaultLines && defaultMode === 'custom' ? Math.round(line.amount * unit) : shares[i]!,
    }))
  }
  const [initial] = useState(open)
  const ids = useRef(initial.length)
  const [rows, setRows] = useState(initial)
  const [mode, setModeState] = useState<Mode>(defaultMode)

  const number = useMemo(
    () => numberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
    [lang, digits],
  )
  const plain = useMemo(
    () => numberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }),
    [lang, digits],
  )
  const percentage = useMemo(() => numberFormat(lang, { maximumFractionDigits: 1 }), [lang])
  const percentPlain = useMemo(() => numberFormat(lang, { maximumFractionDigits: 1, useGrouping: false }), [lang])
  const currency = useMemo(() => numberFormat(lang, format), [lang, format])
  const parts = currency.formatToParts(1)
  // The sign set apart in the fields: the currency's or the unit's.
  const signPart = parts.find((p) => p.type === 'currency' || p.type === 'unit')
  const sign = signPart?.value ?? ''
  const signFirst = signPart ? parts.indexOf(signPart) < parts.findIndex((p) => p.type === 'integer') : false
  const percentSign = numberFormat(copy.locale, { style: 'percent' }).formatToParts(0.5).find((p) => p.type === 'percentSign')?.value ?? '%'
  const money = (minor: number) => currency.format(minor / unit)
  const date =
    given.date &&
    dateTimeFormat(copy.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${given.date}T00:00:00Z`))

  const byId = new Map(categories.map((c, i) => [c.id, { ...c, tone: (c.tone ?? TONES[i % TONES.length]!) as Tone }]))
  const lines = (list: SplitRow[]): SplitLine[] => list.map((row) => ({ category: row.category, amount: row.minor / unit }))
  const equalize = (list: SplitRow[]) => {
    const shares = equalShares(total, list.length)
    return list.map((row, i) => ({ ...row, minor: shares[i]! }))
  }
  const commit = (next: SplitRow[]) => {
    setRows(next)
    onLinesChange?.(lines(next))
  }

  const setMode = (next: string) => {
    const value = next as Mode
    setModeState(value)
    onModeChange?.(value)
    if (value === 'equal') commit(equalize(rows))
  }
  const edit = (id: string, minor: number | null) => {
    if (minor === null) return
    commit(rows.map((row) => (row.id === id ? { ...row, minor: Math.max(0, minor) } : row)))
  }
  const typeAmount = (id: string) => (text: string) => {
    const value = parseDecimal(text, copy.locale)
    edit(id, value === null ? null : Math.round(value * unit))
  }
  const typePercent = (id: string) => (text: string) => {
    const value = parseDecimal(text, copy.locale)
    edit(id, value === null ? null : Math.round((total * value) / 100))
  }
  const pick = (id: string, category: string | null) => {
    if (category) commit(rows.map((row) => (row.id === id ? { ...row, category } : row)))
  }
  const free = categories.filter((c) => !rows.some((row) => row.category === c.id))
  const add = () => {
    if (!free[0]) return
    const next = [...rows, { id: `row-${ids.current++}`, category: free[0].id, minor: mode === 'equal' ? 0 : Math.max(0, total - sumOf(rows)) }]
    commit(mode === 'equal' ? equalize(next) : next)
  }
  const remove = (id: string) => {
    const next = rows.filter((row) => row.id !== id)
    commit(mode === 'equal' ? equalize(next) : next)
  }
  const cancel = () => {
    setRows(initial)
    setModeState(defaultMode)
    onLinesChange?.(lines(initial))
    onCancel?.()
  }

  const allocated = sumOf(rows)
  const gap = total - allocated
  const complete = gap === 0 && total > 0
  const state = complete ? 'done' : gap > 0 ? 'left' : 'over'
  const status = complete ? copy.complete(money(total)) : gap > 0 ? copy.left(money(gap)) : copy.over(money(-gap))
  const scale = Math.max(total, allocated, 1)
  const segments = rows.map((row) => ({ id: row.id, tone: byId.get(row.category)?.tone ?? TONES[0]!, share: row.minor / scale }))
  const editable = mode === 'custom'

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-xl')}>
      <CardHeader className="pt-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardAction>
          <SegmentedControl variant="pill" aria-label={copy.mode} value={mode} onValueChange={setMode}>
            <SegmentedControlItem value="equal">{copy.equal}</SegmentedControlItem>
            <SegmentedControlItem value="custom">{copy.custom}</SegmentedControlItem>
          </SegmentedControl>
        </CardAction>
      </CardHeader>

      <div className="flex items-end justify-between gap-4 px-(--ui--panel-x) pt-(--ui--panel-y)">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-ui-lg font-medium">{given.label}</span>
          <span className="truncate text-ui text-fg-muted">{[given.detail, date].filter(Boolean).join(' · ')}</span>
        </div>
        <span className="shrink-0 text-3xl leading-none font-semibold tracking-tight tabular-nums">
          <bdi>{money(total)}</bdi>
        </span>
      </div>

      <div className="flex flex-col gap-2.5 px-(--ui--panel-x) pt-5" role="group" aria-label={copy.allocation}>
        <AllocationBar segments={segments} left={Math.max(0, gap) / scale} />
        <p id={statusId} role="status" data-slot="split-status" data-state={state} className={cn('text-ui font-medium tabular-nums', STATUS[state])}>
          <bdi>{status}</bdi>
        </p>
      </div>

      <div className="flex flex-col gap-1 px-(--ui--panel-x) pt-4 pb-(--ui--panel-y)">
        <div aria-hidden className={cn(ROW, 'text-ui-sm text-fg-muted')}>
          <span>{copy.category}</span>
          <span className="sm:col-start-3 text-end">{copy.amount}</span>
          <span className="text-end">{copy.percent}</span>
        </div>
        <ul className="flex flex-col gap-1">
          {rows.map((row) => {
            const category = byId.get(row.category)
            const name = category?.name ?? row.category
            const share = total > 0 ? row.minor / total : 0
            // Its own category and the ones no row has taken.
            const options = [category, ...free].filter((c) => c !== undefined)
            return (
              <li key={row.id} className={ROW}>
                <Select
                  value={row.category}
                  onValueChange={(value) => pick(row.id, value)}
                  items={options.map((c) => ({ value: c.id, label: c.name }))}
                >
                  <SelectTrigger variant="soft" aria-label={copy.categoryOf(name)} className="w-full ps-3">
                    <span aria-hidden className={cn('size-2.5 shrink-0 rounded-sm', FILL[category?.tone ?? TONES[0]!])} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TickMeter share={share} tone={category?.tone ?? TONES[0]!} />
                <NumberField
                  label={copy.amountOf(name)}
                  text={number.format(row.minor / unit)}
                  seed={plain.format(row.minor / unit)}
                  editable={editable}
                  sign={sign}
                  signFirst={signFirst}
                  onType={typeAmount(row.id)}
                />
                <NumberField
                  label={copy.percentOf(name)}
                  text={percentage.format(share * 100)}
                  seed={percentPlain.format(share * 100)}
                  editable={editable}
                  sign={percentSign}
                  onType={typePercent(row.id)}
                />
                <Button variant="ghost" size="icon" aria-label={copy.remove(name)} disabled={rows.length <= 2} onClick={() => remove(row.id)}>
                  <XIcon size={16} />
                </Button>
              </li>
            )
          })}
        </ul>
        <div className="pt-1">
          <Button variant="ghost" onClick={add} disabled={free.length === 0}>
            <PlusIcon size={16} />
            {copy.add}
          </Button>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <Button variant="secondary" onClick={cancel}>
          {copy.cancel}
        </Button>
        <AsyncButton
          onAction={async () => {
            await (onSave ? onSave(lines(rows)) : demo('SplitAllocation: onSave', 900))
          }}
          disabled={!complete}
          aria-describedby={statusId}
          pendingLabel={copy.saving}
          successLabel={copy.saved}
        >
          {copy.save}
        </AsyncButton>
      </footer>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-xl', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SplitAllocation, type SplitAllocationProps }
