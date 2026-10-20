'use client'

import { useId, type ComponentProps } from 'react'
import { Reveal } from '@youj/motion'
import { Drawer, DrawerContent } from '../../../../components/ui/drawer'
import { cn } from '../../../../lib/utils'
import { glass } from '../model'
import { DETAIL, EDGE, PANEL, type Harbor } from '../use-harbor'
import { FleetFigures } from './fleet-figures'
import { FleetMap } from './fleet-map'
import { LiveClock } from './live-clock'
import { MapControls } from './map-controls'
import { ShipmentsPanel } from './shipments-panel'
import { VesselDetail } from './voyage-detail'

/* The fleet map. From 1024px it fills the space it is given under floating
 * panels (ships, voyage, figures, controls); below it the map sits above the
 * list and a voyage opens in a Drawer. */

export function HarborView({ harbor, embedded = false, className, ...rest }: { harbor: Harbor; embedded?: boolean } & Omit<ComponentProps<'div'>, 'children'>) {
  const { floating, hud, clock, time, ships, selectedId, map, voyages, selected, detail, select, rerouteShips, open, insets, mapLabel } = harbor
  const drawerTitle = useId()

  const fleetMap = <FleetMap ref={map} voyages={voyages} selectedId={selectedId} onSelect={select} insets={insets} clock={clock} label={mapLabel} />

  // In the app's frame the map is a region of the page (the page owns `main`), filling what's left under its header.
  const Root = embedded ? 'div' : 'main'
  const own = embedded ? 'min-h-144 flex-1 rounded-xl border border-line' : ''

  if (floating) {
    return (
      <Root className={cn('relative overflow-hidden bg-canvas text-fg', embedded ? own : 'h-svh', className)} {...rest}>
        <section aria-label="Fleet map" className="absolute inset-0">
          {fleetMap}
        </section>

        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-end gap-3">
          <div className={cn('pointer-events-auto flex h-11 items-center rounded-xl px-3.5', glass)}>
            <LiveClock />
          </div>
        </div>

        <aside aria-label="Ships" className={cn('absolute start-3 top-3 bottom-3 z-10 flex w-[21rem] flex-col overflow-hidden rounded-2xl', glass)}>
          <ShipmentsPanel harbor={harbor} embedded={embedded} />
        </aside>

        <aside
          aria-label="Voyage"
          data-open={open ? 'true' : 'false'}
          inert={!open}
          className={cn(
            'absolute end-3 top-[4.25rem] bottom-3 z-10 w-[23rem] overflow-hidden rounded-2xl',
            glass,
            'transition-[translate,opacity] yj-duration-slow ease-emphasized',
            'data-[open=false]:pointer-events-none data-[open=false]:translate-x-[calc(100%+1.5rem)] data-[open=false]:opacity-0',
            'rtl:data-[open=false]:-translate-x-[calc(100%+1.5rem)]',
          )}
        >
          {detail && (
            <Reveal key={detail.id} inView={false} variant="fade" duration="fast" className="h-full">
              <VesselDetail ship={detail} time={time} onClose={() => select(null)} onReroute={(id) => rerouteShips([id])} />
            </Reveal>
          )}
        </aside>

        {hud && (
          <div
            className="absolute bottom-3 z-10 transition-[inset-inline-end] yj-duration-slow ease-emphasized"
            style={{ insetInlineStart: EDGE + PANEL + 12, insetInlineEnd: open ? EDGE + DETAIL + 12 : EDGE }}
          >
            <FleetFigures ships={ships} className="mx-auto max-w-3xl" />
          </div>
        )}

        <div
          className="absolute top-[4.25rem] z-10 transition-[inset-inline-end] yj-duration-slow ease-emphasized"
          style={{ insetInlineEnd: open ? EDGE + DETAIL + 12 : EDGE }}
        >
          <MapControls harbor={harbor} />
        </div>
      </Root>
    )
  }

  return (
    <Root className={cn('flex flex-col bg-canvas text-fg', embedded ? 'flex-1' : 'min-h-svh', className)} {...rest}>
      <section aria-label="Fleet map" className="relative h-[42svh] min-h-64 shrink-0 overflow-hidden">
        {fleetMap}
        <div className="absolute end-3 top-3">
          <MapControls harbor={harbor} />
        </div>
      </section>
      <div className="relative z-10 -mt-5 flex flex-1 flex-col rounded-t-3xl border-t border-line bg-canvas shadow-[0_-10px_28px_-22px_var(--color-fg)]">
        <span aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-well" />
        <aside aria-label="Ships" className="flex flex-1 flex-col">
          <ShipmentsPanel harbor={harbor} embedded={embedded} />
        </aside>
      </div>
      {/* The voyage's own heading names the drawer. */}
      <Drawer open={!!selected} onOpenChange={(next) => !next && select(null)}>
        <DrawerContent className="h-[88svh]" aria-labelledby={drawerTitle}>
          {detail && <VesselDetail ship={detail} time={time} titleId={drawerTitle} onReroute={(id) => rerouteShips([id])} />}
        </DrawerContent>
      </Drawer>
    </Root>
  )
}
