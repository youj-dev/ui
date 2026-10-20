'use client'

import { useId, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { CloudUploadIcon, MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { ProgressList, TransferSummary, type TransferFormat } from '../../components/ui/progress-list'
import { Skeleton } from '../../components/ui/skeleton'
import { DEFAULT_COPY, ITEMS, formatBytes, type TransferListCopy, type TransferListItem } from './transfer-list/data'
import { RowsPlaceholder, SummaryPlaceholder } from './transfer-list/placeholder'
import { useTransfers } from './transfer-list/use-transfers'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'

/* A panel for transfers in flight, as an instrument: the amount moved of the
 * whole in mono, an overall meter in cells, the combined rate and time left,
 * then a row per item (ProgressList) with its own cells, live rate and ETA,
 * and pause, resume or cancel. A finished item settles into a compact done
 * row with a drawn check and sinks to the foot; the failed one says why and
 * offers Retry; past six rows the rest fold under "Show N more". The footer
 * pauses, resumes or cancels everything. Files in a sync in the demo; tables
 * between databases or renders being exported read the same through
 * `format`. Loading, an error with Retry and an empty list take the rows'
 * place at the card's size. The demo moves the amounts on a timer
 * (`useTransfers`); swap it for your uploader's state. The card softens the
 * list's instrument look through its slots (SOFT). Reduced motion: cells
 * light at once and rows settle in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

interface TransferListProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<TransferListCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The transfers to start with. Default: fourteen demo files mid-sync. */
  items?: TransferListItem[]
  /** Writes sizes and rates in your unit (rows, frames…); a size is the item's `size` or `transferred`, a rate its amount a second. Default: decimal bytes in the locale ("48.2 MB", "2.9 MB/s"). */
  format?: TransferFormat
  /** Skeletons in place of the rows and figures while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the rows when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is nothing to show. Default: `copy.emptyTitle` and `copy.emptyBody`. */
  empty?: ReactNode
  /** Rows shown before the rest fold away. Default 6. */
  max?: number
  /** Classes for its parts: `card` holds the block's size (831px tall at 100%; the rows scroll inside it, so files settling, unfolding or leaving never resize it). */
  classNames?: { card?: string }
}

/* The calmer finish the card puts on ProgressList and TransferSummary through
 * their slots: names and figures in the text face, each meter one smooth
 * rounded bar (its cells butted together) instead of a run of blocks, rows
 * parted by hairlines rather than boxed, and the rate and time left as plain
 * figures, not wells. */
const SOFT = cn(
  '[&_[data-slot=progress-list-name]]:font-sans [&_[data-slot=progress-list-name]]:font-medium',
  '[&_[data-slot=progress-list-value]]:font-sans [&_[data-slot=progress-list-meta]]:font-sans [&_[data-slot=progress-list-meta]]:tabular-nums',
  '[&_[data-slot=progress-list-track]]:h-1.5 [&_[data-slot=progress-list-track]]:gap-0 [&_[data-slot=progress-list-track]]:overflow-hidden [&_[data-slot=progress-list-track]]:rounded-full',
  // The track carries the empty part; each lit cell overlaps the next by a pixel, so they read as one bar with no seams.
  '[&_[data-slot=progress-list-track]]:bg-well [&_[data-slot=progress-list-cell]]:-me-px [&_[data-slot=progress-list-cell]]:rounded-none [&_[data-slot=progress-list-cell][data-state=off]]:bg-transparent',
  // Rows sit on the card, parted by hairlines, instead of each in its own well.
  '[&_[data-slot=progress-list-row]]:rounded-none [&_[data-slot=progress-list-row]]:bg-transparent [&_[data-slot=progress-list-row]]:px-0 [&_[data-slot=progress-list-row]]:shadow-[inset_0_-1px_0_var(--color-line-subtle)]',
  '[&_[data-slot=transfer-summary-figure]]:font-sans [&_[data-slot=transfer-summary-figure]]:font-medium',
  '[&_[data-slot=segmented-meter-track]]:h-2 [&_[data-slot=segmented-meter-track]]:gap-0 [&_[data-slot=segmented-meter-track]]:overflow-hidden [&_[data-slot=segmented-meter-track]]:rounded-full',
  '[&_[data-slot=segmented-meter-track]]:bg-well [&_[data-slot=segmented-meter-cell]]:-me-px [&_[data-slot=segmented-meter-cell]]:rounded-none [&_[data-slot=segmented-meter-cell][data-state=off]]:bg-transparent',
  '[&_[data-slot=transfer-summary-stat]]:justify-start [&_[data-slot=transfer-summary-stat]]:bg-transparent [&_[data-slot=transfer-summary-stat]]:px-0 [&_[data-slot=transfer-summary-stat]]:py-0',
  '[&_[data-slot=transfer-summary-stat]_dd]:font-sans [&_[data-slot=transfer-summary-stat]_dd]:text-ui',
  // Labels in sentence case, whatever the theme's label voice.
  '[&_:is([data-slot=transfer-summary-stat]_dt,[data-slot=segmented-meter-label])]:font-sans [&_:is([data-slot=transfer-summary-stat]_dt,[data-slot=segmented-meter-label])]:tracking-normal [&_:is([data-slot=transfer-summary-stat]_dt,[data-slot=segmented-meter-label])]:normal-case',
)

function TransferList({ theme, embedded = true, fill = false, copy: copyProp, locale, items: initial = ITEMS, format, loading = false, error, onRetry, empty, max = 6, classNames, className, ...rest }: TransferListProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const t = useTransfers(
    initial.map((f) => (f.status === 'failed' && !f.error ? { ...f, error: copy.connectionReset } : f)),
    visible && !loading && !error,
  )
  const size = t.files.reduce((sum, f) => sum + f.size, 0)
  const active = t.files.filter((f) => f.status === 'active').length
  const queued = t.files.filter((f) => f.status === 'queued').length
  const paused = t.files.some((f) => f.status === 'paused')
  const open = !loading && !error && t.files.some((f) => f.status !== 'done')
  const waiting = loading || Boolean(error)

  const card = (
    // A fixed height: the rows scroll in what the header, the totals and the footer leave.
    <Card className={cn('h-207.75 w-full text-fg', SOFT, !embedded && !fill && 'max-w-160', classNames?.card)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">
          {loading ? <Skeleton className="inline-block h-4 w-32 align-middle" /> : error ? <span className="text-fg-subtle">—</span> : copy.subtitle(t.files.length, format?.size ? format.size(size) : formatBytes(size, copy.locale))}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      {waiting ? (
        <>
          <CardContent aria-label={copy.overall} role="group">
            <SummaryPlaceholder loading={loading} />
          </CardContent>
          <CardContent className="-my-1 min-h-0 flex-1 overflow-hidden py-1">
            {loading ? (
              <RowsPlaceholder label={copy.loadingLabel} />
            ) : (
              <div className="flex h-full flex-col justify-center">
                <Alert variant="danger">
                  <AlertDescription>{error}</AlertDescription>
                  {onRetry && (
                    <AlertAction>
                      <Button size="sm" variant="outline" onClick={onRetry}>
                        {copy.retry}
                      </Button>
                    </AlertAction>
                  )}
                </Alert>
              </div>
            )}
          </CardContent>
        </>
      ) : t.files.length > 0 ? (
        <>
          <CardContent aria-label={copy.overall} role="group">
            <TransferSummary items={t.files} locale={copy.locale} format={format} />
          </CardContent>
          <CardContent className="-my-1 min-h-0 flex-1 overflow-y-auto py-1 yj-scrollbar">
            <ProgressList
              items={t.files}
              max={max}
              locale={copy.locale}
              format={format}
              label={copy.items}
              onPause={t.pause}
              onResume={t.resume}
              onCancel={t.cancel}
              onRetry={t.retry}
            />
          </CardContent>
        </>
      ) : (
        <CardContent className="flex flex-1 flex-col">
          {empty ?? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CloudUploadIcon />
                </EmptyMedia>
                <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                <EmptyDescription>{copy.emptyBody}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      )}

      <CardFooter className="flex-wrap justify-end">
        <span className="me-auto basis-full text-ui-sm text-fg-muted tabular-nums sm:basis-auto">{loading ? <Skeleton className="h-4 w-28" /> : error ? <span className="text-fg-subtle">—</span> : open ? copy.status(active, queued) : copy.settled}</span>
        <Button variant="secondary" disabled={!open} onClick={t.cancelAll}>
          {copy.cancelAll}
        </Button>
        {active + queued > 0 || !paused ? (
          <Button disabled={waiting || active + queued === 0} onClick={t.pauseAll}>
            {copy.pauseAll}
          </Button>
        ) : (
          <Button onClick={t.resumeAll}>{copy.resumeAll}</Button>
        )}
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { TransferList, type TransferListProps }
export type { TransferListCopy, TransferListItem }
