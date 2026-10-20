import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { YoujProvider } from '@youj/core'
import { FilmIcon, TableIcon } from '@youj/icons'
import { TransferList } from './transfer-list'
import { ITEMS, type TransferListItem } from './transfer-list/data'

const meta: Meta<typeof TransferList> = {
  title: 'Blocks/App/Transfer List',
  component: TransferList,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Follow transfers in flight so you can see what is still on its way: an overall meter, a row each with its rate and time left, and pause, resume, cancel or retry. Files, table copies and video renders read the same.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TransferList>

/** Files syncing: three moving, one failed, one paused, some queued and a few done. */
export const Default: Story = { name: 'File sync' }

/** Every file finished: compact done rows, nothing to pause. */
export const Settled: Story = {
  args: { items: ITEMS.map((f) => ({ ...f, transferred: f.size, rate: undefined, status: 'done' as const })) },
}

/** Nothing left: every transfer canceled. */
export const Empty: Story = { args: { items: [] } }

/** Skeletons hold the figures and rows while the data loads; the card keeps its size. */
export const Loading: Story = { args: { loading: true } }

/** The load failed: the message with Retry in the rows' place, and dashes for the figures. */
export const Error: Story = { args: { error: 'Couldn’t load the transfers.', onRetry: fn() } }

const MB = 1_000_000
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const table = (id: string, rows: number, moved: number, speed: number, status: TransferListItem['status'], error?: string): TransferListItem => ({
  id,
  name: id,
  size: rows,
  transferred: moved,
  rate: status === 'active' ? speed : undefined,
  speed,
  status,
  error,
  icon: <TableIcon size={16} />,
})

/** Tech: tables copying between databases. `format` counts rows and rows a second instead of bytes, and the provider's labels say tables. */
export const DataMigration: Story = {
  name: 'Data migration',
  args: {
    items: [
      table('orders', 48.2 * MB, 31 * MB, 410_000, 'active'),
      table('order_items', 126 * MB, 52 * MB, 880_000, 'active'),
      table('events', 310 * MB, 141 * MB, 1_200_000, 'active'),
      table('customers', 5.8 * MB, 2.1 * MB, 95_000, 'failed', 'Lock timeout on the target after 2.1M rows'),
      table('payments', 22 * MB, 7 * MB, 300_000, 'paused'),
      table('sessions', 84 * MB, 0, 700_000, 'queued'),
      table('audit_log', 210 * MB, 0, 950_000, 'queued'),
      table('invoices', 9.4 * MB, 0, 260_000, 'queued'),
      table('products', 0.41 * MB, 0, 40_000, 'queued'),
      table('inventory', 3.6 * MB, 0, 180_000, 'queued'),
      table('shipments', 14 * MB, 14 * MB, 350_000, 'done'),
      table('coupons', 0.12 * MB, 0.12 * MB, 30_000, 'done'),
      table('regions', 240, 240, 240, 'done'),
      table('carts', 31 * MB, 31 * MB, 500_000, 'done'),
    ],
    format: {
      size: (rows: number) => `${compact.format(rows)} rows`,
      rate: (perSecond: number) => `${compact.format(perSecond)} rows/s`,
    },
    copy: {
      title: 'Migration',
      subtitle: (count: number, size: string) => `${count} ${count === 1 ? 'table' : 'tables'} · ${size}`,
      more: 'More migration options',
      items: 'Tables',
      status: (active: number, queued: number) => `${active} copying · ${queued} queued`,
      settled: 'All tables copied',
      emptyTitle: 'No tables selected',
      emptyBody: 'Pick tables to copy to the new database.',
    },
  },
  render: (args) => (
    <YoujProvider labels={{ transferFiles: (done, total) => `${done} of ${total} ${total === 1 ? 'table' : 'tables'}`, transferRate: 'Speed' }}>
      <TransferList {...args} />
    </YoujProvider>
  ),
}

const render = (id: string, frames: number, done: number, fps: number, status: TransferListItem['status'], error?: string): TransferListItem => ({
  id,
  name: id,
  size: frames,
  transferred: done,
  rate: status === 'active' ? fps : undefined,
  speed: fps,
  status,
  error,
  icon: <FilmIcon size={16} />,
})

/** Media: video renders exporting. `format` counts frames and frames a second, and the provider's labels say renders. */
export const VideoExports: Story = {
  name: 'Video exports',
  args: {
    items: [
      render('cold-open-4k.mov', 4_320, 2_790, 38, 'active'),
      render('interview-a-1080p.mp4', 18_000, 6_300, 92, 'active'),
      render('trailer-cut-3.mov', 3_240, 1_150, 31, 'active'),
      render('title-sequence.mov', 8_640, 5_460, 24, 'failed', 'GPU ran out of memory at frame 5,460'),
      render('broll-harbor.mp4', 12_000, 3_800, 70, 'paused'),
      render('episode-12-final.mov', 86_400, 0, 41, 'queued'),
      render('episode-12-captions.mp4', 86_400, 0, 110, 'queued'),
      render('teaser-vertical.mp4', 1_800, 0, 120, 'queued'),
      render('thumbnail-loop.mov', 480, 0, 60, 'queued'),
      render('lower-thirds.mov', 2_400, 0, 55, 'queued'),
      render('ident-short.mov', 360, 360, 48, 'done'),
      render('bumper-2s.mp4', 120, 120, 60, 'done'),
      render('intro-card.mov', 720, 720, 52, 'done'),
      render('credits-roll.mov', 5_400, 5_400, 64, 'done'),
    ],
    format: {
      size: (frames: number) => `${new Intl.NumberFormat('en').format(Math.round(frames))} frames`,
      rate: (perSecond: number) => `${Math.round(perSecond)} fps`,
    },
    copy: {
      title: 'Exports',
      subtitle: (count: number, size: string) => `${count} ${count === 1 ? 'render' : 'renders'} · ${size}`,
      more: 'More export options',
      items: 'Renders',
      status: (active: number, queued: number) => `${active} rendering · ${queued} queued`,
      settled: 'All renders finished',
      emptyTitle: 'Nothing exporting',
      emptyBody: 'Renders you queue show up here while they run.',
    },
  },
  render: (args) => (
    <YoujProvider labels={{ transferFiles: (done, total) => `${done} of ${total} ${total === 1 ? 'render' : 'renders'}`, transferRate: 'Speed' }}>
      <TransferList {...args} />
    </YoujProvider>
  ),
}
