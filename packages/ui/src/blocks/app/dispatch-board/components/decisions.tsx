'use client'

import { CheckCircleIcon, CheckIcon, LockIcon, SparklesIcon } from '@youj/icons'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ProposalCard } from '../../../../components/ui/proposal-card'
import { Eyebrow } from '../../../../components/ui/typography'
import { cn } from '../../../../lib/utils'
import { DRIVERS, HANDLED, type Decision, type Proposal } from '../data'
import type { Decisions as DecisionMap } from '../model'

/** The agent's proposals, each waiting on approve, review or dismiss, then what it handled on its own. */
export function Decisions({
  proposals,
  decisions,
  onDecide,
  onReview,
  className,
}: {
  proposals: Proposal[]
  decisions: DecisionMap
  onDecide: (id: string, decision: Decision) => void
  onReview: (load: string) => void
  className?: string
}) {
  const pending = proposals.filter((p) => (decisions[p.id] ?? 'pending') === 'pending').length
  return (
    <Card role="region" aria-labelledby="decisions" size="sm" className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <SparklesIcon size={14} className="text-fg-muted" />
          <h2 id="decisions">Dispatch agent</h2>
        </CardTitle>
        <CardDescription aria-live="polite">{pending ? `${pending} waiting on you` : 'All caught up'}</CardDescription>
        <CardAction>
          <Badge variant="outline" className="gap-1">
            <LockIcon size={11} /> Approve first
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pb-1 yj-scrollbar">
        <ol className="flex flex-col gap-2">
          {proposals.map((proposal, i) => {
            const status = decisions[proposal.id] ?? 'pending'
            const to = DRIVERS.find((d) => d.id === proposal.to)
            return (
              <li key={proposal.id}>
                <ProposalCard
                  className="gap-3 p-3.5"
                  source={<span className="text-fg-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>}
                  title={proposal.title}
                  description={proposal.description}
                  facts={[
                    { label: proposal.kind === 'assign' ? 'Outcome' : 'Saves', value: proposal.saves, tone: 'success' },
                    ...(proposal.distance ? [{ label: 'Extra distance', value: proposal.distance }] : []),
                  ]}
                  status={status}
                  resolution={
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        {status === 'approved' && <CheckCircleIcon size={14} className="text-success-text" />}
                        {status === 'approved' ? (to ? `Handed to ${to.name}` : 'Approved') : 'Dismissed'}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => onDecide(proposal.id, 'pending')}>
                        Undo
                      </Button>
                    </span>
                  }
                  actions={
                    <>
                      <Button size="sm" onClick={() => onDecide(proposal.id, 'approved')}>
                        <CheckIcon size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReview(proposal.load)}>
                        Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDecide(proposal.id, 'dismissed')}>
                        Dismiss
                      </Button>
                    </>
                  }
                />
              </li>
            )
          })}
        </ol>
        <div className="flex flex-col gap-2.5 rounded-xl border border-line p-3.5">
          <Eyebrow render={<h3 />}>Handled · no approval needed</Eyebrow>
          <ul className="flex flex-col gap-2">
            {HANDLED.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-ui-sm text-fg">
                <CheckCircleIcon size={14} className="mt-0.5 shrink-0 text-success-text" />
                <span className="flex-1">{item.text}</span>
                <span className="text-ui-xs text-fg-muted tabular-nums">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
