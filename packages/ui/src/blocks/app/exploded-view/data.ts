/** The five layers the drawing stacks, bottom to top. The drawing is fixed; their names and details are `parts`. */
export type PartId = 'chassis' | 'mainboard' | 'compute' | 'spreader' | 'lid'

/** A figure in parts: the number, then its unit set small and muted. */
export type ExplodedViewFigure = readonly [value: string, unit: string]

/** What a layer of the drawing is called, on the rail beside it and over the drawing. */
export interface ExplodedViewPart {
  id: PartId
  name: string
  detail: string
}

/** A line of the spec sheet and the layer it lights when pointed at. */
export interface ExplodedViewSpec {
  id: string
  label: string
  figures: ExplodedViewFigure[]
  part: PartId
}

export interface Layer {
  id: PartId
  /** Height in grid units. */
  h: number
  /** How far it sits in from the chassis' edge, grid units. */
  inset: number
  /** The wireframe for a part you see through (the lid). */
  wire?: boolean
}

export const LAYERS: Layer[] = [
  { id: 'chassis', h: 0.9, inset: 0 },
  { id: 'mainboard', h: 0.2, inset: 0.3 },
  { id: 'compute', h: 0.34, inset: 1.15 },
  { id: 'spreader', h: 0.22, inset: 0.55 },
  { id: 'lid', h: 0.7, inset: 0, wire: true },
]

export const PARTS: ExplodedViewPart[] = [
  { id: 'chassis', name: 'chassis', detail: 'die-cast, fanless' },
  { id: 'mainboard', name: 'mainboard', detail: '5G modem, 2 × 2.5 GbE' },
  { id: 'compute', name: 'compute module', detail: 'swappable, 26 TOPS' },
  { id: 'spreader', name: 'heat spreader', detail: 'vapor chamber' },
  { id: 'lid', name: 'lid', detail: 'four captive screws' },
]

/** A layer's entry in `parts` (an id with no entry shows as itself). */
export const partOf = (parts: ExplodedViewPart[], id: PartId): ExplodedViewPart => parts.find((p) => p.id === id) ?? { id, name: id, detail: '' }

/** Each figure and the part of the gateway it's about: hovering or focusing it lights that part. */
export const SPECS: ExplodedViewSpec[] = [
  { id: 'npu', label: 'NPU', figures: [['26', 'TOPS']], part: 'compute' },
  { id: 'power', label: 'Power', figures: [['9', 'W typ'], ['14', 'W peak']], part: 'chassis' },
  { id: 'thermal', label: 'Thermal', figures: [['−20 to +55', '°C']], part: 'spreader' },
  { id: 'radios', label: 'Radios', figures: [['5G · Wi-Fi 7', '']], part: 'mainboard' },
  { id: 'ethernet', label: 'Ethernet', figures: [['2 × 2.5', 'GbE']], part: 'mainboard' },
  { id: 'ingress', label: 'Ingress', figures: [['IP54', '']], part: 'lid' },
]

export const DEFAULT_COPY = {
  title: 'Relay R4',
  subtitle: 'edge gateway · rev C',
  status: 'In service · 412 units',
  more: 'More gateway actions',
  /** The drawing's name for assistive tech. */
  drawing: 'Relay R4 taken apart into five layers: chassis, mainboard, compute module, heat spreader and lid',
  view: 'View',
  assembled: 'Assembled',
  exploded: 'Exploded',
  /** Over the drawing, naming the part that's lit. */
  showing: (part: string) => part,
  headline: 'The compute module lifts out on its own',
  body: 'Four captive screws hold the lid and the heat spreader. Lift them off and the module unplugs from its connector, so an upgrade is a short site visit while the mainboard, the modem and its antennas stay sealed.',
  specs: 'Specifications',
  /** Read after a figure: the part it lights. */
  lights: (part: string) => `Shows the ${part} in the drawing`,
  statusLine: 'Rev C · shipping since Mar',
  datasheet: 'Datasheet',
  order: 'Order module',
  ordering: 'Ordering',
  ordered: 'Module ordered',
  /** Announced when the order goes through. */
  orderedAnnounce: 'Compute module ordered for Relay R4',
}

export type ExplodedViewCopy = typeof DEFAULT_COPY

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}
