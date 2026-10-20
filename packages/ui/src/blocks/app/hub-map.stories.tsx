import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HubMap } from './hub-map'
import { HUBS, type HubMapHub, type HubMapLane } from './hub-map/data'

const meta: Meta<typeof HubMap> = {
  title: 'Blocks/App/Hub Map',
  component: HubMap,
  // The gallery's picture: the demo network, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'ops.parcelway.com/network/hubs' },
    docs: {
      description: {
        component:
          'Follow a network of hubs on a live world map: each hub’s volume and health, flows along the lanes between hubs, and the throughput, backlog and top lanes of the hub you pick. Parcels, flights and data centers read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof HubMap>

/** The hero: nine hubs, São Paulo behind on a customs backlog and picked, parcels running along every lane. */
export const Default: Story = { name: 'Parcel network' }

/** Halos sized by delayed parcels instead of volume: the backlogs stand out. */
export const Delays: Story = { args: { defaultMetric: 'delays', defaultHub: 'HKG' } }

/** Singapore halted by a storm: its ping turns danger and the lanes through it carry the warning tone. */
export const Closure: Story = {
  args: {
    defaultHub: 'SIN',
    hubs: HUBS.map((h) =>
      h.id === 'SIN'
        ? { ...h, status: 'halted', health: 0.41, backlog: 18_400 }
        : h.id === 'GRU'
          ? { ...h, status: 'onSchedule', health: 0.947, backlog: 360 }
          : h,
    ),
  },
}

/** Frozen: no drift and no parcels moving, for a still. */
export const Paused: Story = { args: { live: false } }

type Row = [id: string, city: string, lng: number, lat: number, volume: number, health: number, backlog: number, load: number, status: string]
const hubsOf = (rows: Row[]): HubMapHub[] =>
  rows.map(([id, city, lng, lat, volume, health, backlog, load, status]) => ({ id, city, lng, lat, volume, health, backlog, load, status }))
const lanesOf = (rows: [string, string, number, number][]): HubMapLane[] =>
  rows.map(([from, to, volume, time]) => ({ from, to, volume, time }))

/** Aviation: eight hubs with passengers per hour and the share of flights on time. Frankfurt is delayed by fog; the action reroutes its flights. */
export const AirlineRoutes: Story = {
  name: 'Airline routes',
  args: {
    live: false,
    defaultHub: 'FRA',
    statuses: [
      { id: 'onTime', label: 'On time', tone: 'success', healthy: true },
      { id: 'delayed', label: 'Delayed', tone: 'warning' },
      { id: 'grounded', label: 'Grounded', tone: 'danger' },
    ],
    metrics: [
      { id: 'passengers', label: 'Passengers', measure: 'volume' },
      { id: 'delays', label: 'Delays', measure: 'backlog' },
    ],
    thresholds: { backlog: 12 },
    hubs: hubsOf([
      ['JFK', 'New York', -73.78, 40.64, 9_800, 0.91, 7, 0.78, 'onTime'],
      ['GRU', 'São Paulo', -46.47, -23.43, 3_100, 0.94, 3, 0.52, 'onTime'],
      ['LHR', 'London', -0.46, 51.47, 11_200, 0.89, 9, 0.84, 'onTime'],
      ['FRA', 'Frankfurt', 8.57, 50.03, 8_600, 0.64, 26, 0.93, 'delayed'],
      ['DXB', 'Dubai', 55.36, 25.25, 10_400, 0.95, 4, 0.81, 'onTime'],
      ['SIN', 'Singapore', 103.99, 1.36, 7_900, 0.96, 3, 0.69, 'onTime'],
      ['HND', 'Tokyo', 139.78, 35.55, 8_300, 0.97, 2, 0.72, 'onTime'],
      ['SYD', 'Sydney', 151.18, -33.94, 3_900, 0.92, 4, 0.58, 'onTime'],
    ]),
    history: {
      FRA: [9_400, 9_200, 9_100, 8_900, 8_600, 8_500, 8_700, 8_600, 8_200, 8_400, 8_600, 8_600],
      LHR: [10_900, 11_000, 11_200, 11_300, 11_100, 11_200, 11_400, 11_200, 11_000, 11_100, 11_200, 11_200],
      JFK: [9_200, 9_400, 9_500, 9_700, 9_800, 9_900, 9_800, 9_700, 9_800, 9_900, 9_800, 9_800],
    },
    lanes: lanesOf([
      ['JFK', 'LHR', 2_100, 7],
      ['LHR', 'FRA', 1_300, 2],
      ['FRA', 'DXB', 1_500, 6],
      ['DXB', 'SIN', 1_200, 7],
      ['SIN', 'SYD', 800, 8],
      ['HND', 'SIN', 1_100, 7],
      ['GRU', 'LHR', 600, 11],
      ['SYD', 'HND', 700, 9],
    ]),
    onAction: fn(),
    copy: {
      title: 'Airline routes',
      exportCsv: 'Export schedule',
      openRunbook: 'Open disruption plan',
      throughput: 'Passengers boarding',
      health: 'Flights on time',
      healthy: 'Hubs on time',
      inTransit: 'Passengers in the air',
      map: 'Airline hubs on a world map, with the routes between them',
      acted: 'Rerouted',
      volume: 'Boarding',
      backlog: 'Late flights',
      load: 'Gate use',
      lastHour: 'Passengers boarded, last hour',
      lanes: 'Top routes',
      duration: 'Flight time',
      arcs: 'Routes between hubs',
      action: 'Reroute flights',
      actionPending: 'Rerouting…',
      resume: 'Resume flights',
      resumePending: 'Resuming…',
      actionNote: (id: string) => `${id} rerouted. Its flights are landing at nearby hubs.`,
      resumeNote: (id: string) => `${id} is accepting flights again.`,
      manifests: 'Schedules',
      updated: 'Updated every 5 min · times from flight data',
    },
  },
}

/** Tech: eight regions of a cloud provider, with traffic in gigabits per second and the share of probes under the latency target. Mumbai is down. */
export const DataCenterMesh: Story = {
  name: 'Data center mesh',
  args: {
    live: false,
    defaultHub: 'BOM',
    statuses: [
      { id: 'healthy', label: 'Healthy', tone: 'success', healthy: true },
      { id: 'degraded', label: 'Degraded', tone: 'warning' },
      { id: 'down', label: 'Down', tone: 'danger' },
    ],
    metrics: [
      { id: 'traffic', label: 'Traffic', measure: 'volume' },
      { id: 'errors', label: 'Errors', measure: 'backlog' },
    ],
    thresholds: { health: 0.99, backlog: 200, load: 0.8 },
    format: { notation: 'compact', maximumFractionDigits: 1 },
    durationFormat: { style: 'unit', unit: 'millisecond', maximumFractionDigits: 0 },
    hubs: hubsOf([
      ['PDX', 'Oregon', -122.68, 45.52, 640, 0.998, 42, 0.61, 'healthy'],
      ['IAD', 'Virginia', -77.45, 39.04, 1_240, 0.997, 88, 0.72, 'healthy'],
      ['GRU', 'São Paulo', -46.63, -23.55, 310, 0.992, 61, 0.55, 'healthy'],
      ['DUB', 'Dublin', -6.27, 53.35, 780, 0.996, 54, 0.66, 'healthy'],
      ['FRA', 'Frankfurt', 8.68, 50.11, 910, 0.986, 240, 0.84, 'degraded'],
      ['BOM', 'Mumbai', 72.88, 19.08, 40, 0.31, 3_800, 0.12, 'down'],
      ['SIN', 'Singapore', 103.82, 1.35, 560, 0.995, 77, 0.64, 'healthy'],
      ['NRT', 'Tokyo', 139.69, 35.68, 690, 0.998, 39, 0.58, 'healthy'],
    ]),
    history: {
      BOM: [410, 430, 420, 440, 430, 410, 380, 220, 90, 40, 40, 40],
      FRA: [820, 840, 870, 900, 910, 930, 900, 920, 940, 910, 900, 910],
      IAD: [1_180, 1_200, 1_220, 1_240, 1_260, 1_240, 1_230, 1_250, 1_240, 1_230, 1_240, 1_240],
    },
    lanes: lanesOf([
      ['PDX', 'IAD', 240, 62],
      ['IAD', 'DUB', 310, 74],
      ['DUB', 'FRA', 280, 22],
      ['FRA', 'BOM', 120, 118],
      ['BOM', 'SIN', 90, 58],
      ['SIN', 'NRT', 210, 68],
      ['NRT', 'PDX', 190, 104],
      ['IAD', 'GRU', 110, 118],
    ]),
    onAction: fn(),
    copy: {
      title: 'Backbone',
      subtitle: (n: number) => `Live · ${n} regions`,
      exportCsv: 'Export metrics',
      openRunbook: 'Open the failover runbook',
      throughput: 'Backbone traffic',
      unit: ' Gbps',
      health: 'On target',
      healthy: 'Regions healthy',
      inTransit: 'In flight (Mb)',
      map: 'Data center regions on a world map, with the links between them',
      hubs: 'Regions',
      acted: 'Drained',
      hubLabel: (id: string, city: string, status: string, volume: string, health: string) =>
        `${id}, ${city}, ${status}, ${volume}, ${health} of probes on target`,
      volume: 'Traffic',
      backlog: 'Errors',
      load: 'CPU use',
      lastHour: 'Traffic, last hour',
      lanes: 'Top links',
      duration: 'Latency',
      arcs: 'Links between regions',
      action: 'Drain region',
      actionPending: 'Draining…',
      resume: 'Restore region',
      resumePending: 'Restoring…',
      actionNote: (id: string) => `${id} drained. Its traffic is shifting to nearby regions.`,
      resumeNote: (id: string) => `${id} is taking traffic again.`,
      manifests: 'Incidents',
      updated: 'Probes every 30 s · from three vantage points',
    },
  },
}

/** Skeletons hold the map’s and the panel’s place while the data loads; the figures keep their size. */
export const Loading: Story = { args: { loading: true, live: false } }

/** No hubs yet: the empty message in the map’s place. */
export const Empty: Story = { args: { hubs: [], lanes: [], live: false } }

/** The load failed: the message with Retry in the map’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the network.', onRetry: fn(), live: false } }
