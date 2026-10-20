'use client'

import { Stat, StatGroup, StatNote, StatValue } from '../../../../components/ui/stat-card'
import { DRIVERS, type Load } from '../data'

/** The day at a glance: loads on the road, on-time share, loads at risk, decisions waiting and drivers free. */
export function KpiStrip({ loads, pending }: { loads: Load[]; pending: number }) {
  const rolling = loads.filter((l) => l.status !== 'booked').length
  const onTime = loads.filter((l) => l.status === 'on-time').length
  const risky = loads.filter((l) => l.status === 'at-risk' || l.status === 'delayed').length
  const busy = new Set(loads.filter((l) => l.status !== 'booked' && l.driver).map((l) => l.driver))
  const free = DRIVERS.filter((d) => !busy.has(d.id)).length
  return (
    <StatGroup
      role="region"
      aria-label="Today"
      className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 *:data-[slot=stat]:p-3 *:data-[slot=stat]:md:px-4"
    >
      <Stat label="On the road">
        <StatValue size="sm" value={rolling} unit={`of ${loads.length}`} />
        <StatNote>Monitoring 1,284 events</StatNote>
      </Stat>
      <Stat label="On time">
        <StatValue size="sm" value={onTime / rolling} format={{ style: 'percent' }} />
        <StatNote>
          {onTime} of {rolling} loads on the road
        </StatNote>
      </Stat>
      <Stat label="At risk">
        <StatValue size="sm" value={risky} />
        <StatNote className={risky ? 'text-danger-text' : undefined}>{risky ? 'Late against the window' : 'Nothing late'}</StatNote>
      </Stat>
      <Stat label="Awaiting you">
        <StatValue size="sm" value={pending} />
        <StatNote className={pending ? 'text-accent-text' : undefined}>{pending ? 'Agent proposals' : 'All decided'}</StatNote>
      </Stat>
      <Stat label="Drivers free" className="max-xl:hidden">
        <StatValue size="sm" value={free} unit={`of ${DRIVERS.length}`} />
        <StatNote>Within hours of service</StatNote>
      </Stat>
    </StatGroup>
  )
}
