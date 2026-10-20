'use client'

import { useId, type ReactNode } from 'react'
import { BellIcon, BotIcon, ClockIcon, GaugeIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from '@youj/icons'
import { StatDelta, StatValue } from '../../../components/ui/stat-card'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { PlanVsActualCopy, PlanVsActualFact } from './data'

/* The year so far: spent to date in large mono, how far it runs from the
 * plan to date (StatDelta, a rise in the bad ink), the projected year, a
 * short list of facts each with its icon in a recessed disc, and the two
 * agents that moved most against their plan with why. */

export interface PlanVsActualMover {
  id: string
  name: string
  /** Projected year minus the plan: above zero is over. */
  delta: number
  note?: string
}

interface SummaryProps {
  ytd: number
  planYtd: number
  projectedYear: number
  facts: PlanVsActualFact[]
  movers: PlanVsActualMover[]
  money: (value: number) => string
  valueOptions: Intl.NumberFormatOptions
  better: 'under' | 'over'
  copy: PlanVsActualCopy
  locale: string
  heading: 'h2' | 'h3'
}

const ICONS: Record<NonNullable<PlanVsActualFact['icon']>, ReactNode> = {
  bell: <BellIcon />,
  wallet: <WalletIcon />,
  clock: <ClockIcon />,
  gauge: <GaugeIcon />,
  bot: <BotIcon />,
}

const disc = (icon: ReactNode) => (
  <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-band text-fg-muted [&_svg]:size-3.5">
    {icon}
  </span>
)

export function Summary({ ytd, planYtd, projectedYear, facts, movers, money, valueOptions, better, copy, locale, heading: Heading }: SummaryProps) {
  const headingId = useId()
  const moversId = useId()
  const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${money(Math.abs(v))}`
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
        <Eyebrow id={headingId} render={<Heading />}>
          {copy.spentYtd}
        </Eyebrow>
        <StatValue value={ytd} from={ytd} size="lg" format={valueOptions} locale={locale} />
        {planYtd > 0 && (
          <StatDelta
            value={(ytd - planYtd) / planYtd}
            format={{ style: 'percent', maximumFractionDigits: 0 }}
            invert={better === 'under'}
            locale={locale}
          >
            {copy.againstPlan(money(planYtd))}
          </StatDelta>
        )}
        <p className="flex items-baseline justify-between gap-3 pt-1 text-ui text-fg-muted">
          {copy.projectedYear}
          <span className="font-mono text-fg tabular-nums">{money(projectedYear)}</span>
        </p>
      </section>
      <dl className="flex flex-col divide-y divide-line border-y border-line">
        {facts.map((fact) => (
          <div key={fact.id} className="flex items-center gap-3 py-1.5">
            <dt className="flex min-w-0 flex-1 items-center gap-3 text-ui text-fg-muted">
              {disc(ICONS[fact.icon ?? 'gauge'])}
              <span className="truncate">{fact.label}</span>
            </dt>
            <dd className="font-mono text-ui text-fg tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {movers.length > 0 && (
        <section aria-labelledby={moversId} className="flex flex-col gap-2.5">
          <Eyebrow id={moversId} render={<Heading />}>
            {copy.movers}
          </Eyebrow>
          <ul className="flex flex-col gap-3">
            {movers.map((mover) => (
              <li key={mover.id} className="flex items-start gap-3">
                {disc(mover.delta > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />)}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-mono text-ui text-fg">{mover.name}</span>
                    <span
                      className={cn(
                        'font-mono text-ui tabular-nums',
                        (better === 'under' ? mover.delta > 0 : mover.delta < 0) ? 'text-warning-text' : 'text-success-text',
                      )}
                    >
                      {signed(mover.delta)}
                    </span>
                  </div>
                  {mover.note && <p className="text-ui-sm text-pretty text-fg-muted">{mover.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
