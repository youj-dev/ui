'use client'

import { type ComponentProps, useId, useMemo, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter } from '@youj/motion'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card } from '../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { cn, numberFormat } from '../../lib/utils'
import { candidatesFor, DEFAULT_COPY, GROUPS, THRESHOLD, demo, type CheckGateCandidate, type CheckGateCopy, type CheckGateGroup, type CheckGateFilter } from './check-gate/data'
import { CandidateHistory } from './check-gate/candidate-history'
import { GroupList } from './check-gate/group-list'

/* The checks that gate a candidate before it goes through: a mobile build
 * in the demo, a loan application or a site inspection just as well. What
 * it is and when its checks ran sit in the head, with a status pill that
 * counts the groups under the bar. The history leads: the candidate's pass
 * rate (a Counter), how far it moved from the one before and its check
 * count, beside the last candidates as lollipops against the bar (hollow
 * heads for those that fell under it, the candidate as a target). Then
 * every group as a bullet row; the All / Blocking control filters them to
 * the ones under the bar, and Review blockers jumps there. The last button
 * runs on Button onAction; swap the demo `wait` with `onPromote`. Stems and
 * fills grow as they scroll into view.
 * It is built for the compact layout density (ui.css), taken from the page: one band
 * rhythm with Card's; embedded, it keeps its natural width unless `fill`.
 * Reduced motion: drawn in place. */

interface CheckGateProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2` (its parts by `h3`s), without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CheckGateCopy>
  /** The last candidates, oldest first; the latest is the candidate. Default: demo history, with the candidate's rate taken from `groups`. */
  candidates?: CheckGateCandidate[]
  /** The candidate's groups of checks. */
  groups?: CheckGateGroup[]
  /** The pass rate a candidate has to reach to go through, 0–100. Default 97. */
  threshold?: number
  /** Puts the candidate through; resolve when it's done. Default: a short demo wait. */
  onPromote?: () => Promise<unknown> | unknown
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

function CheckGate({ theme, embedded = true, fill = false, copy: copyProp, candidates: candidatesProp, groups = GROUPS, threshold = THRESHOLD, onPromote, locale, className, ...rest }: CheckGateProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const candidates = candidatesProp ?? candidatesFor(groups)
  const titleId = useId()
  const groupsId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const SectionTitle = embedded ? 'h3' : 'h2'
  const [filter, setFilter] = useState<CheckGateFilter>('all')
  const percent = useMemo(() => numberFormat(copy.locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format, [copy.locale])
  const points = useMemo(
    () => numberFormat(copy.locale, { signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format,
    [copy.locale],
  )
  const count = useMemo(() => numberFormat(copy.locale).format, [copy.locale])

  const latest = candidates[candidates.length - 1]?.rate ?? 0
  const before = candidates[candidates.length - 2]
  const change = latest - (before?.rate ?? latest)
  const under = groups.filter((g) => (g.total ? (100 * g.passed) / g.total : 0) < threshold)
  const failures = groups.reduce((sum, g) => sum + g.total - g.passed, 0)
  const checks = groups.reduce((sum, g) => sum + g.total, 0)
  const listed = filter === 'blocking' ? under : groups

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-3xl')}>
      <header className="flex flex-wrap items-start gap-x-4 gap-y-3 px-(--ui--panel-x) py-(--ui--panel-head-y)">
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {copy.title}
          </Title>
          <p className="truncate text-ui text-fg-muted">
            {copy.subject} · {copy.ran}
          </p>
        </div>
        {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
        <Badge dir="auto" variant={under.length ? 'warning' : 'success'} size="lg" className="font-sans text-ui tracking-normal normal-case">
          {under.length ? copy.blockingCount(under.length) : copy.clear}
        </Badge>
      </header>

      <div className="grid gap-5 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) sm:grid-cols-[--spacing(44)_minmax(0,1fr)] sm:gap-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-ui-sm text-fg-muted">
            {copy.passRate}
          </span>
          <Counter value={latest / 100} format={{ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }} locale={copy.locale} className="font-sans text-4xl leading-none font-semibold tracking-tight tabular-nums" />
          {before && <span dir="auto" className={cn('mt-1 self-start text-ui tabular-nums', change >= 0 ? 'text-success-text' : 'text-danger-text')}>{copy.delta(points(change), before.id)}</span>}
          <span dir="auto" className="self-start text-ui text-fg-muted tabular-nums">{copy.checks(count(checks - failures), count(checks))}</span>
        </div>
        <CandidateHistory candidates={candidates} threshold={threshold} copy={copy} percent={percent} />
      </div>

      <section aria-labelledby={groupsId} className="flex flex-col gap-2 border-t border-line px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle id={groupsId} className="text-ui-sm font-normal text-fg-muted">
            {copy.groups}
          </SectionTitle>
          <SegmentedControl size="sm" aria-label={copy.filter} value={filter} onValueChange={(next) => setFilter(next as CheckGateFilter)}>
            <SegmentedControlItem value="all">{copy.all}</SegmentedControlItem>
            <SegmentedControlItem value="blocking">{copy.blocking}</SegmentedControlItem>
          </SegmentedControl>
        </div>
        {/* Every group's height at 100%: Blocking's shorter list never resizes the card. */}
        <div className="-mx-1 h-88.5 overflow-y-auto px-1 yj-scrollbar">
          <GroupList groups={listed} threshold={threshold} copy={copy} previous={before?.id ?? ''} percent={percent} points={points} />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <Button variant="secondary" disabled={!under.length} onClick={() => setFilter('blocking')}>
          {copy.review(under.length)}
        </Button>
        <AsyncButton onAction={() => (onPromote ? onPromote() : demo('CheckGate: onPromote', 1200))} pendingLabel={copy.promoting} successLabel={copy.promoted}>
          {copy.promote}
        </AsyncButton>
      </footer>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CheckGate, type CheckGateProps }
export type { CheckGateCandidate, CheckGateCopy, CheckGateFilter, CheckGateGroup }
