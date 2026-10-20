import type { RouteMapPoint, RouteMapRoute } from '../../../components/ui/route-map'

/* Lanefield's dispatch day, Monday Oct 5, 2026, at 11:58: five live loads on
 * one regional map, six drivers on the day's timeline, and three proposals
 * from the dispatch agent waiting on a person. Times are minutes after
 * midnight, so the page renders the same on the server and in the browser. */

export type LoadStatus = 'on-time' | 'at-risk' | 'delayed' | 'booked'
export type Priority = 'low' | 'medium' | 'high'

export interface Place {
  id: string
  name: string
  x: number
  y: number
}

export interface Load {
  id: string
  customer: string
  pallets: number
  status: LoadStatus
  priority: Priority
  origin: Place
  destination: Place
  /** Departure and ETA, minutes after midnight. */
  departs: number
  eta: number
  /** Minutes late against plan. */
  late?: number
  /** The driver's lane id, or none yet. */
  driver?: string
  /** Where the truck is now, for loads on the road. */
  at?: { x: number; y: number; detail: string }
  /** Driven, ahead and delayed stretches: waypoints between the stops. */
  driven?: (string | RouteMapPoint)[]
  ahead?: (string | RouteMapPoint)[]
  delayed?: (string | RouteMapPoint)[]
}

export interface Driver {
  id: string
  name: string
  detail: string
  available?: boolean
}

export type ProposalKind = 'reroute' | 'reassign' | 'assign'

export interface Proposal {
  id: string
  kind: ProposalKind
  load: string
  title: string
  description: string
  /** The gain, as one figure: "31 min". */
  saves: string
  /** For a reroute: the route it proposes, and the ETAs it weighs. */
  path?: (string | RouteMapPoint)[]
  via?: { current: string; proposed: string }
  etaNow?: number
  etaProposed?: number
  distance?: string
  /** For a reassignment or an assignment: who takes it, and when the run would be. */
  to?: string
  run?: { start: number; end: number }
}

export type Decision = 'pending' | 'approved' | 'dismissed'

export const NOW = 11 * 60 + 58
export const DAY_START = new Date(2026, 9, 5, 8).getTime()
/** A clock time as a timestamp on the day, for TimeLanes. */
export const at = (minutes: number) => DAY_START + (minutes - 8 * 60) * 60_000
export const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

const place = (id: string, name: string, x: number, y: number): Place => ({ id, name, x, y })
const HARBOR = place('harbor', 'Harbor DC', 12, 72)
const SUMMIT = place('summit', 'Summit DC', 86, 18)
const EASTGATE = place('eastgate', 'Eastgate', 84, 76)
const MILLBROOK = place('millbrook', 'Millbrook', 46, 64)
const AVERY = place('avery', 'Port Avery', 40, 90)
const CEDAR = place('cedar', 'Cedar Flats', 66, 10)
const WESTFIELD = place('westfield', 'Westfield', 18, 26)

export const DRIVERS: Driver[] = [
  { id: 'dana', name: 'Dana Okafor', detail: 'LD-4821' },
  { id: 'mateo', name: 'Mateo Silva', detail: 'LD-4930' },
  { id: 'priya', name: 'Priya Raman', detail: 'Available', available: true },
  { id: 'sam', name: 'Sam Whitfield', detail: 'LD-4962' },
  { id: 'aiyana', name: 'Aiyana Cole', detail: 'LD-4975' },
  { id: 'felix', name: 'Felix Brandt', detail: 'Off at 14:00', available: true },
]

export const LOADS: Load[] = [
  {
    id: 'LD-4821',
    customer: 'Pinecrest Grocers',
    pallets: 14,
    status: 'at-risk',
    priority: 'medium',
    origin: HARBOR,
    destination: SUMMIT,
    departs: 9 * 60 + 14,
    eta: 15 * 60 + 49,
    late: 47,
    driver: 'dana',
    at: { x: 43, y: 45, detail: '+47 min · speed −24%' },
    driven: ['harbor', [20, 65], [29, 55], [36, 49], 'now'],
    delayed: ['now', [53, 36], [64, 29]],
    ahead: [[64, 29], [76, 23], 'summit'],
  },
  {
    id: 'LD-4930',
    customer: 'Bluefin Supply',
    pallets: 8,
    status: 'delayed',
    priority: 'high',
    origin: EASTGATE,
    destination: MILLBROOK,
    departs: 10 * 60 + 5,
    eta: 13 * 60 + 23,
    late: 18,
    driver: 'mateo',
    at: { x: 66, y: 69, detail: '+18 min · dock queue' },
    driven: ['eastgate', [76, 74], 'now'],
    delayed: ['now', [56, 66], 'millbrook'],
  },
  {
    id: 'LD-4957',
    customer: 'Orchard Row',
    pallets: 22,
    status: 'booked',
    priority: 'low',
    origin: AVERY,
    destination: CEDAR,
    departs: 13 * 60 + 30,
    eta: 16 * 60 + 40,
    ahead: ['avery', [52, 70], [60, 44], [64, 24], 'cedar'],
  },
  {
    id: 'LD-4962',
    customer: 'Copperline Hardware',
    pallets: 6,
    status: 'on-time',
    priority: 'medium',
    origin: WESTFIELD,
    destination: SUMMIT,
    departs: 10 * 60 + 40,
    eta: 13 * 60 + 10,
    driver: 'sam',
    at: { x: 50, y: 21, detail: 'On time · ETA 13:10' },
    driven: ['westfield', [32, 24], 'now'],
    ahead: ['now', [70, 20], 'summit'],
  },
  {
    id: 'LD-4975',
    customer: 'Tidewater Market',
    pallets: 11,
    status: 'on-time',
    priority: 'medium',
    origin: HARBOR,
    destination: EASTGATE,
    departs: 11 * 60 + 20,
    eta: 14 * 60 + 5,
    driver: 'aiyana',
    at: { x: 30, y: 80, detail: 'On time · ETA 14:05' },
    driven: ['harbor', [20, 78], 'now'],
    ahead: ['now', [50, 84], [70, 82], 'eastgate'],
  },
]

export const PROPOSALS: Proposal[] = [
  {
    id: 'p-reroute',
    kind: 'reroute',
    load: 'LD-4821',
    title: 'Reroute LD-4821 via Ridge Rd',
    description: 'Congestion on Harbor Fwy has cut speed by 24%. The delivery window stays intact.',
    saves: '31 min',
    path: ['now', [52, 55], [66, 57], [78, 42], [84, 28], 'summit'],
    via: { current: 'Harbor Fwy', proposed: 'Ridge Rd' },
    etaNow: 15 * 60 + 49,
    etaProposed: 15 * 60 + 18,
    distance: '+4.2 mi',
  },
  {
    id: 'p-reassign',
    kind: 'reassign',
    load: 'LD-4930',
    title: 'Move LD-4930 to Priya Raman',
    description: 'Mateo has a dock appointment at 13:30 in Millbrook that overlaps this drop.',
    saves: '22 min',
    to: 'priya',
    run: { start: 12 * 60 + 15, end: 13 * 60 + 25 },
  },
  {
    id: 'p-assign',
    kind: 'assign',
    load: 'LD-4957',
    title: 'Assign LD-4957 to Felix Brandt',
    description: '4 mi from Port Avery with 6 h 40 min of drive time left today.',
    saves: 'Pickup on time',
    to: 'felix',
    run: { start: 13 * 60 + 30, end: 16 * 60 + 40 },
  },
]

/** The day's runs already on the board, beside the loads above. */
export const RUNS: { id: string; lane: string; start: number; end: number; label: string; done?: boolean }[] = [
  { id: 'r-dana-1', lane: 'dana', start: 8 * 60, end: 9 * 60, label: '4790', done: true },
  { id: 'r-mateo-1', lane: 'mateo', start: 8 * 60 + 10, end: 9 * 60 + 45, label: '4802', done: true },
  { id: 'r-priya-1', lane: 'priya', start: 8 * 60 + 30, end: 11 * 60 + 40, label: '4811', done: true },
  { id: 'r-sam-1', lane: 'sam', start: 8 * 60, end: 10 * 60 + 20, label: '4797', done: true },
  { id: 'r-aiyana-1', lane: 'aiyana', start: 8 * 60 + 40, end: 10 * 60 + 55, label: '4805', done: true },
  { id: 'r-felix-1', lane: 'felix', start: 8 * 60, end: 12 * 60 + 30, label: '4788' },
]

export const STATUS_LABEL: Record<LoadStatus, string> = { 'on-time': 'On time', 'at-risk': 'At risk', delayed: 'Delayed', booked: 'Booked' }
export const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' }

/** What the agent did on its own this morning: no approval needed. */
export const HANDLED: { id: string; text: string; time: string }[] = [
  { id: 'h1', text: 'Flagged 7 delays and opened exceptions', time: '10:38' },
  { id: 'h2', text: 'Drafted 4 customer ETA updates', time: '10:36' },
  { id: 'h3', text: 'Checked 212 driver logs for hours conflicts', time: '10:30' },
]

export type { RouteMapRoute }
