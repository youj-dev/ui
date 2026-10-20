'use client'

import { CheckIcon, TruckIcon } from '@youj/icons'
import { Button, RouteMap, type RouteMapRoute, type RouteMapStop } from '@youj/react'

const STOPS: RouteMapStop[] = [
  { id: 'depot', name: 'Harbor depot', kind: 'origin', x: 12, y: 72, detail: 'Departed 09:14' },
  { id: 'yard', name: 'North yard', x: 29, y: 55, detail: 'Passed 10:41' },
  {
    id: 'truck',
    name: 'Load 4821',
    kind: 'current',
    x: 43,
    y: 45,
    detail: '47 min late',
    icon: <TruckIcon size={14} />,
    cardSide: 'top',
    card: (
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-ui-xs text-fg-muted">LOAD 4821</span>
        <span className="font-medium text-fg">Slowed on Ridge road</span>
        <span className="font-mono text-ui-xs text-danger-text tabular-nums">+47 min · speed −24%</span>
      </div>
    ),
  },
  { id: 'ridge', name: 'Ridge junction', x: 64, y: 29, detail: 'ETA 13:05' },
  { id: 'summit', name: 'Summit DC', kind: 'destination', x: 86, y: 18, detail: 'ETA 15:49' },
]

const ROUTES: RouteMapRoute[] = [
  { id: 'driven', status: 'done', path: ['depot', [20, 65], 'yard', [36, 49], 'truck'] },
  { id: 'late', status: 'delayed', path: ['truck', [53, 36], 'ridge'] },
  { id: 'ahead', status: 'on-time', path: ['ridge', [76, 23], 'summit'] },
  { id: 'reroute', status: 'proposed', label: 'Proposed via river road', path: ['truck', [52, 55], [66, 57], [78, 42], [84, 28], 'summit'] },
]

export default function RouteMapDemo() {
  return (
    <div className="w-full max-w-3xl">
      <RouteMap stops={STOPS} routes={ROUTES}>
        {/* Your own overlay: the reroute to approve, beside the legend. */}
        <div className="absolute end-3 bottom-3 z-20 hidden w-56 flex-col gap-2 rounded-xl border border-line bg-overlay p-3 shadow-md sm:flex">
          <span className="font-mono text-ui-xs text-accent-text">REROUTE · LOAD 4821</span>
          <div className="flex items-baseline justify-between rounded-lg bg-band px-2.5 py-1.5">
            <span className="text-ui-sm text-fg-muted">Ridge road</span>
            <span className="font-mono text-ui text-danger-text tabular-nums">15:49</span>
          </div>
          <div className="flex items-baseline justify-between rounded-lg bg-accent-subtle px-2.5 py-1.5">
            <span className="text-ui-sm text-fg">River road</span>
            <span className="font-mono text-ui text-accent-text tabular-nums">15:18</span>
          </div>
          <Button size="sm">
            <CheckIcon size={14} />
            Approve reroute
          </Button>
        </div>
      </RouteMap>
    </div>
  )
}
