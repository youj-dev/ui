'use client'

import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, MapPinIcon, PackageIcon, SparklesIcon } from '@youj/icons'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Eyebrow } from '../../../../components/ui/typography'
import { Timeline, type TimelineEventType } from '../../../../components/ui/timeline'
import { clock, type Decision, type ShipmentDetailEvent, type ShipmentDetailRoute } from '../data'

const TYPES: Record<string, TimelineEventType> = {
  pickup: { icon: PackageIcon, tone: 'success', label: 'Pickup' },
  alert: { icon: AlertTriangleIcon, tone: 'danger', label: 'Alert' },
  agent: { icon: SparklesIcon, tone: 'accent', label: 'Route agent' },
  awaiting: { icon: ClockIcon, tone: 'warning', label: 'Waiting' },
  approved: { icon: CheckCircleIcon, tone: 'success', label: 'Approved' },
  delivery: { icon: MapPinIcon, label: 'Delivery' },
}

/** What happened to the shipment, newest first; a decision on the reroute joins the top. */
export function ShipmentTimeline({
  events: log,
  route,
  now,
  decision,
}: {
  events: ShipmentDetailEvent[]
  route: ShipmentDetailRoute
  now: number
  decision: Decision
}) {
  const decided =
    decision === 'pending'
      ? []
      : [
          {
            id: 'decision',
            type: 'approved',
            title: decision === 'approved' ? `Reroute via ${route.detour.via} approved` : 'Reroute dismissed',
            detail: decision === 'approved' ? 'Driver notified · customer ETA update sent' : `Staying on ${route.road}`,
            time: now,
          },
        ]
  const events = [...decided, ...log.filter((e) => decision === 'pending' || e.type !== 'awaiting')].map((e) => ({
    id: e.id,
    type: e.type,
    summary: e.title,
    title: (
      <span className="flex flex-col">
        <span>{e.title}</span>
        <span className="text-ui-sm font-normal text-fg-muted">{e.detail}</span>
      </span>
    ),
    time: e.time,
  }))
  return (
    <Card role="region" aria-labelledby="shipment-timeline" size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 id="shipment-timeline">Shipment timeline</h2>
        </CardTitle>
        <CardAction>
          <Eyebrow className="tabular-nums">As of {clock(now)}</Eyebrow>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Timeline events={events} types={TYPES} now={now} />
      </CardContent>
    </Card>
  )
}
