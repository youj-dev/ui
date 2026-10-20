import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActivityIcon, ClipboardListIcon, ContainerIcon, HeartIcon, PackageIcon, PlaneIcon, ShieldXIcon, ShuffleIcon, SirenIcon, TruckIcon, UserIcon, UsersIcon } from '@youj/icons'
import { QueueFlow } from './queue-flow'
import { NODES } from './queue-flow/data'

const meta: Meta<typeof QueueFlow> = {
  title: 'Blocks/App/Queue Flow',
  component: QueueFlow,
  // The gallery's picture: the simulated desk, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt',
      address: 'support.orbit.app/desk/live',
    },
    docs: {
      description: {
        component:
          'Watch work move through a queue live: items ride from where they arrive through triage to the teams that handle them, a team over its target slows its route and makes triage hold back, and rejected items go to their own folder. Pick a step to inspect it, add people or empty the folder. The items run on the compositor and pause off screen; under reduced motion they stand still along their routes. A support desk, an emergency department and a parcel sorter are in the stories.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof QueueFlow>

/** A support desk: email, phone and chat through routing and an assistant to two teams, with spam in its own folder. */
export const Default: Story = { name: 'Support desk' }

/** Billing fully staffed: no queue, every team on target. */
export const OnTarget: Story = {
  args: {
    nodes: NODES.map((n) => (n.id === 'billing' ? { ...n, staff: 8 } : n)),
  },
}

const hours = new Intl.NumberFormat('en', { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 0 })
const minutes = new Intl.NumberFormat('en', { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 0 })
const clock = (m: number) => (m >= 60 ? `${hours.format(Math.floor(m / 60))} ${minutes.format(Math.round(m % 60))}` : minutes.format(Math.round(m)))

/** Health: arrivals by foot, ambulance and referral through triage to the wards. The minor injuries ward is over target, so its route slows and triage holds back. */
export const EmergencyRoom: Story = {
  name: 'Emergency room triage',
  args: {
    target: 90,
    format: { time: clock },
    lenses: [
      { id: 'volume', label: 'Arrivals' },
      { id: 'reply', label: 'Time to be seen' },
      { id: 'rejected', label: 'Left unseen' },
    ],
    nodes: [
      { id: 'walkin', label: 'Walk-in', kind: 'channel', about: 'front desk · registered on arrival', icon: <UserIcon size={13} />, layer: 0, lane: 0, rate: 60, reply: 4 },
      { id: 'ambulance', label: 'Ambulance', kind: 'channel', about: 'crews calling ahead from the road', icon: <SirenIcon size={13} />, layer: 0, lane: 1, rate: 18, reply: 2 },
      { id: 'referral', label: 'Referral', kind: 'channel', about: 'sent in by a GP or the clinic', icon: <ClipboardListIcon size={13} />, layer: 0, lane: 2, rate: 12, reply: 6 },
      {
        id: 'triage',
        label: 'Triage',
        kind: 'triage',
        about: 'scores urgency, sends to a ward',
        icon: <ActivityIcon size={13} />,
        layer: 1,
        lane: 0.5,
        staff: 3,
        perStaff: 30,
        rejects: 0.04,
        reply: 8,
        limit: 60,
      },
      { id: 'trauma', label: 'Trauma team', kind: 'triage', about: 'meets the crew at the bay', icon: <UsersIcon size={13} />, layer: 1, lane: 1.75, reply: 3 },
      {
        id: 'minor',
        label: 'Minor injuries',
        kind: 'team',
        about: 'sprains, cuts and stitches',
        icon: <HeartIcon size={13} />,
        layer: 2,
        lane: 0,
        staff: 3,
        perStaff: 11,
        reply: 25,
        limit: 40,
        opens: 0.5,
      },
      {
        id: 'major',
        label: 'Majors',
        kind: 'team',
        about: 'chest pain, fractures and observation',
        icon: <HeartIcon size={13} />,
        layer: 2,
        lane: 1,
        staff: 7,
        perStaff: 8,
        reply: 35,
        limit: 50,
      },
      { id: 'left', label: 'Left unseen', kind: 'sink', about: 'left before triage · followed up by phone', icon: <ShieldXIcon size={13} />, layer: 2, lane: 2, reply: 0, holds: 17 },
    ],
    routes: [
      { from: 'walkin', to: 'triage' },
      { from: 'referral', to: 'triage' },
      { from: 'ambulance', to: 'trauma' },
      { from: 'triage', to: 'minor', share: 0.5 },
      { from: 'triage', to: 'major', share: 0.5 },
      { from: 'trauma', to: 'major', share: 0.6 },
      { from: 'triage', to: 'left', reject: true },
    ],
    copy: {
      title: 'Emergency department',
      subtitle: 'All arrivals · live',
      pause: 'Pause the floor',
      resume: 'Resume the floor',
      overview: 'Department overview',
      volume: 'Arrivals',
      reply: 'Time to be seen p95',
      sink: 'Left unseen',
      rejectedShare: (share: string) => `${share} of arrivals left unseen`,
      lens: 'Show on each step',
      layers: ['Arrivals', 'Triage', 'Wards'],
      kinds: { channel: 'Arrival', triage: 'Triage', team: 'Ward', sink: 'Exit' },
      graph: 'Department steps',
      health: { ok: 'On target', over: 'Over target', holding: 'Holding back', sink: 'Holding patients' },
      table: 'Flows and their patients',
      rate: 'Patients an hour',
      in: 'In',
      new: 'Arrived',
      routed: 'Triaged',
      solved: 'Treated',
      staffLabel: 'Nurses',
      held: 'Left',
      rejected: 'Left unseen',
      reads: 'Receives from',
      writes: 'Sends to',
      staff: (added: number) => `Add ${added} nurses`,
      staffed: (name: string, people: number) => `${name} now has ${people} nurses. The wait is shrinking.`,
      purge: (count: string) => `Follow up ${count}`,
      purging: 'Calling',
      purged: (count: string) => `Followed up ${count} patients.`,
      open: 'Open ward',
      deskPaused: 'Floor paused. Figures hold until you resume.',
      deskResumed: 'Floor resumed.',
      legend: { flowing: 'Flowing', slowed: 'Over target', sink: 'Left unseen' },
      history: (name: string) => `${name}, patients an hour over the last 24 readings`,
    },
  },
}

/** Logistics: parcels from two docks and air freight through the sorter to two truck routes. South is short of trucks, so it slows; the sorter pushes anything it cannot read to the reject chute. */
export const ParcelSortation: Story = {
  name: 'Parcel sortation',
  args: {
    target: 120,
    format: { time: clock },
    lenses: [
      { id: 'volume', label: 'Parcels' },
      { id: 'reply', label: 'Dwell time' },
      { id: 'rejected', label: 'Rejects' },
    ],
    nodes: [
      { id: 'dock-a', label: 'Dock A', kind: 'channel', about: 'road freight · trailers from the north', icon: <TruckIcon size={13} />, layer: 0, lane: 0, rate: 300, reply: 5 },
      { id: 'dock-b', label: 'Dock B', kind: 'channel', about: 'road freight · trailers from the ports', icon: <ContainerIcon size={13} />, layer: 0, lane: 1, rate: 220, reply: 5 },
      { id: 'air', label: 'Air freight', kind: 'channel', about: 'overnight flights, unloaded at the apron', icon: <PlaneIcon size={13} />, layer: 0, lane: 2, rate: 80, reply: 8 },
      {
        id: 'sorter',
        label: 'Sorter',
        kind: 'triage',
        about: 'scans each label, drops it on a lane',
        icon: <ShuffleIcon size={13} />,
        layer: 1,
        lane: 0.5,
        staff: 4,
        perStaff: 200,
        rejects: 0.03,
        reply: 12,
        limit: 400,
      },
      { id: 'hand', label: 'Hand sort', kind: 'triage', about: 'oversize and fragile parcels', icon: <PackageIcon size={13} />, layer: 1, lane: 1.75, staff: 6, perStaff: 20, reply: 15, limit: 200 },
      {
        id: 'north',
        label: 'Route North',
        kind: 'team',
        about: 'depots from the coast to the hills',
        icon: <TruckIcon size={13} />,
        layer: 2,
        lane: 0,
        staff: 3,
        perStaff: 100,
        reply: 45,
        limit: 600,
      },
      {
        id: 'south',
        label: 'Route South',
        kind: 'team',
        about: 'city and suburb deliveries',
        icon: <TruckIcon size={13} />,
        layer: 2,
        lane: 1,
        staff: 3,
        perStaff: 90,
        reply: 50,
        limit: 600,
        opens: 0.5,
      },
      { id: 'chute', label: 'Reject chute', kind: 'sink', about: 'unreadable labels · rechecked by hand', icon: <ShieldXIcon size={13} />, layer: 2, lane: 2, reply: 0, holds: 140 },
    ],
    routes: [
      { from: 'dock-a', to: 'sorter' },
      { from: 'dock-b', to: 'sorter' },
      { from: 'air', to: 'hand' },
      { from: 'sorter', to: 'north', share: 0.55 },
      { from: 'sorter', to: 'south', share: 0.45 },
      { from: 'hand', to: 'south' },
      { from: 'sorter', to: 'chute', reject: true },
    ],
    copy: {
      title: 'Sorting hub',
      subtitle: 'All docks · live',
      pause: 'Pause the hub',
      resume: 'Resume the hub',
      overview: 'Hub overview',
      volume: 'Parcels in',
      reply: 'Dwell time p95',
      sink: 'In the chute',
      rejectedShare: (share: string) => `${share} of parcels rejected`,
      layers: ['Docks', 'Sorting', 'Routes'],
      kinds: { channel: 'Dock', triage: 'Sorting', team: 'Route', sink: 'Chute' },
      graph: 'Hub steps',
      health: { ok: 'On target', over: 'Over target', holding: 'Holding back', sink: 'Holding parcels' },
      table: 'Lanes and their volume',
      rate: 'Parcels an hour',
      new: 'Unloaded',
      routed: 'Sorted',
      solved: 'Loaded',
      staffLabel: 'Trucks',
      held: 'Held',
      rejected: 'Rejected',
      reads: 'Receives from',
      writes: 'Sends to',
      staff: (added: number) => `Add ${added} trucks`,
      staffed: (name: string, people: number) => `${name} now has ${people} trucks. The queue is shrinking.`,
      purge: (count: string) => `Recheck ${count}`,
      purging: 'Rechecking',
      purged: (count: string) => `Rechecked ${count} parcels.`,
      open: 'Open lane',
      noneWaiting: 'No parcels waiting',
      deskPaused: 'Hub paused. Figures hold until you resume.',
      deskResumed: 'Hub resumed.',
      legend: { flowing: 'Flowing', slowed: 'Over target', sink: 'Rejected' },
      history: (name: string) => `${name}, parcels an hour over the last 24 readings`,
    },
  },
}

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the card alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }
