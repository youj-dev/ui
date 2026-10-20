'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { SparkleIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { CoverageMatrix } from '../../components/ui/coverage-matrix'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  COLUMNS,
  DEFAULT_COPY,
  ROWS,
  demo,
  type CoverageGridColumn,
  type CoverageGridCopy,
  type CoverageGridRow,
  type CoverageGridTone,
} from './coverage-grid/data'

/* Where coverage is thin: a CoverageMatrix of rows down the side and columns
 * across the top, each cell filled by how deep the coverage goes in its
 * column's color, and hatched where there is none. The head counts the
 * covered cells. Picking a row (a click, or Enter on one of its cells) turns
 * its gaps red and points the foot at it: how many gaps it has, with a draft
 * button for them and Review gaps. Drafting awaits `onDraft`, then says the
 * drafts go live once reviewed; the matrix keeps the live ones only. The
 * demo is detection rules by tactic and source; tests by app area and kind,
 * or sessions by topic and format, are the same card. Loading, an error with
 * Retry and an empty grid take the matrix's place at its size.
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the fills are drawn in place. */

interface CoverageGridProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CoverageGridCopy>
  /** Formats the counts (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The columns: where the coverage comes from. */
  columns?: CoverageGridColumn[]
  /** The rows, each with its depth per column. */
  rows?: CoverageGridRow[]
  /** The depth that fills a cell. Default: the most any cell has. */
  maxDepth?: number
  /** Skeletons in place of the matrix and the foot's line while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the matrix when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is nothing to draw. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** The row the foot is about (its id), when your app owns it. */
  row?: string
  /** The row picked at first. Default: the one with the most gaps. */
  defaultRow?: string
  onRowChange?: (id: string) => void
  /** Drafts what's missing for a row's gaps (the columns with none); the card awaits it. */
  onDraft?: (row: CoverageGridRow, gaps: CoverageGridColumn[]) => Promise<unknown> | unknown
  /** Opens the gaps for review. */
  onReview?: (row: CoverageGridRow, gaps: CoverageGridColumn[]) => void
}

/** The matrix's room while it is not drawn: what eight rows take, so the card keeps its size. */
const ROOM = 'h-110'

function CoverageGrid({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  columns = COLUMNS,
  rows = ROWS,
  maxDepth,
  loading = false,
  error,
  onRetry,
  empty,
  row: rowProp,
  defaultRow,
  onRowChange,
  onDraft,
  onReview,
  ...rest
}: CoverageGridProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const count = numberFormat(locale)
  const gapsOf = (r: CoverageGridRow) => columns.filter((_, i) => !(r.depth[i] ?? 0))
  const mostGaps = rows.reduce<CoverageGridRow | undefined>((best, r) => (!best || gapsOf(r).length > gapsOf(best).length ? r : best), undefined)
  const [picked, setPicked] = useControllableState(rowProp, defaultRow ?? mostGaps?.id ?? '')
  const [drafted, setDrafted] = useState<ReadonlySet<string>>(new Set())
  const blank = loading || !!error || rows.length === 0 || columns.length === 0
  const current = blank ? undefined : (rows.find((r) => r.id === picked) ?? mostGaps)
  const gaps = current ? gapsOf(current) : []
  const total = rows.length * columns.length
  const covered = rows.reduce((sum, r) => sum + (columns.length - gapsOf(r).length), 0)
  const done = current ? drafted.has(current.id) : false

  const draft = async () => {
    if (!current || !gaps.length) return
    await (onDraft ? onDraft(current, gaps) : demo('CoverageGrid: onDraft', 900))
    setDrafted((prev) => new Set(prev).add(current.id))
    announce(copy.drafted(gaps.length, current.label))
  }

  const body = loading ? (
    <div className={cn(ROOM, 'flex flex-col gap-3')}>
      <span className="sr-only">{copy.loadingLabel}</span>
      <div className="h-20 shrink-0" />
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} className="flex flex-1 items-center gap-3">
          <Skeleton className="h-3.5 w-28 shrink-0" />
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: columns.length || 6 }, (_, c) => (
              <Skeleton key={c} className="h-8 flex-1" />
            ))}
          </div>
        </div>
      ))}
      <div className="h-6 shrink-0" />
    </div>
  ) : error ? (
    <div className={cn(ROOM, 'grid place-items-center')}>
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
  ) : rows.length === 0 || columns.length === 0 ? (
    <div className={cn(ROOM, 'grid')}>
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  ) : (
    <CoverageMatrix
      label={copy.matrixLabel}
      columns={columns.map((c) => ({ id: c.id, label: c.label, tone: c.tone }))}
      rows={rows.map((r) => ({ id: r.id, label: r.label, values: r.depth }))}
      max={maxDepth}
      value={current?.id ?? null}
      onValueChange={(id) => {
        setPicked(id)
        onRowChange?.(id)
      }}
      formatValue={copy.depth}
      noneLabel={copy.noDepth}
      depthLabel={copy.depthLabel}
      locale={locale}
    />
  )

  const card = (
    <Card data-slot="coverage-grid" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <Badge variant="secondary" size="lg" className="font-mono tabular-nums">
            {loading ? (
              <Skeleton className="h-3.5 w-12" />
            ) : blank ? (
              <span className="text-fg-subtle">—</span>
            ) : (
              <>
                <span aria-hidden>{copy.coveredCount(count.format(covered), count.format(total))}</span>
                <span className="sr-only">{copy.coveredName(count.format(covered), count.format(total))}</span>
              </>
            )}
          </Badge>
        </CardAction>
      </CardHeader>

      <div className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">{body}</div>

      <footer className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <div aria-live="polite" className="flex min-h-10 items-start gap-2.5 text-ui text-fg">
          {(loading || current) && <SparkleIcon aria-hidden size={16} className="mt-0.5 shrink-0 text-accent-text" />}
          {loading ? (
            <span className="flex flex-1 flex-col gap-2 pt-0.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </span>
          ) : (
            <span>
              {!current
                ? null
                : done
                  ? copy.drafted(gaps.length, current.label)
                  : gaps.length
                    ? copy.suggestion(gaps.length, current.label)
                    : copy.noGaps(current.label)}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <AsyncButton
            className="flex-1"
            disabled={!gaps.length || done}
            onAction={draft}
            pendingLabel={copy.drafting}
            successLabel={copy.draftDone}
            errorLabel={(error) => (error instanceof Error && error.message ? error.message : copy.failed)}
          >
            {done ? copy.draftDone : current ? copy.draft(gaps.length) : copy.draftIdle}
          </AsyncButton>
          <Button variant="secondary" className="flex-1" disabled={!gaps.length} onClick={() => current && onReview?.(current, gaps)}>
            {copy.review}
          </Button>
        </div>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
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

export { CoverageGrid, type CoverageGridProps }
export type { CoverageGridColumn, CoverageGridCopy, CoverageGridRow, CoverageGridTone }
