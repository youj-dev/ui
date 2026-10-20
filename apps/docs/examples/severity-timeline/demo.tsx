'use client'

import { useState } from 'react'
import { Button, SeverityTimeline, type SeverityEvent } from '@youj/react'

const MIN = 60_000

function incident(start: number): SeverityEvent[] {
  return [
    { id: 'alert', at: start, severity: 2, title: 'Error rate above 5% on checkout-api', detail: '5xx at 7.4% over 5 min', actor: 'pagerbot', ongoing: true },
    { id: 'page', at: start + MIN, title: 'Paged the payments on-call', actor: 'pagerbot' },
    { id: 'ack', at: start + 3 * MIN, milestone: 'acknowledged', title: 'M. Oyelaran took command', actor: 'm.oyelaran' },
    { id: 'sev1', at: start + 6 * MIN, severity: 1, title: 'Card payments failing in eu-west', actor: 'pagerbot', duration: 9 * MIN },
    { id: 'rollback', at: start + 9 * MIN, severity: 3, title: 'Rolled back checkout-api to v2.14.3', actor: 'deploybot', duration: 4 * MIN },
    { id: 'mitigated', at: start + 15 * MIN, milestone: 'mitigated', title: 'Authorisations recovering', actor: 'm.oyelaran' },
  ]
}

export default function SeverityTimelineDemo() {
  const [events, setEvents] = useState(() => incident(Date.now() - 18 * MIN))
  const resolved = events.some((e) => e.milestone === 'resolved')
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <SeverityTimeline events={events} />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={resolved}
          onClick={() => setEvents((list) => [...list, { id: `e${list.length}`, at: Date.now(), severity: 3, title: 'Scaled payments-worker to 12 replicas', actor: 'autoscaler', duration: 2 * MIN }])}
        >
          Add an event
        </Button>
        <Button
          size="sm"
          disabled={resolved}
          onClick={() => setEvents((list) => [...list, { id: 'resolved', at: Date.now(), milestone: 'resolved', title: 'Error rate under 0.5% for 10 min', actor: 'm.oyelaran' }])}
        >
          Resolve
        </Button>
      </div>
    </div>
  )
}
