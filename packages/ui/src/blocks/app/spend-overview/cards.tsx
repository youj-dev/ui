'use client'

import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatBars, StatDelta, StatMeter, StatValue } from '../../../components/ui/stat-card'
import { initials, numberFormat } from '../../../lib/utils'
import type { SpendBilling, SpendMember, SpendOverviewCopy, SpendPersonal } from './data'
import { Panel } from './panel'

interface CardProps {
  copy: SpendOverviewCopy
  locale: string
  currency: string
  loading?: boolean
  onOpen?: () => void
}

/** A figure and its line under it, or their skeletons. */
function Figure({ loading, children }: { loading?: boolean; children: ReactNode }) {
  return loading ? <Skeleton className="h-9 w-32" /> : <>{children}</>
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 text-ui">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

/** The signed-in member's own spend: the figure, its change, the days as mini bars, their counts and the personal limit as a meter. */
function PersonalCard({ copy, locale, currency, loading, onOpen, personal }: CardProps & { personal: SpendPersonal }) {
  const money = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
  const count = numberFormat(locale)
  const compact = numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
  const change = personal.previous > 0 ? (personal.spend - personal.previous) / personal.previous : undefined
  return (
    <Panel title={copy.personal} description={copy.personalSub} onOpen={onOpen} openLabel={copy.open(copy.personal.toLowerCase())}>
      <div className="flex flex-col gap-1">
        <Figure loading={loading}>
          <StatValue value={personal.spend} from={personal.spend} format={{ style: 'currency', currency }} locale={locale} />
          {change !== undefined && (
            <StatDelta value={change} invert locale={locale}>
              {copy.change(copy.lastPeriod)}
            </StatDelta>
          )}
        </Figure>
      </div>
      {loading ? <Skeleton className="h-10 w-full" /> : <StatBars data={personal.daily} label={copy.personalBars} className="h-10" />}
      <dl className="flex flex-col divide-y divide-line border-y border-line">
        <Row label={copy.requestsLabel} value={loading ? '–' : count.format(personal.requests)} />
        <Row label={copy.tokensLabel} value={loading ? '–' : compact.format(personal.tokens)} />
      </dl>
      <StatMeter value={personal.spend} max={personal.limit} locale={locale} className="mt-0">
        {copy.personalLimit(money.format(personal.limit))}
      </StatMeter>
    </Panel>
  )
}

/** The members spending the most, with what the average member spends under them. */
function LeaderboardCard({ copy, locale, currency, loading, onOpen, members, average }: CardProps & { members: SpendMember[]; average: number }) {
  const money = numberFormat(locale, { style: 'currency', currency })
  return (
    <Panel title={copy.leaderboard} description={copy.leaderboardSub} onOpen={onOpen} openLabel={copy.open(copy.leaderboard.toLowerCase())}>
      <ol className="flex flex-col divide-y divide-line">
        {!loading && members.length === 0 && <li className="py-2.5 text-ui text-fg-muted">{copy.emptyMembers}</li>}
        {loading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="py-2.5">
                <Skeleton className="h-8 w-full" />
              </li>
            ))
          : members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar>
                  <AvatarFallback>{initials(m.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-ui font-medium">{m.name}</span>
                <span className="text-ui tabular-nums">{money.format(m.spend)}</span>
              </li>
            ))}
      </ol>
      <dl className="mt-auto flex flex-col border-t border-line">
        <Row label={copy.average} value={loading ? '–' : money.format(average)} />
      </dl>
    </Panel>
  )
}

/** Credit left to spend and how much of the workspace limit the month has used. */
function BillingCard({
  copy,
  locale,
  currency,
  loading,
  onOpen,
  billing,
  spent,
  limit,
  resets,
}: CardProps & { billing: SpendBilling; spent: number; limit: number; resets: string }) {
  const money = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
  return (
    <Panel title={copy.billing} description={copy.billingSub} onOpen={onOpen} openLabel={copy.open(copy.billing.toLowerCase())}>
      <div className="flex flex-col gap-1">
        <span className="text-ui text-fg-muted">{copy.credit}</span>
        <Figure loading={loading}>
          <StatValue value={billing.credit} from={billing.credit} format={{ style: 'currency', currency }} locale={locale} />
          <span className="text-ui-sm text-fg-muted">{copy.resets(resets)}</span>
        </Figure>
      </div>
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <span className="text-ui font-medium">{copy.workspaceLimit}</span>
        <StatMeter value={spent} max={limit} locale={locale} className="mt-1" detail={copy.limitLeft(money.format(Math.max(0, limit - spent)))}>
          {copy.limitOf(money.format(limit))}
        </StatMeter>
      </div>
    </Panel>
  )
}

export { BillingCard, LeaderboardCard, PersonalCard }
