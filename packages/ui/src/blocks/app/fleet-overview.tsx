'use client'

import type { HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { AppPage } from '../../components/ui/app-page'
import { Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import { HarborView } from './fleet-overview/components/harbor-view'
import type { Tracked } from './fleet-overview/model'
import { useHarbor } from './fleet-overview/use-harbor'
import { useMapKeys } from './fleet-overview/use-map-keys'

/* An ocean-freight fleet on a map, content only (the app's frame brings the
 * navigation): a dot map of the world with the ships steaming along their
 * lanes (FleetMap), under floating panels. The shipments panel has Tabs for
 * sailing, holding and in port (PresenceList rows with live progress),
 * search and the fleet's figures; picking a ship, in the list or on the map,
 * eases the camera to its voyage and opens it: route Progress, an ETA that
 * rolls, the voyage log (Timeline), the manifest (Pagination) and contacts.
 * A storm over the Bay of Biscay holds two ships. Rerouting them (from the
 * map's Alert or the held ship's voyage) redraws their lanes west of the
 * storm, rolls their ETAs on and empties Holding; `onReroute` runs the real
 * request first. It fills the space it is given (the screen's height by
 * default: set `className`). Below 1024px the map sits above the list and a
 * voyage opens in a Drawer. Keys: / searches, J and K step through the list,
 * + and − zoom, 0 frames, Esc closes the voyage.
 * Demo content — edit after adding. Reduced motion: ships hold still; lanes
 * and the camera arrive at once. */

interface FleetOverviewProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** Wraps the screen in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, with the map filling the page under it. Default true; `false` draws its own page (a full-viewport map under its panels). */
  embedded?: boolean
  /** The voyage open on the map at first (on wide screens), by ship id. `null` opens on the whole fleet. Default the first held ship. */
  defaultSelectedId?: string | null
  /** Reroutes the held ships; resolve when the request is done. Default: a short demo wait. */
  onReroute?: (ships: Tracked[]) => Promise<unknown> | unknown
}

function FleetOverview({ theme, embedded = true, defaultSelectedId = 'nordic-tern', onReroute, className, ...rest }: FleetOverviewProps) {
  const harbor = useHarbor({ defaultSelectedId, onReroute })
  useMapKeys(harbor)

  return (
    <ThemeScope theme={theme}>
      <p aria-live="polite" className="sr-only">
        {harbor.announcement}
      </p>
      {embedded ? (
        <AppPage {...rest} title="Fleet overview" width="fill" className={cn('text-fg', className)} classNames={{ body: 'min-h-[calc(100dvh-(--spacing(16)))]' }}>
          <HarborView harbor={harbor} embedded />
        </AppPage>
      ) : (
        <HarborView harbor={harbor} className={className} {...rest} />
      )}
      <Toaster />
    </ThemeScope>
  )
}

export { FleetOverview }
export type { FleetOverviewProps }
