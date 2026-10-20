import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { QueueMonitor } from './queue-monitor'
import { BACKLOGGED, type QueueMonitorQueue } from './queue-monitor/data'

const meta: Meta<typeof QueueMonitor> = {
  title: 'Blocks/App/Queue Monitor',
  component: QueueMonitor,
  // The gallery's picture: the demo queues, without their Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Keep an eye on the work waiting in a queue: throughput, waits, and the backlog, busy slots and failures as lanes of cells. Background jobs, kitchen orders and a print queue read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof QueueMonitor>

/** Four background queues: emails, webhooks, exports and billing. */
export const Default: Story = { name: 'Background jobs' }

/** The emails queue at capacity: every slot busy, the backlog near full (its cells turn amber), failures piling up and the p95 wait past 30 s. */
export const Backlogged: Story = { args: { queues: BACKLOGGED } }

const minutes = new Intl.NumberFormat('en', { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 0 })

const ticket = (id: string, error: string) => ({ id, error })
/** A calm 30-minute trace around a rate. */
const trace = (rate: number, swing: number, seed: number) =>
  Array.from({ length: 30 }, (_, i) => Math.max(0, Math.round(rate * (0.9 + i / 290) + Math.sin(i / 2.3 + seed) * swing + Math.cos(i / 1.1 + seed * 2) * swing * 0.4)))

const KITCHEN: QueueMonitorQueue[] = [
  {
    id: 'grill',
    label: 'grill',
    workers: 3,
    slotsPerWorker: 4,
    queued: 14,
    capacity: 30,
    running: 10,
    failed: [ticket('table-12', 'Steak sent back: overcooked'), ticket('table-4', 'Burger sent back: wrong bun')],
    done: 142,
    target: 200,
    throughput: trace(4, 1, 1),
    p95Wait: 540,
    oldest: 780,
  },
  { id: 'fry', label: 'fry', workers: 2, slotsPerWorker: 3, queued: 6, capacity: 24, running: 5, failed: [], done: 96, target: 160, throughput: trace(3, 1, 2), p95Wait: 240, oldest: 330 },
  {
    id: 'salad',
    label: 'salad',
    workers: 1,
    slotsPerWorker: 3,
    queued: 3,
    capacity: 20,
    running: 2,
    failed: [ticket('table-9', 'Salad sent back: nuts, allergy')],
    done: 58,
    target: 90,
    throughput: trace(2, 1, 3),
    p95Wait: 150,
    oldest: 200,
  },
  { id: 'drinks', label: 'drinks', workers: 2, slotsPerWorker: 6, queued: 5, capacity: 40, running: 8, failed: [], done: 210, target: 300, throughput: trace(6, 1, 4), p95Wait: 90, oldest: 130 },
]

/** Restaurants: tickets waiting and in progress at each station, a dish sent back is a failed cell you can remake, and Add cook scales the station. */
export const KitchenOrders: Story = {
  name: 'Kitchen orders',
  args: {
    queues: KITCHEN,
    format: { age: (seconds) => minutes.format(Math.round(seconds / 60)) },
    copy: {
      title: 'Kitchen orders',
      subtitle: (station: string, cooks: number) => `${station} · ${cooks} ${cooks === 1 ? 'cook' : 'cooks'}`,
      queue: 'Station',
      throughput: 'Orders',
      oldest: 'Oldest ticket',
      load: 'Station load',
      queued: 'Waiting',
      running: 'In progress',
      failed: 'Sent back',
      done: 'Served · 1h',
      retry: 'Remake',
      retryAll: 'Remake all',
      retrying: (dish: string) => `Remaking ${dish}`,
      retryingAll: (count: number) => `Remaking ${count} ${count === 1 ? 'dish' : 'dishes'}`,
      pauseQueue: 'Pause station',
      resumeQueue: 'Resume station',
      drain: 'Clear waiting tickets',
      drained: 'Waiting tickets cleared',
      scale: 'Add cook',
      scaling: 'Calling…',
      scaled: 'Added',
      scaledTo: (cooks: number) => `${cooks} ${cooks === 1 ? 'cook' : 'cooks'} on the station`,
    },
    onRetryFailed: fn(),
    onScale: fn(),
  },
}

const PRINTERS: QueueMonitorQueue[] = [
  {
    id: 'library',
    label: 'Library',
    workers: 2,
    slotsPerWorker: 2,
    queued: 38,
    capacity: 120,
    running: 3,
    failed: [ticket('thesis-2291', 'Paper jam in tray 2')],
    done: 840,
    target: 1200,
    throughput: trace(22, 4, 1),
    p95Wait: 95,
    oldest: 210,
  },
  {
    id: 'room-204',
    label: 'Room 204',
    workers: 1,
    slotsPerWorker: 2,
    queued: 11,
    capacity: 60,
    running: 2,
    failed: [ticket('quiz-b', 'Out of toner'), ticket('quiz-c', 'Out of toner')],
    done: 260,
    target: 400,
    throughput: trace(12, 3, 2),
    p95Wait: 40,
    oldest: 75,
  },
  { id: 'staff-room', label: 'Staff room', workers: 1, slotsPerWorker: 2, queued: 4, capacity: 60, running: 1, failed: [], done: 190, target: 400, throughput: trace(8, 2, 3), p95Wait: 25, oldest: 40 },
  { id: 'plotter', label: 'Plotter', workers: 1, slotsPerWorker: 1, queued: 7, capacity: 20, running: 1, failed: [], done: 24, target: 40, throughput: trace(1, 1, 4), p95Wait: 310, oldest: 420 },
]

/** Office and school: each printer is a queue, trays are its workers, and a jam is a failed cell you can resend. */
export const PrintQueue: Story = {
  name: 'Print queue',
  args: {
    queues: PRINTERS,
    copy: {
      title: 'Print queue',
      subtitle: (printer: string, trays: number) => `${printer} · ${trays} ${trays === 1 ? 'tray' : 'trays'}`,
      queue: 'Printer',
      throughput: 'Pages',
      oldest: 'Oldest document',
      load: 'Printer load',
      queued: 'Waiting',
      running: 'Printing',
      failed: 'Stuck',
      done: 'Printed · 1h',
      retry: 'Resend',
      retryAll: 'Resend all',
      retrying: (doc: string) => `Resending ${doc}`,
      retryingAll: (count: number) => `Resending ${count} ${count === 1 ? 'document' : 'documents'}`,
      pauseQueue: 'Pause printer',
      resumeQueue: 'Resume printer',
      drain: 'Cancel waiting documents',
      drained: 'Waiting documents cancelled',
      scale: 'Add a tray',
      scaling: 'Loading…',
      scaled: 'Added',
      scaledTo: (trays: number) => `${trays} ${trays === 1 ? 'tray' : 'trays'} loaded`,
    },
  },
}

/** Skeletons hold the figures' place while the queues load; the tabs, lanes and footer keep their size. */
export const Loading: Story = { args: { loading: true } }

/** No queues yet: the empty message in the figures' place. */
export const Empty: Story = { args: { queues: [] } }

/** The load failed: the message with Retry in the figures' place. */
export const Error: Story = { args: { error: 'Couldn’t load the queues.', onRetry: fn() } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the card alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }
