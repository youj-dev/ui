import type { ImageAnnotation } from '../../../components/ui/annotated-image'
import type { StepperStep } from '../../../components/ui/stepper'

/* Lanefield's shipment LD-4821 on Monday Oct 5, 2026 at 11:58: Pinecrest
 * Grocers' chilled load from Harbor DC to Summit DC, slowed on Harbor Fwy,
 * with the route agent's reroute via Ridge Rd waiting on a dispatcher. */

export type Decision = 'pending' | 'approved' | 'dismissed'

const day = (h: number, m: number) => new Date(2026, 9, 5, h, m).getTime()

/** The shipment: the lane, the delivery window and ETAs (as the dispatcher's clock writes them), the people and equipment, and the record. */
export interface ShipmentDetailShipment {
  id: string
  customer: string
  pallets: number
  from: string
  to: string
  window: string
  etaNow: string
  etaProposed: string
  /** Minutes behind plan on the current road. */
  late: number
  /** Minutes the detour saves. */
  saves: number
  driver: { name: string; unit: string; onDuty: string }
  trailer: string
  /** PO and bill of lading numbers. */
  reference: string
  /** The reefer's reading and whether it holds. */
  reefer: { reading: string; ok: boolean }
  load: string
  rate: { value: number; currency: string }
  /** When the vehicle last reported, shown under its picture. */
  lastReading: string
}

export const SHIPMENT: ShipmentDetailShipment = {
  id: 'LD-4821',
  customer: 'Pinecrest Grocers',
  pallets: 14,
  from: 'Harbor DC',
  to: 'Summit DC',
  window: '15:00–15:30',
  etaNow: '15:49',
  etaProposed: '15:18',
  late: 47,
  saves: 31,
  driver: { name: 'Dana Okafor', unit: 'V-204', onDuty: '6 h 12 min' },
  trailer: '53′ reefer TR-5531',
  reference: '77341 · 5531',
  reefer: { reading: '34.1°F · stable', ok: true },
  load: '14 of 26 pallets · 8,420 lb',
  rate: { value: 1842, currency: 'USD' },
  lastReading: '2 min ago',
}

/** The route as stops, where the vehicle is now, and the detour on offer: from one stop to another, by `via` instead of `road`. */
export interface ShipmentDetailRoute {
  steps: StepperStep[]
  current: number
  road: string
  detour: { from: number; to: number; via: string }
}

const STEPS: StepperStep[] = [
  { id: 'harbor', title: 'Harbor DC', description: 'Left 09:48' },
  { id: 'yard', title: 'North yard', description: 'Passed 10:41' },
  { id: 'fwy', title: 'Harbor Fwy', description: 'Speed −24%' },
  { id: 'junction', title: 'Ridge junction', description: 'ETA 12:55' },
  { id: 'summit', title: 'Summit DC', description: 'ETA 15:49' },
]

export const ROUTE: ShipmentDetailRoute = { steps: STEPS, current: 2, road: 'Harbor Fwy', detour: { from: 2, to: 4, via: 'Ridge Rd' } }

/** The vehicle's readings, each a numbered callout on its picture. */
export type ShipmentDetailReading = ImageAnnotation

/** Points on TruckArt (720 × 270), numbered in reading order: the reefer unit, the cab's window and the tank on the cab's side; the box and a rear wheel on the trailer's. */
export const READINGS: ShipmentDetailReading[] = [
  { id: 'reefer', x: 31.2, y: 25, title: 'Reefer', detail: '34.1°F · set 34°F' },
  { id: 'driver', x: 10.4, y: 36, title: 'Dana Okafor', detail: 'V-204 · 6 h 12 min on duty' },
  { id: 'fuel', x: 20.7, y: 73.7, title: 'Fuel · range', detail: '64% · 412 mi' },
  { id: 'load', x: 76, y: 42, title: 'Load', detail: '14 of 26 pallets · 8,420 lb' },
  { id: 'speed', x: 91.7, y: 81.9, title: 'Speed · Harbor Fwy', detail: '38 mph · −24%' },
]

export interface ShipmentDetailEvent {
  id: string
  type: 'pickup' | 'alert' | 'agent' | 'awaiting' | 'delivery' | 'approved'
  title: string
  detail: string
  time: number
}

export const EVENTS: ShipmentDetailEvent[] = [
  { id: 'e5', type: 'awaiting', title: 'Awaiting dispatcher approval', detail: 'Customer update drafted, not sent', time: day(11, 39) },
  { id: 'e4', type: 'agent', title: 'Reroute recommended via Ridge Rd', detail: 'Route agent · 92% confidence', time: day(11, 34) },
  { id: 'e3', type: 'alert', title: 'Traffic delay detected · +18 min', detail: 'Speed down 24% between North yard and Ridge junction', time: day(11, 32) },
  { id: 'e2', type: 'pickup', title: 'Picked up at Harbor DC, dock 4', detail: 'Dana Okafor · 14 pallets signed', time: day(9, 14) },
]

export interface ShipmentDetailDocument {
  id: string
  name: string
  detail: string
  status: 'signed' | 'pending' | 'filed'
}

export const DOCUMENTS: ShipmentDetailDocument[] = [
  { id: 'bol', name: 'Bill of lading', detail: 'BOL 77341-5531 · signed 09:14', status: 'signed' },
  { id: 'rate', name: 'Rate confirmation', detail: '$1,842.00 · Pinecrest Grocers', status: 'filed' },
  { id: 'temp', name: 'Temperature log', detail: 'Reefer TR-5531 · every 5 min', status: 'filed' },
  { id: 'pod', name: 'Proof of delivery', detail: 'Signature and photo at Summit DC', status: 'pending' },
]

/** The agent's case for the detour: who flagged it and when, its reasoning as label and line, and what the change gains. */
export interface ShipmentDetailProposal {
  agent: string
  /** "92% confidence · 26 min ago". */
  meta: string
  /** When it was flagged, on the route card: "26 min ago". */
  flagged: string
  reasons: [label: string, text: string][]
  facts: { label: string; value: string; tone?: 'success' | 'danger' }[]
  note: string
}

export const PROPOSAL: ShipmentDetailProposal = {
  agent: 'Route agent',
  meta: '92% confidence · 26 min ago',
  flagged: '26 min ago',
  reasons: [
    ['What happened', '47 min behind plan; lands 19 min after the window.'],
    ['Why', 'Congestion on Harbor Fwy near North yard, speed down 24%.'],
    ['Recommendation', 'Switch to Ridge Rd and tell the customer.'],
  ],
  facts: [
    { label: 'Time saved', value: '−31 min', tone: 'success' },
    { label: 'Extra distance', value: '+4.2 mi' },
    { label: 'Delivery window', value: 'Kept', tone: 'success' },
  ],
  note: 'Needs your approval: a route change is a high-impact action.',
}

export const NOW = day(11, 58)

/** A moment as the dispatcher's 24-hour clock: "11:58". */
export const clock = (time: number) => {
  const date = new Date(time)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
