import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { StatusCard } from './status'
import { SERVICES_INCIDENT } from './status/data'

const meta: Meta<typeof StatusCard> = {
  title: 'Blocks/App/Status',
  component: StatusCard,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Show your team how every service is doing, in a card inside your app, with the uptime, the error budget and each service over 90 days.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StatusCard>

export const Default: Story = { name: 'Product services' }

/** Storage is failing uploads today: the pill turns to a partial outage and the footer names the incident. */
export const Incident: Story = { args: { services: SERVICES_INCIDENT } }

// Thirty days of your own monitoring, ending Jan 30, 2027: a seeded wobble, one bad day on the queue.
const month = (id: string, name: string, seed: number, bad?: number) => ({
  id,
  name,
  days: Array.from({ length: 30 }, (_, i) => {
    const minutes = i === bad ? 47 : (i * seed) % 11 === 0 ? 2 : 0
    return { date: `2027-01-${String(i + 1).padStart(2, '0')}`, uptime: 1 - minutes / 1440, downtimeMinutes: minutes, incidents: i === bad ? 1 : 0, ...(i === bad ? { note: 'Consumer lag after a broker restart' } : null) }
  }),
})

/** Your own services and day, the actions wired and the strings rewritten in `copy`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    services: [month('ledger', 'ledger-db', 3), month('queue', 'events-queue', 5, 21), month('sync', 'bank-sync', 7)],
    today: '2027-01-30',
    target: 0.995,
    copy: { title: 'Platform health', subtitle: (n: number) => `${n} systems · last 30 days`, uptime: 'Uptime · 30 days' },
    onSubscribe: fn(),
    onCopyLink: fn(),
    onExport: fn(),
    onHistory: fn(),
    onValueChange: fn(),
  },
}

// A fictional run of days ending on `end`: a seeded wobble, then the named bad days (minutes down, or null for no data).
const run = (id: string, name: string, length: number, end: string, seed: number, bad: Record<number, [number | null, string?]> = {}) => ({
  id,
  name,
  days: Array.from({ length }, (_, i) => {
    const ago = length - 1 - i
    const date = new Date(`${end}T12:00:00`)
    date.setDate(date.getDate() - ago)
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const hit = bad[ago]
    if (hit && hit[0] === null) return { date: day, uptime: null }
    const minutes = hit ? hit[0]! : (i * seed) % 13 === 0 ? 2 : 0
    return { date: day, uptime: 1 - minutes / 1440, downtimeMinutes: minutes, incidents: hit ? 1 : 0, ...(hit?.[1] ? { note: hit[1] } : null) }
  }),
})

const fixed = (n: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)

/** Education: a campus's buildings and what each keeps running. Statuses, the legend's words and the strings follow. */
export const CampusFacilities: Story = {
  name: 'Campus facilities',
  args: {
    services: [
      run('library', 'Library heat', 90, '2026-11-12', 3, { 14: [190, 'Boiler fault, repaired overnight'] }),
      run('hall', 'Lecture Wi-Fi', 90, '2026-11-12', 5, { 2: [75, 'Access points rebooting after a firmware update'], 3: [20, 'Firmware rollout'] }),
      run('dorm', 'North dorm water', 90, '2026-11-12', 7, { 31: [null], 9: [30, 'Pressure drop, pipe flushed'] }),
      run('lab', 'Chem lab vents', 90, '2026-11-12', 11),
      run('gym', 'Sports center', 90, '2026-11-12', 13),
    ],
    today: '2026-11-12',
    target: 0.995,
    statuses: [
      { id: 'normal', label: 'Running', tone: 'success' },
      { id: 'limited', label: 'Limited', tone: 'warning' },
      { id: 'closed', label: 'Closed', tone: 'danger' },
    ],
    format: { uptime: fixed },
    copy: {
      title: 'Campus facilities',
      subtitle: (n: number) => `${n} buildings · last 90 days`,
      uptime: 'Availability · 90 days',
      budget: 'Downtime allowed left',
      operational: 'All buildings running',
      partial: 'Some buildings limited',
      allServices: 'all buildings',
      services: 'Buildings',
      servicesSummary: (n: number) => (n ? `${n} limited today` : 'All running'),
      history: 'Maintenance log',
      subscribe: 'Get alerts',
      subscribed: 'Alerts on',
      empty: 'No buildings to show yet',
    },
  },
}

/** City transit: lines over 90 days, each with its own words for a bad day, one suspended by hand. */
export const TransitLines: Story = {
  name: 'Transit lines',
  args: {
    services: [
      run('red', 'Red line', 90, '2026-10-05', 3, { 6: [70, 'Signal failure at Harbor'], 5: [25, 'Residual delays'] }),
      run('blue', 'Blue line', 90, '2026-10-05', 5),
      run('green', 'Green line', 90, '2026-10-05', 7, { 0: [210, 'Track works, replacement buses running'] }),
      run('x1', 'Express X1', 90, '2026-10-05', 11, { 22: [140, 'Bridge closed for inspection'] }),
      { ...run('tram', 'Old Town tram', 90, '2026-10-05', 13), status: 'suspended' },
    ],
    today: '2026-10-05',
    target: 0.99,
    statuses: [
      { id: 'on-time', label: 'On time', tone: 'success' },
      { id: 'delays', label: 'Delays', tone: 'warning' },
      { id: 'suspended', label: 'Suspended', tone: 'danger' },
    ],
    format: { uptime: fixed },
    copy: {
      title: 'Service status',
      subtitle: (n: number) => `${n} lines · last 90 days`,
      uptime: 'On-time service · 90 days',
      target: 'Goal',
      budget: 'Delay minutes left',
      operational: 'All lines running',
      partial: 'Disruption on the network',
      allServices: 'all lines',
      services: 'Lines',
      servicesSummary: (n: number) => (n ? `${n} disrupted today` : 'All on time'),
      subscribe: 'Follow',
      subscribed: 'Following',
      history: 'Past disruptions',
    },
  },
}
