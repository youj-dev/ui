'use client'

import { useEffect, useId, useLayoutEffect, useState, useRef, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { SeatMap, type SeatMapRow, type SeatMapTier } from '../../components/ui/seat-map'
import { useAnnouncer } from '../../hooks/use-announcer'
import { AISLES, DEFAULT_COPY, demo, FEE, HOLD, HOLD_LEFT, MAX_SEATS, PICKED, ROWS, TIERS, type SeatPlanCopy } from './seat-plan/data'
import { Selection } from './seat-plan/selection'
import { SeatPlanEmpty, SeatPlanError, SeatPlanLoading } from './seat-plan/states'
import { useVisible } from '../../hooks/use-visible'
import { cn, numberFormat } from '../../lib/utils'

/* Picking seats on a plan: the kit's SeatMap (the stage, rows bending round it
 * with aisles, seats tinted by tier, taken ones dimmed, picked ones
 * springing in with a check, a chip over whichever seat you point at or
 * focus) beside a live selection: each seat with its tier and price, the
 * fees and the total in mono, and the hold counting down, amber in
 * its last two minutes. When the hold runs out the seats go back on sale.
 * Tiers with no price show none (a plan of assigned seats has no sums), a
 * `fee` of 0 drops the fees line and `hold={null}` the timer. Loading, an
 * error with Retry and an empty plan take the plan's place at its size.
 * Confirming resolves through `onConfirm`. Reduced motion: every change is
 * drawn in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface SeatPlanProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the cards. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1152px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SeatPlanCopy>
  /** How its prices and counts read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The plan, row by row. Default: the demo's ten rows of fourteen. */
  rows?: SeatMapRow[]
  /** The tiers its seats belong to, in the key's order; a tier with no price shows none. Default: the demo's three. */
  tiers?: SeatMapTier[]
  /** Seat positions (counted along the row) after which an aisle runs. Default: after 3 and 11. */
  aisles?: number[]
  /** The word on the stage, or false for none. Default: the labels' "Stage". */
  stage?: string | false
  /** How many seats can be picked. Default 8. */
  max?: number
  /** Added per seat on top of its price; 0 for none. Default 2.5. */
  fee?: number
  /** Formats prices. Default: `copy.currency` in the locale. */
  format?: (price: number) => string
  /** Seconds a pick is held in all; `null` for no hold: no timer and no lapse. Default 600. */
  hold?: number | null
  /** Seats picked when the block mounts. Default: two in row F. */
  defaultPicked?: string[]
  /** Seconds left on the hold when the block mounts. Default 9:12. */
  holdLeft?: number
  /** Called with the picked seats; resolve when they are confirmed. Default: a short demo wait. */
  onConfirm?: (seats: string[]) => Promise<unknown> | unknown
  /** Skeletons in place of the plan, and its figures, while your seats load. Default false. */
  loading?: boolean
  /** Shown in place of the plan when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is no plan. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function SeatPlan({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  rows = ROWS,
  tiers = TIERS,
  aisles = AISLES,
  stage,
  max = MAX_SEATS,
  fee = FEE,
  format,
  hold = HOLD,
  defaultPicked = PICKED,
  holdLeft: holdLeftProp,
  onConfirm,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: SeatPlanProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy = { ...DEFAULT_COPY, ...copyProp, locale }
  const money = numberFormat(locale, { style: 'currency', currency: copy.currency })
  const formatPrice = format ?? ((value: number) => money.format(value))
  // A price of 0 is as good as none: the plan shows no "$0" beside a free seat.
  const planTiers = tiers.map((t) => (t.price ? t : { ...t, price: undefined }))
  const holdLeft = holdLeftProp ?? (hold === HOLD ? HOLD_LEFT : (hold ?? 0))
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [picked, setPicked] = useState(defaultPicked)
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const [left, setLeft] = useState(holdLeft)
  const timed = hold !== null
  const idle = loading || !!error

  // The hold runs while seats are picked; when it ends, they go back on sale.
  const holding = timed && picked.length > 0 && left > 0 && visible
  useEffect(() => {
    if (!holding) return
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [holding])
  const [lapses, setLapses] = useState(0)
  if (timed && left <= 0 && picked.length > 0) {
    setPicked([])
    setLapses((n) => n + 1)
  }
  const lapsed = useRef(() => announce(copy.expired))
  useLayoutEffect(() => {
    lapsed.current = () => announce(copy.expired)
  })
  useEffect(() => {
    if (lapses > 0) lapsed.current()
  }, [lapses])

  const pick = (next: string[]) => {
    // A fresh pick after the hold ran out starts a new hold.
    if (timed && left <= 0) setLeft(hold)
    setPicked(next)
  }

  const map = (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="py-7">
        {loading ? (
          <SeatPlanLoading copy={copy} />
        ) : error ? (
          <SeatPlanError message={error} onRetry={onRetry} copy={copy} />
        ) : rows.length === 0 ? (
          <SeatPlanEmpty empty={empty} copy={copy} />
        ) : (
          <SeatMap rows={rows} tiers={planTiers} aisles={aisles} stage={stage} value={picked} onValueChange={pick} max={max} currency={copy.currency} format={format} locale={locale} label={copy.map} />
        )}
      </CardContent>
      <CardFooter>
        <span>{copy.footnote}</span>
      </CardFooter>
    </Card>
  )

  // Its natural width: on the layout on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-288'
  const layout = (
    <div className={cn('grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_--spacing(88)]', !embedded && cap)}>
      {map}
      <div className="relative min-w-0 lg:min-h-96">
        <Selection
          picked={idle ? [] : picked}
          rows={rows}
          tiers={tiers}
          left={left}
          hold={hold}
          max={max}
          fee={fee}
          format={formatPrice}
          formatParts={format ? undefined : (value) => money.formatToParts(value)}
          loading={loading}
          error={!!error}
          onRemove={(id) => setPicked((list) => list.filter((p) => p !== id))}
          onClear={() => (setPicked([]), announce(copy.cleared))}
          onHold={() => setLeft(hold ?? 0)}
          onConfirm={() => (onConfirm ? onConfirm(picked) : demo('SeatPlan: onConfirm', 1200))}
          copy={copy}
          heading={embedded ? 'h3' : 'h2'}
        />
      </div>
      {announcer}
    </div>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
      {layout}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {layout}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SeatPlan, type SeatPlanProps }
export type { SeatPlanCopy, SeatMapRow as SeatPlanRow, SeatMapTier as SeatPlanTier }
