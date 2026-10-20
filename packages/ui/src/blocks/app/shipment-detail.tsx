'use client'

import type { HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { CheckIcon, PhoneIcon, ShareIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { toast, Toaster } from '../../components/ui/toast'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Details } from './shipment-detail/components/details'
import { Documents } from './shipment-detail/components/documents'
import { RiskCard } from './shipment-detail/components/risk-card'
import { RouteCard } from './shipment-detail/components/route-card'
import { ShipmentTimeline } from './shipment-detail/components/shipment-timeline'
import {
  DOCUMENTS,
  EVENTS,
  NOW,
  PROPOSAL,
  READINGS,
  ROUTE,
  SHIPMENT,
  type Decision,
  type ShipmentDetailDocument,
  type ShipmentDetailEvent,
  type ShipmentDetailProposal,
  type ShipmentDetailReading,
  type ShipmentDetailRoute,
  type ShipmentDetailShipment,
} from './shipment-detail/data'

/* One freight shipment from the dispatcher's seat, content only (the app's
 * frame brings the navigation). A page header with the actions, then:
 * - The route card: the lane and its state, the window, the ETA now and with
 *   the detour, the vehicle as an AnnotatedImage (driver, fuel, speed,
 *   reefer, load, each a numbered callout on a leader line), and the route
 *   as a Stepper whose detour arcs over the slow stretch.
 * - The route agent's case as a ProposalCard: what happened, why, the
 *   recommendation, current against proposed ETA and the impact; approve it
 *   (here or in the title row), view the route or dismiss it, then undo.
 * - A Timeline of what happened, which a decision joins at the top; the
 *   shipment's record as a PropertyList; its documents.
 * Approving turns At risk to On time, moves the ETA inside the window and
 * marks the detour approved. In one column the agent's case follows the
 * route. The feed reads as of `now` (the demo's 11:58).
 * Your shipment, route, readings, timeline, documents and the agent's case
 * come in as props (the demo's are the defaults), the decision is yours to
 * own, and each action calls its handler (a toast stands in for an unwired
 * one). Reduced motion: every change lands in place. */

interface ShipmentDetailProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** Wraps the screen in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage, with the shipment's actions) and the frame's gutter, across the whole width. Default true; `false` draws its own page (a large title row over a centered canvas). */
  embedded?: boolean
  /** The shipment: lane, window and ETAs, driver, equipment and its record. */
  shipment?: ShipmentDetailShipment
  /** The stops, where the vehicle is, and the detour on offer. */
  route?: ShipmentDetailRoute
  /** The vehicle's readings, called out on its picture. */
  readings?: ShipmentDetailReading[]
  /** What happened, newest first. */
  events?: ShipmentDetailEvent[]
  /** The shipment's paperwork. */
  documents?: ShipmentDetailDocument[]
  /** The agent's case for the detour. */
  proposal?: ShipmentDetailProposal
  /** The moment the timeline reads from. Default: the demo's clock. */
  now?: number
  /** The reroute's state (controlled). */
  decision?: Decision
  /** The reroute's state at first. Default 'pending'. */
  defaultDecision?: Decision
  /** Approve, dismiss or undo (back to 'pending'). */
  onDecisionChange?: (decision: Decision) => void
  onShareTracking?: () => void
  onCallDriver?: () => void
  onViewRoute?: () => void
  onEdit?: (field: 'driver' | 'window') => void
  onDownloadDocument?: (document: ShipmentDetailDocument) => void
}

function ShipmentDetail({
  theme,
  embedded = true,
  shipment = SHIPMENT,
  route = ROUTE,
  readings = READINGS,
  events = EVENTS,
  documents = DOCUMENTS,
  proposal = PROPOSAL,
  now = NOW,
  decision: decisionProp,
  defaultDecision = 'pending',
  onDecisionChange,
  onShareTracking,
  onCallDriver,
  onViewRoute,
  onEdit,
  onDownloadDocument,
  className,
  ...rest
}: ShipmentDetailProps) {
  const [decision, setDecision] = useControllableState(decisionProp, defaultDecision)
  const s = shipment
  const decide = (next: Decision) => {
    setDecision(next)
    onDecisionChange?.(next)
    if (next === 'approved' && !onDecisionChange) toast.success('Reroute approved', { description: `${s.driver.name} and ${s.customer} are notified.` })
  }

  const actions = (
    <>
      <Button size="sm" variant="outline" onClick={onShareTracking ?? (() => toast('Tracking link copied', { description: `${s.customer} can follow ${s.id} live.` }))}>
        <ShareIcon size={14} /> Share tracking
      </Button>
      <Button size="sm" variant="outline" onClick={onCallDriver ?? (() => toast(`Calling ${s.driver.name}…`))}>
        <PhoneIcon size={14} /> Call driver
      </Button>
      {decision === 'pending' && (
        <Button size="sm" onClick={() => decide('approved')}>
          <CheckIcon size={14} /> Approve reroute
        </Button>
      )}
    </>
  )
  // Two columns on wide screens; in one, the agent's case follows the route it's about.
  const cards = (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_--spacing(104)]">
      <div className="flex min-w-0 flex-col gap-4 max-xl:contents">
        <RouteCard shipment={s} route={route} readings={readings} proposal={proposal} decision={decision} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 max-xl:order-last lg:grid-cols-2">
          <Details shipment={s} onEdit={onEdit ?? ((field) => toast(`Editing ${field === 'driver' ? 'driver' : 'delivery window'}`, { description: `${s.id} · changes are logged on the timeline.` }))} />
          <Documents documents={documents} onDownload={onDownloadDocument ?? ((doc) => toast(`${doc.name} downloaded`))} compact />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4 max-xl:contents">
        <RiskCard
          shipment={s}
          route={route}
          proposal={proposal}
          decision={decision}
          onDecide={decide}
          onViewRoute={onViewRoute ?? (() => toast(`Opening ${s.id} on the dispatch board…`))}
        />
        <ShipmentTimeline events={events} route={route} now={now} decision={decision} />
      </div>
    </div>
  )

  return (
    <ThemeScope theme={theme}>
      {embedded ? (
        <AppPage {...rest} title={`Shipment ${s.id}`} actions={actions} width="fill" className={cn('text-fg', className)}>
          {cards}
        </AppPage>
      ) : (
        <main className={cn('min-h-dvh w-full bg-chrome text-fg', className)} {...rest}>
          <div className="mx-auto flex w-full max-w-400 flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-normal tracking-tight text-fg sm:text-4xl">Shipment {s.id}</h1>
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            </div>
            {cards}
          </div>
        </main>
      )}
      <Toaster />
    </ThemeScope>
  )
}

export { ShipmentDetail }
export type {
  ShipmentDetailProps,
  ShipmentDetailShipment,
  ShipmentDetailRoute,
  ShipmentDetailReading,
  ShipmentDetailEvent,
  ShipmentDetailDocument,
  ShipmentDetailProposal,
  Decision as ShipmentDetailDecision,
}
