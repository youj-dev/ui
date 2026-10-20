import type { TimelineEvent } from '../../../components/ui/timeline'
import { dateTimeFormat, numberFormat as numFormat } from '../../../lib/utils'
import { ROUTES, type RouteId, type Shipment, type ShipmentStatus } from './data'
import { buildRoute, nearestProgress, pointAt, project, type Route } from './geo'

/* The fleet as the app tracks it: each ship's voyage along its lane on the
 * simulation clock, and the camera's contract with the map. */

export interface Voyage {
  id: string
  vessel: string
  /** Which lane it's on; a reroute changes it, and the new lane draws itself in. */
  routeId: string
  route: Route
  status: ShipmentStatus
  /** Progress (0–1) at simulation time `t0`. */
  p0: number
  t0: number
  /** Progress per simulated second; 0 holds the ship where it is. */
  rate: number
  from: string
  to: string
}

/** Moving ships stop just short of the berth: arriving is a status change, not an animation. */
const CAP = 0.985

export function progressAt(voyage: Voyage, time: number) {
  return voyage.rate ? Math.min(CAP, voyage.p0 + voyage.rate * (time - voyage.t0)) : voyage.p0
}

/** Simulated seconds, advanced by the map's loop. */
export interface SimClock {
  time: number
}

export interface MapInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface FleetMapHandle {
  zoomBy: (factor: number) => void
  /** Frames the selection (or the whole fleet) again. */
  fit: () => void
}

export type Group = 'transit' | 'delayed' | 'arrived'

export interface Tracked extends Shipment {
  routeId: RouteId
  geo: Route
  /** Progress at simulation time t0, and progress per simulated second. */
  p0: number
  t0: number
  rate: number
  events: TimelineEvent[]
}

/** Map units per knot per simulated second: calm enough to read, quick enough to see. */
const MAP_SPEED = 0.04
const HOUR = 3_600_000
export const DAY = 24 * HOUR

const geometry = new Map<RouteId, Route>()
function geo(id: RouteId) {
  let route = geometry.get(id)
  if (!route) geometry.set(id, (route = buildRoute(ROUTES[id])))
  return route
}

/** Where each held ship waits: the last waypoint before the storm, shared with its detour. */
const HOLD: Record<string, readonly [number, number]> = { 'nordic-tern': [-5.3, 49.2], 'cape-lumen': [-14.5, 35.0] }

export const groupOf = (status: ShipmentStatus): Group => (status === 'delayed' ? 'delayed' : status === 'arrived' ? 'arrived' : 'transit')

export function track(shipment: Shipment, loadedAt: number): Tracked {
  const route = geo(shipment.route)
  const hold = HOLD[shipment.id]
  const p0 = hold && shipment.status === 'delayed' ? nearestProgress(route, ...project(hold)) : shipment.progress
  return {
    ...shipment,
    routeId: shipment.route,
    geo: route,
    p0,
    t0: 0,
    rate: shipment.status === 'on-time' ? (shipment.speed * MAP_SPEED) / route.length : 0,
    events: shipment.log.map((e) => ({ id: e.id, type: e.type, title: e.title, time: loadedAt - e.ago * HOUR })),
  }
}

export function voyageOf(ship: Tracked): Voyage {
  return { id: ship.id, vessel: ship.vessel, routeId: ship.routeId, route: ship.geo, status: ship.status, p0: ship.p0, t0: ship.t0, rate: ship.rate, from: ship.from, to: ship.to }
}

/** Sends a held ship west of the storm: same position, new lane, a later ETA. */
export function reroute(ship: Tracked, time: number): Tracked {
  if (ship.status !== 'delayed' || !ship.detour) return ship
  const route = geo(ship.detour)
  const here = pointAt(ship.geo, progressAt(voyageOf(ship), time))
  const extra = ship.id === 'nordic-tern' ? 1.4 : 0.9
  return {
    ...ship,
    status: 'rerouted',
    routeId: ship.detour,
    geo: route,
    p0: nearestProgress(route, here.x, here.y),
    t0: time,
    rate: (ship.speed * MAP_SPEED) / route.length,
    eta: ship.eta + extra,
    hold: undefined,
    events: [
      ...ship.events,
      { id: `${ship.id}-reroute`, type: 'reroute', title: `Rerouted west of the storm cell, ETA +${extra} days`, summary: 'Rerouted west of the storm cell', time: Date.now() },
    ],
  }
}

/** How far along a ship is now. */
export const progressOf = (ship: Tracked, time: number) => (ship.status === 'arrived' ? 1 : progressAt(voyageOf(ship), time))

/** Nautical miles along a lane: a degree of arc is 60 nm, and the map draws four units to the degree. */
export const nauticalMiles = (route: Route) => Math.round((route.length / 4) * 60)

export const dateFormat = (locale: string) => dateTimeFormat(locale, { month: 'short', day: 'numeric' })
export const numberFormat = (locale: string) => numFormat(locale)
export const initials = (name: string) =>
  name
    .replace(/^Capt\. /, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

/** A surface that floats over the map. */
export const glass = 'border border-line bg-canvas/85 youj-allow-glass shadow-lg backdrop-blur-xl'
