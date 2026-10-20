import type { Meta, StoryObj } from '@storybook/react-vite'
import { LogsTable } from './logs'
import type { LogsTableEvent } from './logs/data'

const meta: Meta<typeof LogsTable> = {
  title: 'Blocks/Tables/Logs',
  component: LogsTable,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A live event stream, virtualized for thousands of rows: it follows new events while you read from the top and holds still (counting what waits) when you scroll down or pause. Arrow through it and the inspector shows each event’s request, duration and payload as JSON. Search, and filter by level and service.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LogsTable>

/** The block as it installs: a simulated stream, marked as demo data. */
export const Default: Story = {}

/** The gallery's picture: the stream without its demo badge. */
export const Clean: Story = { args: { demoMarker: false } }

const EVENTS: LogsTableEvent[] = [
  { id: 'd1', time: '2026-10-10T08:12:03.004Z', level: 'info', service: 'deploy', message: 'Build 4f2a91c started on main', payload: { commit: '4f2a91c', branch: 'main' } },
  { id: 'd2', time: '2026-10-10T08:12:41.310Z', level: 'debug', service: 'deploy', message: 'Restored 1,204 cached modules', payload: { cache: 'hit', modules: 1204 } },
  { id: 'd3', time: '2026-10-10T08:13:30.875Z', level: 'warn', service: 'deploy', message: 'Bundle grew 12% (412 kB → 461 kB)', payload: { before: 412, after: 461, unit: 'kB' } },
  { id: 'd4', time: '2026-10-10T08:14:02.120Z', level: 'info', service: 'edge', message: 'Promoted to production in 3 regions', duration: 860, payload: { regions: ['fra1', 'iad1', 'hnd1'] } },
  { id: 'd5', time: '2026-10-10T08:15:44.690Z', level: 'error', service: 'edge', message: 'Health check failed in hnd1: 503', duration: 3012, payload: { region: 'hnd1', status: 503, retry: true } },
]

/** A deploy's events: no simulation, so no badge; the app appends to stream. */
export const WithYourData: Story = { args: { events: EVENTS, copy: { title: 'Deploy log' } } }

/** Paused: new events wait, counted on the button. */
export const Paused: Story = { args: { defaultPaused: true, demoMarker: false } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }
