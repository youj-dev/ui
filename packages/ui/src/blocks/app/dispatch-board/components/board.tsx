'use client'

import { PlusIcon } from '@youj/icons'
import { Button } from '../../../../components/ui/button'
import { toast } from '../../../../components/ui/toast'
import type { DispatchState } from '../use-dispatch'
import { Decisions } from './decisions'
import { DispatchMap } from './dispatch-map'
import { DriverTimeline } from './driver-timeline'
import { KpiStrip } from './kpi-strip'
import { Queue } from './queue'

export function NewLoadButton() {
  return (
    <Button size="sm" onClick={() => toast('New load', { description: 'Opens the booking form.' })}>
      <PlusIcon size={14} /> New load
    </Button>
  )
}

/** The board: a title row with New load (unless the page's header holds it), KPIs over the queue, the map with the driver timeline under it, and the agent's proposals. */
export function Board({ state, embedded = false }: { state: DispatchState; embedded?: boolean }) {
  const { loads, selected, select, proposal, proposals, decisions, pending, decide } = state
  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-normal tracking-tight text-fg sm:text-4xl">Dispatch</h1>
          <NewLoadButton />
        </div>
      )}
      <KpiStrip loads={loads} pending={pending.length} />
      <div className="grid gap-4 lg:grid-cols-[--spacing(68)_minmax(0,1fr)] xl:grid-cols-[--spacing(68)_minmax(0,1fr)_--spacing(84)]">
        <Queue loads={loads} selected={selected.id} onSelect={select} pending={pending.length} />
        <div className="flex min-w-0 flex-col gap-4">
          <DispatchMap loads={loads} selected={selected} proposal={proposal} decision={proposal ? decisions[proposal.id] : undefined} onSelect={select} onDecide={decide} />
          <DriverTimeline loads={loads} proposals={proposals} decisions={decisions} />
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <Decisions proposals={proposals} decisions={decisions} onDecide={decide} onReview={select} />
        </div>
      </div>
    </div>
  )
}
