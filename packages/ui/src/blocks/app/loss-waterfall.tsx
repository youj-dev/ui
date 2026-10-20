'use client'

import { useId, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ChevronRightIcon } from '@youj/icons'
import { Counter } from '@youj/motion'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { DEFAULT_COPY, LOSSES, START, type LossWaterfallLoss, type LossWaterfallCopy } from './loss-waterfall/data'
import { Drawing } from './loss-waterfall/drawing'
import { biggestLoss, waterfallSteps } from './loss-waterfall/math'

/* A start amount worn down to a result, as an isometric waterfall (a day's
 * planned minutes, a gross pay, a funnel's visitors). The start stands as the
 * first bar, each loss hangs from where the one before left the level, and
 * what is left is the green bar at the end: the share that remains, big above
 * it with how it moved. The biggest loss is called out in your unit; pick
 * another in the legend (every loss is a button with its figure) and the callout moves
 * to it. The row under the drawing names where to look next for the picked
 * loss and calls `onDrill`. The drawing is an image whose text lists every
 * step. Reduced motion: the bars stand where they are.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface LossWaterfallProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<LossWaterfallCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Where it starts, in any unit: the first bar. */
  start?: number
  /** Formats a figure (the start, a loss, what is left). Default: the locale's number format; the unit lives in `copy.loss`, `copy.callout` and `copy.drawingLabel`. */
  format?: (value: number) => string
  /** The losses in the order they take time off. */
  losses?: LossWaterfallLoss[]
  /** How the result moved since the last period, in percentage points. Default 3.2; `null` hides it. */
  change?: number | null
  /** The loss picked at first (its `id`). Default: the biggest. */
  defaultSelected?: string
  /** Called with the loss when one is picked in the legend. */
  onLossChange?: (loss: LossWaterfallLoss) => void
  /** Called by the drill-in row, with the picked loss. */
  onDrill?: (loss: LossWaterfallLoss) => void
}

function LossWaterfall({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  start = START, format,
  losses = LOSSES,
  change = 3.2,
  defaultSelected,
  onLossChange,
  onDrill,
  className,
  ...rest
}: LossWaterfallProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [picked, setPicked] = useState(defaultSelected ?? biggestLoss(losses)?.id ?? '')
  const count = { format: format ?? numberFormat(locale).format }
  const points = numberFormat(locale, { signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const percent = numberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const { result, ratio } = waterfallSteps(start, losses)
  const loss = losses.find((l) => l.id === picked)

  const card = (
    <Card data-slot="loss-waterfall" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-sm')}>
      <header className="flex flex-col gap-1 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.subtitle}</p>
      </header>

      <div className="flex flex-col gap-4 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-baseline gap-1.5">
            <Counter value={ratio} format={{ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }} locale={locale} className="font-sans text-3xl leading-none font-semibold tracking-tight tabular-nums" />
            <span className="text-ui text-fg-muted">{copy.metric}</span>
          </span>
          {change !== null && (
            <Badge variant={change >= 0 ? 'success' : 'danger'} className="font-sans text-ui tracking-normal normal-case tabular-nums">
              {copy.change(points.format(change))}
            </Badge>
          )}
        </p>

        <Drawing
          start={start}
          losses={losses}
          selected={picked}
          label={copy.drawingLabel(
            count.format(start),
            losses.map((l) => copy.loss(l.label, count.format(l.value))).join(', '),
            count.format(result),
            percent.format(ratio),
          )}
          callout={loss ? copy.callout(count.format(loss.value)) : ''}
        />

        <ul aria-label={copy.legendLabel} className="-mx-2 flex flex-wrap gap-x-1 gap-y-0.5">
          {losses.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                aria-pressed={picked === l.id}
                onClick={() => {
                  setPicked(l.id)
                  onLossChange?.(l)
                }}
                className="focus-ring inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-ui tabular-nums transition-colors yj-duration-fast ease-standard hover:bg-hover aria-pressed:bg-selected"
              >
                <span aria-hidden className="size-2 rounded-xs" style={{ background: toneColor(l.tone) }} />
                <span className="text-fg-muted">{l.label}</span>{' '}
                <span className="font-medium">{count.format(l.value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line">
        {/* One row, whichever loss is picked: title and detail keep their line. */}
        <button
          type="button"
          disabled={!loss?.drill}
          onClick={() => loss && onDrill?.(loss)}
          className="focus-ring flex w-full items-center justify-between gap-3 px-(--ui--panel-x) py-(--ui--panel-foot-y) text-start transition-colors yj-duration-fast ease-standard enabled:hover:bg-hover"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-ui font-medium">{loss?.drill?.title ?? loss?.label}</span>
            <span className="truncate text-ui-sm text-fg-muted tabular-nums">{loss?.drill?.detail ?? ''}</span>
          </span>
          <ChevronRightIcon aria-hidden size={16} className="shrink-0 text-fg-muted rtl:-scale-x-100" />
        </button>
      </div>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-sm', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LossWaterfall, type LossWaterfallProps }
export type { LossWaterfallLoss, LossWaterfallCopy }
