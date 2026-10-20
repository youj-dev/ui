'use client'

import { AlertTriangleIcon, CheckCircleIcon, SparklesIcon } from '@youj/icons'
import { AnnotatedImage } from '../../../../components/ui/annotated-image'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Stepper } from '../../../../components/ui/stepper'
import { Eyebrow } from '../../../../components/ui/typography'
import { cn } from '../../../../lib/utils'
import type { Decision, ShipmentDetailProposal, ShipmentDetailReading, ShipmentDetailRoute, ShipmentDetailShipment } from '../data'
import { TruckArt } from './truck-art'

/** One figure of the delivery: the window, the ETA now, the ETA with the detour. Colored only for its state: late in danger, back inside the window in success. */
function Figure({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'danger' | 'success' }) {
  const ink = tone === 'danger' ? 'text-danger-text' : tone === 'success' ? 'text-success-text' : 'text-fg-muted'
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Eyebrow render={<dt />}>{label}</Eyebrow>
      <dd data-slot="stat-value" data-size="sm" className="text-xl leading-[1.1] font-semibold tracking-tight whitespace-nowrap text-fg tabular-nums">
        {value}
      </dd>
      {note && <dd className={cn('text-ui-xs', ink)}>{note}</dd>}
    </div>
  )
}

/** The shipment at a glance: the lane and its state, the delivery figures, the vehicle with its readings and the route as a stage rail with the detour over it. */
export function RouteCard({
  shipment: s,
  route,
  readings,
  proposal,
  decision,
}: {
  shipment: ShipmentDetailShipment
  route: ShipmentDetailRoute
  readings: ShipmentDetailReading[]
  proposal: ShipmentDetailProposal
  decision: Decision
}) {
  const approved = decision === 'approved'
  const { via } = route.detour
  // The destination's ETA follows the decision.
  const steps = route.steps.map((step, i) =>
    i === route.steps.length - 1 ? { ...step, description: `ETA ${approved ? s.etaProposed : s.etaNow}` } : step,
  )
  return (
    <Card role="region" aria-labelledby="route-title" className="min-w-0">
      {/* On a phone the agent's flag waits for its own card, and the title takes the width. */}
      <CardHeader className="max-sm:grid-cols-1">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h2 id="route-title">
            {s.from} → {s.to}
          </h2>
          {approved ? (
            <Badge variant="success" className="gap-1">
              <CheckCircleIcon size={12} /> On time
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1">
              <AlertTriangleIcon size={12} /> At risk
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {s.id} · {s.customer} · {s.pallets} pallets
        </CardDescription>
        <CardAction className="max-sm:hidden">
          <Badge variant="outline" className="gap-1.5">
            <SparklesIcon size={12} /> {proposal.agent} flagged · {proposal.flagged}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-4 border-y border-line py-3 sm:grid-cols-3">
          <Figure label="Window" value={s.window} note="Today" />
          <Figure
            label="ETA now"
            value={approved ? s.etaProposed : s.etaNow}
            note={approved ? 'inside window' : `+${s.late} min vs plan`}
            tone={approved ? 'success' : 'danger'}
          />
          <Figure label="With detour" value={s.etaProposed} note={approved ? 'approved' : `inside window · −${s.saves} min`} />
        </dl>
        <AnnotatedImage
          annotations={readings}
          media={<TruckArt />}
          label="Vehicle readings"
          caption={`${s.trailer} · last reading ${s.lastReading}`}
          // The truck stands on the card itself, and the gutters give it the room a hero needs.
          className="mx-auto w-full max-w-3xl [&_[data-slot=annotated-image-callout]]:size-5 [&_[data-slot=annotated-image-media]]:overflow-visible [&_[data-slot=annotated-image-media]]:bg-transparent [&_[data-slot=annotated-image-stage]]:[--annotated-gutter:minmax(7rem,9rem)]"
        />
        <Stepper
          steps={steps}
          current={route.current}
          compact
          aria-label="Route"
          detour={
            decision === 'dismissed'
              ? undefined
              : { from: route.detour.from, to: route.detour.to, label: approved ? `${via} · approved` : `${via} detour`, detail: `−${s.saves} min` }
          }
        />
      </CardContent>
    </Card>
  )
}
