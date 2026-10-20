'use client'

import { CheckIcon, EyeIcon, LockIcon, SparklesIcon } from '@youj/icons'
import { Button } from '../../../../components/ui/button'
import { ProposalCard } from '../../../../components/ui/proposal-card'
import { Eyebrow } from '../../../../components/ui/typography'
import type { Decision, ShipmentDetailProposal, ShipmentDetailRoute, ShipmentDetailShipment } from '../data'

/** The agent's reasoning as label and line, the labels in a column of their own. */
function Case({ rows }: { rows: [string, string][] }) {
  return (
    <span className="grid grid-cols-[minmax(0,--spacing(30))_minmax(0,1fr)] gap-x-4 gap-y-2.5 pt-1">
      {rows.map(([label, text]) => (
        <span key={label} className="contents">
          <Eyebrow className="pt-0.5">{label}</Eyebrow>
          <span className="text-ui-sm text-fg">{text}</span>
        </span>
      ))}
    </span>
  )
}

/** The route agent's case: what happened, why, what it recommends, the gain, and the dispatcher's decision. */
export function RiskCard({
  shipment: s,
  route,
  proposal,
  decision,
  onDecide,
  onViewRoute,
}: {
  shipment: ShipmentDetailShipment
  route: ShipmentDetailRoute
  proposal: ShipmentDetailProposal
  decision: Decision
  onDecide: (decision: Decision) => void
  onViewRoute: () => void
}) {
  const via = route.detour.via
  return (
    <ProposalCard
      headingLevel={2}
      className="gap-4 [&_h2]:text-ui-lg"
      source={
        <span className="flex w-full items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-fg-muted">
            <SparklesIcon size={12} />
            {proposal.agent}
          </span>
          <span className="font-sans tracking-normal text-fg-muted normal-case tabular-nums">{proposal.meta}</span>
        </span>
      }
      title={`Delivery risk · reroute via ${via}`}
      description={<Case rows={proposal.reasons} />}
      options={[
        { id: 'current', label: `${route.road} · current`, value: s.etaNow, detail: `+${s.late} min`, tone: 'danger' },
        { id: 'proposed', label: `${via} · proposed`, value: s.etaProposed, detail: `−${s.saves} min`, proposed: true },
      ]}
      facts={proposal.facts}
      note={
        <span className="inline-flex items-center gap-1.5">
          <LockIcon size={12} /> {proposal.note}
        </span>
      }
      status={decision}
      resolution={
        <span className="flex items-center justify-between gap-2">
          {decision === 'approved' ? 'Approved by you · driver and customer notified' : `Dismissed · staying on ${route.road}`}
          <Button size="sm" variant="ghost" onClick={() => onDecide('pending')}>
            Undo
          </Button>
        </span>
      }
      actions={
        <>
          <Button size="sm" onClick={() => onDecide('approved')}>
            <CheckIcon size={14} /> Approve reroute
          </Button>
          <Button size="sm" variant="outline" onClick={onViewRoute}>
            <EyeIcon size={14} /> View route
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDecide('dismissed')}>
            Dismiss
          </Button>
        </>
      }
    />
  )
}
