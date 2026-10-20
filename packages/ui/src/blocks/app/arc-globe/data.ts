export type ArcGlobeTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A region the places sit in: its color and name. */
export interface ArcGlobeRegion {
  id: string
  label: string
  tone: ArcGlobeTone
  /** Where the globe turns when the region is picked, degrees. Default: the middle of its places. */
  lat?: number
  lng?: number
}

/** A way to cut the figures, such as one site or one product line. */
export interface ArcGlobeSite {
  id: string
  label: string
  /** Its share of the figures, 0 to 1. Default 1. */
  share?: number
}

/** A span of time the figures are cut to. */
export interface ArcGlobePeriod {
  id: string
  /** On its button. */
  label: string
  /** For assistive tech. Default: the label. */
  name?: string
  /** How many days the span covers: the places' figures are for 30 days and scale to this. */
  days: number
  /** The rate shown in the fourth tile, with its change against the period before. */
  rate?: { share: number; change: number }
}

/** Something that sends to the globe, drawn at its city. */
export interface ArcGlobePlace {
  /** Short code shown in mono: "DE". */
  id: string
  name: string
  /** The city it is drawn at on the globe. */
  city: string
  /** Longitude of that city, degrees, east positive. */
  lng: number
  /** Latitude, degrees, north positive. */
  lat: number
  /** An `ArcGlobeRegion` id. */
  region: string
  /** The main count over the last 30 days. The other periods are drawn from it. */
  volume: number
  /** The secondary count per unit of volume, on average. */
  weight: number
  /** The place that serves it, by id: its own when it hosts one. */
  servedBy: string
  /** The code shown for a place that serves others: "FRA". */
  code?: string
}

/** One event: sent from `from`, served by `to` (the same place when it serves itself). */
export interface ArcGlobeVisit {
  id: number
  from: string
  to: string
  /** What it was, in mono: a page, a payment, a flight. */
  label: string
  /** Secondary units in the event. */
  weight: number
  /** Epoch milliseconds. */
  at: number
}

/** The figure beside the totals: how many are happening right now, and the change against an hour ago. */
export interface ArcGlobeNow {
  value: number
  /** As a fraction. */
  change: number
}

/** Regions in the order they list. */
export const REGIONS: ArcGlobeRegion[] = [
  { id: 'na', label: 'North America', tone: 'chart-1' },
  { id: 'eu', label: 'Europe', tone: 'chart-2' },
  { id: 'apac', label: 'Asia-Pacific', tone: 'chart-3' },
  { id: 'latam', label: 'Latin America', tone: 'chart-4' },
  { id: 'mea', label: 'Middle East & Africa', tone: 'chart-5' },
]

export const PLACES: ArcGlobePlace[] = [
  {
    id: 'US',
    name: 'United States',
    city: 'New York',
    lng: -74,
    lat: 40.7,
    region: 'na',
    volume: 1_240_000,
    weight: 2.9,
    servedBy: 'US',
    code: 'IAD',
  },
  { id: 'GB', name: 'United Kingdom', city: 'London', lng: -0.1, lat: 51.5, region: 'eu', volume: 412_000, weight: 3.1, servedBy: 'DE' },
  { id: 'DE', name: 'Germany', city: 'Frankfurt', lng: 8.7, lat: 50.1, region: 'eu', volume: 386_000, weight: 3.4, servedBy: 'DE', code: 'FRA' },
  { id: 'JP', name: 'Japan', city: 'Tokyo', lng: 139.7, lat: 35.7, region: 'apac', volume: 298_000, weight: 2.6, servedBy: 'SG' },
  { id: 'IN', name: 'India', city: 'Mumbai', lng: 72.9, lat: 19.1, region: 'apac', volume: 264_000, weight: 2.2, servedBy: 'SG' },
  { id: 'FR', name: 'France', city: 'Paris', lng: 2.35, lat: 48.9, region: 'eu', volume: 214_000, weight: 2.8, servedBy: 'DE' },
  { id: 'CA', name: 'Canada', city: 'Toronto', lng: -79.4, lat: 43.7, region: 'na', volume: 196_000, weight: 3.0, servedBy: 'US' },
  { id: 'BR', name: 'Brazil', city: 'São Paulo', lng: -46.6, lat: -23.5, region: 'latam', volume: 188_000, weight: 2.4, servedBy: 'BR', code: 'GRU' },
  { id: 'AU', name: 'Australia', city: 'Sydney', lng: 151.2, lat: -33.9, region: 'apac', volume: 172_000, weight: 2.7, servedBy: 'SG' },
  { id: 'NL', name: 'Netherlands', city: 'Amsterdam', lng: 4.9, lat: 52.4, region: 'eu', volume: 118_000, weight: 3.2, servedBy: 'DE' },
  { id: 'MX', name: 'Mexico', city: 'Mexico City', lng: -99.1, lat: 19.4, region: 'latam', volume: 112_000, weight: 2.1, servedBy: 'US' },
  { id: 'KR', name: 'South Korea', city: 'Seoul', lng: 127, lat: 37.6, region: 'apac', volume: 102_000, weight: 2.5, servedBy: 'SG' },
  { id: 'ES', name: 'Spain', city: 'Madrid', lng: -3.7, lat: 40.4, region: 'eu', volume: 96_000, weight: 2.3, servedBy: 'DE' },
  { id: 'SG', name: 'Singapore', city: 'Singapore', lng: 103.8, lat: 1.35, region: 'apac', volume: 64_000, weight: 3.3, servedBy: 'SG', code: 'SIN' },
  { id: 'SE', name: 'Sweden', city: 'Stockholm', lng: 18.1, lat: 59.3, region: 'eu', volume: 58_000, weight: 3.0, servedBy: 'DE' },
  { id: 'AR', name: 'Argentina', city: 'Buenos Aires', lng: -58.4, lat: -34.6, region: 'latam', volume: 52_000, weight: 2.2, servedBy: 'BR' },
  { id: 'CO', name: 'Colombia', city: 'Bogotá', lng: -74.1, lat: 4.7, region: 'latam', volume: 46_000, weight: 2.0, servedBy: 'US' },
  { id: 'AE', name: 'United Arab Emirates', city: 'Dubai', lng: 55.3, lat: 25.2, region: 'mea', volume: 44_000, weight: 2.9, servedBy: 'DE' },
  { id: 'NG', name: 'Nigeria', city: 'Lagos', lng: 3.4, lat: 6.5, region: 'mea', volume: 41_000, weight: 1.8, servedBy: 'DE' },
  { id: 'ZA', name: 'South Africa', city: 'Johannesburg', lng: 28, lat: -26.2, region: 'mea', volume: 38_000, weight: 2.3, servedBy: 'DE' },
]

export const PERIODS: ArcGlobePeriod[] = [
  { id: '24h', label: '24h', name: 'Last 24 hours', days: 1, rate: { share: 0.412, change: -0.021 } },
  { id: '7d', label: '7d', name: 'Last 7 days', days: 7, rate: { share: 0.397, change: -0.014 } },
  { id: '30d', label: '30d', name: 'Last 30 days', days: 30, rate: { share: 0.384, change: 0.012 } },
  { id: '90d', label: '90d', name: 'Last 90 days', days: 90, rate: { share: 0.391, change: -0.018 } },
]

/** A demo's fixed split: pass your own figures per site. */
export const SITES: ArcGlobeSite[] = [
  { id: 'all', label: 'All sites' },
  { id: 'www', label: 'fieldnote.app', share: 0.58 },
  { id: 'docs', label: 'docs.fieldnote.app', share: 0.31 },
  { id: 'shop', label: 'shop.fieldnote.app', share: 0.11 },
]

/** Happening in the last five minutes, across every site: the demo's baseline. */
export const NOW: ArcGlobeNow = { value: 1_284, change: 0.084 }

const PAGES = ['/', '/pricing', '/docs/quickstart', '/blog/launch-week', '/changelog', '/docs/api', '/customers', '/signup']

/** A small seeded generator, so the demo's figures are the same on the server and in the browser. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (text: string) => [...text].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)

export interface Figures {
  volume: number
  secondary: number
  /** Against the period before, as a fraction. */
  change: number
}

/** A place's volume, secondary count and change over a period: its 30 days scaled to the period, with a steady wobble of its own. */
export function figuresOf(place: ArcGlobePlace, period: ArcGlobePeriod): Figures {
  const random = seeded(hash(`${place.id}:${period.id}`))
  const volume = Math.round(((place.volume * period.days) / 30) * (0.86 + random() * 0.28))
  return { volume, secondary: Math.round(volume * place.weight), change: -0.07 + random() * 0.31 }
}

/** The demo's next visit: a place picked by volume, served by its nearest hub. */
export function nextVisit(places: ArcGlobePlace[], random: () => number, id: number, at: number): ArcGlobeVisit {
  const total = places.reduce((sum, c) => sum + c.volume, 0)
  let r = random() * total
  const from = places.find((c) => (r -= c.volume) < 0) ?? places[0]!
  const to = places.find((c) => c.id === from.servedBy) ?? from
  const weight = Math.max(1, Math.round(from.weight * Math.exp((random() + random() - 1) * 0.8)))
  return { id, from: from.id, to: to.id, label: PAGES[Math.floor(random() * PAGES.length)]!, weight, at }
}

export const DEFAULT_COPY = {
  title: 'Global traffic',
  subtitle: (places: number) => `${places} countries · visitors land live`,
  live: 'Live',
  paused: 'Paused',
  demoData: 'Demo data',
  pause: 'Pause live visitors',
  resume: 'Resume live visitors',
  period: 'Period',
  scope: 'Site',
  now: 'Visitors now',
  vsHourAgo: 'vs. an hour ago',
  primary: 'Visitors',
  secondary: 'Pageviews',
  rate: 'Bounce rate',
  vsPrevious: 'vs. previous period',
  regions: 'Regions',
  topPlaces: 'Top countries',
  share: (percent: string) => `${percent} of visitors`,
  globe: (places: number, top: string) => `Globe of ${places} countries, lit by visitors; the most come from ${top}.`,
  hint: 'Drag to spin · pick a country to fly there',
  latest: 'Latest visits',
  waiting: 'Waiting for the next visitor…',
  /** Read before the place that served an event (the arrow is a picture). */
  via: 'served from',
  units: (n: number) => (n === 1 ? '1 page' : `${n} pages`),
  /** Names the places' data table for assistive tech. */
  table: 'Visitors by country',
  place: 'Country',
  change: 'Change',
  announcePeriod: (period: string, volume: string) => `${period}: ${volume} visitors`,
  announceScope: (scope: string) => `Showing ${scope}`,
  announcePlace: (name: string, volume: string, share: string) => `${name}: ${volume} visitors, ${share} of traffic`,
  announceRegion: (name: string, volume: string) => `${name}: ${volume} visitors`,
  loadingLabel: 'Loading the globe',
  errorTitle: 'Couldn’t load the globe.',
  retry: 'Retry',
  emptyTitle: 'Nothing to show yet',
  emptyDescription: 'Places show up here as they report.',
  announceLive: (live: boolean): string => (live ? 'Live visitors resumed' : 'Live visitors paused'),
}

export type ArcGlobeCopy = typeof DEFAULT_COPY & {
  /** The locale counts, shares and times are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
