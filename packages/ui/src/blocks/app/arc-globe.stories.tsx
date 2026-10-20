import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ArcGlobe } from './arc-globe'
import type { ArcGlobePlace, ArcGlobeVisit } from './arc-globe/data'

const meta: Meta<typeof ArcGlobe> = {
  title: 'Blocks/App/Arc Globe',
  component: ArcGlobe,
  // The gallery's picture: the demo stream, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'analytics.fieldnote.app/traffic/world' },
    docs: {
      description: {
        component:
          'Watch what comes in from around the world on a turning dot globe, each event arcing to the place that serves it, with live counts, totals, regions and top places for any way of cutting the figures and any period. Site visitors, card payments and flights read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ArcGlobe>

/** A site’s visitors landing from twenty countries, served by the nearest of four regions. */
export const Default: Story = { name: 'Site visitors' }

/** Frozen: no visitors stream in, for a still. */
export const Paused: Story = { args: { live: false } }

/** The docs site over the last 24 hours. */
export const DocsLastDay: Story = { name: 'Docs, last 24 hours', args: { defaultPeriod: '24h', defaultSite: 'docs' } }

const at = Date.UTC(2026, 9, 14, 14, 30, 0)
const place = (
  id: string,
  name: string,
  city: string,
  lng: number,
  lat: number,
  region: string,
  volume: number,
  weight: number,
  servedBy: string,
  code?: string,
): ArcGlobePlace => ({ id, name, city, lng, lat, region, volume, weight, servedBy, code })

const PAYMENT_PLACES: ArcGlobePlace[] = [
  place('US', 'United States', 'Chicago', -87.6, 41.9, 'americas', 9_400_000, 0.029, 'US', 'ORD'),
  place('CA', 'Canada', 'Toronto', -79.4, 43.7, 'americas', 1_450_000, 0.029, 'US'),
  place('MX', 'Mexico', 'Mexico City', -99.1, 19.4, 'americas', 820_000, 0.034, 'US'),
  place('BR', 'Brazil', 'São Paulo', -46.6, -23.5, 'americas', 1_120_000, 0.037, 'US'),
  place('GB', 'United Kingdom', 'London', -0.1, 51.5, 'europe', 3_100_000, 0.027, 'DE'),
  place('DE', 'Germany', 'Frankfurt', 8.7, 50.1, 'europe', 2_650_000, 0.025, 'DE', 'FRA'),
  place('FR', 'France', 'Paris', 2.35, 48.9, 'europe', 1_980_000, 0.026, 'DE'),
  place('ES', 'Spain', 'Madrid', -3.7, 40.4, 'europe', 940_000, 0.027, 'DE'),
  place('IN', 'India', 'Mumbai', 72.9, 19.1, 'apac', 1_240_000, 0.021, 'SG'),
  place('SG', 'Singapore', 'Singapore', 103.8, 1.35, 'apac', 760_000, 0.028, 'SG', 'SIN'),
  place('JP', 'Japan', 'Tokyo', 139.7, 35.7, 'apac', 2_020_000, 0.031, 'SG'),
  place('AU', 'Australia', 'Sydney', 151.2, -33.9, 'apac', 1_310_000, 0.03, 'SG'),
]
const PAYMENT_VISITS: ArcGlobeVisit[] = [
  { id: 5, from: 'JP', to: 'SG', label: 'Card ···· 4242', weight: 18, at },
  { id: 4, from: 'GB', to: 'DE', label: 'Card ···· 1881', weight: 6, at: at - 2000 },
  { id: 3, from: 'BR', to: 'US', label: 'Card ···· 9013', weight: 31, at: at - 4000 },
  { id: 2, from: 'IN', to: 'SG', label: 'Card ···· 5559', weight: 3, at: at - 6000 },
  { id: 1, from: 'FR', to: 'DE', label: 'Card ···· 7306', weight: 12, at: at - 8000 },
]

/** Fintech: card volume from twelve markets, each payment arcing to the processing region that clears it. The tile on the right is the decline rate. */
export const CardPayments: Story = {
  name: 'Card payments',
  args: {
    places: PAYMENT_PLACES,
    regions: [
      { id: 'americas', label: 'Americas', tone: 'chart-1' },
      { id: 'europe', label: 'Europe', tone: 'chart-2' },
      { id: 'apac', label: 'Asia-Pacific', tone: 'chart-3' },
    ],
    sites: [
      { id: 'all', label: 'All products' },
      { id: 'online', label: 'Online checkout', share: 0.64 },
      { id: 'terminal', label: 'In-person terminals', share: 0.36 },
    ],
    periods: [
      { id: 'day', label: '1D', name: 'Last 24 hours', days: 1, rate: { share: 0.047, change: 0.004 } },
      { id: 'week', label: '1W', name: 'Last 7 days', days: 7, rate: { share: 0.043, change: -0.002 } },
      { id: 'month', label: '1M', name: 'Last 30 days', days: 30, rate: { share: 0.041, change: -0.006 } },
    ],
    defaultPeriod: 'month',
    visits: PAYMENT_VISITS,
    now: { value: 412, change: 0.031 },
    format: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 },
    demoMarker: false,
    copy: {
      title: 'Card payments',
      subtitle: (n: number) => `${n} markets · payments clear live`,
      scope: 'Product',
      now: 'Payments per minute',
      primary: 'Volume processed',
      secondary: 'Fees earned',
      rate: 'Decline rate',
      topPlaces: 'Top markets',
      share: (percent: string) => `${percent} of volume`,
      globe: (n: number, top: string) => `Globe of ${n} markets, lit by volume; the most is from ${top}.`,
      hint: 'Drag to spin · pick a market to fly there',
      latest: 'Latest payments',
      waiting: 'Waiting for the next payment…',
      via: 'cleared in',
      units: (n: number) => `$${n} fee`,
      table: 'Volume by market',
      place: 'Market',
      pause: 'Pause live payments',
      resume: 'Resume live payments',
      announcePeriod: (period: string, volume: string) => `${period}: ${volume} processed`,
      announcePlace: (name: string, volume: string, share: string) => `${name}: ${volume} processed, ${share} of volume`,
      announceRegion: (name: string, volume: string) => `${name}: ${volume} processed`,
      announceLive: (live: boolean) => (live ? 'Live payments resumed' : 'Live payments paused'),
    },
  },
}

const FLIGHT_PLACES: ArcGlobePlace[] = [
  place('LHR', 'London Heathrow', 'London', -0.45, 51.47, 'europe', 6_100_000, 0.9, 'LHR', 'LHR'),
  place('CDG', 'Paris Charles de Gaulle', 'Paris', 2.55, 49.0, 'europe', 4_800_000, 0.8, 'LHR'),
  place('FRA', 'Frankfurt', 'Frankfurt', 8.57, 50.04, 'europe', 4_300_000, 0.8, 'LHR'),
  place('JFK', 'New York JFK', 'New York', -73.78, 40.64, 'americas', 5_600_000, 1.0, 'JFK', 'JFK'),
  place('YYZ', 'Toronto Pearson', 'Toronto', -79.63, 43.68, 'americas', 3_000_000, 1.1, 'JFK'),
  place('MEX', 'Mexico City', 'Mexico City', -99.07, 19.44, 'americas', 2_700_000, 1.2, 'JFK'),
  place('GRU', 'São Paulo Guarulhos', 'São Paulo', -46.47, -23.43, 'americas', 3_400_000, 1.3, 'JFK'),
  place('DXB', 'Dubai', 'Dubai', 55.36, 25.25, 'gulf', 5_200_000, 1.4, 'DXB', 'DXB'),
  place('DEL', 'Delhi', 'Delhi', 77.1, 28.56, 'asia', 3_900_000, 1.2, 'DXB'),
  place('SIN', 'Singapore Changi', 'Singapore', 103.99, 1.36, 'asia', 4_100_000, 1.0, 'SIN', 'SIN'),
  place('HND', 'Tokyo Haneda', 'Tokyo', 139.78, 35.55, 'asia', 5_000_000, 0.9, 'SIN'),
  place('SYD', 'Sydney', 'Sydney', 151.18, -33.94, 'asia', 3_200_000, 1.1, 'SIN'),
]
const FLIGHT_VISITS: ArcGlobeVisit[] = [
  { id: 5, from: 'SYD', to: 'SIN', label: 'SK 221', weight: 281, at },
  { id: 4, from: 'GRU', to: 'JFK', label: 'SK 904', weight: 243, at: at - 3000 },
  { id: 3, from: 'CDG', to: 'LHR', label: 'SK 17', weight: 164, at: at - 6000 },
  { id: 2, from: 'DEL', to: 'DXB', label: 'SK 612', weight: 302, at: at - 9000 },
  { id: 1, from: 'HND', to: 'SIN', label: 'SK 538', weight: 227, at: at - 12000 },
]

/** Travel: passengers from twelve airports, each departure arcing to the hub it connects through. The tile on the right is the share of flights delayed. */
export const Flights: Story = {
  name: 'Flights',
  args: {
    places: FLIGHT_PLACES,
    regions: [
      { id: 'americas', label: 'Americas', tone: 'chart-1' },
      { id: 'europe', label: 'Europe', tone: 'chart-2' },
      { id: 'gulf', label: 'Gulf', tone: 'chart-5' },
      { id: 'asia', label: 'Asia-Pacific', tone: 'chart-3' },
    ],
    sites: [
      { id: 'all', label: 'All cabins' },
      { id: 'economy', label: 'Economy', share: 0.82 },
      { id: 'premium', label: 'Premium and business', share: 0.18 },
    ],
    periods: [
      { id: 'today', label: 'Today', name: 'Today', days: 1, rate: { share: 0.168, change: 0.012 } },
      { id: 'week', label: '7D', name: 'Last 7 days', days: 7, rate: { share: 0.151, change: -0.008 } },
      { id: 'month', label: '30D', name: 'Last 30 days', days: 30, rate: { share: 0.144, change: -0.011 } },
    ],
    defaultPeriod: 'month',
    visits: FLIGHT_VISITS,
    now: { value: 187, change: -0.022 },
    demoMarker: false,
    copy: {
      title: 'Flights',
      subtitle: (n: number) => `${n} airports · departures in the air`,
      scope: 'Cabin',
      now: 'Flights in the air',
      primary: 'Passengers',
      secondary: 'Bags checked',
      rate: 'Delayed flights',
      topPlaces: 'Busiest airports',
      share: (percent: string) => `${percent} of passengers`,
      globe: (n: number, top: string) => `Globe of ${n} airports, lit by passengers; the most fly from ${top}.`,
      hint: 'Drag to spin · pick an airport to fly there',
      latest: 'Latest departures',
      waiting: 'Waiting for the next departure…',
      via: 'connecting through',
      units: (n: number) => `${n} seats`,
      table: 'Passengers by airport',
      place: 'Airport',
      pause: 'Pause live departures',
      resume: 'Resume live departures',
      announcePeriod: (period: string, volume: string) => `${period}: ${volume} passengers`,
      announcePlace: (name: string, volume: string, share: string) => `${name}: ${volume} passengers, ${share} of the total`,
      announceRegion: (name: string, volume: string) => `${name}: ${volume} passengers`,
      announceLive: (live: boolean) => (live ? 'Live departures resumed' : 'Live departures paused'),
    },
  },
}

/** Skeletons hold the globe’s, the lists’ and the figures’ place while the data loads. */
export const Loading: Story = { args: { loading: true, live: false } }

/** No places yet: the empty message in the globe’s place. */
export const Empty: Story = { args: { places: [], live: false } }

/** The load failed: the message with Retry in the globe’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the globe.', onRetry: fn(), live: false } }
