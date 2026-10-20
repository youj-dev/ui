'use client'

import { useId, useMemo, type CSSProperties, type HTMLAttributes } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PlusIcon, XIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { RadarChart, type RadarChartAxis, type RadarChartTone } from '../../components/ui/radar-chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Switch } from '../../components/ui/switch'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  AXES,
  DEFAULT_COPY,
  ITEMS,
  SPECS,
  START,
  type CompareItem,
  type CompareItemsCopy,
  type CompareSpec,
} from './compare-items/data'
import { SpecsTable } from './compare-items/specs-table'

/* Two to four things side by side. A picker heads each column and its swatch
 * is that thing's color on the radar; the radar shows where each is strong,
 * and the overview under it lines every spec up by column: text, numbers with
 * their unit, Yes and No badges. "Highlight best" marks the best value in each
 * row that has one (the lower price, the longer context, the Yes that others
 * lack) with a dot in the column's color and the rest quieter; a tie marks
 * nothing. Columns are added from the items not yet picked and removed down to
 * two. The block keeps its height whatever is picked.
 * Wire `value` (or `onValueChange`) to your own state to keep the picks.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded, it keeps its natural width unless `fill`. Reduced motion: the
 * radar is drawn in place. */

const TONES: RadarChartTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4']

interface CompareItemsProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (896px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CompareItemsCopy>
  /** Formats numbers (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Everything that can be picked. */
  items?: CompareItem[]
  /** The radar's axes. Every item scores on each, 0 to 100. */
  axes?: RadarChartAxis[]
  /** The rows of the overview. */
  specs?: CompareSpec[]
  /** The ids picked, in column order (controlled). Two to `maxItems`. */
  value?: string[]
  /** The ids it opens with (uncontrolled). Default: the first three items. */
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Whether the best value in each row is marked (controlled). */
  highlight?: boolean
  /** Whether it opens with the best marked. Default false. */
  defaultHighlight?: boolean
  onHighlightChange?: (highlight: boolean) => void
  /** The most columns. Default 4, the most there are colors for. */
  maxItems?: 2 | 3 | 4
}

function CompareItems({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  items = ITEMS,
  axes = AXES,
  specs = SPECS,
  value: valueProp,
  defaultValue,
  onValueChange,
  highlight: highlightProp,
  defaultHighlight = false,
  onHighlightChange,
  maxItems = 4,
  className,
  ...rest
}: CompareItemsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [ids, setIds] = useControllableState(valueProp, defaultValue ?? START.filter((id) => items.some((item) => item.id === id)))
  const [highlight, setHighlight] = useControllableState(highlightProp, defaultHighlight)

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const picks = ids.flatMap((id) => byId.get(id) ?? [])
  const free = items.filter((item) => !ids.includes(item.id))
  const tones = new Map(picks.map((pick, i) => [pick.id, TONES[i % TONES.length]!]))
  const numbers = (spec: CompareSpec) => numberFormat(copy.locale, spec.format)

  const commit = (next: string[]) => {
    setIds(next)
    onValueChange?.(next)
  }
  const swap = (index: number, id: string | null) => {
    if (id) commit(ids.map((current, i) => (i === index ? id : current)))
  }
  const add = () => {
    if (free[0] && ids.length < maxItems) commit([...ids, free[0].id])
  }
  const remove = (index: number) => commit(ids.filter((_, i) => i !== index))
  const light = (next: boolean) => {
    setHighlight(next)
    onHighlightChange?.(next)
  }

  const series = picks.map((pick) => ({ id: pick.id, name: pick.name, values: axes.map((axis) => pick.scores[axis.id] ?? 0), tone: tones.get(pick.id) }))
  const layout = { '--compare-items-n': picks.length } as CSSProperties

  const card = (
    <Card
      className={cn(
        'w-full gap-0 overflow-hidden py-0 text-fg [--compare-items-label:5.5rem] sm:[--compare-items-label:9rem]',
        !embedded && !fill && 'max-w-4xl',
      )}
      style={layout}
    >
      <CardHeader className="pt-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        <CardAction>
          <label className="flex h-control shrink-0 items-center gap-2.5 text-ui">
            <Switch size="sm" checked={highlight} onCheckedChange={light} />
            {copy.highlightBest}
          </label>
        </CardAction>
      </CardHeader>

      <div
        role="group"
        aria-label={copy.models}
        data-slot="compare-items-pickers"
        className="grid grid-cols-[var(--compare-items-label)_repeat(var(--compare-items-n),minmax(0,1fr))] items-center px-(--ui--panel-x) pt-(--ui--panel-y)"
      >
        <div>
          {picks.length < maxItems && (
            <Button variant="ghost" className="-ms-2" onClick={add} disabled={free.length === 0}>
              <PlusIcon size={16} />
              {copy.add}
            </Button>
          )}
        </div>
        {picks.map((pick, i) => {
          const options = [pick, ...free]
          return (
            <div key={i} data-slot="compare-items-picker" className="flex min-w-0 items-center gap-1 pe-2">
              <Select value={pick.id} onValueChange={(next) => swap(i, next)} items={options.map((o) => ({ value: o.id, label: o.name }))}>
                <SelectTrigger
                  variant="soft"
                  aria-label={copy.pickerOf(i + 1)}
                  className="w-full min-w-0 ps-2.5"
                >
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--color-${tones.get(pick.id)})` }} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {picks.length > 2 && (
                <Button variant="ghost" size="icon" aria-label={copy.remove(pick.name)} onClick={() => remove(i)}>
                  <XIcon size={16} />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="-mt-3 px-(--ui--panel-x)">
        <RadarChart axes={axes} series={series} max={100} label={copy.chart} locale={copy.locale} legend={false} />
      </div>

      <div className="flex flex-col gap-1 px-(--ui--panel-x) pb-(--ui--panel-y)">
        <h3 className="text-ui font-medium">{copy.overview}</h3>
        <SpecsTable picks={picks} specs={specs} tones={new Map([...tones].map(([id, tone]) => [id, `var(--color-${tone})`]))} highlight={highlight} copy={copy} formatNumber={numbers} />
      </div>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-4xl', className)}>
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

export { CompareItems, type CompareItemsProps }
export type { CompareItem, CompareItemsCopy, CompareSpec }
