import type { LonLat } from './geo'

/* Sample fleet for the Logistics example: ports, sea lanes and the vessels on
 * them. Vessels, carriers and people are invented. Times are relative to the
 * load, so the voyage log always reads as recent. */

export interface Port {
  code: string
  name: string
  country: string
  at: LonLat
  /** Where its label sits on the map: after the mark (default), before it, above or below. */
  label?: 'end' | 'start' | 'above' | 'below'
  /** Berths in use, and in all. */
  berths: [used: number, total: number]
  /** Hours a ship waits at anchor for a berth today. */
  wait: number
}

export const PORTS: Record<string, Port> = {
  RTM: { code: 'RTM', name: 'Rotterdam', country: 'Netherlands', at: [4.3, 51.95], label: 'start', berths: [7, 9], wait: 2 },
  HAM: { code: 'HAM', name: 'Hamburg', country: 'Germany', at: [9.95, 53.55], label: 'above', berths: [4, 7], wait: 0 },
  NYC: { code: 'NYC', name: 'New York', country: 'United States', at: [-74.0, 40.6], label: 'below', berths: [5, 8], wait: 0 },
  SSZ: { code: 'SSZ', name: 'Santos', country: 'Brazil', at: [-46.3, -23.95], berths: [3, 6], wait: 4 },
  PSD: { code: 'PSD', name: 'Port Said', country: 'Egypt', at: [32.3, 31.26], label: 'above', berths: [2, 5], wait: 0 },
  JEA: { code: 'JEA', name: 'Jebel Ali', country: 'United Arab Emirates', at: [55.03, 25.0], label: 'below', berths: [6, 10], wait: 1 },
  CMB: { code: 'CMB', name: 'Colombo', country: 'Sri Lanka', at: [79.85, 6.95], label: 'above', berths: [3, 7], wait: 0 },
  SIN: { code: 'SIN', name: 'Singapore', country: 'Singapore', at: [103.8, 1.26], label: 'below', berths: [11, 12], wait: 6 },
  SHA: { code: 'SHA', name: 'Shanghai', country: 'China', at: [121.8, 31.2], berths: [9, 12], wait: 3 },
  PUS: { code: 'PUS', name: 'Busan', country: 'South Korea', at: [129.04, 35.1], label: 'above', berths: [5, 9], wait: 0 },
  DUR: { code: 'DUR', name: 'Durban', country: 'South Africa', at: [31.05, -29.87], label: 'below', berths: [2, 6], wait: 0 },
  SYD: { code: 'SYD', name: 'Sydney', country: 'Australia', at: [151.2, -33.86], label: 'start', berths: [3, 5], wait: 0 },
}

export type AlertId = 'storm'

export interface FleetAlert {
  id: AlertId
  tone: 'warning' | 'danger' | 'info'
  title: string
  body: string
  /** The ship it's about, to open on the map. */
  ship: string
  action: string
  pending: string
  done: string
  /** What happened, once it's resolved. */
  resolution: string
  /** Hours before the load it was raised. */
  raised: number
}

export const ALERTS: FleetAlert[] = [
  {
    id: 'storm', tone: 'warning', ship: 'nordic-tern', raised: 5,
    title: 'Storm cell over the Bay of Biscay',
    body: 'Nordic Tern and Cape Lumen are holding. A lane west of the cell adds about a day.',
    action: 'Reroute 2 ships', pending: 'Rerouting…', done: 'Rerouted',
    resolution: 'Nordic Tern and Cape Lumen rerouted west of the storm cell.',
  },
]

/* Sea lanes as waypoints. Shared stretches are spelled out once. */
const CHANNEL: LonLat[] = [[2.2, 51.3], [-1.2, 50.2], [-5.3, 49.2]]
const BISCAY: LonLat[] = [[-8.8, 46.4], [-10.2, 43.2], [-9.9, 38.8], [-6.6, 36.0]]
/** West of the storm: out into the Atlantic and back in at Gibraltar. */
const BISCAY_DETOUR: LonLat[] = [[-12.5, 49.8], [-16.0, 45.5], [-15.2, 39.5], [-10.5, 37.2], [-6.6, 36.0]]
const MED_TO_SIN: LonLat[] = [
  [-1.5, 36.4], [5.0, 37.6], [11.2, 37.4], [15.5, 35.3], [22.0, 34.2], [28.5, 32.9], [32.3, 31.3], [32.55, 29.9], [34.0, 27.3], [37.3, 22.0],
  [40.2, 16.6], [43.4, 12.6], [47.0, 12.2], [52.5, 12.6], [60.0, 11.2], [70.0, 8.0], [80.5, 5.6], [88.0, 5.8], [95.0, 5.9], [98.6, 4.0], [101.0, 2.8], [103.8, 1.26],
]
const SIN_TO_SHA: LonLat[] = [[106.0, 3.0], [109.5, 8.5], [111.5, 14.5], [114.8, 20.0], [118.0, 23.2], [119.8, 24.8], [122.2, 28.2], [122.4, 30.6], [121.8, 31.2]]
const SANTOS_NORTH: LonLat[] = [[-46.3, -23.95], [-40.5, -22.0], [-34.0, -9.0], [-29.5, 0.0], [-25.5, 14.0], [-19.5, 25.0], [-14.5, 35.0]]
const ATLANTIC: LonLat[] = [[-74.0, 40.6], [-68.0, 40.8], [-55.0, 43.5], [-40.0, 47.2], [-25.0, 49.3], [-12.0, 49.9], [-5.8, 49.6], [-1.2, 50.2], [2.2, 51.3], [4.3, 51.95]]

export const ROUTES = {
  'rtm-sin': [[4.3, 51.95], ...CHANNEL, ...BISCAY, ...MED_TO_SIN],
  'ham-sha': [[9.95, 53.55], [8.3, 54.0], [4.2, 53.1], ...CHANNEL, ...BISCAY, ...MED_TO_SIN, ...SIN_TO_SHA],
  'ham-sha-detour': [[9.95, 53.55], [8.3, 54.0], [4.2, 53.1], ...CHANNEL, ...BISCAY_DETOUR, ...MED_TO_SIN, ...SIN_TO_SHA],
  'ssz-rtm': [...SANTOS_NORTH, [-11.0, 42.5], [-7.5, 47.3], [-4.5, 49.3], [-1.2, 50.2], [2.2, 51.3], [4.3, 51.95]],
  'ssz-rtm-detour': [...SANTOS_NORTH, [-17.5, 41.5], [-15.5, 47.5], [-9.0, 50.2], [-4.5, 49.9], [-1.2, 50.2], [2.2, 51.3], [4.3, 51.95]],
  'nyc-rtm': ATLANTIC,
  'rtm-nyc': [...ATLANTIC].reverse(),
  'dur-sin': [[31.05, -29.87], [36.0, -31.0], [48.0, -28.0], [62.0, -19.0], [78.0, -8.0], [90.0, 1.0], [95.3, 6.3], [98.6, 4.0], [101.0, 2.8], [103.8, 1.26]],
  'pus-jea': [
    [129.04, 35.1], [127.5, 33.0], [123.5, 29.5], [120.8, 25.6], [118.0, 23.2], [114.8, 20.0], [111.5, 14.5], [109.5, 8.5], [106.0, 3.0], [103.8, 1.26],
    [101.0, 2.8], [98.6, 4.0], [95.0, 5.9], [88.0, 5.8], [80.5, 5.6], [73.0, 9.5], [65.0, 16.0], [60.5, 21.5], [57.8, 25.6], [56.6, 26.4], [55.03, 25.0],
  ],
  'sin-syd': [
    [103.8, 1.26], [106.0, -2.5], [110.0, -5.3], [114.5, -6.0], [115.8, -8.6], [115.7, -10.5], [113.5, -15.0], [111.5, -22.0], [111.5, -30.0],
    [114.5, -35.8], [124.0, -36.0], [132.0, -35.8], [139.0, -37.8], [144.5, -39.8], [149.5, -38.2], [151.6, -35.0], [151.2, -33.86],
  ],
  'sin-rtm': [...MED_TO_SIN].reverse().concat([...BISCAY].reverse(), [...CHANNEL].reverse(), [[4.3, 51.95]]),
} satisfies Record<string, LonLat[]>

export type RouteId = keyof typeof ROUTES

/** The storm cell over the Bay of Biscay: its center and radius in degrees. */
export const STORM = { at: [-9.5, 45.2] as LonLat, radius: 4.5, name: 'Storm cell, Bay of Biscay' }

export type ShipmentStatus = 'on-time' | 'delayed' | 'rerouted' | 'arrived'

export interface Contact {
  name: string
  role: string
  email: string
}

export interface VoyageEvent {
  id: string
  type: 'load' | 'depart' | 'waypoint' | 'canal' | 'weather' | 'reroute' | 'customs' | 'arrive'
  title: string
  /** Hours before the load. */
  ago: number
}

export interface Shipment {
  id: string
  vessel: string
  imo: string
  /** The booking reference on the bill of lading. */
  booking: string
  route: RouteId
  /** Where to put the detour when the storm clears. */
  detour?: RouteId
  from: string
  to: string
  status: ShipmentStatus
  /** Share of the voyage done at load, 0–1. Delayed ships hold here. */
  progress: number
  /** Knots while under way. */
  speed: number
  teu: number
  /** Days to arrival at load (for arrived ships: days since). */
  eta: number
  /** Why it's late, for delayed ships. */
  hold?: string
  master: string
  agent: Contact
  log: VoyageEvent[]
}

const AGENTS: Record<string, Contact> = {
  SHA: { name: 'Wei Zhang', role: 'Port agent, Shanghai', email: 'wei.zhang@harbor.app' },
  RTM: { name: 'Femke de Vries', role: 'Terminal operations, Rotterdam', email: 'femke@harbor.app' },
  SIN: { name: 'Mei Lin Tan', role: 'Port agent, Singapore', email: 'meilin@harbor.app' },
  JEA: { name: 'Omar Haddad', role: 'Port agent, Jebel Ali', email: 'omar@harbor.app' },
  SYD: { name: 'Isla Moore', role: 'Port agent, Sydney', email: 'isla@harbor.app' },
  NYC: { name: 'Marcus Bell', role: 'Terminal operations, New York', email: 'marcus@harbor.app' },
}

let eventId = 0
const log = (entries: [VoyageEvent['type'], string, number][]): VoyageEvent[] =>
  entries.map(([type, title, ago]) => ({ id: `e${++eventId}`, type, title, ago }))

export const SHIPMENTS: Shipment[] = [
  {
    id: 'nordic-tern', vessel: 'Nordic Tern', imo: '9784312', booking: 'HBR-24-80153', route: 'ham-sha', detour: 'ham-sha-detour',
    from: 'HAM', to: 'SHA', status: 'delayed', progress: 0.058, speed: 17.2, teu: 11_480, eta: 31.5,
    hold: 'Holding west of Ushant until the storm cell passes', master: 'Capt. Ingrid Solberg', agent: AGENTS.SHA!,
    log: log([['load', 'Loaded 11,480 TEU at Burchardkai', 74], ['depart', 'Departed Hamburg', 62], ['waypoint', 'Cleared the Dover Strait', 30], ['weather', 'Holding position: storm cell over the Bay of Biscay', 5]]),
  },
  {
    id: 'cape-lumen', vessel: 'Cape Lumen', imo: '9812047', booking: 'HBR-24-79920', route: 'ssz-rtm', detour: 'ssz-rtm-detour',
    from: 'SSZ', to: 'RTM', status: 'delayed', progress: 0.72, speed: 15.8, teu: 6_240, eta: 5.8,
    hold: 'Slow steaming off the Canaries, waiting on a weather window', master: 'Capt. Rafael Moura', agent: AGENTS.RTM!,
    log: log([['load', 'Loaded 6,240 TEU at Santos', 290], ['depart', 'Departed Santos', 280], ['waypoint', 'Crossed the Equator', 150], ['weather', 'Slowed to 9 knots ahead of the storm cell', 8]]),
  },
  {
    id: 'astra-meridian', vessel: 'Astra Meridian', imo: '9701855', booking: 'HBR-24-78814', route: 'rtm-sin',
    from: 'RTM', to: 'SIN', status: 'on-time', progress: 0.63, speed: 17.6, teu: 14_020, eta: 8.4, master: 'Capt. Lena Okafor', agent: AGENTS.SIN!,
    log: log([['depart', 'Departed Rotterdam', 330], ['waypoint', 'Passed Gibraltar', 250], ['canal', 'Transited the Suez Canal in convoy', 150], ['waypoint', 'Cleared Bab-el-Mandeb', 98], ['customs', 'Pre-cleared for Singapore', 20]]),
  },
  {
    id: 'halcyon-bay', vessel: 'Halcyon Bay', imo: '9745230', booking: 'HBR-24-81007', route: 'nyc-rtm',
    from: 'NYC', to: 'RTM', status: 'on-time', progress: 0.56, speed: 18.4, teu: 8_860, eta: 3.1, master: 'Capt. Daniel Reyes', agent: AGENTS.RTM!,
    log: log([['load', 'Loaded 8,860 TEU at Port Newark', 150], ['depart', 'Departed New York', 138], ['waypoint', 'Passed the Grand Banks', 70]]),
  },
  {
    id: 'orient-pearl', vessel: 'Orient Pearl', imo: '9820416', booking: 'HBR-24-80468', route: 'pus-jea',
    from: 'PUS', to: 'JEA', status: 'on-time', progress: 0.47, speed: 16.9, teu: 9_310, eta: 9.8, master: 'Capt. Min-jun Park', agent: AGENTS.JEA!,
    log: log([['depart', 'Departed Busan', 230], ['waypoint', 'Called at Singapore for bunkers', 44], ['waypoint', 'Entered the Strait of Malacca', 30]]),
  },
  {
    id: 'blue-heron', vessel: 'Blue Heron', imo: '9690321', booking: 'HBR-24-79377', route: 'dur-sin',
    from: 'DUR', to: 'SIN', status: 'on-time', progress: 0.34, speed: 15.2, teu: 4_150, eta: 6.9, master: 'Capt. Thandi Nkosi', agent: AGENTS.SIN!,
    log: log([['load', 'Loaded 4,150 TEU at Durban', 110], ['depart', 'Departed Durban', 98], ['waypoint', 'Rounded Madagascar', 40]]),
  },
  {
    id: 'kestrel-point', vessel: 'Kestrel Point', imo: '9758844', booking: 'HBR-24-80790', route: 'sin-syd',
    from: 'SIN', to: 'SYD', status: 'on-time', progress: 0.41, speed: 17.1, teu: 5_520, eta: 7.5, master: 'Capt. Hana Sato', agent: AGENTS.SYD!,
    log: log([['depart', 'Departed Singapore', 120], ['waypoint', 'Passed the Lombok Strait', 64], ['customs', 'Biosecurity papers lodged for Sydney', 12]]),
  },
  {
    id: 'saltmarsh', vessel: 'Saltmarsh', imo: '9733105', booking: 'HBR-24-81142', route: 'rtm-nyc',
    from: 'RTM', to: 'NYC', status: 'on-time', progress: 0.22, speed: 18.8, teu: 7_900, eta: 6.1, master: 'Capt. Owen Hughes', agent: AGENTS.NYC!,
    log: log([['load', 'Loaded 7,900 TEU at Maasvlakte II', 60], ['depart', 'Departed Rotterdam', 48], ['waypoint', 'Cleared the English Channel', 20]]),
  },
  {
    id: 'silver-gannet', vessel: 'Silver Gannet', imo: '9688172', booking: 'HBR-24-77301', route: 'sin-rtm',
    from: 'SIN', to: 'RTM', status: 'arrived', progress: 1, speed: 0, teu: 12_700, eta: 2, master: 'Capt. Pieter Jansen', agent: AGENTS.RTM!,
    log: log([['canal', 'Transited the Suez Canal', 270], ['depart', 'Passed Gibraltar', 170], ['arrive', 'Berthed at Maasvlakte II', 48], ['customs', 'Cleared customs, 12,700 TEU released', 30]]),
  },
  {
    id: 'northern-lark', vessel: 'Northern Lark', imo: '9771406', booking: 'HBR-24-77958', route: 'dur-sin',
    from: 'DUR', to: 'SIN', status: 'arrived', progress: 1, speed: 0, teu: 3_980, eta: 1, master: 'Capt. Sipho Dlamini', agent: AGENTS.SIN!,
    log: log([['depart', 'Departed Durban', 360], ['arrive', 'Berthed at Pasir Panjang', 24], ['customs', 'Discharge started', 20]]),
  },
  {
    id: 'coral-drift', vessel: 'Coral Drift', imo: '9709934', booking: 'HBR-24-78245', route: 'rtm-nyc',
    from: 'RTM', to: 'NYC', status: 'arrived', progress: 1, speed: 0, teu: 6_870, eta: 0.2, master: 'Capt. Maeve Byrne', agent: AGENTS.NYC!,
    log: log([['depart', 'Departed Rotterdam', 205], ['arrive', 'Berthed at Port Elizabeth', 5]]),
  },
]

/* ── Manifest ───────────────────────────────────────────────────────────── */

export interface Container {
  id: string
  size: '20′ DV' | '40′ HC' | '40′ RF'
  cargo: string
  /** Gross tonnes. */
  weight: number
  state: string
  hold?: boolean
}

const CARGO = ['Machine parts', 'Green coffee', 'Pharmaceuticals', 'Cotton textiles', 'Auto parts', 'Flat-pack furniture', 'Consumer electronics', 'Wine', 'Solar panels', 'Frozen seafood', 'Paper rolls', 'Bicycles']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** ISO 6346's check digit: letters take the values 10–38, skipping multiples of 11. */
function checkDigit(code: string) {
  const values: Record<string, number> = {}
  let v = 10
  for (const c of LETTERS) {
    if (v % 11 === 0) v++
    values[c] = v++
  }
  const sum = [...code].reduce((total, c, i) => total + (values[c] ?? Number(c)) * 2 ** i, 0)
  return (sum % 11) % 10
}

/** The containers aboard, deterministic per ship. */
export function manifest(shipment: Shipment): Container[] {
  let seed = [...shipment.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0
  const next = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296)
  const count = 18 + Math.floor(next() * 18)
  return Array.from({ length: count }, () => {
    const serial = String(100000 + Math.floor(next() * 899999))
    const owner = next() > 0.35 ? 'HBRU' : 'TDWU'
    const reefer = next() > 0.78
    const cargo = reefer ? (next() > 0.5 ? 'Frozen seafood' : 'Pharmaceuticals') : CARGO[Math.floor(next() * CARGO.length)]!
    const hold = next() > 0.93
    const temperature = (4 + next() * 1.5).toFixed(1)
    return {
      id: `${owner} ${serial} ${checkDigit(owner + serial)}`,
      size: reefer ? '40′ RF' : next() > 0.45 ? '40′ HC' : '20′ DV',
      cargo,
      weight: Math.round((8 + next() * 20) * 10) / 10,
      state: hold ? 'Held for inspection' : reefer ? `Reefer ${temperature} °C` : next() > 0.6 ? 'Customs cleared' : 'Sealed',
      hold,
    }
  })
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return new Promise((resolve) => setTimeout(resolve, ms))
}
