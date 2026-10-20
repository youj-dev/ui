import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HealthDial, type HealthDialPart, type HealthDialSignal, type HealthDialSnapshot } from './health-dial'

const meta: Meta<typeof HealthDial> = {
  title: 'Blocks/App/Health Dial',
  component: HealthDial,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Check how one thing is doing with a health dial, the signals behind it and the parts it is made of: a service and its regions, a patient and their monitors, a wind farm and its turbines.',
      },
    },
  },
  args: { onClose: () => {} },
}
export default meta
type Story = StoryObj<typeof HealthDial>

export const Default: Story = { name: 'API service' }

/** The last 15 minutes: the index back in the nominal zone and the error budget well under its line. */
export const LastQuarterHour: Story = { name: 'Last 15 minutes', args: { defaultRange: '15m' } }

const ledger = (index: number, saturation: number, budget: number, connections: number, lagging: boolean): HealthDialSnapshot => ({
  index,
  signals: [
    { id: 'saturation', label: 'Saturation', value: saturation, thresholds: [{ value: 80, tone: 'warning', label: 'High' }] },
    { id: 'budget', label: 'Error budget used', value: budget, thresholds: [{ value: 75, tone: 'warning', label: 'High' }] },
    { id: 'connections', label: 'Open connections', value: connections, max: 800, format: {} },
  ],
  parts: [
    { id: 'fra', label: 'eu-fra-1', measures: [820, 96], status: 'nominal' },
    { id: 'iad', label: 'us-iad-2', measures: [1240, lagging ? 740 : 120], status: lagging ? 'lagging' : 'nominal' },
  ],
})

/** A bank's ledger service: its own regions, pool, wording and handlers. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    subject: 'ledger-api',
    capacity: 4,
    snapshots: { '15m': ledger(91, 38, 14, 220, false), '6h': ledger(68, 71, 52, 610, true), '3d': ledger(83, 49, 33, 410, false) },
    copy: { title: 'Ledger health', capacity: 'Nodes' },
    onRangeChange: fn(),
    onRebalance: fn(),
    onAddCapacity: fn(),
    onClose: fn(),
  },
}

const meter = (id: string, label: string, value: number, max: number, bad: number, tone: 'warning' | 'danger' = 'warning'): HealthDialSignal => ({
  id,
  label,
  value,
  max,
  format: {},
  thresholds: [{ value: bad, tone, label: tone === 'danger' ? 'Critical' : 'Elevated' }],
})

const vitals = (index: number, heart: number, oxygen: number, pressure: number, drifting: string | null): HealthDialSnapshot => ({
  index,
  signals: [
    meter('heart', 'Heart rate (bpm)', heart, 200, 110),
    { id: 'oxygen', label: 'Oxygen saturation', value: oxygen },
    meter('pressure', 'Systolic pressure (mmHg)', pressure, 200, 140, 'danger'),
  ],
  parts: ['Bedside monitor', 'Pulse oximeter', 'Blood pressure cuff'].map(
    (label, i): HealthDialPart => ({ id: `m${i}`, label, measures: [[60, 12, 4][i]!, [2, 5, 15][i]!], status: label === drifting ? 'drifting' : 'steady' }),
  ),
})

/** Health: a patient's vitals as the signals, an early-warning score on the dial, the monitors as the parts. */
export const PatientVitals: Story = {
  name: 'Patient vitals',
  args: {
    subject: 'Bed 14 · N. Okafor',
    ranges: [
      { id: '1h', label: '1H' },
      { id: '8h', label: '8H' },
      { id: '24h', label: '24H' },
    ],
    defaultRange: '8h',
    snapshots: {
      '1h': vitals(88, 76, 97, 124, null),
      '8h': vitals(61, 112, 93, 148, 'Pulse oximeter'),
      '24h': vitals(72, 96, 95, 136, null),
    },
    statuses: [
      { id: 'steady', label: 'steady', tone: 'success' },
      { id: 'drifting', label: 'drifting', tone: 'warning', action: true, then: 'rechecked' },
      { id: 'rechecked', label: 'rechecked', tone: 'muted' },
    ],
    format: { measures: [(n) => `${n} reads/min`, (n) => `every ${n}s`] },
    capacity: 3,
    copy: {
      title: 'Patient status',
      index: 'Stability score',
      nominal: 'Stable',
      strained: 'Watch',
      critical: 'Unstable',
      signals: 'Vitals',
      parts: 'Monitors',
      rebalance: 'Recheck',
      rebalanceFrom: (part: string) => `Recheck ${part}`,
      rebalancing: 'Checking…',
      capacity: 'Care team',
      capacityValue: (n: number) => `${n} nurses`,
      addCapacity: 'Call a nurse',
      adding: 'Calling…',
    },
  },
}

const turbines = (index: number, wind: number, load: number, output: number, down: string | null): HealthDialSnapshot => ({
  index,
  signals: [meter('wind', 'Wind speed (m/s)', wind, 25, 20), { id: 'load', label: 'Grid load', value: load, thresholds: [{ value: 90, tone: 'warning', label: 'High' }] }, meter('output', 'Output (MW)', output, 60, 55)],
  parts: [
    ['t01', 'T-01', 3.1, 14],
    ['t02', 'T-02', 2.9, 13],
    ['t03', 'T-03', down ? 0.6 : 3, down ? 4 : 14],
    ['t04', 'T-04', 0, 0],
  ].map(([id, label, mw, rpm]): HealthDialPart => ({ id: id as string, label: label as string, measures: [mw as number, rpm as number], status: id === 't04' ? 'serviced' : id === down ? 'curtailed' : 'generating' })),
})

/** Energy: a wind farm's turbines as the parts and its availability on the dial; a curtailed turbine offers a restart. */
export const WindFarm: Story = {
  name: 'Wind farm',
  args: {
    subject: 'Ridgeline North',
    ranges: [
      { id: 'now', label: 'Now' },
      { id: 'day', label: 'Day' },
      { id: 'week', label: 'Week' },
    ],
    defaultRange: 'day',
    snapshots: { now: turbines(94, 11, 62, 34, null), day: turbines(81, 14, 77, 41, 't03'), week: turbines(88, 9, 58, 29, null) },
    statuses: [
      { id: 'generating', label: 'generating', tone: 'success' },
      { id: 'curtailed', label: 'curtailed', tone: 'warning', action: true, then: 'generating' },
      { id: 'serviced', label: 'in service', tone: 'muted' },
    ],
    format: { measures: [(n) => `${n} MW`, (n) => `${n} rpm`] },
    capacity: 12,
    copy: {
      title: 'Farm availability',
      index: 'Availability',
      critical: 'Down',
      strained: 'Reduced',
      nominal: 'Full',
      signals: 'Conditions',
      parts: 'Turbines',
      rebalance: 'Restart',
      rebalanceFrom: (part: string) => `Restart ${part}`,
      rebalancing: 'Restarting…',
      capacity: 'Installed',
      capacityValue: (n: number) => `${n} turbines`,
      addCapacity: 'Add turbine',
      adding: 'Adding…',
    },
  },
}

/** Skeletons in the body's shape; the foot's count waits too. */
export const Loading: Story = { args: { loading: true } }

/** The window has no snapshot yet. */
export const Empty: Story = { args: { snapshots: {} } }

/** The check failed: the message and Retry take the body's place at its size. */
export const Error: Story = { args: { error: 'Couldn’t reach the metrics service.', onRetry: fn() } }
