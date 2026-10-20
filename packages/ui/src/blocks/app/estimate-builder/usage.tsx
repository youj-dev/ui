'use client'

import { useId, type ReactNode } from 'react'
import { Slider } from '../../../components/ui/slider'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat, toneColor } from '../../../lib/utils'
import type { EstimateBuilderCopy, EstimateBuilderLine, EstimateBuilderUsage } from './data'

/* The usage, a line each: its name and amount, a ruler of ticks lit in the
 * line's color up to the amount, and what it costs for the billing period
 * with the unit price under it. Pointing at a line lights its part of the bar above. The
 * preset switch sits at the head, with which preset the lines match (or
 * Custom once a ruler moves). On a narrow card the ruler drops under the
 * name and cost, so it keeps its width. */

interface UsageProps {
  lines: readonly EstimateBuilderLine[]
  usage: EstimateBuilderUsage
  onUsageChange: (id: string, value: number) => void
  /** Each line's cost for the billing period, by id. */
  costs: Record<string, number>
  /** The region's factor on every price. */
  factor: number
  presetName: string | null
  presetControl: ReactNode
  onActiveChange: (index: number | null) => void
  copy: EstimateBuilderCopy
  locale: string
  amountOptions: Intl.NumberFormatOptions
  unitPriceOptions: Intl.NumberFormatOptions
  heading: 'h2' | 'h3'
}

export function Usage({
  lines,
  usage,
  onUsageChange,
  costs,
  factor,
  presetName,
  presetControl,
  onActiveChange,
  copy,
  locale,
  amountOptions,
  unitPriceOptions,
  heading: Heading,
}: UsageProps) {
  const headingId = useId()
  const count = numberFormat(locale, { maximumFractionDigits: 1 })
  const money = numberFormat(locale, amountOptions)
  const unitPrice = numberFormat(locale, unitPriceOptions)

  return (
    <section aria-labelledby={headingId} className="@container/usage flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading id={headingId} className="text-ui-lg font-medium text-fg">
            {copy.usage}
          </Heading>
          <Eyebrow>{presetName ? copy.preset(presetName) : copy.custom}</Eyebrow>
        </div>
        {presetControl}
      </div>
      <ul className="flex flex-col divide-y divide-line" onPointerLeave={() => onActiveChange(null)}>
        {lines.map((line, i) => {
          const value = usage[line.id] ?? line.min
          return (
            <li
              key={line.id}
              data-slot="estimate-builder-line"
              onPointerEnter={() => onActiveChange(i)}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2.5',
                '@md/usage:grid-cols-[calc(var(--spacing)*34)_minmax(0,1fr)_calc(var(--spacing)*24)]',
              )}
            >
              <div className="col-start-1 row-start-1 flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 items-center gap-2 text-ui text-fg">
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: toneColor(line.tone) }} />
                  <span className="truncate">{line.label}</span>
                </span>
                <Eyebrow className="ps-4 tabular-nums">
                  {count.format(value)} {line.unit}
                </Eyebrow>
              </div>
              <Slider
                variant="ticks"
                tone={line.tone}
                ticks={line.ticks}
                min={line.min}
                max={line.max}
                step={line.step}
                value={value}
                onValueChange={(next) => onUsageChange(line.id, next as number)}
                aria-label={line.label}
                getAriaValueText={(_, v) => `${count.format(v)} ${line.unit}`}
                onFocus={() => onActiveChange(i)}
                className="col-span-2 row-start-2 @md/usage:col-span-1 @md/usage:col-start-2 @md/usage:row-start-1"
              />
              <div className="col-start-2 row-start-1 flex flex-col items-end gap-0.5 @md/usage:col-start-3">
                <span className="font-mono text-ui text-fg tabular-nums">{money.format(costs[line.id] ?? 0)}</span>
                <Eyebrow className="whitespace-nowrap tabular-nums">{copy.unitPrice(unitPrice.format(line.price * factor), line.priceUnit)}</Eyebrow>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
