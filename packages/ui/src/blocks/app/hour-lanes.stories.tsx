import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HourLanes } from './hour-lanes'

const meta: Meta<typeof HourLanes> = {
  title: 'Blocks/App/Hour Lanes',
  component: HourLanes,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See when things happen, by lane: a lane of dots per source, entrance or channel across the day, the busiest bucket flagged, and an Off-hours switch that keeps the night in color, with the peak, the off-hours share and the night’s busiest lane below.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof HourLanes>

/** A swell around `peak` hour over a quiet floor, one value per hour. */
const hours = (peak: number, height: number, width: number, floor: number) =>
  Array.from({ length: 24 }, (_, h) => Math.round(floor + height * Math.exp(-((h - peak) ** 2) / (2 * width * width))))

/** The last 7 days by half-hour: identity and mail peak at lunch, network at night. */
export const Default: Story = { name: 'Security alerts' }

/** Off-hours on: 19:00 to 07:00 in color, the working day quiet. */
export const OffHours: Story = { name: 'Off-hours', args: { defaultShowOffHours: true } }

/** Other data: hourly buckets for three sources, an office day of 08:00 to 18:00, German words, and the switch in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    offHours: [18, 8],
    lanes: [
      {
        id: 'edr',
        label: 'Geräte',
        tone: 'chart-1',
        values: [9, 8, 7, 7, 6, 7, 12, 22, 38, 44, 41, 39, 36, 40, 42, 38, 30, 20, 14, 12, 11, 10, 10, 9],
      },
      {
        id: 'fw',
        label: 'Firewall',
        tone: 'chart-2',
        values: [30, 34, 38, 36, 28, 20, 14, 12, 12, 13, 12, 12, 12, 12, 12, 13, 14, 16, 20, 24, 26, 28, 29, 30],
      },
      { id: 'sso', label: 'Anmeldung', tone: 'chart-3', values: [2, 1, 1, 1, 1, 3, 9, 26, 40, 30, 22, 18, 20, 24, 20, 16, 12, 8, 5, 4, 3, 3, 2, 2] },
    ],
    copy: {
      title: 'Alarme nach Uhrzeit',
      subtitle: 'Letzte 30 Tage',
      zone: 'MEZ',
      offHours: 'Außerhalb der Bürozeit',
      countLabel: (count: string) => `${count} Alarme`,
      peak: (time: string, count: string) => `Spitze ${time} · ${count}`,
      peakHour: 'Spitze',
      offHoursShare: 'Nachts',
      nightLead: 'Nachts vorn',
    },
    onShowOffHoursChange: fn(),
  },
}

/** Retail: visits to an all-night store by entrance, with the overnight hours in color. */
export const StoreVisits: Story = {
  name: 'Store visits',
  args: {
    offHours: [22, 6],
    defaultShowOffHours: true,
    lanes: [
      { id: 'main', label: 'Main door', tone: 'chart-1', values: hours(17, 310, 3.5, 12) },
      { id: 'garage', label: 'Garage', tone: 'chart-5', values: hours(18, 190, 4, 22) },
      { id: 'side', label: 'Side door', tone: 'chart-3', values: hours(12, 90, 2.5, 6) },
      { id: 'pickup', label: 'Pickup', tone: 'chart-4', values: hours(19, 70, 2, 4) },
    ],
    copy: {
      title: 'Visits by hour',
      subtitle: 'Last 30 days · Harbor Street',
      zone: 'ET',
      offHours: 'Overnight',
      chartLabel: 'Visits by time of day, per entrance',
      countLabel: (count: string) => `${count} visits`,
      peakHour: 'Busiest hour',
      offHoursShare: 'Overnight',
      nightLead: 'Overnight lead',
    },
  },
}

/** Operations: support contacts by channel, in thousands, with the hours outside the desk's shift in color. */
export const SupportCalls: Story = {
  name: 'Support calls',
  args: {
    offHours: [18, 8],
    lanes: [
      { id: 'phone', label: 'Phone', tone: 'chart-2', values: hours(11, 1300, 2.8, 60) },
      { id: 'chat', label: 'Chat', tone: 'chart-4', values: hours(14, 980, 3.6, 90) },
      { id: 'email', label: 'Email', tone: 'chart-3', values: hours(9, 720, 3.2, 140) },
    ],
    format: (count: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(count),
    copy: {
      title: 'Contacts by hour',
      subtitle: 'This quarter',
      zone: 'CET',
      offHours: 'After hours',
      chartLabel: 'Contacts by time of day, per channel',
      countLabel: (count: string) => `${count} contacts`,
      peakHour: 'Peak hour',
      offHoursShare: 'After hours',
      nightLead: 'After-hours lead',
    },
  },
}

/** Skeletons hold the lanes’ place while the data loads; the foot’s figures wait too. */
export const Loading: Story = { args: { loading: true } }

/** Nothing counted: the empty message in the lanes’ place. */
export const Empty: Story = { args: { lanes: [] } }

/** The load failed: the message with Retry in the lanes’ place. */
export const Error: Story = { args: { error: 'Couldn’t load the counts.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
