'use client'

import { useState } from 'react'
import { CheckIcon, TruckIcon } from '@youj/icons'
import { Button } from '../../../../components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover'
import { ProposalCard } from '../../../../components/ui/proposal-card'
import { RouteMap } from '../../../../components/ui/route-map'
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group'
import { cn } from '../../../../lib/utils'
import { clock, type Decision, type Load, type Proposal } from '../data'
import { mapFor } from '../model'

/** The two routes in numbers, for Compare. */
function Comparison({ load, proposal }: { load: Load; proposal: Proposal }) {
  const rows: [string, string, string][] = [
    ['ETA', clock(proposal.etaNow!), clock(proposal.etaProposed!)],
    ['Against plan', `+${load.late ?? 0} min`, `−${proposal.saves}`],
    ['Distance', '142 mi', `146 mi`],
    ['Window', 'Missed', 'Kept'],
  ]
  return (
    <table className="w-full text-ui-sm whitespace-nowrap">
      <caption className="sr-only">Current route against the proposal</caption>
      <thead>
        <tr className="text-ui-xs text-fg-muted">
          <th scope="col" className="pb-1.5 text-start font-normal" />
          <th scope="col" className="pb-1.5 text-end font-normal">
            {proposal.via!.current}
          </th>
          <th scope="col" className="pb-1.5 text-end font-normal text-accent-text">
            {proposal.via!.proposed}
          </th>
        </tr>
      </thead>
      <tbody className="font-mono tabular-nums">
        {rows.map(([label, now, next]) => (
          <tr key={label} className="border-t border-line">
            <th scope="row" className="py-1.5 pe-3 text-start font-sans font-normal text-fg-muted">
              {label}
            </th>
            <td className="py-1.5 ps-3 text-end">{now}</td>
            <td className="py-1.5 ps-3 text-end text-accent-text">{next}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export interface DispatchMapProps {
  loads: Load[]
  selected: Load
  proposal?: Proposal
  decision?: Decision
  onSelect: (id: string) => void
  onDecide: (id: string, decision: Decision) => void
  /** Fill the height it's given instead of keeping its 6:5 ratio. */
  fill?: boolean
  className?: string
}

type Layer = 'all' | 'late'

/** The selected load's route over every live truck (or only the late ones), with its reroute to approve or compare in a card over the map. */
export function DispatchMap({ loads, selected, proposal, decision = 'pending', onSelect, onDecide, fill = false, className }: DispatchMapProps) {
  const [layer, setLayer] = useState<Layer>('all')
  const rolling = loads.filter((l) => l.at)
  const late = new Set(rolling.filter((l) => l.late).map((l) => `truck:${l.id}`))
  const map = mapFor(loads, selected, proposal, decision)
  const stops = map.stops.filter((s) => layer === 'all' || !s.id.startsWith('truck:') || late.has(s.id))
  const routes = map.routes
  // Every other truck on the road wears a truck too, on an ink disc.
  for (const stop of stops) if (stop.id.startsWith('truck:')) stop.icon = <TruckIcon size={12} />
  const truck = stops.find((s) => s.id === 'now')
  if (truck)
    Object.assign(truck, {
      icon: <TruckIcon size={14} />,
      cardSide: 'top' as const,
      card: (
        <div className="flex flex-col gap-0.5">
          <span className="text-ui-xs font-medium text-fg tabular-nums">{selected.id}</span>
          <span className={selected.late ? 'text-ui-xs text-danger-text tabular-nums' : 'text-ui-xs text-success-text tabular-nums'}>
            {selected.at!.detail}
          </span>
        </div>
      ),
    })
  const reroute = proposal?.kind === 'reroute' ? proposal : undefined

  return (
    <RouteMap
      key={selected.id}
      stops={stops}
      routes={routes}
      ratio={6 / 5}
      label={`Route of ${selected.id}`}
      value={null}
      onValueChange={(id) => id?.startsWith('truck:') && onSelect(id.slice(6))}
      className={cn('rounded-2xl border-transparent bg-band', className)}
      style={fill ? { aspectRatio: 'auto' } : undefined}
    >
      <ToggleGroup
        aria-label="Trucks on the map"
        variant="segmented"
        size="sm"
        value={[layer]}
        onValueChange={(next: unknown[]) => setLayer((next[0] as Layer | undefined) ?? 'all')}
        className="absolute start-3 top-3 z-20 bg-overlay/90 youj-allow-glass shadow-sm backdrop-blur-sm"
      >
        <ToggleGroupItem value="all" className="gap-1.5">
          <TruckIcon size={14} /> On the road <span className="text-fg-muted tabular-nums">{rolling.length}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="late" className="gap-1.5">
          Running late <span className="text-fg-muted tabular-nums">{late.size}</span>
        </ToggleGroupItem>
      </ToggleGroup>
      {reroute && (
        <ProposalCard
          title={`Reroute via ${reroute.via!.proposed}`}
          headingLevel={3}
          status={decision}
          className="absolute end-3 bottom-3 z-20 hidden w-64 gap-2.5 p-3 shadow-md md:flex"
          options={[
            {
              id: 'current',
              label: `${reroute.via!.current} · current`,
              value: clock(reroute.etaNow!),
              detail: `+${selected.late ?? 47} min`,
              tone: 'danger',
            },
            {
              id: 'proposed',
              label: `${reroute.via!.proposed} · proposed`,
              value: clock(reroute.etaProposed!),
              detail: `−${reroute.saves}`,
              proposed: true,
            },
          ]}
          resolution={
            decision === 'approved' ? `On ${reroute.via!.proposed} · ETA ${clock(reroute.etaProposed!)}` : `Staying on ${reroute.via!.current}`
          }
          actions={
            <>
              <Button size="sm" onClick={() => onDecide(reroute.id, 'approved')}>
                <CheckIcon size={14} /> Approve
              </Button>
              <Popover>
                <PopoverTrigger render={<Button size="sm" variant="outline" />}>Compare</PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-auto">
                  <Comparison load={selected} proposal={reroute} />
                </PopoverContent>
              </Popover>
            </>
          }
        />
      )}
    </RouteMap>
  )
}
