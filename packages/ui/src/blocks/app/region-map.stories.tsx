import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RegionMap } from './region-map'
import type { RegionMapRegion } from './region-map/data'

const meta: Meta<typeof RegionMap> = {
  title: 'Blocks/App/Region Map',
  component: RegionMap,
  // The gallery's picture: the demo regions, without their Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See where activity comes from on a world map, region by region: its share of the total, its rate and a reading that flags the ones in trouble. Network traffic, ride requests and store sales read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RegionMap>

/** An edge network’s requests per second from ten points of presence; São Paulo is slow. */
export const Default: Story = { name: 'API traffic' }

/** Frozen: no live drift, for a still. */
export const Paused: Story = { args: { live: false } }

/** The last 24 hours: São Paulo recovers under the slow line. */
export const LastDay: Story = { name: 'Last 24 hours', args: { defaultRange: '24h', live: false } }

type Row = [id: string, city: string, lng: number, lat: number, value: number, reading: number, failures: number]
const regionsOf = (rows: Row[]): RegionMapRegion[] =>
  rows.map(([id, city, lng, lat, value, reading, failures]) => ({ id, city, lng, lat, value, reading, failures }))

const RIDES = {
  now: regionsOf([
    ['bog', 'Bogotá', -74.07, 4.71, 410, 3.8, 0.012],
    ['mex', 'Mexico City', -99.13, 19.43, 640, 4.6, 0.018],
    ['sao', 'São Paulo', -46.63, -23.55, 880, 5.2, 0.021],
    ['los', 'Lagos', 3.38, 6.52, 330, 3.4, 0.011],
    ['cai', 'Cairo', 31.24, 30.04, 520, 8.7, 0.064],
    ['bom', 'Mumbai', 72.88, 19.08, 970, 6.9, 0.047],
    ['mnl', 'Manila', 120.98, 14.6, 280, 3.9, 0.013],
    ['cgk', 'Jakarta', 106.85, -6.21, 760, 4.1, 0.014],
  ]),
  today: regionsOf([
    ['bog', 'Bogotá', -74.07, 4.71, 350, 3.6, 0.011],
    ['mex', 'Mexico City', -99.13, 19.43, 590, 4.2, 0.016],
    ['sao', 'São Paulo', -46.63, -23.55, 810, 4.9, 0.019],
    ['los', 'Lagos', 3.38, 6.52, 300, 3.3, 0.01],
    ['cai', 'Cairo', 31.24, 30.04, 480, 5.4, 0.026],
    ['bom', 'Mumbai', 72.88, 19.08, 920, 6.1, 0.038],
    ['mnl', 'Manila', 120.98, 14.6, 260, 3.7, 0.012],
    ['cgk', 'Jakarta', 106.85, -6.21, 700, 4.0, 0.013],
  ]),
  week: regionsOf([
    ['bog', 'Bogotá', -74.07, 4.71, 330, 3.7, 0.011],
    ['mex', 'Mexico City', -99.13, 19.43, 570, 4.3, 0.017],
    ['sao', 'São Paulo', -46.63, -23.55, 790, 4.8, 0.018],
    ['los', 'Lagos', 3.38, 6.52, 290, 3.2, 0.01],
    ['cai', 'Cairo', 31.24, 30.04, 450, 4.8, 0.021],
    ['bom', 'Mumbai', 72.88, 19.08, 880, 5.7, 0.031],
    ['mnl', 'Manila', 120.98, 14.6, 250, 3.6, 0.012],
    ['cgk', 'Jakarta', 106.85, -6.21, 680, 3.9, 0.013],
  ]),
}

/** Mobility: ride requests per minute from eight cities, with the average pickup wait as the reading. Cairo and Mumbai are backed up; the action pages more drivers. */
export const RideRequests: Story = {
  name: 'Ride requests',
  args: {
    live: false,
    snapshots: RIDES,
    ranges: [
      { id: 'now', label: 'Now', name: 'last 15 min', previous: 4_980 },
      { id: 'today', label: 'Today', name: 'today so far', previous: 4_620 },
      { id: 'week', label: '7D', name: 'last 7 days', previous: 4_410 },
    ],
    readingFormat: { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 1 },
    threshold: 6,
    defaultRegion: 'cai',
    onAction: fn(),
    copy: {
      title: 'Ride requests',
      scope: 'emerging markets',
      more: 'More dispatch actions',
      openLogs: 'Open dispatch log',
      measure: 'Requests',
      unit: 'req/min',
      reading: 'Avg pickup wait',
      failures: 'Unfulfilled',
      regionsLabel: 'Cities',
      regionCount: (count: number, flagged: number) => `${count} cities${flagged ? ` · ${flagged} backed up` : ''}`,
      map: 'Ride requests by city on a world map',
      mapLabel: 'Requests by city',
      region: 'City',
      valueHead: 'Requests/min',
      readingHead: 'Wait',
      flagged: 'Backed up',
      footer: 'Dispatch · {count} cities',
      action: 'Page more drivers',
      actionPending: 'Paging…',
      actionDone: 'Drivers paged',
      logs: 'Open dispatch log',
    },
  },
}

const SALES = {
  hour: regionsOf([
    ['pdx', 'Portland', -122.68, 45.52, 18_400, 0.031, 0.021],
    ['sea', 'Seattle', -122.33, 47.61, 24_900, 0.044, 0.026],
    ['den', 'Denver', -104.99, 39.74, 15_200, 0.052, 0.024],
    ['aus', 'Austin', -97.74, 30.27, 21_700, 0.119, 0.03],
    ['chi', 'Chicago', -87.63, 41.88, 33_800, 0.047, 0.022],
    ['atl', 'Atlanta', -84.39, 33.75, 27_100, 0.068, 0.028],
    ['nyc', 'New York', -74.0, 40.71, 46_300, 0.083, 0.031],
    ['bos', 'Boston', -71.06, 42.36, 22_600, 0.039, 0.019],
  ]),
  day: regionsOf([
    ['pdx', 'Portland', -122.68, 45.52, 17_100, 0.034, 0.02],
    ['sea', 'Seattle', -122.33, 47.61, 23_400, 0.041, 0.025],
    ['den', 'Denver', -104.99, 39.74, 14_800, 0.049, 0.023],
    ['aus', 'Austin', -97.74, 30.27, 20_300, 0.071, 0.027],
    ['chi', 'Chicago', -87.63, 41.88, 31_900, 0.045, 0.021],
    ['atl', 'Atlanta', -84.39, 33.75, 26_200, 0.061, 0.026],
    ['nyc', 'New York', -74.0, 40.71, 44_800, 0.074, 0.03],
    ['bos', 'Boston', -71.06, 42.36, 21_900, 0.037, 0.018],
  ]),
  week: regionsOf([
    ['pdx', 'Portland', -122.68, 45.52, 16_400, 0.033, 0.02],
    ['sea', 'Seattle', -122.33, 47.61, 22_800, 0.04, 0.024],
    ['den', 'Denver', -104.99, 39.74, 14_300, 0.047, 0.022],
    ['aus', 'Austin', -97.74, 30.27, 19_600, 0.064, 0.026],
    ['chi', 'Chicago', -87.63, 41.88, 30_700, 0.044, 0.021],
    ['atl', 'Atlanta', -84.39, 33.75, 25_400, 0.058, 0.025],
    ['nyc', 'New York', -74.0, 40.71, 43_100, 0.07, 0.029],
    ['bos', 'Boston', -71.06, 42.36, 21_200, 0.036, 0.018],
  ]),
}

/** Retail: sales per hour from eight metro areas, in dollars, with the stockout rate as the reading. Austin is running out of stock. */
export const StoreSales: Story = {
  name: 'Store sales',
  args: {
    live: false,
    snapshots: SALES,
    ranges: [
      { id: 'hour', label: 'Hour', name: 'this hour', previous: 196_000 },
      { id: 'day', label: 'Day', name: 'today', previous: 205_000 },
      { id: 'week', label: 'Week', name: 'this week', previous: 189_000 },
    ],
    format: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 },
    readingFormat: { style: 'percent', maximumFractionDigits: 1 },
    threshold: 0.1,
    defaultRegion: 'aus',
    onAction: fn(),
    copy: {
      title: 'Sales',
      scope: 'US stores',
      more: 'More sales actions',
      exportCsv: 'Export sales',
      openLogs: 'Open the stock report',
      measure: 'Sales',
      unit: 'per hour',
      reading: 'Stockout rate',
      failures: 'Refund rate',
      regionsLabel: 'Metro areas',
      regionCount: (count: number, flagged: number) => `${count} areas${flagged ? ` · ${flagged} low` : ''}`,
      map: 'Sales by metro area on a world map',
      mapLabel: 'Sales by metro area',
      region: 'Metro area',
      valueHead: 'Sales/h',
      readingHead: 'Stockouts',
      flagged: 'Low stock',
      footer: 'Point of sale · {count} metro areas',
      action: 'Ship stock',
      actionPending: 'Placing order…',
      actionDone: 'Stock on the way',
      logs: 'Open the stock report',
    },
  },
}

/** Skeletons hold the figures’, the map’s and the table’s place while the data loads. */
export const Loading: Story = { args: { loading: true, live: false } }

/** No regions yet: the empty message in the map’s place. */
export const Empty: Story = { args: { snapshots: { '5m': [] }, live: false } }

/** The load failed: the message with Retry in the map’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the regions.', onRetry: fn(), live: false } }
