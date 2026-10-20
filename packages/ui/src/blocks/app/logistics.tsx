'use client'

import { useState, type HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { ArrowRightIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { toast, Toaster } from '../../components/ui/toast'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { NewLoadButton } from './dispatch-board/components/board'
import { Decisions } from './dispatch-board/components/decisions'
import { DispatchMap } from './dispatch-board/components/dispatch-map'
import { DriverTimeline } from './dispatch-board/components/driver-timeline'
import { KpiStrip } from './dispatch-board/components/kpi-strip'
import { Queue } from './dispatch-board/components/queue'
import { PROPOSALS } from './dispatch-board/data'
import { useDispatch, type DispatchState } from './dispatch-board/use-dispatch'
import { FleetFigures } from './fleet-overview/components/fleet-figures'
import { FleetMap } from './fleet-overview/components/fleet-map'
import { MapControls } from './fleet-overview/components/map-controls'
import { ShipmentsPanel } from './fleet-overview/components/shipments-panel'
import { VesselDetail } from './fleet-overview/components/voyage-detail'
import type { Tracked } from './fleet-overview/model'
import { useHarbor, type Harbor } from './fleet-overview/use-harbor'
import { useMapKeys } from './fleet-overview/use-map-keys'
import { Details } from './shipment-detail/components/details'
import { Documents } from './shipment-detail/components/documents'
import { RiskCard } from './shipment-detail/components/risk-card'
import { RouteCard } from './shipment-detail/components/route-card'
import { ShipmentTimeline } from './shipment-detail/components/shipment-timeline'
import { DOCUMENTS, EVENTS, NOW, PROPOSAL, READINGS, ROUTE, SHIPMENT, type Decision } from './shipment-detail/data'

/* Lanefield's logistics desk, content only (the app's frame brings the
 * navigation): one page header with New load, over three views in Tabs that
 * keep one size (the page fills the frame's height, and each view scrolls
 * inside it):
 * - Fleet: the ocean fleet on a dot map (FleetMap) beside a card of ships
 *   sailing, holding and in port, with search and the fleet's figures.
 *   Picking a ship eases the camera to its voyage and turns the card into
 *   the voyage: route, ETA, log, manifest and contacts. A storm holds two
 *   ships; Reroute redraws their lanes. Keys while the map shows: / searches,
 *   J and K step, + and − zoom, 0 frames, Esc closes the voyage.
 * - Dispatch: the day's figures, the load queue, the selected load on a
 *   RouteMap (or every driver's day as TimeLanes, a SegmentedControl away)
 *   and the dispatch agent's proposals to approve, review or dismiss.
 * - Shipment: load LD-4821 in full: the route with the truck and its
 *   readings, the agent's reroute, the timeline, the record and documents.
 * Opening the at-risk load from Dispatch shows its Shipment view, and View
 * route there goes back to it on the map; its reroute is one decision in
 * both views. Demo content — edit after adding. Reduced motion: ships hold
 * still, routes and the camera arrive at once, cards land in place. */

type View = 'fleet' | 'dispatch' | 'shipment'

interface LogisticsProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** Wraps the screen in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage, with New load) and the frame's gutter, filling the frame's height. Default true; `false` draws its own page, the whole viewport. */
  embedded?: boolean
  /** The view shown (controlled). */
  view?: View
  /** The view shown at first. Default 'fleet'. */
  defaultView?: View
  /** Called with the view chosen. */
  onViewChange?: (view: View) => void
  /** Reroutes the ships held by the storm; resolve when the request is done. Default: a short demo wait. */
  onReroute?: (ships: Tracked[]) => Promise<unknown> | unknown
}

const REROUTE = PROPOSALS.find((p) => p.load === SHIPMENT.id)!

function FleetView({ harbor }: { harbor: Harbor }) {
  // The ships fill a card of their own beside the map (not panels over it), and it scrolls; the figures lead the view, as Dispatch's do.
  const panel: Harbor = { ...harbor, floating: false, hud: true, insets: { top: 24, right: 64, bottom: 24, left: 24 } }
  const { ships, selected, detail, time, select, rerouteShips, map, voyages, selectedId, clock, mapLabel } = harbor
  const { insets } = panel
  return (
    <div className="yj-scrollbar flex h-full min-h-0 flex-col gap-4 overscroll-contain max-lg:overflow-y-auto max-lg:*:shrink-0">
      <FleetFigures ships={ships} compact className="grid-cols-2 sm:grid-cols-4" />
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[--spacing(84)_minmax(0,1fr)]">
        <Card size="sm" className="min-h-0 min-w-0 gap-0 overflow-hidden py-0 max-lg:order-last max-lg:h-120">
          {selected && detail ? (
            <VesselDetail ship={detail} time={time} onClose={() => select(null)} onReroute={(id) => rerouteShips([id])} />
          ) : (
            <div className="yj-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
              <ShipmentsPanel harbor={panel} embedded />
            </div>
          )}
        </Card>
        <Card role="region" aria-label="Fleet map" className="relative min-h-0 min-w-0 overflow-hidden py-0 max-lg:h-64">
          <FleetMap
            ref={map}
            voyages={voyages}
            selectedId={selectedId}
            onSelect={select}
            insets={insets}
            clock={clock}
            label={mapLabel}
          />
          <div className="absolute end-3 top-3">
            <MapControls harbor={panel} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function DispatchView({ state, onOpenShipment }: { state: DispatchState; onOpenShipment: () => void }) {
  const { loads, selected, select, proposal, proposals, decisions, pending, decide } = state
  const [layer, setLayer] = useState<'map' | 'drivers'>('map')
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overscroll-contain max-xl:overflow-y-auto max-xl:*:shrink-0 yj-scrollbar">
      <KpiStrip loads={loads} pending={pending.length} />
      <div className="grid gap-4 lg:grid-cols-[--spacing(76)_minmax(0,1fr)] xl:min-h-0 xl:flex-1 xl:grid-cols-[--spacing(76)_minmax(0,1fr)_--spacing(84)]">
        <Queue loads={loads} selected={selected.id} onSelect={select} pending={pending.length} className="lg:h-128 xl:h-auto xl:min-h-0" />
        <Card role="region" aria-labelledby="dispatch-route" size="sm" className="min-w-0 gap-3 pb-0 max-lg:h-112 lg:h-128 xl:h-auto xl:min-h-0">
          <CardHeader>
            <CardTitle>
              <h2 id="dispatch-route">{layer === 'map' ? `Route of ${selected.id}` : 'Drivers today'}</h2>
            </CardTitle>
            <CardDescription>
              {layer === 'map'
                ? `${selected.customer} · ${selected.origin.name} to ${selected.destination.name}`
                : 'Runs by driver · proposals dashed'}
            </CardDescription>
            <CardAction className="flex items-center gap-2">
              {selected.id === SHIPMENT.id && layer === 'map' && (
                <Button size="sm" variant="outline" onClick={onOpenShipment}>
                  Open shipment <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
                </Button>
              )}
              <SegmentedControl
                aria-label="Show"
                variant="pill"
                size="sm"
                value={layer}
                onValueChange={(next) => setLayer(next as 'map' | 'drivers')}
              >
                <SegmentedControlItem value="map">Map</SegmentedControlItem>
                <SegmentedControlItem value="drivers">Drivers</SegmentedControlItem>
              </SegmentedControl>
            </CardAction>
          </CardHeader>
          <div className="min-h-0 flex-1 overflow-hidden border-t border-line">
            {layer === 'map' ? (
              <DispatchMap
                fill
                loads={loads}
                selected={selected}
                proposal={proposal}
                decision={proposal ? decisions[proposal.id] : undefined}
                onSelect={select}
                onDecide={decide}
                className="h-full rounded-none border-0"
              />
            ) : (
              <div className="yj-scrollbar h-full overflow-y-auto overscroll-contain *:rounded-none *:border-0 *:shadow-none">
                <DriverTimeline loads={loads} proposals={proposals} decisions={decisions} />
              </div>
            )}
          </div>
        </Card>
        <Decisions
          proposals={proposals}
          decisions={decisions}
          onDecide={decide}
          onReview={select}
          className="lg:col-span-2 xl:col-span-1 xl:min-h-0"
        />
      </div>
    </div>
  )
}

function ShipmentView({ decision, onDecide, onViewRoute }: { decision: Decision; onDecide: (decision: Decision) => void; onViewRoute: () => void }) {
  return (
    <div className="yj-scrollbar h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_--spacing(100)]">
        <div className="flex min-w-0 flex-col gap-4 max-xl:contents">
          <RouteCard shipment={SHIPMENT} route={ROUTE} readings={READINGS} proposal={PROPOSAL} decision={decision} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 max-xl:order-last lg:grid-cols-2">
            <Details
              shipment={SHIPMENT}
              onEdit={(field) =>
                toast(`Editing ${field === 'driver' ? 'driver' : 'delivery window'}`, {
                  description: `${SHIPMENT.id} · changes are logged on the timeline.`,
                })
              }
            />
            <Documents documents={DOCUMENTS} onDownload={(doc) => toast(`${doc.name} downloaded`)} compact />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4 max-xl:contents">
          <RiskCard shipment={SHIPMENT} route={ROUTE} proposal={PROPOSAL} decision={decision} onDecide={onDecide} onViewRoute={onViewRoute} />
          <ShipmentTimeline events={EVENTS} route={ROUTE} now={NOW} decision={decision} />
        </div>
      </div>
    </div>
  )
}

function Logistics({ theme, embedded = true, view: viewProp, defaultView = 'fleet', onViewChange, onReroute, className, ...rest }: LogisticsProps) {
  const [view, setViewState] = useControllableState<View>(viewProp, defaultView)
  const setView = (next: View) => {
    setViewState(next)
    onViewChange?.(next)
  }
  const harbor = useHarbor({ defaultSelectedId: null, onReroute })
  useMapKeys(harbor, view === 'fleet')
  const dispatch = useDispatch(SHIPMENT.id)
  // The shipment's reroute is the dispatch agent's proposal for its load: one decision, seen from both views.
  const decision = dispatch.decisions[REROUTE.id] ?? 'pending'
  const pending = dispatch.pending.length

  const page = (
    <AppPage
      {...rest}
      title="Logistics"
      actions={<NewLoadButton />}
      width="fill"
      // A tool: it fills the frame's height (or the viewport, standalone), and each view keeps that size.
      className={cn(embedded ? 'h-[calc(100dvh-(--spacing(16)))] min-h-160 text-fg' : 'mx-auto h-dvh min-h-160 max-w-400 text-fg', className)}
      classNames={{ body: 'min-h-0 flex-1' }}
    >
      <Tabs value={view} onValueChange={(next) => setView(next as View)} className="relative min-h-0 flex-1 gap-4">
        <TabsList aria-label="View">
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="dispatch">
            Dispatch
            {pending > 0 && (
              <Badge variant="secondary" size="sm" className="tabular-nums">
                {pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shipment">
            Shipment <span className="max-sm:hidden">{SHIPMENT.id}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fleet" className="min-h-0">
          <FleetView harbor={harbor} />
        </TabsContent>
        <TabsContent value="dispatch" className="min-h-0">
          <DispatchView state={dispatch} onOpenShipment={() => setView('shipment')} />
        </TabsContent>
        <TabsContent value="shipment" className="min-h-0">
          <ShipmentView
            decision={decision}
            onDecide={(next) => dispatch.decide(REROUTE.id, next)}
            onViewRoute={() => {
              dispatch.select(SHIPMENT.id)
              setView('dispatch')
            }}
          />
        </TabsContent>
      </Tabs>
    </AppPage>
  )

  return (
    <ThemeScope theme={theme}>
      <p aria-live="polite" className="sr-only">
        {harbor.announcement}
      </p>
      {embedded ? page : <main className="min-h-dvh bg-chrome">{page}</main>}
      <Toaster />
    </ThemeScope>
  )
}

export { Logistics }
export type { LogisticsProps, View as LogisticsView }
